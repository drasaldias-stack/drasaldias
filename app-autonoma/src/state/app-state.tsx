import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { COMPONENTES } from '@/content/componentes';
import { generarMenu, menuVigente, type Menu, type ResultadoMenu } from '@/logic/menu';
import { hoyISO, semanaDelPrograma, semanaVigente } from '@/logic/programa';
import type { PreferenciasCocina, PreferenciasEjercicio, ResultadoSeguridad } from '@/logic/tipos';

// Todo se guarda solo en el dispositivo (AsyncStorage; en web, localStorage). No hay cuenta ni servidor.
// El resultado del filtro de seguridad incluye mensajes que nombran la condición: es un dato de salud.
const CLAVE = 'ruta90-autonoma-v1';

export type Perfil = {
  nombre: string;
  inicio: string;
  seguridad: ResultadoSeguridad;
  confirmaEjercicio: boolean;
  confirmaAlimentacion: boolean;
  cocina: PreferenciasCocina;
  ejercicio: PreferenciasEjercicio;
};

export type EstadoApp = {
  version: 1;
  perfil: Perfil | null;
  clasesVistas: Record<string, string>;
  sesionesHechas: Record<string, string>;
  /** Días de caminata cumplidos por semana del programa (clave: semana 1 a 12). */
  caminatas: Record<string, number>;
  menu: { semana: number; regeneracion: number; menu: Menu } | null;
  /** Ítems marcados en la lista de compras, con clave `${semana}|${item}`. */
  compras: Record<string, boolean>;
};

const VACIO: EstadoApp = { version: 1, perfil: null, clasesVistas: {}, sesionesHechas: {}, caminatas: {}, menu: null, compras: {} };

export const COCINA_INICIAL: PreferenciasCocina = { personas: 1, minutos: 90, equipos: ['horno', 'microondas'], patron: 'omnivoro', exclusiones: [] };
export const EJERCICIO_INICIAL: PreferenciasEjercicio = { programa: 'desde_cero', minutos: 20, materiales: ['silla'] };

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const registro = <T,>(x: unknown, valor: (v: unknown) => v is T): Record<string, T> => {
  if (!esObjeto(x)) return {};
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(x)) if (valor(v)) out[k] = v;
  return out;
};
const esString = (v: unknown): v is string => typeof v === 'string';
const esNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const esTrue = (v: unknown): v is boolean => v === true;

/** Valida lo guardado antes de usarlo: si el perfil está incompleto, vuelve al estado inicial. */
export function normalizar(crudo: unknown): EstadoApp {
  if (!esObjeto(crudo) || crudo.version !== 1) return VACIO;
  let perfil: Perfil | null = null;
  if (crudo.perfil != null) {
    const p = crudo.perfil;
    if (!esObjeto(p) || !esString(p.inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(p.inicio) || !esObjeto(p.seguridad)) return VACIO;
    const s = p.seguridad;
    const acceso = (v: unknown): ResultadoSeguridad['alimentacion'] => (v === 'bloqueado' || v === 'requiere_confirmacion' ? v : 'ok');
    perfil = {
      nombre: esString(p.nombre) ? p.nombre : '',
      inicio: p.inicio,
      seguridad: {
        apta: s.apta !== false,
        alimentacion: acceso(s.alimentacion),
        ejercicio: acceso(s.ejercicio),
        mensajes: Array.isArray(s.mensajes) ? s.mensajes.filter(esString) : [],
      },
      confirmaEjercicio: p.confirmaEjercicio === true,
      confirmaAlimentacion: p.confirmaAlimentacion === true,
      cocina: { ...COCINA_INICIAL, ...(esObjeto(p.cocina) ? (p.cocina as Partial<PreferenciasCocina>) : {}) },
      ejercicio: { ...EJERCICIO_INICIAL, ...(esObjeto(p.ejercicio) ? (p.ejercicio as Partial<PreferenciasEjercicio>) : {}) },
    };
  }
  const m = crudo.menu;
  const menu =
    esObjeto(m) && esNumero(m.semana) && esNumero(m.regeneracion) && menuVigente(m.menu as Menu, COMPONENTES)
      ? { semana: m.semana, regeneracion: m.regeneracion, menu: m.menu as Menu }
      : null;
  return {
    version: 1,
    perfil,
    clasesVistas: registro(crudo.clasesVistas, esString),
    sesionesHechas: registro(crudo.sesionesHechas, esString),
    caminatas: registro(crudo.caminatas, esNumero),
    menu,
    compras: registro(crudo.compras, esTrue),
  };
}

const mismoConjunto = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));
/** Solo estos campos cambian qué menú se arma; personas solo escala la lista de compras. */
const afectaMenu = (a: PreferenciasCocina, b: PreferenciasCocina) =>
  a.minutos !== b.minutos || a.patron !== b.patron || !mismoConjunto(a.equipos, b.equipos) || !mismoConjunto(a.exclusiones, b.exclusiones);

