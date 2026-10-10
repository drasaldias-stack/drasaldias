import { formatearCantidad } from './compras';
import { comidasDelDia, ROLES_PLATO, type Asignacion, type Menu, type RolPlato } from './menu';
import { escalar, NADA, nutricionPorPorcion, sumar, type Nutricion } from './nutricion';
import { NOMBRE_COMIDA_PLURAL, objetivoPorComida, type MetaComida } from './objetivo';
import type { Comida, Componente, Ingrediente, Objetivo } from './tipos';

// Dimensiona las porciones de cada comida para acercarse al objetivo del día. Las recetas no cambian: cambia cuántas
// porciones base de cada componente se comen en cada comida, y de ahí salen las cantidades a cocinar y a comprar.

/**
 * Múltiplos de porción base que se admiten; fuera de esto el plato deja de parecerse a la receta. El cereal no baja
 * de media porción (un cuarto son 15 g crudos, que nadie cocina). En desayuno y once el tope es 1½: lo que falte se
 * completa con una fruta o pan en vez de, por ejemplo, cuatro huevos al desayuno.
 */
export const LIMITES_FACTOR = { proteina: [0.5, 2], carbohidrato: [0.5, 2.5], simple: [0.5, 1.5] } as const;
export const PASO_FACTOR = 0.25;
/** Para cumplir la proteína se acepta pasarse hasta esta fracción de la energía de la comida. */
export const TOLERANCIA_ENERGIA = 0.1;
/** Se avisa que falta proteína cuando queda bajo esta fracción de lo previsto y además faltan al menos estos gramos. */
export const UMBRAL_PROTEINA_CORTA = 0.85;
export const MINIMO_PROTEINA_CORTA_G = 5;
/** Por debajo de esta fracción de la energía prevista se sugiere completar; por encima de la otra, se avisa el exceso. */
export const UMBRAL_ENERGIA_CORTA = 0.8;
export const UMBRAL_ENERGIA_EXCEDE = 1.15;

export type Porcion = { id: string; factor: number; nutricion: Nutricion };
export type ComidaPlan = {
  comida: Comida;
  porciones: Porcion[];
  total: Nutricion;
  meta: MetaComida | null;
  proteinaCorta: boolean;
  energiaCorta: boolean;
  energiaExcede: boolean;
};
export type DiaPlan = { dia: number; comidas: ComidaPlan[]; total: Nutricion; congelados: string[] };

const aCuartos = (x: number) => Math.round(x / PASO_FACTOR) * PASO_FACTOR;
const acotar = (x: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, Number.isFinite(x) ? x : min));

/**
 * Factores de cada rol para que el plato cumpla la meta de la comida. La verdura queda en una porción; el aliño
 * también, salvo que con él no quepa ni el plato mínimo, en cuyo caso baja a media. Se resuelve el sistema de dos
 * ecuaciones (energía y proteína) para proteína y cereal; si la solución exacta no es practicable, el cereal se
 * acota y la proteína sube hasta donde alcance la energía más la tolerancia; la energía que sobre la ocupa el cereal.
 */
export function dimensionarPlato(partes: Record<RolPlato, Nutricion>, meta: MetaComida | null): Record<RolPlato, number> {
  if (!meta) return { proteina: 1, carbohidrato: 1, verdura: 1, salsa: 1 };
  const kP = partes.proteina.kcal;
  const pP = partes.proteina.proteina;
  const kC = partes.carbohidrato.kcal;
  const pC = partes.carbohidrato.proteina;
  const lp = LIMITES_FACTOR.proteina;
  const lc = LIMITES_FACTOR.carbohidrato;
  const restante = (salsa: number) => ({
    K: meta.kcal - partes.verdura.kcal - salsa * partes.salsa.kcal,
    P: meta.proteina - partes.verdura.proteina - salsa * partes.salsa.proteina,
  });
  const salsa = restante(1).K < lp[0] * kP + lc[0] * kC ? 0.5 : 1;
  const { K, P } = restante(salsa);
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
  if (!(y >= lc[0] && y <= lc[1] && x >= lp[0] && x <= lp[1])) {
    y = acotar(y, lc);
    const xProteina = pP > 0 ? (P - pC * y) / pP : lp[0];
    const xEnergia = kP > 0 ? (K + TOLERANCIA_ENERGIA * meta.kcal - kC * y) / kP : lp[0];
    x = acotar(Math.min(xProteina, xEnergia), lp);
    if (kC > 0) y = acotar((K - kP * x) / kC, lc);
  }
  return { proteina: aCuartos(x), carbohidrato: aCuartos(y), verdura: 1, salsa };
}

