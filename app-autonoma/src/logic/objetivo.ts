import { ACTIVIDADES, COMIDAS, SEXOS, type Actividad, type Comida, type DatosCalculo, type Objetivo, type Sexo } from './tipos';

// Objetivo diario de energía y proteína: validación, reparto en las cuatro comidas y sugerencia a partir de los
// datos corporales. La sugerencia es solo un punto de partida: lo que manda es lo que indique el profesional.

export const LIMITES_OBJETIVO = { kcal: [800, 4000], proteina: [30, 300] } as const;
export const LIMITES_DATOS = { edad: [18, 100], pesoKg: [35, 300], tallaCm: [130, 220] } as const;

/** Reparto de la energía del día entre las cuatro comidas. Almuerzo y cena iguales. Fijo en esta versión. */
export const REPARTO_KCAL: Record<Comida, number> = { desayuno: 0.25, almuerzo: 0.3, once: 0.15, cena: 0.3 };
/** Reparto de la proteína: concentrada en almuerzo y cena, que llevan una porción de proteína; menos en desayuno y once. */
export const REPARTO_PROTEINA: Record<Comida, number> = { desayuno: 0.15, almuerzo: 0.375, once: 0.1, cena: 0.375 };

/**
 * Factor sobre el gasto en reposo según actividad habitual: 1,2 sedentaria, 1,375 ligera, 1,55 moderada (ejercicio
 * 3 a 5 días por semana). No se ofrece un nivel más alto: la app es para personas que están empezando.
 */
export const FACTOR_ACTIVIDAD: Record<Actividad, number> = { baja: 1.2, media: 1.375, alta: 1.55 };
/** Déficit diario que propone la app respecto del gasto total estimado, solo con IMC de 25 o más. */
export const DEFICIT_KCAL = 500;
/** Por debajo de esto la app no sugiere: un plan tan bajo necesita supervisión directa. */
export const PISO_KCAL: Record<Sexo, number> = { mujer: 1200, hombre: 1500 };
/** Rango de proteína por kilo de peso de referencia que muestra la sugerencia. */
export const PROTEINA_G_POR_KG = [1.2, 1.6] as const;
/** Cortes de IMC de la sugerencia: bajo 18,5 no se sugiere nada; de 18,5 a 25 se sugiere mantener; desde 25, déficit. */
export const IMC_BAJO_PESO = 18.5;
export const IMC_SOBREPESO = 25;
/** Desde este IMC la proteína se calcula con el peso ajustado. */
export const IMC_PESO_AJUSTADO = 30;

export const redondearA = (x: number, paso: number) => Math.round(x / paso) * paso;
const entre = (x: unknown, [min, max]: readonly [number, number]): x is number => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
const acotar = (x: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, x));

export const objetivoValido = (kcal: unknown, proteina: unknown): boolean => entre(kcal, LIMITES_OBJETIVO.kcal) && entre(proteina, LIMITES_OBJETIVO.proteina);

export function datosValidos(d: Partial<Record<keyof DatosCalculo, unknown>>): d is DatosCalculo {
  return (
    SEXOS.includes(d.sexo as Sexo) &&
    ACTIVIDADES.includes(d.actividad as Actividad) &&
    entre(d.edad, LIMITES_DATOS.edad) &&
    entre(d.pesoKg, LIMITES_DATOS.pesoKg) &&
    entre(d.tallaCm, LIMITES_DATOS.tallaCm)
  );
}

/** Gasto energético en reposo según la ecuación de Mifflin-St Jeor. */
export function gastoReposo(d: DatosCalculo): number {
  return 10 * d.pesoKg + 6.25 * d.tallaCm - 5 * d.edad + (d.sexo === 'hombre' ? 5 : -161);
}

export const imc = (d: Pick<DatosCalculo, 'pesoKg' | 'tallaCm'>): number => d.pesoKg / Math.pow(d.tallaCm / 100, 2);