type Acciones = {
  guardarPerfil: (p: Perfil) => void;
  actualizarPerfil: (cambios: Partial<Perfil>) => void;
  actualizarCocina: (c: PreferenciasCocina) => void;
  alternarClase: (id: string) => void;
  alternarSesion: (clave: string) => void;
  cambiarCaminata: (semana: number, delta: number, maximo: number) => void;
  nuevaCombinacion: () => void;
  reemplazarMenu: (m: Menu) => void;
  alternarCompra: (clave: string) => void;
  limpiarCompras: (semana: number) => void;
  reiniciarPrograma: () => void;
  borrarTodo: () => void;
};

type Contexto = { estado: EstadoApp; listo: boolean; semana: number; menuActual: ResultadoMenu | null } & Acciones;

const Ctx = createContext<Contexto | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoApp>(VACIO);
  const [listo, setListo] = useState(false);
  const cargado = useRef(false);

  useEffect(() => {
    let vivo = true;
    AsyncStorage.getItem(CLAVE)
      .then((txt) => {
        if (!vivo || !txt) return;
        try {
          setEstado(normalizar(JSON.parse(txt)));
        } catch {
          setEstado(VACIO);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        cargado.current = true;
        if (vivo) setListo(true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!cargado.current) return;
    if (estado === VACIO) {
      AsyncStorage.removeItem(CLAVE).catch(() => undefined);
      return;
    }
    AsyncStorage.setItem(CLAVE, JSON.stringify(estado)).catch(() => undefined);
  }, [estado]);

  const semana = estado.perfil ? semanaDelPrograma(estado.perfil.inicio) : 1;

  // El menú se arma por semana. Se rehace si cambió la semana, el catálogo o las preferencias que lo afectan.
  const menuActual = useMemo<ResultadoMenu | null>(() => {
    const p = estado.perfil;
    if (!p) return null;
    const m = estado.menu;
    if (m && m.semana === semana && menuVigente(m.menu, COMPONENTES)) return { ok: true, menu: m.menu };
    return generarMenu(p.cocina, COMPONENTES, semana * 100 + (m?.semana === semana ? m.regeneracion : 0));
  }, [estado.perfil, estado.menu, semana]);

  useEffect(() => {
    if (!menuActual?.ok) return;
    const m = estado.menu;
    if (m && m.semana === semana && m.menu === menuActual.menu) return;
    if (m && m.semana === semana && menuVigente(m.menu, COMPONENTES)) return;
    setEstado((e) => ({ ...e, menu: { semana, regeneracion: e.menu?.semana === semana ? e.menu.regeneracion : 0, menu: menuActual.menu } }));
  }, [menuActual, semana, estado.menu]);

  const guardarPerfil = useCallback((p: Perfil) => setEstado((e) => ({ ...e, perfil: p, menu: null })), []);
  const actualizarPerfil = useCallback(
    (cambios: Partial<Perfil>) => setEstado((e) => (e.perfil ? { ...e, perfil: { ...e.perfil, ...cambios } } : e)),
    [],
  );
  const actualizarCocina = useCallback(
    (c: PreferenciasCocina) =>
      setEstado((e) => {
        if (!e.perfil) return e;
        const menu = afectaMenu(e.perfil.cocina, c) ? null : e.menu;
        return { ...e, perfil: { ...e.perfil, cocina: c }, menu };
      }),
    [],
  );
  const alternarClase = useCallback(
    (id: string) =>
      setEstado((e) => {
        const vistas = { ...e.clasesVistas };
        if (vistas[id]) delete vistas[id];
        else vistas[id] = hoyISO();
        return { ...e, clasesVistas: vistas };
      }),
    [],
  );
  const alternarSesion = useCallback(
    (clave: string) =>
      setEstado((e) => {
        const hechas = { ...e.sesionesHechas };
        if (hechas[clave]) delete hechas[clave];
        else hechas[clave] = hoyISO();
        return { ...e, sesionesHechas: hechas };
      }),
    [],
  );
  const cambiarCaminata = useCallback(
    (sem: number, delta: number, maximo: number) =>
      setEstado((e) => {
        const k = String(semanaVigente(sem));
        const actual = e.caminatas[k] ?? 0;
        const nuevo = Math.max(0, Math.min(maximo, actual + delta));
        return { ...e, caminatas: { ...e.caminatas, [k]: nuevo } };
      }),
    [],
  );
  const nuevaCombinacion = useCallback(
    () =>
      setEstado((e) => {
        if (!e.perfil) return e;
        const sem = semanaDelPrograma(e.perfil.inicio);
        const regeneracion = (e.menu?.semana === sem ? e.menu.regeneracion : 0) + 1;
        const r = generarMenu(e.perfil.cocina, COMPONENTES, sem * 100 + regeneracion);
        if (!r.ok) return e;
        return { ...e, menu: { semana: sem, regeneracion, menu: r.menu } };
      }),
    [],
  );
  const reemplazarMenu = useCallback(
    (menu: Menu) =>
      setEstado((e) => {
        if (!e.perfil) return e;
        const sem = semanaDelPrograma(e.perfil.inicio);
        return { ...e, menu: { semana: sem, regeneracion: e.menu?.semana === sem ? e.menu.regeneracion : 0, menu } };
      }),
    [],
  );
  const alternarCompra = useCallback(
    (clave: string) =>
      setEstado((e) => {
        const compras = { ...e.compras };
        if (compras[clave]) delete compras[clave];
        else compras[clave] = true;
        return { ...e, compras };
      }),
    [],
  );
  const limpiarCompras = useCallback(
    (sem: number) =>
      setEstado((e) => {
        const prefijo = `${sem}|`;
        const compras = Object.fromEntries(Object.entries(e.compras).filter(([k]) => !k.startsWith(prefijo)));
        return { ...e, compras };
      }),
    [],
  );
  const reiniciarPrograma = useCallback(
    () =>
      setEstado((e) =>
        e.perfil ? { ...e, perfil: { ...e.perfil, inicio: hoyISO() }, sesionesHechas: {}, caminatas: {}, clasesVistas: {}, menu: null, compras: {} } : e,
      ),
    [],
  );
  const borrarTodo = useCallback(() => setEstado(VACIO), []);

  const valor = useMemo<Contexto>(
    () => ({
      estado, listo, semana, menuActual,
      guardarPerfil, actualizarPerfil, actualizarCocina, alternarClase, alternarSesion, cambiarCaminata,
      nuevaCombinacion, reemplazarMenu, alternarCompra, limpiarCompras, reiniciarPrograma, borrarTodo,
    }),
    [estado, listo, semana, menuActual, guardarPerfil, actualizarPerfil, actualizarCocina, alternarClase, alternarSesion,
      cambiarCaminata, nuevaCombinacion, reemplazarMenu, alternarCompra, limpiarCompras, reiniciarPrograma, borrarTodo],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useApp(): Contexto {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp debe usarse dentro de AppStateProvider');
  return c;
}
