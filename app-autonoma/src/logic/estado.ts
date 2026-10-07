import { COMPONENTES } from '../content/componentes';
import { PROGRAMAS } from '../content/ejercicios';
import { menuVigente, type Menu } from './menu';
import { normalizarPauta, normalizarRutina } from './propio';
import {
  EQUIPOS,
  EXCLUSIONES,
  MATERIALES,
  MINUTOS_COCINA,
  MINUTOS_EJERCICIO,
  PATRONES,
  type EstadoAcceso,
  type MotivoAlimentacion,
  type MotivoBloqueo,
  type MotivoEjercicio,
  type PautaPropia,
  type PreferenciasCocina,
  type PreferenciasEjercicio,
  type ResultadoSeguridad,
  type RutinaPropia,
} from './tipos';

// Forma del estado que se guarda en el dispositivo y su validación al cargarlo.
// Sin dependencias de React ni de AsyncStorage para poder probarse con Node.

export type Perfil = {
  nombre: string;
  inicio: string;
  seguridad: ResultadoSeguridad;
  confirmaEjercicio: boolean;
  confirmaAlimentacion: boolean;
  cocina: PreferenciasCocina;
  ejercicio: PreferenciasEjercicio;
  /** Pauta de alimentación cargada por la persona (propia o de su profesional), además del menú de la app. */
  pauta: PautaPropia | null;
  /** Rutina de ejercicio cargada por la persona, además del programa de la app. */
  rutina: RutinaPropia | null;
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
  /** Fecha (AAAA-MM-DD) del último código de respaldo creado, o null. Viaja dentro del código. */
  respaldo: { ultimo: string | null };
};

export const VACIO: EstadoApp = { version: 1, perfil: null, clasesVistas: {}, sesionesHechas: {}, caminatas: {}, menu: null, compras: {}, respaldo: { ultimo: null } };

export const COCINA_INICIAL: PreferenciasCocina = { personas: 1, minutos: 90, equipos: ['horno', 'microondas'], patron: 'omnivoro', exclusiones: [] };
export const EJERCICIO_INICIAL: PreferenciasEjercicio = { programa: 'desde_cero', minutos: 20, materiales: ['silla'] };

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const esString = (v: unknown): v is string => typeof v === 'string';
const esNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const esTrue = (v: unknown): v is boolean => v === true;
const esFechaISO = (v: unknown): v is string => esString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);

const registro = <T,>(x: unknown, valor: (v: unknown) => v is T): Record<string, T> => {
  if (!esObjeto(x)) return {};
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(x)) if (valor(v)) out[k] = v;
  return out;
};
/** Un valor de una lista cerrada; si no está en la lista, el inicial. */
const uno = <T,>(v: unknown, permitidos: readonly T[], inicial: T): T => (permitidos.includes(v as T) ? (v as T) : inicial);
/** Una lista de valores de una lista cerrada; se descartan los desconocidos. Si no es una lista, la inicial. */
const varios = <T,>(v: unknown, permitidos: readonly T[], inicial: readonly T[]): T[] =>
  Array.isArray(v) ? (Array.from(new Set(v.filter((x) => permitidos.includes(x)))) as T[]) : [...inicial];

const PERSONAS = [1, 2, 3, 4] as const;
const ACCESOS: readonly EstadoAcceso[] = ['ok', 'requiere_confirmacion', 'bloqueado'];
const MOTIVOS_EJERCICIO: readonly MotivoEjercicio[] = ['sintomas', 'enfermedad', 'insulina', 'conducta'];
const MOTIVOS_ALIMENTACION: readonly MotivoAlimentacion[] = ['insulina'];
const MOTIVOS_BLOQUEO: readonly MotivoBloqueo[] = ['edad', 'embarazo', 'conducta'];

