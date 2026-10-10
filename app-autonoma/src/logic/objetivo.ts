import { ACTIVIDADES, COMIDAS, SEXOS, type Actividad, type Comida, type DatosCalculo, type Objetivo, type Sexo } from './tipos';

// Objetivo diario de energía y proteína: validación, reparto en las cuatro comidas y sugerencia a partir de los
// datos corporales. La sugerencia es solo un punto de partida: lo que manda es lo que indique el profesional.

export const LIMITES_OBJETIVO = { kcal: [800, 4000], proteina: [30, 300] } as const;
export const LIMITES_DATOS = { edad: [18, 100], pesoKg: [35, 300], tallaCm: [130, 220] } as const;

/** Reparto de la energía del día entre las cuatro comidas. Fijo en esta versión. */
export const REPARTO_KCAL: Record<Comida, number> = { desayuno: 0.25, almuerzo: 0.35, once: 0.15, cena: 0.25 };
/** Reparto de la proteína: más en almuerzo y cena, donde hay una porción de proteína, y menos en la once. */
export const REPARTO_PROTEINA: Record<Comida, number> = { desayuno: 0.2, almuerzo: 0.35, once: 0.1, cena: 0.35 };

/** Factor sobre el gasto en reposo según actividad habitual (sedentaria, ligera, moderada). */
export const FACTOR_ACTIVIDAD: Record<Actividad, number> = { baja: 1.2, media: 1.375, alta: 1.55 };
/** Déficit diario que propone la app respecto del gasto total estimado. */
export const DEFICIT_KCAL = 500;
/** Por debajo de esto la app no sugiere: un plan tan bajo necesita supervisión directa. */
export const PISO_KCAL: Record<Sexo, number> = { mujer: 1200, hombre: 1500 };
/** Rango de proteína por kilo de peso de referencia que muestra la sugerencia. */
export const PROTEINA_G_POR_KG = [1.2, 1.6] as const;

export const redondearA = (x: number, paso: number) => Math.round(x / paso) * paso;
const entre = (x: unknown, [min, max]: readonly [number, number]): x is number => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;

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
  const ideal = 25 * talla * talla;
  return imc(d) < 30 ? d.pesoKg : ideal + 0.25 * (d.pesoKg - ideal);
}

export type Sugerencia = {
  reposo: number;
  total: number;
  kcal: number;
  /** La sugerencia quedó en el piso porque el déficit la dejaba por debajo. */
  enPiso: boolean;
  proteinaMin: number;
  proteinaMax: number;
  pesoReferencia: number;
  imc: number;
};

export function sugerirObjetivo(d: DatosCalculo): Sugerencia {
  const reposo = gastoReposo(d);
  const total = reposo * FACTOR_ACTIVIDAD[d.actividad];
  const sinPiso = total - DEFICIT_KCAL;
  const piso = PISO_KCAL[d.sexo];
  const ref = pesoReferencia(d);
  return {
    reposo: Math.round(reposo),
    total: Math.round(total),
    kcal: redondearA(Math.max(piso, sinPiso), 50),
    enPiso: sinPiso < piso,
    proteinaMin: redondearA(PROTEINA_G_POR_KG[0] * ref, 5),
    proteinaMax: redondearA(PROTEINA_G_POR_KG[1] * ref, 5),
    pesoReferencia: Math.round(ref),
    imc: Math.round(imc(d) * 10) / 10,
  };
}

export type MetaComida = { kcal: number; proteina: number };

/** Objetivo de cada comida según el reparto. */
export function objetivoPorComida(o: Objetivo): Record<Comida, MetaComida> {
  const out = {} as Record<Comida, MetaComida>;
  // El pequeño sumando evita que 31,4999… (producto en coma flotante de 90 × 0,35) se redondee hacia abajo.
  for (const c of COMIDAS) out[c] = { kcal: Math.round(o.kcal * REPARTO_KCAL[c] + 1e-9), proteina: Math.round(o.proteina * REPARTO_PROTEINA[c] + 1e-9) };
  return out;
}

export const NOMBRE_COMIDA: Record<Comida, string> = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', once: 'Once', cena: 'Cena' };
