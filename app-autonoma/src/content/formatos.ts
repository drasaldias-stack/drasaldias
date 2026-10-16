import type { Ingrediente } from '../logic/tipos';

/**
 * Formatos de venta habituales de los productos envasados en supermercados chilenos, para orientar la compra.
 * Son referencias, no una lista exhaustiva: cada tienda y marca tiene sus propios tamaños y cambian con el tiempo.
 * Consultados el 16 de octubre de 2026 en lider.cl y jumbo.cl (fichas de producto de marcas propias y de terceros).
 * Las verduras, frutas y lo que se vende a granel o por unidad no llevan formato: la lista ya está en unidades o gramos.
 * En conservas el tamaño es el peso escurrido, que es como están las cantidades de las recetas.
 */
export type FormatoVenta = {
  /** Envase en singular: bolsa, caja, lata, frasco, bandeja, pote, botella. */
  envase: string;
  /** Contenido del envase en la unidad indicada. */
  tamano: number;
  unidad: Extract<Ingrediente['unidad'], 'g' | 'ml' | 'unidad'>;
};

const g = (envase: string, ...tamanos: number[]): FormatoVenta[] => tamanos.map((tamano) => ({ envase, tamano, unidad: 'g' }));
const ml = (envase: string, ...tamanos: number[]): FormatoVenta[] => tamanos.map((tamano) => ({ envase, tamano, unidad: 'ml' }));
const un = (envase: string, ...tamanos: number[]): FormatoVenta[] => tamanos.map((tamano) => ({ envase, tamano, unidad: 'unidad' }));

export const FORMATOS_VENTA: Record<string, FormatoVenta[]> = {
  // Legumbres y cereales secos.
  'Lentejas secas': g('bolsa', 500),
  'Porotos negros secos': g('bolsa', 1000),
  Quinoa: g('bolsa', 250, 350, 400),
  'Arroz integral': g('bolsa', 1000),
  'Pasta integral corta': g('bolsa', 400, 500),
  'Cuscús integral': g('bolsa', 250, 500),
  Avena: g('caja', 700, 800),
  'Pan integral': g('bolsa', 400, 500),
  'Galletas de arroz': g('paquete', 110, 150),
  // Conservas: peso escurrido.
  'Atún o jurel en agua, en conserva': g('lata', 90, 220),
  'Garbanzos cocidos, de frasco o lata': g('caja o lata', 230),
  'Tomate en cubos, en conserva o fresco': g('caja o lata', 380),
  // Carnes y pescados.
  'Pechuga de pollo': g('bandeja', 780, 850, 1000),
  'Pechuga o trutro deshuesado de pollo': g('bandeja', 780, 850, 1000),
  'Carne molida de vacuno, 5 % de grasa o menos': g('bandeja', 250, 500),
  'Lomo de cerdo': g('bandeja', 800),
  'Filete de pescado blanco (merluza, reineta u otro)': g('bolsa', 500),
  Huevo: un('caja', 12, 20, 30),
  // Lácteos y alternativas.
  'Leche o bebida vegetal sin azúcar': ml('caja', 1000),
  'Yogur natural sin azúcar': g('pote', 120, 150, 800),
  Quesillo: g('pote', 300),
  'Tofu firme': g('envase', 200, 350, 500),
  // Despensa.
  'Semillas de chía': g('bolsa', 175, 250, 375),
  Nueces: g('bolsa', 100, 200),
  'Nueces o almendras': g('bolsa', 100, 200),
  'Mantequilla de maní': g('frasco', 350, 400, 500),
  'Tahini o aceite de oliva': g('frasco', 225, 330),
  Mostaza: g('frasco', 210, 250),
  'Salsa de soya baja en sodio': ml('botella', 165, 500),
};
