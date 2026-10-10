import { ALIMENTOS } from '../content/alimentos';
import type { Alimento, Componente, Ingrediente } from './tipos';

// Energía y proteína de ingredientes y de la porción base de cada componente, a partir de la tabla de alimentos.
// Sin dependencias de React para poder probarse con Node.

export type Nutricion = { kcal: number; proteina: number };
export const NADA: Nutricion = { kcal: 0, proteina: 0 };

const GRAMOS_CDA = 15;
const GRAMOS_CDTA = 5;

/** Gramos (o ml) que representa la cantidad de un ingrediente. */
export function gramosDe(ing: Pick<Ingrediente, 'cantidad' | 'unidad'>, alimento: Alimento | undefined): number {
  switch (ing.unidad) {
    case 'g':
    case 'ml':
      return ing.cantidad;
    case 'cda':
      return ing.cantidad * GRAMOS_CDA;
    case 'cdta':
      return ing.cantidad * GRAMOS_CDTA;
    case 'unidad':
    case 'diente':
      return ing.cantidad * (alimento?.porUnidad ?? 0);
  }
}

/** Energía y proteína de la cantidad indicada de un ingrediente, o null si no está en la tabla. */
export function nutricionIngrediente(ing: Ingrediente): Nutricion | null {
  const a = ALIMENTOS[ing.nombre];
  if (!a) return null;
  const g = gramosDe(ing, a);
  return { kcal: (a.kcal * g) / 100, proteina: (a.proteina * g) / 100 };
}

export const sumar = (...xs: Nutricion[]): Nutricion => xs.reduce((s, x) => ({ kcal: s.kcal + x.kcal, proteina: s.proteina + x.proteina }), NADA);
export const escalar = (n: Nutricion, f: number): Nutricion => ({ kcal: n.kcal * f, proteina: n.proteina * f });

/** Ingredientes del componente que no tienen valor en la tabla (la prueba automática exige que no haya ninguno). */
export const ingredientesSinValor = (c: Componente): string[] => c.ingredientes.filter((i) => !ALIMENTOS[i.nombre]).map((i) => i.nombre);

/** Energía y proteína de una porción base del componente (sus ingredientes divididos por las porciones que rinde). */
export function nutricionPorPorcion(c: Componente): Nutricion {
  const total = sumar(...c.ingredientes.map((ing) => nutricionIngrediente(ing) ?? NADA));
  return escalar(total, 1 / c.porciones);
}

export const redondearKcal = (kcal: number) => Math.round(kcal / 5) * 5;
export const redondearProteina = (g: number) => Math.round(g);