export function normalizarCocina(c: unknown): PreferenciasCocina {
  const o = esObjeto(c) ? c : {};
  return {
    personas: uno(o.personas, PERSONAS, COCINA_INICIAL.personas),
    minutos: uno(o.minutos, MINUTOS_COCINA, COCINA_INICIAL.minutos),
    equipos: varios(o.equipos, EQUIPOS, COCINA_INICIAL.equipos),
    patron: uno(o.patron, PATRONES, COCINA_INICIAL.patron),
    exclusiones: varios(o.exclusiones, EXCLUSIONES, COCINA_INICIAL.exclusiones),
  };
}

export function normalizarEjercicio(e: unknown): PreferenciasEjercicio {
  const o = esObjeto(e) ? e : {};
  return {
    programa: uno(o.programa, Object.keys(PROGRAMAS) as PreferenciasEjercicio['programa'][], EJERCICIO_INICIAL.programa),
    minutos: uno(o.minutos, MINUTOS_EJERCICIO, EJERCICIO_INICIAL.minutos),
    materiales: varios(o.materiales, MATERIALES, EJERCICIO_INICIAL.materiales),
  };
}

/**
 * Valida lo guardado antes de usarlo. Un perfil sin fecha de inicio o sin resultado de seguridad
 * vuelve al estado inicial; cualquier otro campo inválido vuelve a su valor inicial sin perder el resto.
 * Un menú con forma inválida se descarta solo (se vuelve a generar).
 */
export function normalizar(crudo: unknown): EstadoApp {
  if (!esObjeto(crudo) || crudo.version !== 1) return VACIO;
  let perfil: Perfil | null = null;
  if (crudo.perfil != null) {
    const p = crudo.perfil;
    if (!esObjeto(p) || !esString(p.inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(p.inicio) || !esObjeto(p.seguridad)) return VACIO;
    const s = p.seguridad;
    const motivos = esObjeto(s.motivos) ? s.motivos : {};
    const bloqueos = esObjeto(s.bloqueos) ? s.bloqueos : {};
    perfil = {
      nombre: esString(p.nombre) ? p.nombre : '',
      inicio: p.inicio,
      seguridad: {
        apta: s.apta !== false,
        alimentacion: uno(s.alimentacion, ACCESOS, 'ok'),
        ejercicio: uno(s.ejercicio, ACCESOS, 'ok'),
        motivos: {
          ejercicio: varios(motivos.ejercicio, MOTIVOS_EJERCICIO, []),
          alimentacion: varios(motivos.alimentacion, MOTIVOS_ALIMENTACION, []),
        },
        bloqueos: {
          ejercicio: varios(bloqueos.ejercicio, MOTIVOS_BLOQUEO, []),
          alimentacion: varios(bloqueos.alimentacion, MOTIVOS_BLOQUEO, []),
        },
        mensajes: Array.isArray(s.mensajes) ? s.mensajes.filter(esString) : [],
      },
      confirmaEjercicio: p.confirmaEjercicio === true,
      confirmaAlimentacion: p.confirmaAlimentacion === true,
      cocina: normalizarCocina(p.cocina),
      ejercicio: normalizarEjercicio(p.ejercicio),
      pauta: normalizarPauta(p.pauta),
      rutina: normalizarRutina(p.rutina),
    };
  }
  const m = crudo.menu;
  const menu =
    esObjeto(m) && esNumero(m.semana) && esNumero(m.regeneracion) && menuVigente(m.menu, COMPONENTES)
      ? { semana: m.semana, regeneracion: m.regeneracion, menu: m.menu }
      : null;
  return {
    version: 1,
    perfil,
    clasesVistas: registro(crudo.clasesVistas, esString),
    sesionesHechas: registro(crudo.sesionesHechas, esString),
    caminatas: registro(crudo.caminatas, esNumero),
    menu,
    compras: registro(crudo.compras, esTrue),
    respaldo: { ultimo: esObjeto(crudo.respaldo) && esFechaISO(crudo.respaldo.ultimo) ? crudo.respaldo.ultimo : null },
  };
}
