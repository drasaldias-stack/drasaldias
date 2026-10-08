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
/** Las sesiones propias llevan este prefijo y su clave estable en el id, para no chocar con las A, B y C del programa
 * y para que las marcas sobrevivan a quitar o reordenar sesiones. */
export const PREFIJO_SESION_PROPIA = 'mi-';
const CLAVE_VALIDA = /^[a-z0-9]{1,12}$/;

/** Clave nueva para una sesión propia; no necesita ser única entre personas, solo dentro de la rutina. */
export const nuevaClave = () => Math.random().toString(36).slice(2, 8) || 'x';

export const TITULO_PAUTA: Record<PautaPropia['origen'], string> = { profesional: 'Pauta de mi profesional', propia: 'Mi pauta' };

export const PAUTA_PLANTILLA: PautaPropia = {
  origen: 'propia',
  titulo: TITULO_PAUTA.propia,
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
  sesiones: [{ id: 'A', clave: 'p1', nombre: 'Sesión A', vueltas: 1, items: [] }],
  notas: '',
};

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
// Quita caracteres de control (salvo salto de línea y tabulación), que solo pueden entrar por un código de respaldo manipulado.
const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max) : '');
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
    origen: v.origen === 'profesional' ? 'profesional' : 'propia',
    titulo: texto(v.titulo, LIMITES.titulo) || TITULO_PAUTA[v.origen === 'profesional' ? 'profesional' : 'propia'],
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
      clave: typeof s.clave === 'string' && CLAVE_VALIDA.test(s.clave) ? s.clave : '',
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
  // Claves faltantes o repetidas: se asigna una derivada de la posición (solo pasa con estados antiguos o manipulados).
  const vistas = new Set<string>();
  for (const [i, s] of sesiones.entries()) {
    if (!s.clave || vistas.has(s.clave)) s.clave = `p${i + 1}`;
    vistas.add(s.clave);
  }
  if (sesiones.length === 0) return null;
  return {
    nombre: texto(v.nombre, LIMITES.nombreRutina) || 'Mi rutina',
    sesiones,
    notas: texto(v.notas, LIMITES.notas),
  };
}

export const idItemRutina = (clave: string, indice: number) => `propio-${clave}-${indice}`;
export const idSesionPropia = (clave: string) => `${PREFIJO_SESION_PROPIA}${clave}`;
export const esSesionPropia = (id: string) => id.startsWith(PREFIJO_SESION_PROPIA);
/** Clave de sesión hecha (`semana-mi-clave`) que pertenece a una sesión propia. */
export const esMarcaPropia = (claveHecha: string) => claveHecha.includes(`-${PREFIJO_SESION_PROPIA}`);
/** Letra por posición (A, B, C) de una sesión propia a partir de su id; null si ya no existe en la rutina. */
export function letraSesionPropia(r: RutinaPropia | null, idSesion: string): IdSesionRutina | null {
  const i = (r?.sesiones ?? []).findIndex((s) => idSesionPropia(s.clave) === idSesion);
  return i >= 0 ? IDS_SESION[i] : null;
}

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
          id: idSesionPropia(s.clave),
          nombre: s.nombre,
          vueltas: s.vueltas,
          items: s.items.map((it, i) => ({ ejercicio: idItemRutina(s.clave, i), cantidad: it.cantidad, unidad: it.unidad })),
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

/** Cuidado genérico que se muestra una vez al inicio de una sesión propia, porque la app no conoce la técnica de esos ejercicios. Pendiente de validación clínica. */
export const CUIDADO_PROPIO =
  'Estos ejercicios los escribiste tú y Ruta 90 no conoce su técnica. Hazlos despacio y controlados, sin aguantar la respiración, y detente si duele. Si usas pesas o máquinas, elige una carga con la que completes todas las repeticiones con buena técnica.';

/** Los ejercicios de la rutina propia como catálogo: sin instrucciones ni alternativas, porque la app no los conoce. */
export function catalogoDeRutina(r: RutinaPropia | null): Ejercicio[] {
  return (r?.sesiones ?? []).flatMap((s) =>
    s.items.map((it, i) => ({ id: idItemRutina(s.clave, i), nombre: it.nombre, tipo: 'fuerza' as const, requiere: [], instrucciones: [], cuidado: '' })),
  );
}

/** Catálogo de la app más los ejercicios propios; los ids no chocan porque los propios llevan prefijo. */
export function catalogoCompleto(r: RutinaPropia | null): Ejercicio[] {
  return r ? [...EJERCICIOS, ...catalogoDeRutina(r)] : EJERCICIOS;
}

/** Cuántas sesiones suman el programa y la rutina propia en una semana; sirve para avisar sobre el volumen total. */
export const totalSesionesSemana = (sesionesPrograma: number, r: RutinaPropia | null) => sesionesPrograma + (r?.sesiones.length ?? 0);

/** Aviso sobre el volumen total cuando la rutina propia se suma al programa. Pendiente de validación clínica. */
export function avisoVolumen(sesionesPrograma: number, r: RutinaPropia | null): string | null {
  const propias = r?.sesiones.length ?? 0;
  if (propias === 0) return null;
  const total = sesionesPrograma + propias;
  return `Entre tu programa y tu rutina tienes ${total} sesiones esta semana. Si estás empezando, haz primero las ${sesionesPrograma} del programa y deja tu rutina en una o dos sesiones; no hagas fuerza dos días seguidos para los mismos músculos y descansa al menos un día a la semana sin sesión.`;
}