/**
 * Peso con que se calcula la proteína: el real si el IMC es menor de 30; con IMC de 30 o más, el peso ajustado
 * (el peso que daría IMC 25 más un cuarto del exceso sobre ese peso), para no sobrestimar la necesidad.
 */
export function pesoReferencia(d: Pick<DatosCalculo, 'pesoKg' | 'tallaCm'>): number {
  const talla = d.tallaCm / 100;
  const ideal = IMC_SOBREPESO * talla * talla;
  return imc(d) < IMC_PESO_AJUSTADO ? d.pesoKg : ideal + 0.25 * (d.pesoKg - ideal);
}

/** Qué propone la app según el IMC: nada con bajo peso, mantener con peso normal, déficit desde sobrepeso. */
export type ModoSugerencia = 'sin_sugerencia' | 'mantenimiento' | 'deficit';

export type Sugerencia = {
  modo: ModoSugerencia;
  imc: number;
  reposo: number;
  total: number;
  /** Energía antes de aplicar el piso y el redondeo (total, o total menos el déficit). */
  sinRedondear: number;
  kcal: number;
  /** La sugerencia quedó en el piso porque el déficit la dejaba por debajo. */
  enPiso: boolean;
  /** La sugerencia quedó en el máximo que admite la app. */
  enTope: boolean;
  proteinaMin: number;
  proteinaMax: number;
  pesoReferencia: number;
};

export function sugerirObjetivo(d: DatosCalculo): Sugerencia {
  const indice = imc(d);
  const modo: ModoSugerencia = indice < IMC_BAJO_PESO ? 'sin_sugerencia' : indice < IMC_SOBREPESO ? 'mantenimiento' : 'deficit';
  const reposo = gastoReposo(d);
  const total = reposo * FACTOR_ACTIVIDAD[d.actividad];
  const sinRedondear = modo === 'deficit' ? total - DEFICIT_KCAL : total;
  const piso = PISO_KCAL[d.sexo];
  const redondeada = redondearA(Math.max(piso, sinRedondear), 50);
  const ref = pesoReferencia(d);
  return {
    modo,
    imc: Math.round(indice * 10) / 10,
    reposo: Math.round(reposo),
    total: Math.round(total),
    sinRedondear: Math.round(sinRedondear),
    kcal: acotar(redondeada, LIMITES_OBJETIVO.kcal),
    enPiso: sinRedondear < piso,
    enTope: redondeada > LIMITES_OBJETIVO.kcal[1],
    proteinaMin: acotar(redondearA(PROTEINA_G_POR_KG[0] * ref, 5), LIMITES_OBJETIVO.proteina),
    proteinaMax: acotar(redondearA(PROTEINA_G_POR_KG[1] * ref, 5), LIMITES_OBJETIVO.proteina),
    pesoReferencia: Math.round(ref),
  };
}

/** Si la sugerencia puede guardarse como objetivo. */
export const sugerenciaUsable = (s: Sugerencia): boolean => s.modo !== 'sin_sugerencia' && objetivoValido(s.kcal, s.proteinaMin);

export type MetaComida = { kcal: number; proteina: number };

/** Objetivo de cada comida según el reparto. */
export function objetivoPorComida(o: Objetivo): Record<Comida, MetaComida> {
  const out = {} as Record<Comida, MetaComida>;
  // El pequeño sumando evita que 33,7499… (producto en coma flotante) se redondee hacia abajo.
  for (const c of COMIDAS) out[c] = { kcal: Math.round(o.kcal * REPARTO_KCAL[c] + 1e-9), proteina: Math.round(o.proteina * REPARTO_PROTEINA[c] + 1e-9) };
  return out;
}

export const NOMBRE_COMIDA: Record<Comida, string> = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', once: 'Once', cena: 'Cena' };
export const NOMBRE_COMIDA_PLURAL: Record<Comida, string> = { desayuno: 'Los desayunos', almuerzo: 'Los almuerzos', once: 'Las onces', cena: 'Las cenas' };
