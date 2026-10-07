import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { COMPONENTES } from '@/content/componentes';
import { normalizar, VACIO, type EstadoApp, type Perfil } from '@/logic/estado';
import { generarMenu, menuVigente, type Menu, type ResultadoMenu } from '@/logic/menu';
import { hoyISO, semanaDelPrograma, semanaVigente } from '@/logic/programa';
import type { PreferenciasCocina } from '@/logic/tipos';

// Todo se guarda solo en el dispositivo (AsyncStorage; en web, localStorage). No hay cuenta ni servidor.
// El resultado del filtro de seguridad incluye mensajes que nombran la condición: es un dato de salud.
// La forma del estado y su validación están en src/logic/estado.ts.
const CLAVE = 'ruta90-autonoma-v1';

export { COCINA_INICIAL, EJERCICIO_INICIAL, normalizar } from '@/logic/estado';
export type { EstadoApp, Perfil } from '@/logic/estado';

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
  /** Reemplaza todo el estado por uno restaurado desde un código de respaldo (ya validado). */
  restaurarEstado: (e: EstadoApp) => void;
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
        let cargado: EstadoApp = VACIO;
        try {
          cargado = normalizar(JSON.parse(txt));
        } catch {
          cargado = VACIO;
        }
        // Lo guardado no sirve: se elimina en vez de dejarlo hasta el próximo registro.
        if (cargado === VACIO) AsyncStorage.removeItem(CLAVE).catch(() => undefined);
        setEstado(cargado);
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
  const restaurarEstado = useCallback((e: EstadoApp) => setEstado(e), []);

  const valor = useMemo<Contexto>(
    () => ({
      estado, listo, semana, menuActual,
      guardarPerfil, actualizarPerfil, actualizarCocina, alternarClase, alternarSesion, cambiarCaminata,
      nuevaCombinacion, reemplazarMenu, alternarCompra, limpiarCompras, reiniciarPrograma, borrarTodo, restaurarEstado,
    }),
    [estado, listo, semana, menuActual, guardarPerfil, actualizarPerfil, actualizarCocina, alternarClase, alternarSesion,
      cambiarCaminata, nuevaCombinacion, reemplazarMenu, alternarCompra, limpiarCompras, reiniciarPrograma, borrarTodo, restaurarEstado],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useApp(): Contexto {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp debe usarse dentro de AppStateProvider');
  return c;
}
