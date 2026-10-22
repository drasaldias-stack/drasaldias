import { formatearCantidad } from './compras';
import { comidasDelDia, ROLES_PLATO, type Asignacion, type Menu, type RolPlato } from './menu';
import { escalar, esDeHuevo, huevosPorPorcion, NADA, nutricionPorPorcion, sumar, type Nutricion } from './nutricion';
import { NOMBRE_COMIDA_PLURAL, objetivoPorComida, type MetaComida } from './objetivo';
import type { Comida, Componente, Exclusion, Ingrediente, Objetivo, Patron } from './tipos';

export { huevosPorPorcion } from './nutricion';

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
/**
 * Huevos crudos como máximo en las cuatro comidas de un día. El menú ya evita más de una preparación de huevo entre
 * proteínas, desayuno y once (menu.ts); este tope es la última barrera para los días en que igual se juntan (por
 * ejemplo, huevos duros en almuerzo y cena cuando la otra proteína ya venció). Se recorta de a un cuarto de porción
 * la comida cuyo cuarto quita más huevos (a igualdad, la de mayor porción, así almuerzo y cena bajan parejo), sin
 * tocar preparaciones donde el huevo es solo un ligante, y el desayuno o la once no bajan de una porción mientras un
 * plato pueda bajar. Lo que falte de proteína se avisa, nombrando esta causa. Criterio revisable por el equipo de salud.
 */
export const MAX_HUEVOS_DIA = 4;
/** Al recortar por huevos, el cereal puede subir hasta este extra sobre lo que tenía, no hasta su tope general. */
export const EXTRA_CEREAL_POR_HUEVOS = 0.5;

export type Porcion = { id: string; factor: number; nutricion: Nutricion };
export type ComidaPlan = {
  comida: Comida;
  porciones: Porcion[];
  total: Nutricion;
  meta: MetaComida | null;
  proteinaCorta: boolean;
  energiaCorta: boolean;
  energiaExcede: boolean;
  /** La porción se recortó por el tope de huevos del día. */
  porHuevos: boolean;
};
export type DiaPlan = { dia: number; comidas: ComidaPlan[]; total: Nutricion; congelados: string[]; huevos: number };

const aCuartos = (x: number) => Math.round(x / PASO_FACTOR) * PASO_FACTOR;
const acotar = (x: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, Number.isFinite(x) ? x : min));

/**
 * Factores de cada rol para que el plato cumpla la meta de la comida. La verdura queda en una porción; el aliño
 * también, salvo que con él no quepa ni el plato mínimo, en cuyo caso baja a media. Se resuelve el sistema de dos
 * ecuaciones (energía y proteína) para proteína y cereal; si la solución exacta no es practicable, el cereal se
 * acota y la proteína sube hasta donde alcance la energía más la tolerancia; la energía que sobre la ocupa el cereal.
 */
export function dimensionarPlato(
  partes: Record<RolPlato, Nutricion>,
  meta: MetaComida | null,
  topes: { proteina?: number; carbohidrato?: number } = {},
): Record<RolPlato, number> {
  if (!meta) return { proteina: 1, carbohidrato: 1, verdura: 1, salsa: 1 };
  const kP = partes.proteina.kcal;
  const pP = partes.proteina.proteina;
  const kC = partes.carbohidrato.kcal;
  const pC = partes.carbohidrato.proteina;
  const conTope = ([min, max]: readonly [number, number], tope?: number) => [min, Math.max(min, Math.min(max, tope ?? Infinity))] as const;
  const lp = conTope(LIMITES_FACTOR.proteina, topes.proteina);
  const lc = conTope(LIMITES_FACTOR.carbohidrato, topes.carbohidrato);
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
  const f = { proteina: aCuartos(x), carbohidrato: aCuartos(y), verdura: 1, salsa };
  // El redondeo a cuartos (y la tolerancia) no deben dejar el plato por sobre el umbral de exceso: si pasa, se quita
  // un cuarto de cereal, luego de proteína y por último medio aliño, hasta entrar en rango o llegar al plato mínimo.
  const energia = () => ROLES_PLATO.reduce((t, r) => t + partes[r].kcal * f[r], 0);
  while (energia() > UMBRAL_ENERGIA_EXCEDE * meta.kcal + 1e-9) {
    if (f.carbohidrato - PASO_FACTOR >= lc[0] - 1e-9) f.carbohidrato -= PASO_FACTOR;
    else if (f.proteina - PASO_FACTOR >= lp[0] - 1e-9) f.proteina -= PASO_FACTOR;
    else if (f.salsa > 0.5) f.salsa = 0.5;
    else break;
  }
  return { ...f, proteina: aCuartos(f.proteina), carbohidrato: aCuartos(f.carbohidrato) };
}