/** Factor de una comida de un solo componente (desayuno u once): se ajusta por energía. */
export function dimensionarSimple(n: Nutricion, meta: MetaComida | null): number {
  if (!meta || n.kcal <= 0) return 1;
  return aCuartos(acotar(meta.kcal / n.kcal, LIMITES_FACTOR.simple));
}

const proteinaCorta = (total: Nutricion, meta: MetaComida | null) =>
  meta !== null && meta.proteina - total.proteina >= MINIMO_PROTEINA_CORTA_G && total.proteina < UMBRAL_PROTEINA_CORTA * meta.proteina;
const energiaCorta = (total: Nutricion, meta: MetaComida | null) => meta !== null && total.kcal < UMBRAL_ENERGIA_CORTA * meta.kcal;
const energiaExcede = (total: Nutricion, meta: MetaComida | null) => meta !== null && total.kcal > UMBRAL_ENERGIA_EXCEDE * meta.kcal;
const banderas = (total: Nutricion, meta: MetaComida | null) => ({
  proteinaCorta: proteinaCorta(total, meta),
  energiaCorta: energiaCorta(total, meta),
  energiaExcede: energiaExcede(total, meta),
});

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
    return { comida, porciones: [{ id: a.id, factor, nutricion: total }], total, meta, ...banderas(total, meta) };
  };
  const plato = (comida: Comida, partes: Record<RolPlato, Asignacion>): ComidaPlan => {
    const meta = metas?.[comida] ?? null;
    const nutr = {} as Record<RolPlato, Nutricion>;
    for (const r of ROLES_PLATO) nutr[r] = nut(partes[r].id);
    const factores = dimensionarPlato(nutr, meta);
    const porciones = ROLES_PLATO.map((r) => ({ id: partes[r].id, factor: factores[r], nutricion: escalar(nutr[r], factores[r]) }));
    const total = sumar(...porciones.map((p) => p.nutricion));
    return { comida, porciones, total, meta, ...banderas(total, meta) };
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

/** En qué comidas y con qué factor se sirve un componente en la semana (sin repetir). */
export function porcionesEnMenu(menu: Menu, catalogo: Componente[], objetivo: Objetivo | null, id: string): { comida: Comida; factor: number }[] {
  const vistas = new Set<string>();
  const out: { comida: Comida; factor: number }[] = [];
  for (const d of planDelDia(menu, catalogo, objetivo))
    for (const c of d.comidas)
      for (const p of c.porciones) {
        const clave = `${c.comida}|${p.factor}`;
        if (p.id !== id || vistas.has(clave)) continue;
        vistas.add(clave);
        out.push({ comida: c.comida, factor: p.factor });
      }
  return out;
}

export type AvisoSemana = { clave: string; texto: string };

const complementoProteina = (componentes: Componente[]): string => {
  const contiene = new Set(componentes.flatMap((c) => c.contiene));
  if (contiene.has('huevo')) return 'Súmales yogur natural o quesillo si los comes, o tofu.';
  if (contiene.has('lacteos')) return 'Súmales un huevo o tofu.';
  return 'Súmales un huevo, yogur natural o quesillo si los comes, o tofu.';
};

/**
 * Avisos de la semana, uno por combinación de comida y preparaciones (no uno por día): qué comidas quedan cortas de
 * proteína o de energía, o se pasan, y con qué completarlas.
 */
export function avisosSemana(plan: DiaPlan[], catalogo: Componente[]): AvisoSemana[] {
  const porId = new Map(catalogo.map((c) => [c.id, c]));
  const vistos = new Set<string>();
  const out: AvisoSemana[] = [];
  const kcal = (n: Nutricion) => Math.round(n.kcal / 5) * 5;
  for (const d of plan)
    for (const c of d.comidas) {
      if (!c.meta || (!c.proteinaCorta && !c.energiaCorta && !c.energiaExcede)) continue;
      const ids = c.porciones.map((p) => p.id);
      const componentes = ids.map((id) => porId.get(id)).filter((x): x is Componente => Boolean(x));
      const principal = componentes.find((x) => x.rol === 'proteina' || x.rol === 'desayuno' || x.rol === 'once');
      // Un aviso por comida y preparación principal: el cereal o la verdura del día no cambian el mensaje.
      const clave = `${c.comida}|${principal?.id ?? ids.join('+')}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      const sujeto = `${NOMBRE_COMIDA_PLURAL[c.comida]} con ${principal?.nombre ?? componentes[0]?.nombre ?? ids[0]}`;
      const frases: string[] = [];
      if (c.energiaExcede) {
        frases.push(`${sujeto} superan lo previsto (≈ ${kcal(c.total)} kcal de ${c.meta.kcal}) porque el plato no se arma con menos; con un objetivo tan bajo conviene revisarlo con tu profesional.`);
      } else {
        if (c.proteinaCorta) frases.push(`${sujeto} quedan en unos ${Math.round(c.total.proteina)} g de proteína de los ${c.meta.proteina} previstos. ${complementoProteina(componentes)}`);
        if (c.energiaCorta) frases.push(`${c.proteinaCorta ? 'Además quedan' : `${sujeto} quedan`} en ≈ ${kcal(c.total)} kcal de ${c.meta.kcal}: agrega una fruta o una rebanada de pan integral (unas 80 kcal cada una) hasta completar.`);
      }
      out.push({ clave, texto: frases.join(' ') });
    }
  return out;
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

const plural = (n: string) => (/ón$/.test(n) ? n.replace(/ón$/, 'ones') : /[aeiouáéíóú]$/.test(n) ? `${n}s` : `${n}es`);

/** Unidades redondeadas a medios con el nombre del alimento: «medio huevo», «1 huevo», «2½ huevos», «3 plátanos». */
export function textoUnidades(cantidad: number, nombre: string): string {
  const n = nombreCorto(nombre);
  const medios = Math.max(0.5, Math.round(cantidad * 2) / 2);
  const entero = Math.floor(medios);
  const medio = medios - entero >= 0.5;
  if (entero === 0) return `medio ${n}`;
  if (entero === 1 && !medio) return `1 ${n}`;
  return `${entero}${medio ? '½' : ''} ${plural(n)}`;
}

/** Cantidad legible de un ingrediente: gramos y mililitros a múltiplos de 5; unidades y dientes a medios. */
export function textoCantidad(cantidad: number, unidad: Ingrediente['unidad']): string {
  if (unidad === 'g' || unidad === 'ml') return formatearCantidad(Math.max(5, Math.round(cantidad / 5) * 5), unidad);
  if (unidad === 'unidad' || unidad === 'diente') {
    const medios = Math.max(0.5, Math.round(cantidad * 2) / 2);
    const entero = Math.floor(medios);
    const medio = medios - entero >= 0.5;
    const singular = medios <= 1;
    const palabra = unidad === 'unidad' ? (singular ? 'unidad' : 'unidades') : singular ? 'diente' : 'dientes';
    return `${entero === 0 ? '' : entero}${medio ? '½' : ''} ${palabra}`;
  }
  return formatearCantidad(Math.round(cantidad * 10) / 10, unidad);
}

/** Cantidad del ingrediente principal (el primero de la receta) que corresponde a esa porción, en crudo. */
export function cantidadPrincipal(c: Componente, factor: number): string | null {
  const ing = c.ingredientes.find((i) => !i.basico);
  if (!ing) return null;
  const cantidad = (ing.cantidad / c.porciones) * factor;
  if (ing.unidad === 'unidad') return textoUnidades(cantidad, ing.nombre);
  return `${textoCantidad(cantidad, ing.unidad)} de ${nombreCorto(ing.nombre)}`;
}
