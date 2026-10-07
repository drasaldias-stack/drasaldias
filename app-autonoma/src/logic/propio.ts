import { EJERCICIOS, PROGRAMAS } from '../content/ejercicios';
import type { Ejercicio, IdSesionRutina, PautaPropia, PreferenciasEjercicio, Programa, RutinaPropia, SesionRutina } from './tipos';

// Pauta de alimentación y rutina de ejercicio cargadas por la persona. La app las muestra tal como se
// escriben, sin revisarlas; por eso se validan solo en forma y tamaño, nunca en contenido.

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
export const MINUTOS_CAMINATA = [10, 15, 20, 30, 45, 60] as const;
export const DIAS_CAMINATA = [2, 3, 4, 5, 6, 7] as const;

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
  caminata: null,
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
  const cam = esObjeto(v.caminata) ? v.caminata : null;
  const minutosDia = cam ? entero(cam.minutosDia, 5, 180) : null;
  const dias = cam ? entero(cam.dias, 1, 7) : null;
  return {
    nombre: texto(v.nombre, LIMITES.nombreRutina) || 'Mi rutina',
    sesiones,
    caminata: minutosDia !== null && dias !== null ? { minutosDia, dias } : null,
    notas: texto(v.notas, LIMITES.notas),
  };
}

export const idItemRutina = (sesion: IdSesionRutina, indice: number) => `propio-${sesion}-${indice}`;

/** La rutina propia con la forma de un programa de la app, para reutilizar las pantallas de sesión y de semana. */
export function programaDeRutina(r: RutinaPropia | null): Programa {
  return {
    id: 'propio',
    nombre: r?.nombre ?? 'Mi rutina',
    paraQuien: 'Rutina cargada por ti. La app la muestra tal como la escribiste y no la revisa.',
    bloques: [
      {
        semanas: [1, 12],
        sesiones: (r?.sesiones ?? []).map((s) => ({
          id: s.id,
          nombre: s.nombre,
          vueltas: s.vueltas,
          items: s.items.map((it, i) => ({ ejercicio: idItemRutina(s.id, i), cantidad: it.cantidad, unidad: it.unidad })),
        })),
      },
    ],
    caminata: r?.caminata
      ? [{ semanaDesde: 1, minutosDia: r.caminata.minutosDia, dias: r.caminata.dias, texto: 'Meta que definiste tú. Puedes cambiarla al editar tu rutina.' }]
      : [],
  };
}

/** Los ejercicios de la rutina propia como catálogo: sin instrucciones ni alternativas, porque la app no los conoce. */
export function catalogoDeRutina(r: RutinaPropia | null): Ejercicio[] {
  return (r?.sesiones ?? []).flatMap((s) =>
    s.items.map((it, i) => ({ id: idItemRutina(s.id, i), nombre: it.nombre, tipo: 'fuerza' as const, requiere: [], instrucciones: [], cuidado: '' })),
  );
}

type ConRutina = { ejercicio: PreferenciasEjercicio; rutina: RutinaPropia | null };

export const esRutinaPropia = (p: ConRutina) => p.ejercicio.programa === 'propio';

export function programaActivo(p: ConRutina): Programa {
  return p.ejercicio.programa === 'propio' ? programaDeRutina(p.rutina) : PROGRAMAS[p.ejercicio.programa];
}

export function catalogoActivo(p: ConRutina): Ejercicio[] {
  return p.ejercicio.programa === 'propio' ? catalogoDeRutina(p.rutina) : EJERCICIOS;
}