/** Factor de una comida de un solo componente (desayuno u once): se ajusta por energía. */
export function dimensionarSimple(n: Nutricion, meta: MetaComida | null, tope?: number): number {
  if (!meta || n.kcal <= 0) return 1;
  const limites = [LIMITES_FACTOR.simple[0], Math.max(LIMITES_FACTOR.simple[0], Math.min(LIMITES_FACTOR.simple[1], tope ?? Infinity))] as const;
  let f = aCuartos(acotar(meta.kcal / n.kcal, limites));
  // Si el redondeo deja la comida por sobre el umbral de exceso, se queda un cuarto más abajo.
  while (f * n.kcal > UMBRAL_ENERGIA_EXCEDE * meta.kcal + 1e-9 && f - PASO_FACTOR >= limites[0] - 1e-9) f = aCuartos(f - PASO_FACTOR);
  return f;
}

/** Si todos los factores de la comida están en su mínimo: no se puede servir menos sin salirse de las recetas. */
export function platoMinimo(c: ComidaPlan): boolean {
  if (c.porciones.length === 1) return c.porciones[0].factor <= LIMITES_FACTOR.simple[0];
  return c.porciones.every((p, i) => {
    const rol = ROLES_PLATO[i];
    if (rol === 'verdura') return true;
    if (rol === 'salsa') return p.factor <= 0.5;
    return p.factor <= LIMITES_FACTOR[rol][0];
  });
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
  const huevos = (id: string): number => {
    const c = porId.get(id);
    return c ? huevosPorPorcion(c) : 0;
  };
  const deHuevo = (id: string): boolean => {
    const c = porId.get(id);
    return c !== undefined && esDeHuevo(c);
  };
  const simple = (comida: Comida, a: Asignacion, tope?: number): ComidaPlan => {
    const meta = metas?.[comida] ?? null;
    const n = nut(a.id);
    const factor = dimensionarSimple(n, meta, tope);
    const total = escalar(n, factor);
    return { comida, porciones: [{ id: a.id, factor, nutricion: total }], total, meta, ...banderas(total, meta), porHuevos: tope !== undefined };
  };
  const plato = (comida: Comida, partes: Record<RolPlato, Asignacion>, topes: { proteina?: number; carbohidrato?: number } = {}): ComidaPlan => {
    const meta = metas?.[comida] ?? null;
    const nutr = {} as Record<RolPlato, Nutricion>;
    for (const r of ROLES_PLATO) nutr[r] = nut(partes[r].id);
    const factores = dimensionarPlato(nutr, meta, topes);
    const porciones = ROLES_PLATO.map((r) => ({ id: partes[r].id, factor: factores[r], nutricion: escalar(nutr[r], factores[r]) }));
    const total = sumar(...porciones.map((p) => p.nutricion));
    return { comida, porciones, total, meta, ...banderas(total, meta), porHuevos: topes.proteina !== undefined };
  };
  const huevosDelDia = (comidas: ComidaPlan[]) => comidas.reduce((s, c) => s + c.porciones.reduce((t, p) => t + p.factor * huevos(p.id), 0), 0);
  return comidasDelDia(menu, catalogo).map((d) => {
    const comidas = [simple('desayuno', d.desayuno), plato('almuerzo', d.almuerzo), simple('once', d.once), plato('cena', d.cena)];
    if (metas) {
      // Tope de huevos por día (ver MAX_HUEVOS_DIA). El cereal de un plato recortado sube a lo más EXTRA_CEREAL_POR_HUEVOS.
      const cerealInicial = { 1: comidas[1].porciones[1].factor, 3: comidas[3].porciones[1].factor } as Record<number, number>;
      const candidatas = [
        { indice: 3, plato: true, rehacer: (t: number) => plato('cena', d.cena, { proteina: t, carbohidrato: cerealInicial[3] + EXTRA_CEREAL_POR_HUEVOS }) },
        { indice: 2, plato: false, rehacer: (t: number) => simple('once', d.once, t) },
        { indice: 0, plato: false, rehacer: (t: number) => simple('desayuno', d.desayuno, t) },
        { indice: 1, plato: true, rehacer: (t: number) => plato('almuerzo', d.almuerzo, { proteina: t, carbohidrato: cerealInicial[1] + EXTRA_CEREAL_POR_HUEVOS }) },
      ];
      for (let vuelta = 0; vuelta < 40 && huevosDelDia(comidas) > MAX_HUEVOS_DIA + 1e-9; vuelta++) {
        const minimo = LIMITES_FACTOR.simple[0];
        const elegibles = candidatas
          .map((c) => ({ ...c, principal: comidas[c.indice].porciones[0] }))
          .filter((c) => deHuevo(c.principal.id) && c.principal.factor - PASO_FACTOR >= minimo - 1e-9);
        if (elegibles.length === 0) break;
        const quita = (c: (typeof elegibles)[number]) => huevos(c.principal.id) * PASO_FACTOR;
        const hayPlato = elegibles.some((c) => c.plato);
        // Desayuno y once no bajan de una porción mientras un plato pueda bajar: un «medio huevo» no es una colación.
        const posibles = elegibles.filter((c) => c.plato || !hayPlato || c.principal.factor - PASO_FACTOR >= 1 - 1e-9);
        const mejor = (posibles.length > 0 ? posibles : elegibles).reduce((m, c) =>
          quita(c) > quita(m) + 1e-9 || (Math.abs(quita(c) - quita(m)) <= 1e-9 && c.principal.factor > m.principal.factor + 1e-9) ? c : m,
        );
        comidas[mejor.indice] = mejor.rehacer(mejor.principal.factor - PASO_FACTOR);
      }
    }
    const asignaciones = [d.desayuno, d.once, ...ROLES_PLATO.map((r) => d.almuerzo[r]), ...ROLES_PLATO.map((r) => d.cena[r])];
    const congelados = [...new Set(asignaciones.filter((a) => a.congelar).map((a) => a.id))];
    return { dia: d.dia, comidas, total: sumar(...comidas.map((c) => c.total)), congelados, huevos: huevosDelDia(comidas) };
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

export type PrefsAviso = { patron?: Patron; exclusiones?: readonly Exclusion[] };

/**
 * Con qué completar la proteína: huevo, lácteos, tofu y, para quien come de todo, atún o pollo; sin repetir lo que ya
 * trae el plato, lo que la persona excluyó (alergia, intolerancia o preferencia) ni huevo en un día que ya está en el
 * tope. Si no queda nada, se remite al equipo de salud.
 */
export const complementoProteina = (componentes: Componente[], prefs: PrefsAviso = {}, sinHuevo = false): string => {
  const contiene = new Set(componentes.flatMap((c) => c.contiene));
  const exclusiones = prefs.exclusiones ?? [];
  const fuera = (e: Exclusion) => contiene.has(e) || exclusiones.includes(e);
  const opciones: string[] = [];
  if (!fuera('huevo') && !sinHuevo) opciones.push('un huevo');
  if (!fuera('lacteos')) opciones.push('un yogur natural o un trozo de quesillo');
  if (!fuera('soya')) opciones.push('tofu');
  if (prefs.patron === 'omnivoro') {
    if (!fuera('pescado')) opciones.push('una lata chica de atún en agua');
    if (!fuera('pollo')) opciones.push('un trozo de pollo cocido');
  }
  if (opciones.length === 0) return 'Pide a tu equipo de salud una fuente de proteína que puedas comer para completarlas.';
  return `Súmales ${enumerar(opciones, 'o')}.`;
};

/** «a», «a o b», «a, b o c»; con «, o» antes del último si alguna opción ya lleva « o ». */
export function enumerar(partes: string[], nexo: 'o' | 'y' = 'y'): string {
  if (partes.length <= 1) return partes[0] ?? '';
  const previas = partes.slice(0, -1).join(', ');
  const coma = nexo === 'o' && partes.some((p) => p.includes(' o ')) ? ',' : '';
  return `${previas}${coma} ${nexo} ${partes[partes.length - 1]}`;
}

/**
 * Avisos de la semana, uno por combinación de comida y preparación principal (no uno por día): qué comidas quedan
 * cortas de proteína o de energía, o se pasan, y con qué completarlas. Si no son todos los días, se nombran; las
 * cifras son las del peor día.
 */
export function avisosSemana(plan: DiaPlan[], catalogo: Componente[], prefs: PrefsAviso = {}): AvisoSemana[] {
  const porId = new Map(catalogo.map((c) => [c.id, c]));
  type Grupo = { comida: Comida; nombre: string; componentes: Componente[]; total: number; marcadas: { dia: number; c: ComidaPlan; huevos: number }[] };
  const grupos = new Map<string, Grupo>();
  for (const d of plan)
    for (const c of d.comidas) {
      if (!c.meta) continue;
      const ids = c.porciones.map((p) => p.id);
      const componentes = ids.map((id) => porId.get(id)).filter((x): x is Componente => Boolean(x));
      const principal = componentes.find((x) => x.rol === 'proteina' || x.rol === 'desayuno' || x.rol === 'once');
      // Un aviso por comida y preparación principal: el cereal o la verdura del día no cambian el mensaje.
      const clave = `${c.comida}|${principal?.id ?? ids.join('+')}`;
      const g = grupos.get(clave) ?? { comida: c.comida, nombre: principal?.nombre ?? componentes[0]?.nombre ?? ids[0], componentes, total: 0, marcadas: [] };
      g.total += 1;
      if (c.proteinaCorta || c.energiaCorta || c.energiaExcede) g.marcadas.push({ dia: d.dia, c, huevos: d.huevos });
      grupos.set(clave, g);
    }
  const kcal = (n: number) => Math.round(n / 5) * 5;
  const out: AvisoSemana[] = [];
  for (const [clave, g] of grupos) {
    if (g.marcadas.length === 0) continue;
    const meta = g.marcadas[0].c.meta!;
    type Marcada = (typeof g.marcadas)[number];
    // «el día 5», «los días 4 y 5»; «del día 5», «de los días 4 y 5», o nada si son todos los días de esa comida.
    const nombrar = (lista: Marcada[]) => (lista.length === 1 ? `el día ${lista[0].dia}` : `los días ${enumerar(lista.map((m) => String(m.dia)))}`);
    const dias = (lista: Marcada[]) => (lista.length >= g.total ? '' : ` de${nombrar(lista).replace(/^el /, 'l ').replace(/^los /, ' los ')}`);
    const sujeto = (lista: Marcada[]) => `${NOMBRE_COMIDA_PLURAL[g.comida]} con ${g.nombre}${dias(lista)}`;
    // El pronombre concuerda con la comida: «Además el del día 5 queda» (almuerzos), «Además las de los días 1 y 2 quedan» (cenas).
    const [uno, varios] = NOMBRE_COMIDA_PLURAL[g.comida].startsWith('Los') ? ['el', 'los'] : ['la', 'las'];
    const ademas = (lista: Marcada[]) =>
      lista.length >= g.total ? 'Además quedan' : `Además ${lista.length === 1 ? `${uno}${dias(lista)} queda` : `${varios}${dias(lista)} quedan`}`;
    const cortas = g.marcadas.filter((m) => m.c.proteinaCorta);
    const proteinaCorta = cortas.length > 0;
    const sinHuevo = g.marcadas.some((m) => m.huevos + 1 > MAX_HUEVOS_DIA + 1e-9);
    const peor = cortas.reduce<Marcada | null>((p, m) => (p === null || m.c.total.proteina < p.c.total.proteina ? m : p), null);
    const recortadas = cortas.filter((m) => m.c.porHuevos);
    // La causa del tope se atribuye solo al día de la cifra; si el peor día no fue recortado, se nombran aparte los que sí.
    const causa = peor?.c.porHuevos
      ? `, por el máximo de ${MAX_HUEVOS_DIA} huevos al día`
      : recortadas.length > 0
        ? ` (${nombrar(recortadas)} además por el máximo de ${MAX_HUEVOS_DIA} huevos al día)`
        : '';
    const proteina = `unos ${Math.round(peor?.c.total.proteina ?? 0)} g de proteína de los ${meta.proteina} previstos${causa}`;
    const complemento = complementoProteina(g.componentes, prefs, sinHuevo);
    const excedidas = g.marcadas.filter((m) => m.c.energiaExcede);
    const frases: string[] = [];
    if (excedidas.length > 0) {
      const maxKcal = kcal(Math.max(...excedidas.map((m) => m.c.total.kcal)));
      const exceso = `superan lo previsto (≈ ${maxKcal} kcal de ${meta.kcal})`;
      if (excedidas.every((m) => platoMinimo(m.c))) {
        // Ya es lo menos que se puede servir de estas recetas: no tiene sentido pedir que se agregue ni que se quite.
        frases.push(`${sujeto(excedidas)} ${exceso} aunque ya es el plato más chico que la app arma; con un objetivo tan bajo conviene revisarlo con tu profesional.`);
        if (proteinaCorta) frases.push(`${ademas(cortas)} en ${proteina}.`);
      } else {
        frases.push(`${sujeto(excedidas)} ${exceso}; si prefieres ajustar la energía, sirve un cuarto de porción menos.`);
        if (proteinaCorta) frases.push(`${ademas(cortas)} en ${proteina}. ${complemento}`);
      }
    } else {
      if (proteinaCorta) frases.push(`${sujeto(cortas)} quedan en ${proteina}. ${complemento}`);
      const bajas = g.marcadas.filter((m) => m.c.energiaCorta);
      if (bajas.length > 0) {
        const minKcal = kcal(Math.min(...bajas.map((m) => m.c.total.kcal)));
        frases.push(`${proteinaCorta ? ademas(bajas) : `${sujeto(bajas)} quedan`} en ≈ ${minKcal} kcal de ${meta.kcal}: agrega una fruta o una rebanada de pan integral (unas 80 kcal cada una) hasta completar.`);
      }
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
