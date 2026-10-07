import type { Ejercicio, Material, Programa, Sesion } from './tipos';

export const SEMANAS_PROGRAMA = 12;
const DIA_MS = 86400000;

/** Fecha local en formato AAAA-MM-DD. */
export function hoyISO(fecha = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function aMediodia(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12).getTime();
}

/** Semana del programa (desde 1). Después de la 12 sigue contando para saber que terminó. */
export function semanaDelPrograma(inicioISO: string, hoy: string = hoyISO()): number {
  const dias = Math.round((aMediodia(hoy) - aMediodia(inicioISO)) / DIA_MS);
  return Math.max(1, Math.floor(dias / 7) + 1);
}

export function semanaVigente(semana: number): number {
  return Math.min(SEMANAS_PROGRAMA, Math.max(1, semana));
}

export function sesionesDeSemana(programa: Programa, semana: number): Sesion[] {
  const s = semanaVigente(semana);
  const bloque = programa.bloques.find((b) => s >= b.semanas[0] && s <= b.semanas[1]) ?? programa.bloques[programa.bloques.length - 1];
  return bloque.sesiones;
}

export function metaCaminata(programa: Programa, semana: number) {
  const s = semanaVigente(semana);
  return [...programa.caminata].reverse().find((c) => s >= c.semanaDesde) ?? programa.caminata[0];
}

/** Usa la alternativa si falta algún material. Evita ciclos. */
export function resolverEjercicio(id: string, materiales: Material[], catalogo: Ejercicio[]): Ejercicio | undefined {
  const vistos = new Set<string>();
  let actual = catalogo.find((e) => e.id === id);
  while (actual && actual.requiere.some((m) => !materiales.includes(m))) {
    if (!actual.alternativa || vistos.has(actual.id)) return actual;
    vistos.add(actual.id);
    actual = catalogo.find((e) => e.id === actual!.alternativa);
  }
  return actual;
}

export const vueltasPorMinutos = (minutos: 10 | 20 | 30) => (minutos === 10 ? 1 : minutos === 20 ? 2 : 3);

export const claveSesion = (semana: number, sesionId: string) => `${semanaVigente(semana)}-${sesionId}`;
