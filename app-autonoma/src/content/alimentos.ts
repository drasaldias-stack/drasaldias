import type { Alimento } from '../logic/tipos';

// VALORES DE REFERENCIA PROVISIONALES. Energía (kcal) y proteína (g) por 100 g del alimento crudo tal como se compra,
// o por 100 ml cuando la receta lo mide en ml, cucharadas (cda) o cucharaditas (cdta).
// Se ingresaron desde el conocimiento general de las tablas de composición de alimentos, sin acceso a una tabla
// oficial al momento de escribirlos, y están redondeados. El equipo de nutrición debe revisarlos y corregirlos
// (idealmente con la tabla chilena de composición de alimentos o con FoodData Central del USDA) antes de usar los
// objetivos con pacientes. Las claves son los nombres exactos de los ingredientes de componentes.ts; una prueba
// automática verifica que ningún ingrediente quede sin valor.
//
// Supuestos que conviene conocer:
// - «Leche o bebida vegetal sin azúcar» usa valores de leche semidescremada. Una bebida de almendras aporta
//   bastante menos energía y proteína; una de soya se parece a la leche.
// - «Fruta de estación» es un promedio de frutas frescas comunes (manzana, pera, naranja, uva).
// - «Pechuga o trutro deshuesado de pollo» usa un valor intermedio entre pechuga y trutro sin piel.
// - «Atún o jurel en agua» es el peso escurrido.
// - Las especias y hierbas secas de despensa se cuentan como cero: en cucharaditas no cambian el resultado.

const UNIDAD = {
  limon: 60, cebolla: 150, zanahoria: 80, ajo: 3, pimenton: 150, huevo: 50, tomate: 120, zapalloItaliano: 200, platano: 120,
};

export const ALIMENTOS: Record<string, Alimento> = {
  // Carnes, pescados y huevos
  'Pechuga o trutro deshuesado de pollo': { kcal: 120, proteina: 21 },
  'Pechuga de pollo': { kcal: 120, proteina: 22.5 },
  'Carne molida de vacuno, 5 % de grasa o menos': { kcal: 137, proteina: 21 },
  'Lomo de cerdo': { kcal: 110, proteina: 21 },
  'Filete de pescado blanco (merluza, reineta u otro)': { kcal: 90, proteina: 18 },
  'Atún o jurel en agua, en conserva': { kcal: 115, proteina: 24 },
  Huevo: { kcal: 143, proteina: 12.6, porUnidad: UNIDAD.huevo },

  // Legumbres, cereales y tubérculos
  'Lentejas secas': { kcal: 352, proteina: 24.6 },
  'Porotos negros secos': { kcal: 341, proteina: 21.6 },
  'Garbanzos cocidos, de frasco o lata': { kcal: 164, proteina: 8.9 },
  'Arroz integral': { kcal: 365, proteina: 7.5 },
  Quinoa: { kcal: 368, proteina: 14 },
  'Papa o camote': { kcal: 80, proteina: 2 },
  'Papas pequeñas': { kcal: 77, proteina: 2 },
  'Pasta integral corta': { kcal: 348, proteina: 14.6 },
  'Cuscús integral': { kcal: 376, proteina: 12.8 },
  'Choclo desgranado congelado': { kcal: 88, proteina: 3 },
  Avena: { kcal: 389, proteina: 16.9 },
  'Pan integral': { kcal: 250, proteina: 9 },
  'Galletas de arroz': { kcal: 385, proteina: 8 },

  // Lácteos y alternativas
  'Tofu firme': { kcal: 120, proteina: 13 },
  'Yogur natural sin azúcar': { kcal: 60, proteina: 4 },
  'Leche o bebida vegetal sin azúcar': { kcal: 42, proteina: 3.4 },
  Quesillo: { kcal: 130, proteina: 12 },

  // Verduras y frutas
  Limón: { kcal: 29, proteina: 1.1, porUnidad: UNIDAD.limon },
  Cebolla: { kcal: 40, proteina: 1.1, porUnidad: UNIDAD.cebolla },
  'Cebolla morada': { kcal: 40, proteina: 1.1, porUnidad: UNIDAD.cebolla },
  Zanahoria: { kcal: 41, proteina: 0.9, porUnidad: UNIDAD.zanahoria },
  Ajo: { kcal: 149, proteina: 6.4, porUnidad: UNIDAD.ajo },
  Pimentón: { kcal: 28, proteina: 1, porUnidad: UNIDAD.pimenton },
  Tomate: { kcal: 18, proteina: 0.9, porUnidad: UNIDAD.tomate },
  'Tomate en cubos, en conserva o fresco': { kcal: 20, proteina: 1 },
  'Zapallo italiano (calabacín)': { kcal: 17, proteina: 1.2, porUnidad: UNIDAD.zapalloItaliano },
  Espinaca: { kcal: 23, proteina: 2.9 },
  Brócoli: { kcal: 34, proteina: 2.8 },
  Coliflor: { kcal: 25, proteina: 1.9 },
  Repollo: { kcal: 25, proteina: 1.3 },
  'Zapallo (calabaza)': { kcal: 30, proteina: 1 },
  Champiñones: { kcal: 22, proteina: 3.1 },
  'Porotos verdes (judías verdes)': { kcal: 31, proteina: 1.8 },
  'Betarraga (remolacha)': { kcal: 43, proteina: 1.6 },
  'Albahaca fresca': { kcal: 23, proteina: 3.2 },
  'Fruta de estación': { kcal: 55, proteina: 0.7 },
  Plátano: { kcal: 89, proteina: 1.1, porUnidad: UNIDAD.platano },
  Palta: { kcal: 160, proteina: 2 },

  // Despensa (por 100 ml cuando se mide en ml o cucharadas)
  'Aceite de oliva': { kcal: 815, proteina: 0 },
  Mostaza: { kcal: 60, proteina: 4 },
  'Salsa de soya baja en sodio': { kcal: 55, proteina: 8 },
  'Tahini o aceite de oliva': { kcal: 595, proteina: 17 },
  'Semillas de chía': { kcal: 486, proteina: 16.5 },
  Nueces: { kcal: 654, proteina: 15 },
  'Nueces o almendras': { kcal: 620, proteina: 17 },
  'Mantequilla de maní': { kcal: 590, proteina: 25 },

  // Condimentos de despensa: en las cantidades de las recetas no cambian el resultado.
  'Sal y pimienta': { kcal: 0, proteina: 0 },
  'Orégano seco': { kcal: 0, proteina: 0 },
  Comino: { kcal: 0, proteina: 0 },
  'Comino u orégano': { kcal: 0, proteina: 0 },
  'Comino y ají de color': { kcal: 0, proteina: 0 },
  'Comino y páprika': { kcal: 0, proteina: 0 },
  Páprika: { kcal: 0, proteina: 0 },
  'Romero seco': { kcal: 0, proteina: 0 },
  Perejil: { kcal: 0, proteina: 0 },
  'Eneldo o perejil': { kcal: 0, proteina: 0 },
  Canela: { kcal: 0, proteina: 0 },
};

export const alimentoPorNombre = (nombre: string): Alimento | undefined => ALIMENTOS[nombre];
