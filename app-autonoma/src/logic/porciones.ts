import { formatearCantidad } from './compras';
import { comidasDelDia, ROLES_PLATO, type Asignacion, type Menu, type RolPlato } from './menu';
import { escalar, NADA, nutricionPorPorcion, sumar, type Nutricion } from './nutricion';
import { objetivoPorComida, type MetaComida } from './objetivo';
import type { Comida, Componente, Objetivo } from './tipos';

// Dimensiona las porciones de cada comida para acercarse al objetivo del día. Las recetas no cambian: cambia cuántas
// porciones base de cada componente se comen en cada comida, y de ahí salen las cantidades a cocinar y a comprar.

/**
 * Múltiplos de porción base que se admiten; fuera de esto el plato deja de parecerse a la receta. En desayuno y once
 * el tope es 1½: lo que falte se completa con una fruta o pan en vez de, por ejemplo, cuatro huevos al desayuno.
 */
export const LIMITES_FACTOR = { proteina: [0.5, 2], carbohidrato: [0.25, 2.5], simple: [0.5, 1.5] } as const;
export const PASO_FACTOR = 0.25;
/** Por debajo de esta fracción del objetivo de proteína de la comida, se avisa que falta proteína. */
export const UMBRAL_PROTEINA_CORTA = 0.85;
/** Por debajo de esta fracción de la energía prevista para la comida, se sugiere completarla. */
export const UMBRAL_ENERGIA_CORTA = 0.8;

export type Porcion = { id: string; factor: number; nutricion: Nutricion };
export type ComidaPlan = {
  comida: Comida;
  porciones: Porcion[];
  total: Nutricion;
  meta: MetaComida | null;
  proteinaCorta: boolean;
  energiaCorta: boolean;
};
export type DiaPlan = { dia: number; comidas: ComidaPlan[]; total: Nutricion; congelados: string[] };

const aCuartos = (x: number) => Math.round(x / PASO_FACTOR) * PASO_FACTOR;
const acotar = (x: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, Number.isFinite(x) ? x : min));

/**
 * Factores de proteína y cereal para que el plato (con una porción de verdura y una de salsa) cumpla la meta.
 * Resuelve el sistema de dos ecuaciones (energía y proteína). Si la solución exacta no es practicable, manda la
 * energía: se acota el cereal y la proteína se recalcula con la energía que queda; la falta de proteína se avisa aparte.
 */
export function dimensionarPlato(partes: Record<RolPlato, Nutricion>, meta: MetaComida | null): Record<RolPlato, number> {
  if (!meta) return { proteina: 1, carbohidrato: 1, verdura: 1, salsa: 1 };
  const kP = partes.proteina.kcal;
  const pP = partes.proteina.proteina;
  const kC = partes.carbohidrato.kcal;
  const pC = partes.carbohidrato.proteina;
  const K = meta.kcal - partes.verdura.kcal - partes.salsa.kcal;
  const P = meta.proteina - partes.verdura.proteina - partes.salsa.proteina;
  const det = kP * pC - kC * pP;
  let x: number;
  let y: number;
  if (Math.abs(det) > 1e-6) {
    x = (K * pC - kC * P) / det;
    y = (kP * P - pP * K) / det;
  } else {
    x = pP > 0 ? P / pP : 1;
    y = kC > 0 ? (K - kP * x) / kC : 1;
  }
  const lp = LIMITES_FACTOR.proteina;
  const lc = LIMITES_FACTOR.carbohidrato;
  if (!(y >= lc[0] && y <= lc[1] && x >= lp[0] && x <= lp[1])) {
    y = acotar(y, lc);
    x = kP > 0 ? acotar((K - kC * y) / kP, lp) : 1;
    y = kC > 0 ? acotar((K - kP * x) / kC, lc) : y;
  }
  return { proteina: aCuartos(x), carbohidrato: aCuartos(y), verdura: 1, salsa: 1 };
}

/** Factor de una comida de un solo componente (desayuno u once): se ajusta por energía. */
export function dimensionarSimple(n: Nutricion, meta: MetaComida | null): number {
  if (!meta || n.kcal <= 0) return 1;
  return aCuartos(acotar(meta.kcal / n.kcal, LIMITES_FACTOR.simple));
}

