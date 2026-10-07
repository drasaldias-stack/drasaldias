import { EJERCICIOS } from '../content/ejercicios';
import { sesionesDeSemana } from './programa';
import type { Ejercicio, IdSesionRutina, PautaPropia, Programa, RutinaPropia, Sesion, SesionRutina } from './tipos';

// Pauta de alimentación y rutina de ejercicio cargadas por la persona, además del menú y del programa de
// la app. La app las muestra tal como se escriben, sin revisarlas; por eso se validan solo en forma y
// tamaño, nunca en contenido.

export const LIMITES = {
  comidas: 8,
  titulo: 60,
  nombreComida: 40,
  detalle: 2000,
  notas: 1000,
  enlace: 500,
  sesiones: 3,
  itemsPorSesion: 15,
  nombreRutina: 60,
  nombreEjercicio: 60,
  cantidadMax: 999,
  vueltasMax: 4,
} as const;

export const IDS_SESION: IdSesionRutina[] = ['A', 'B', 'C'];
/** Las sesiones propias llevan este prefijo en su id para no chocar con las A, B y C del programa. */
export const PREFIJO_SESION_PROPIA = 'mi-';

export const PAUTA_PLANTILLA: PautaPropia = {
  origen: 'profesional',
  titulo: 'Pauta de mi nutricionista',
  comidas: [
    { nombre: 'Desayuno', detalle: '' },
    { nombre: 'Colación', detalle: '' },
    { nombre: 'Almuerzo', detalle: '' },
    { nombre: 'Once', detalle: '' },
    { nombre: 'Cena', detalle: '' },
  ],
  notas: '',
  enlace: '',
};

export const RUTINA_PLANTILLA: RutinaPropia = {
  nombre: 'Mi rutina',
  sesiones: [{ id: 'A', nombre: 'Sesión A', vueltas: 1, items: [] }],
  notas: '',
};

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const entero = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null;

export const enlaceValido = (s: string) => /^https?:\/\/\S+$/i.test(s);

/** Una pauta con forma válida; solo se conservan las comidas con detalle. Null si ninguna lo tiene. */
export function normalizarPauta(v: unknown): PautaPropia | null {
  if (!esObjeto(v)) return null;
  const comidas = (Array.isArray(v.comidas) ? v.comidas : [])
    .filter(esObjeto)
    .map((c) => ({ nombre: texto(c.nombre, LIMITES.nombreComida), detalle: texto(c.detalle, LIMITES.detalle) }))
    .filter((c) => c.detalle.length > 0)
    .slice(0, LIMITES.comidas);
  if (comidas.length === 0) return null;
  const enlace = texto(v.enlace, LIMITES.enlace);
  return {
    origen: v.origen === 'propia' ? 'propia' : 'profesional',
    titulo: texto(v.titulo, LIMITES.titulo) || (v.origen === 'propia' ? 'Mi pauta' : 'Pauta de mi nutricionista'),
    comidas,
    notas: texto(v.notas, LIMITES.notas),
    enlace: enlaceValido(enlace) ? enlace : '',
  };
}

/** Una rutina con forma válida y al menos una sesión con un ejercicio; null si no hay nada que mostrar. */
export function normalizarRutina(v: unknown): RutinaPropia | null {
  if (!esObjeto(v)) return null;
  const sesiones: SesionRutina[] = (Array.isArray(v.sesiones) ? v.sesiones : [])
    .filter(esObjeto)
    .map((s) => ({
      nombre: texto(s.nombre, LIMITES.nombreRutina),
      vueltas: entero(s.vueltas, 1, LIMITES.vueltasMax) ?? 1,
      items: (Array.isArray(s.items) ? s.items : [])
        .filter(esObjeto)
        .map((it) => ({
          nombre: texto(it.nombre, LIMITES.nombreEjercicio),
          cantidad: entero(it.cantidad, 1, LIMITES.cantidadMax) ?? 0,
          unidad: it.unidad === 'seg' ? ('seg' as const) : ('reps' as const),
        }))
        .filter((it) => it.nombre.length > 0 && it.cantidad > 0)
        .slice(0, LIMITES.itemsPorSesion),
    }))
    .filter((s) => s.items.length > 0)
    .slice(0, LIMITES.sesiones)
    .map((s, i) => ({ ...s, id: IDS_SESION[i], nombre: s.nombre || `Sesión ${IDS_SESION[i]}` }));
  if (sesiones.length === 0) return null;
  return {
    nombre: texto(v.nombre, LIMITES.nombreRutina) || 'Mi rutina',
    sesiones,
    notas: texto(v.notas, LIMITES.notas),
  };
}

export const idItemRutina = (sesion: IdSesionRutina, indice: number) => `propio-${sesion}-${indice}`;
export const idSesionPropia = (sesion: IdSesionRutina) => `${PREFIJO_SESION_PROPIA}${sesion}`;
export const esSesionPropia = (id: string) => id.startsWith(PREFIJO_SESION_PROPIA);

/** La rutina propia con la forma de un programa, para reutilizar la pantalla de sesión. Sin caminata: la meta viene del programa de la app. */
export function programaDeRutina(r: RutinaPropia | null): Programa {
  return {
    id: 'propio',
    nombre: r?.nombre ?? 'Mi rutina',
    paraQuien: 'Rutina cargada por ti, además del programa de Ruta 90. La app la muestra tal como la escribiste y no la revisa.',
    bloques: [
      {
        semanas: [1, 12],
        sesiones: (r?.sesiones ?? []).map((s) => ({
          id: idSesionPropia(s.id),
          nombre: s.nombre,
          vueltas: s.vueltas,
          items: s.items.map((it, i) => ({ ejercicio: idItemRutina(s.id, i), cantidad: it.cantidad, unidad: it.unidad })),
        })),
      },
    ],
    caminata: [],
  };
}

/** Las sesiones propias de una semana (las mismas todas las semanas); vacío si no hay rutina. */
export function sesionesPropias(r: RutinaPropia | null, semana: number): Sesion[] {
  return r ? sesionesDeSemana(programaDeRutina(r), semana) : [];
}

/** Los ejercicios de la rutina propia como catálogo: sin instrucciones ni alternativas, porque la app no los conoce. */
export function catalogoDeRutina(r: RutinaPropia | null): Ejercicio[] {
  return (r?.sesiones ?? []).flatMap((s) =>
    s.items.map((it, i) => ({ id: idItemRutina(s.id, i), nombre: it.nombre, tipo: 'fuerza' as const, requiere: [], instrucciones: [], cuidado: '' })),
  );
}

/** Catálogo de la app más los ejercicios propios; los ids no chocan porque los propios llevan prefijo. */
export function catalogoCompleto(r: RutinaPropia | null): Ejercicio[] {
  return r ? [...EJERCICIOS, ...catalogoDeRutina(r)] : EJERCICIOS;
}