const proteinaCorta = (total: Nutricion, meta: MetaComida | null) => meta !== null && total.proteina < UMBRAL_PROTEINA_CORTA * meta.proteina;
const energiaCorta = (total: Nutricion, meta: MetaComida | null) => meta !== null && total.kcal < UMBRAL_ENERGIA_CORTA * meta.kcal;

/** Las cuatro comidas de cada día con sus porciones, dimensionadas según el objetivo (o en porciones base si no hay). */
export function planDelDia(menu: Menu, catalogo: Componente[], objetivo: Objetivo | null): DiaPlan[] {
  const metas = objetivo ? objetivoPorComida(objetivo) : null;
  const porId = new Map(catalogo.map((c) => [c.id, c]));
  const nut = (id: string): Nutricion => {
    const c = porId.get(id);
    return c ? nutricionPorPorcion(c) : NADA;
  };
  const simple = (comida: Comida, a: Asignacion): ComidaPlan => {
    const meta = metas?.[comida] ?? null;
    const n = nut(a.id);
    const factor = dimensionarSimple(n, meta);
    const total = escalar(n, factor);
    return { comida, porciones: [{ id: a.id, factor, nutricion: total }], total, meta, proteinaCorta: proteinaCorta(total, meta), energiaCorta: energiaCorta(total, meta) };
  };
  const plato = (comida: Comida, partes: Record<RolPlato, Asignacion>): ComidaPlan => {
    const meta = metas?.[comida] ?? null;
    const nutr = {} as Record<RolPlato, Nutricion>;
    for (const r of ROLES_PLATO) nutr[r] = nut(partes[r].id);
    const factores = dimensionarPlato(nutr, meta);
    const porciones = ROLES_PLATO.map((r) => ({ id: partes[r].id, factor: factores[r], nutricion: escalar(nutr[r], factores[r]) }));
    const total = sumar(...porciones.map((p) => p.nutricion));
    return { comida, porciones, total, meta, proteinaCorta: proteinaCorta(total, meta), energiaCorta: energiaCorta(total, meta) };
  };
  return comidasDelDia(menu, catalogo).map((d) => {
    const comidas = [simple('desayuno', d.desayuno), plato('almuerzo', d.almuerzo), simple('once', d.once), plato('cena', d.cena)];
    const asignaciones = [d.desayuno, d.once, ...ROLES_PLATO.map((r) => d.almuerzo[r]), ...ROLES_PLATO.map((r) => d.cena[r])];
    const congelados = [...new Set(asignaciones.filter((a) => a.congelar).map((a) => a.id))];
    return { dia: d.dia, comidas, total: sumar(...comidas.map((c) => c.total)), congelados };
  });
}

/** Porciones base de cada componente que se consumen en la semana: suma de los factores de todas las comidas en que aparece. */
export function consumoSemanal(menu: Menu, catalogo: Componente[], objetivo: Objetivo | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const d of planDelDia(menu, catalogo, objetivo)) for (const c of d.comidas) for (const p of c.porciones) m.set(p.id, (m.get(p.id) ?? 0) + p.factor);
  return m;
}

/** «media porción», «1 porción», «1¼ porciones». */
export function textoFactor(f: number): string {
  const entero = Math.floor(f + 1e-9);
  const cuartos = Math.round((f - entero) * 4);
  const frac = ['', '¼', '½', '¾'][cuartos] ?? '';
  if (entero === 0) return cuartos === 2 ? 'media porción' : `${frac} de porción`;
  return `${entero}${frac} ${entero === 1 && cuartos === 0 ? 'porción' : 'porciones'}`;
}

const nombreCorto = (nombre: string) => {
  const corto = nombre.split(/,| \(/)[0].trim();
  return corto.charAt(0).toLowerCase() + corto.slice(1);
};

/** Cantidad del ingrediente principal (el primero de la receta) que corresponde a esa porción, en crudo. */
export function cantidadPrincipal(c: Componente, factor: number): string | null {
  const ing = c.ingredientes.find((i) => !i.basico);
  if (!ing) return null;
  const cantidad = (ing.cantidad / c.porciones) * factor;
  const redondeada = ing.unidad === 'g' || ing.unidad === 'ml' ? Math.max(5, Math.round(cantidad / 5) * 5) : Math.round(cantidad * 4) / 4;
  return `${formatearCantidad(redondeada, ing.unidad)} de ${nombreCorto(ing.nombre)}`;
}
