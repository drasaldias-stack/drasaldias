import type { Componente } from '../logic/tipos';

// CONTENIDO DE EJEMPLO. Cada receta debe revisarla y aprobarla el equipo antes de publicar la app.
// Las cantidades son por persona para todas las porciones que rinde cada componente en la semana.
// Tiempos de refrigeración conservadores: comidas cocidas 3 a 4 días, contados desde el día en que se cocina.

const ACEITE = { nombre: 'Aceite de oliva', cantidad: 1, unidad: 'cda', categoria: 'Despensa', basico: true } as const;
const SAL = { nombre: 'Sal y pimienta', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true } as const;

// Notas repetidas. La cantidad y el complemento proteico los debe fijar el equipo de nutrición.
const NOTA_PROTEINA_VEGETAL =
  'Como proteína principal de una comida aporta menos proteína que una porción de carne o pescado. Complétala con un huevo, yogur natural o queso fresco si los comes, o con tofu, o pide a tu equipo de salud que ajuste la cantidad.';
const NOTA_PROTEINA_HUEVO =
  'Como proteína principal de una comida aporta menos proteína que una porción de carne o pescado. Complétala con yogur natural o queso fresco si los comes, o con tofu, o pide a tu equipo de salud que ajuste la cantidad.';
const NOTA_PROTEINA_TOFU =
  'Como proteína principal de una comida aporta menos proteína que una porción de carne o pescado. Complétalo con un huevo, yogur natural o queso fresco si los comes, o pide a tu equipo de salud que ajuste la cantidad.';
const NOTA_AVENA =
  'La avena no contiene gluten de trigo, pero suele contaminarse en el proceso. Si tienes enfermedad celíaca, usa solo avena certificada sin gluten y según te indique tu equipo de salud.';

export const COMPONENTES: Componente[] = [
  // ---------- Proteínas ----------
  {
    id: 'p_pollo_horno', nombre: 'Pollo al horno con limón y orégano', rol: 'proteina',
    patrones: ['omnivoro'], equipos: ['horno', 'airfryer'], contiene: ['pollo'],
    minutosActivos: 10, minutosTotales: 45, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [
      { nombre: 'Pechuga o trutro deshuesado de pollo', cantidad: 360, unidad: 'g', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Limón', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Orégano seco', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      ACEITE, SAL,
    ],
    pasos: [
      'Precalienta el horno a 200 °C o la freidora de aire a 190 °C.',
      'Mezcla el pollo con el jugo de limón, el aceite, el orégano, sal y pimienta.',
      'Cocina 30 a 35 minutos en horno (20 a 25 en freidora de aire) hasta que el centro no esté rosado. Con termómetro, 74 °C en el centro.',
      'Deja entibiar, corta en tiras y guarda en recipientes cerrados.',
    ],
  },
  {
    id: 'p_pollo_olla', nombre: 'Pollo desmenuzado en olla', rol: 'proteina',
    patrones: ['omnivoro'], equipos: ['olla'], contiene: ['pollo', 'cebolla'],
    minutosActivos: 10, minutosTotales: 35, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [
      { nombre: 'Pechuga de pollo', cantidad: 360, unidad: 'g', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Cebolla', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Zanahoria', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      { nombre: 'Comino', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      SAL,
    ],
    pasos: [
      'Pon el pollo, la cebolla y la zanahoria en trozos y el ajo en la olla con una taza de agua.',
      'Cocina 15 minutos con presión (en olla a presión eléctrica, 15 minutos más lo que tarda en tomar presión). Este tiempo no sirve para una olla de cocción lenta.',
      'Debe desmenuzarse sin partes rosadas; con termómetro, 74 °C. Desmenuza con dos tenedores y guarda con un poco del caldo para que no se seque.',
    ],
  },
  {
    id: 'p_pollo_plancha', nombre: 'Tiras de pollo a la plancha', rol: 'proteina',
    patrones: ['omnivoro'], equipos: ['cocinilla'], contiene: ['pollo'],
    minutosActivos: 15, minutosTotales: 20, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [
      { nombre: 'Pechuga de pollo', cantidad: 360, unidad: 'g', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      { nombre: 'Páprika', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      ACEITE, SAL,
    ],
    pasos: [
      'Corta el pollo en tiras y condimenta con ajo picado, páprika, sal y pimienta.',
      'Cocina en sartén caliente con poco aceite 6 a 8 minutos, dando vuelta, hasta que no quede rosado. Con termómetro, 74 °C.',
      'Enfría y guarda en recipientes cerrados.',
    ],
  },
  {
    id: 'p_carne_molida', nombre: 'Carne molida salteada con verduras', rol: 'proteina',
    patrones: ['omnivoro'], equipos: ['cocinilla'], contiene: ['vacuno', 'cebolla'],
    minutosActivos: 20, minutosTotales: 25, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [
      { nombre: 'Carne molida de vacuno, 5 % de grasa o menos', cantidad: 330, unidad: 'g', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Cebolla', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Pimentón', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Zanahoria', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      { nombre: 'Comino u orégano', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      ACEITE, SAL,
    ],
    pasos: [
      'Sofríe la cebolla, el ajo y el pimentón picados durante 5 minutos.',
      'Agrega la carne, desármala con una cuchara y cocina revolviendo hasta que no quede nada rosado. Con termómetro, 71 °C.',
      'Suma la zanahoria rallada 3 minutos más y condimenta.',
    ],
  },
  {
    id: 'p_albondigas', nombre: 'Albóndigas al horno', rol: 'proteina',
    patrones: ['omnivoro'], equipos: ['horno', 'airfryer'], contiene: ['vacuno', 'huevo', 'cebolla'],
    minutosActivos: 20, minutosTotales: 45, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [
      { nombre: 'Carne molida de vacuno, 5 % de grasa o menos', cantidad: 330, unidad: 'g', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Huevo', cantidad: 0.5, unidad: 'unidad', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Cebolla', cantidad: 0.25, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Zanahoria', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      SAL,
    ],
    pasos: [
      'Precalienta el horno a 200 °C o la freidora de aire a 190 °C.',
      'Mezcla la carne con el huevo, la cebolla picada fina y la zanahoria rallada.',
      'Forma albóndigas del tamaño de una nuez y cocina 18 a 20 minutos. Parte una del centro de la bandeja: no debe quedar rosada. Con termómetro, 71 °C en el centro.',
    ],
  },
  {
    id: 'p_cerdo', nombre: 'Lomo de cerdo al horno con mostaza', rol: 'proteina',
    patrones: ['omnivoro'], equipos: ['horno'], contiene: ['cerdo', 'mostaza'],
    minutosActivos: 10, minutosTotales: 55, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [
      { nombre: 'Lomo de cerdo', cantidad: 360, unidad: 'g', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Mostaza', cantidad: 3, unidad: 'cdta', categoria: 'Despensa' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      { nombre: 'Romero seco', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      SAL,
    ],
    pasos: [
      'Precalienta el horno a 200 °C.',
      'Unta el lomo con mostaza, ajo picado, romero, sal y pimienta.',
      'Hornea hasta 63 °C en el centro: unos 35 a 40 minutos para una pieza de 360 g; una pieza grande tarda bastante más. Si cocinas para varias personas, usa piezas de 350 a 400 g en vez de una sola. Deja reposar 5 minutos antes de cortar.',
    ],
  },
  {
    id: 'p_pescado', nombre: 'Pescado al horno en papillote', rol: 'proteina',
    patrones: ['omnivoro'], equipos: ['horno', 'airfryer'], contiene: ['pescado'],
    minutosActivos: 10, minutosTotales: 25, refrigeradorDias: 3, congelable: false, porciones: 2,
    ingredientes: [
      { nombre: 'Filete de pescado blanco (merluza, reineta u otro)', cantidad: 260, unidad: 'g', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Limón', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Tomate', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      ACEITE, SAL,
    ],
    pasos: [
      'Precalienta el horno a 200 °C.',
      'Pon cada filete sobre papel de horno con rodajas de tomate y limón, un chorrito de aceite y sal.',
      'Cierra el paquete y hornea 15 a 18 minutos (en freidora de aire, 180 °C por 12 a 14 minutos, con el paquete bien cerrado y sujeto por el pescado), hasta que se separe en láminas y esté opaco en el centro.',
    ],
    nota: 'Dura menos que las carnes: el plan lo deja para los primeros días de la semana.',
  },
  {
    id: 'p_atun', nombre: 'Ensalada de atún o jurel', rol: 'proteina',
    patrones: ['omnivoro'], equipos: ['sin_coccion'], contiene: ['pescado', 'cebolla'],
    minutosActivos: 10, minutosTotales: 10, refrigeradorDias: 3, congelable: false, frio: true, porciones: 2,
    ingredientes: [
      { nombre: 'Atún o jurel en agua, en conserva', cantidad: 240, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Cebolla morada', cantidad: 0.25, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Limón', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      ACEITE,
    ],
    pasos: [
      'Escurre el pescado y mézclalo con la cebolla picada fina y el jugo de limón.',
      'Guarda en un recipiente cerrado y aliña al momento de servir.',
    ],
  },
  {
    id: 'p_huevos', nombre: 'Huevos duros', rol: 'proteina',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla'], contiene: ['huevo'],
    minutosActivos: 5, minutosTotales: 20, refrigeradorDias: 5, congelable: false, frio: true, porciones: 3,
    ingredientes: [
      { nombre: 'Huevo', cantidad: 6, unidad: 'unidad', categoria: 'Carnes, pescados y huevos' },
    ],
    pasos: [
      'Cubre los huevos con agua fría y lleva a hervor.',
      'Cuenta 10 minutos de hervor suave y pásalos a agua fría.',
      'Guárdalos con cáscara en el refrigerador; así duran hasta 5 días.',
    ],
    nota: NOTA_PROTEINA_HUEVO,
  },
  {
    id: 'p_lentejas', nombre: 'Lentejas guisadas con verduras', rol: 'proteina',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla', 'olla'], contiene: ['cebolla'],
    minutosActivos: 15, minutosTotales: 45, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [
      { nombre: 'Lentejas secas', cantidad: 180, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Cebolla', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Zanahoria', cantidad: 1, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Pimentón', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      { nombre: 'Comino y ají de color', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      ACEITE, SAL,
    ],
    pasos: [
      'Sofríe la cebolla, la zanahoria, el pimentón y el ajo picados.',
      'Agrega las lentejas lavadas y tres veces su volumen de agua.',
      'Cocina 25 a 30 minutos, o 10 minutos en olla a presión, hasta que estén blandas.',
    ],
    nota: NOTA_PROTEINA_VEGETAL,
  },
  {
    id: 'p_porotos', nombre: 'Porotos negros en olla', rol: 'proteina',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['olla'], contiene: ['cebolla'],
    minutosActivos: 10, minutosTotales: 45, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [
      { nombre: 'Porotos negros secos', cantidad: 180, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Cebolla', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      { nombre: 'Comino', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      SAL,
    ],
    pasos: [
      'Remoja los porotos en agua la noche anterior y bota esa agua.',
      'Cocínalos en olla a presión 25 minutos con agua nueva que los cubra el doble.',
      'Sofríe la cebolla y el ajo, mézclalos con los porotos y condimenta.',
    ],
    nota: `Requiere remojo de 8 horas antes de la sesión de cocina. ${NOTA_PROTEINA_VEGETAL}`,
  },
  {
    id: 'p_garbanzos', nombre: 'Garbanzos asados especiados', rol: 'proteina',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['horno', 'airfryer'], contiene: [],
    minutosActivos: 10, minutosTotales: 40, refrigeradorDias: 4, congelable: false, porciones: 3,
    ingredientes: [
      { nombre: 'Garbanzos cocidos, de frasco o lata', cantidad: 360, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Comino y páprika', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      ACEITE, SAL,
    ],
    pasos: [
      'Enjuaga y seca muy bien los garbanzos.',
      'Mézclalos con aceite y especias.',
      'Hornea 30 minutos a 200 °C, o 15 a 18 en freidora de aire, moviendo a la mitad.',
    ],
    nota: NOTA_PROTEINA_VEGETAL,
  },
  {
    id: 'p_lentejas_ensalada', nombre: 'Ensalada tibia de lentejas', rol: 'proteina',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla', 'olla'], contiene: [],
    minutosActivos: 15, minutosTotales: 35, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [
      { nombre: 'Lentejas secas', cantidad: 180, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Zanahoria', cantidad: 1, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Pimentón', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Limón', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Perejil', cantidad: 1, unidad: 'cda', categoria: 'Despensa', basico: true },
      ACEITE, SAL,
    ],
    pasos: [
      'Cocina las lentejas lavadas en abundante agua 20 a 25 minutos, hasta que estén blandas pero enteras.',
      'Escurre y mezcla con la zanahoria rallada, el pimentón picado, el jugo de limón, el aceite y el perejil.',
    ],
    nota: NOTA_PROTEINA_VEGETAL,
  },
  {
    id: 'p_garbanzos_sarten', nombre: 'Garbanzos salteados con espinaca', rol: 'proteina',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla'], contiene: [],
    minutosActivos: 15, minutosTotales: 15, refrigeradorDias: 4, congelable: false, porciones: 3,
    ingredientes: [
      { nombre: 'Garbanzos cocidos, de frasco o lata', cantidad: 360, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Espinaca', cantidad: 150, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      { nombre: 'Comino', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      ACEITE, SAL,
    ],
    pasos: [
      'Enjuaga los garbanzos y sécalos.',
      'Saltea el ajo y el comino 1 minuto, agrega los garbanzos y dóralos 5 minutos.',
      'Suma la espinaca y cocina hasta que se reduzca.',
    ],
    nota: NOTA_PROTEINA_VEGETAL,
  },
  {
    id: 'p_tofu', nombre: 'Tofu dorado con salsa de soya', rol: 'proteina',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla', 'airfryer'], contiene: ['soya', 'gluten'],
    minutosActivos: 15, minutosTotales: 25, refrigeradorDias: 4, congelable: false, porciones: 3,
    ingredientes: [
      { nombre: 'Tofu firme', cantidad: 300, unidad: 'g', categoria: 'Lácteos y alternativas' },
      { nombre: 'Salsa de soya baja en sodio', cantidad: 2, unidad: 'cda', categoria: 'Despensa' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      ACEITE,
    ],
    pasos: [
      'Seca el tofu con papel y córtalo en cubos.',
      'Dóralo en sartén con poco aceite 10 minutos, o 15 en freidora de aire.',
      'Agrega el ajo picado y la salsa de soya al final y mezcla.',
    ],
    nota: NOTA_PROTEINA_TOFU,
  },
  {
    id: 'p_frittata', nombre: 'Tortilla de verduras al horno', rol: 'proteina',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['horno', 'airfryer'], contiene: ['huevo'],
    minutosActivos: 15, minutosTotales: 40, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [
      { nombre: 'Huevo', cantidad: 5, unidad: 'unidad', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Espinaca', cantidad: 100, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Zapallo italiano (calabacín)', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      ACEITE, SAL,
    ],
    pasos: [
      'Precalienta el horno a 180 °C.',
      'Saltea el zapallo italiano en cubos y la espinaca 3 minutos.',
      'Bate los huevos con sal, mezcla con las verduras y hornea en molde aceitado hasta que cuaje también en el centro: 20 a 25 minutos con 5 huevos; con más cantidad usa dos moldes en vez de uno más alto.',
    ],
    nota: NOTA_PROTEINA_HUEVO,
  },

  // ---------- Carbohidratos ----------
  {
    id: 'c_arroz', nombre: 'Arroz integral', rol: 'carbohidrato',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla', 'olla'], contiene: [],
    minutosActivos: 5, minutosTotales: 45, refrigeradorDias: 3, congelable: true, porciones: 3,
    ingredientes: [{ nombre: 'Arroz integral', cantidad: 150, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' }, SAL],
    pasos: [
      'Lava el arroz y ponlo con dos partes y media de agua por cada parte de arroz.',
      'Cuando hierva, tapa y cocina a fuego bajo 35 a 40 minutos.',
      'Extiéndelo en una bandeja para que se enfríe rápido y refrigéralo dentro de la primera hora.',
    ],
    nota: 'El arroz cocido es delicado: enfríalo en menos de una hora, consúmelo en 2 a 3 días o congélalo en porciones el mismo día, y recaliéntalo humeante una sola vez.',
  },
  {
    id: 'c_quinoa', nombre: 'Quinoa', rol: 'carbohidrato',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla'], contiene: [],
    minutosActivos: 5, minutosTotales: 20, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [{ nombre: 'Quinoa', cantidad: 150, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' }, SAL],
    pasos: [
      'Lava bien la quinoa en un colador para quitarle el amargor.',
      'Cocina con dos partes de agua por cada parte de quinoa durante 15 minutos.',
      'Deja reposar tapada 5 minutos y separa los granos con un tenedor.',
    ],
  },
  {
    id: 'c_papas', nombre: 'Papas o camotes asados', rol: 'carbohidrato',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['horno', 'airfryer'], contiene: [],
    minutosActivos: 10, minutosTotales: 40, refrigeradorDias: 4, congelable: false, porciones: 3,
    ingredientes: [{ nombre: 'Papa o camote', cantidad: 450, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' }, ACEITE, SAL],
    pasos: [
      'Corta en cubos de 2 a 3 cm y mezcla con aceite y sal.',
      'Hornea 30 minutos a 200 °C, o 20 en freidora de aire, moviendo a la mitad.',
    ],
  },
  {
    id: 'c_papas_micro', nombre: 'Papas cocidas al microondas', rol: 'carbohidrato',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['microondas'], contiene: [],
    minutosActivos: 5, minutosTotales: 15, refrigeradorDias: 4, congelable: false, porciones: 3,
    ingredientes: [{ nombre: 'Papas pequeñas', cantidad: 450, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' }],
    pasos: [
      'Lava las papas y pínchalas con un tenedor.',
      'Cocina en un recipiente tapado con dos cucharadas de agua, 8 a 10 minutos a potencia alta.',
    ],
  },
  {
    id: 'c_pasta', nombre: 'Pasta integral corta', rol: 'carbohidrato',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla'], contiene: ['gluten'],
    minutosActivos: 5, minutosTotales: 15, refrigeradorDias: 4, congelable: false, porciones: 3,
    ingredientes: [{ nombre: 'Pasta integral corta', cantidad: 180, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' }, SAL],
    pasos: ['Cocina en abundante agua con sal el tiempo del envase y escurre.', 'Mezcla con unas gotas de aceite para que no se pegue y enfría.'],
  },
  {
    id: 'c_cuscus', nombre: 'Cuscús integral', rol: 'carbohidrato',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla', 'microondas'], contiene: ['gluten'],
    minutosActivos: 5, minutosTotales: 10, refrigeradorDias: 4, congelable: false, porciones: 3,
    ingredientes: [{ nombre: 'Cuscús integral', cantidad: 150, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' }, SAL],
    pasos: ['Cubre el cuscús con la misma cantidad de agua hirviendo y tapa 5 minutos.', 'Separa los granos con un tenedor.'],
  },
  {
    id: 'c_choclo', nombre: 'Choclo (maíz) cocido', rol: 'carbohidrato',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla', 'microondas'], contiene: [],
    minutosActivos: 5, minutosTotales: 15, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [{ nombre: 'Choclo desgranado congelado', cantidad: 300, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' }],
    pasos: ['Cocina en agua hirviendo 5 minutos, o al microondas tapado 4 minutos.', 'Escurre y enfría.'],
  },

  // ---------- Verduras ----------
  {
    id: 'v_asadas', nombre: 'Verduras asadas: zapallo italiano, pimentón y cebolla morada', rol: 'verdura',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['horno', 'airfryer'], contiene: ['cebolla'],
    minutosActivos: 15, minutosTotales: 40, refrigeradorDias: 4, congelable: false, porciones: 3,
    ingredientes: [
      { nombre: 'Zapallo italiano (calabacín)', cantidad: 1, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Pimentón', cantidad: 1, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Cebolla morada', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      ACEITE, SAL,
    ],
    pasos: ['Corta todo en trozos parejos y mezcla con aceite y sal.', 'Asa 25 minutos a 200 °C, o 15 en freidora de aire.'],
  },
  {
    id: 'v_brocoli', nombre: 'Brócoli y coliflor al vapor', rol: 'verdura',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla', 'microondas'], contiene: [],
    minutosActivos: 5, minutosTotales: 12, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [
      { nombre: 'Brócoli', cantidad: 250, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Coliflor', cantidad: 200, unidad: 'g', categoria: 'Verduras y frutas' },
    ],
    pasos: [
      'Corta en ramitos.',
      'Cocina al vapor 5 a 6 minutos, o al microondas tapado con dos cucharadas de agua 4 a 5 minutos.',
      'Enfría rápido con agua fría para que mantengan el color.',
    ],
    nota: 'Cocidas y en cantidades habituales, las crucíferas son seguras también en hipotiroidismo cuando el consumo de yodo es adecuado.',
  },
  {
    id: 'v_repollo', nombre: 'Ensalada base de repollo y zanahoria', rol: 'verdura',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['sin_coccion'], contiene: [],
    minutosActivos: 15, minutosTotales: 15, refrigeradorDias: 5, congelable: false, frio: true, porciones: 3,
    ingredientes: [
      { nombre: 'Repollo', cantidad: 250, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Zanahoria', cantidad: 1, unidad: 'unidad', categoria: 'Verduras y frutas' },
    ],
    pasos: ['Corta el repollo en tiras finas y ralla la zanahoria.', 'Guarda sin aliñar; aliña cada porción al servir.'],
    nota: 'En porciones de ensalada, el repollo crudo es seguro también en hipotiroidismo cuando el consumo de yodo es adecuado; solo cantidades enormes y diarias podrían interferir.',
  },
  {
    id: 'v_espinaca', nombre: 'Espinacas salteadas con ajo', rol: 'verdura',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla'], contiene: [],
    minutosActivos: 10, minutosTotales: 10, refrigeradorDias: 3, congelable: false, porciones: 3,
    ingredientes: [
      { nombre: 'Espinaca', cantidad: 300, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      ACEITE, SAL,
    ],
    pasos: ['Saltea el ajo picado en poco aceite 1 minuto.', 'Agrega la espinaca y cocina 3 a 4 minutos hasta que se reduzca.'],
  },
  {
    id: 'v_zapallo', nombre: 'Zapallo (calabaza) asado', rol: 'verdura',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['horno', 'airfryer'], contiene: [],
    minutosActivos: 10, minutosTotales: 40, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [{ nombre: 'Zapallo (calabaza)', cantidad: 450, unidad: 'g', categoria: 'Verduras y frutas' }, ACEITE, SAL],
    pasos: ['Pela y corta en cubos.', 'Asa 30 minutos a 200 °C, o 18 en freidora de aire.'],
  },
  {
    id: 'v_champinones', nombre: 'Champiñones salteados', rol: 'verdura',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla'], contiene: ['champinones'],
    minutosActivos: 10, minutosTotales: 15, refrigeradorDias: 3, congelable: false, porciones: 3,
    ingredientes: [
      { nombre: 'Champiñones', cantidad: 250, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      ACEITE, SAL,
    ],
    pasos: ['Lamina los champiñones.', 'Saltea a fuego alto con ajo y poco aceite 8 minutos.'],
  },
  {
    id: 'v_porotos_verdes', nombre: 'Porotos verdes cocidos', rol: 'verdura',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla', 'microondas'], contiene: [],
    minutosActivos: 5, minutosTotales: 12, refrigeradorDias: 4, congelable: true, porciones: 3,
    ingredientes: [{ nombre: 'Porotos verdes (judías verdes)', cantidad: 350, unidad: 'g', categoria: 'Verduras y frutas' }],
    pasos: ['Corta las puntas.', 'Cocina en agua hirviendo 6 minutos, o al microondas tapado 5 minutos, y enfría con agua fría.'],
  },
  {
    id: 'v_betarraga', nombre: 'Betarraga (remolacha) cocida', rol: 'verdura',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['olla', 'cocinilla'], contiene: [],
    minutosActivos: 5, minutosTotales: 45, refrigeradorDias: 4, congelable: false, porciones: 3,
    ingredientes: [{ nombre: 'Betarraga (remolacha)', cantidad: 450, unidad: 'g', categoria: 'Verduras y frutas' }],
    pasos: ['Cocina con cáscara en agua 40 minutos, o 15 en olla a presión.', 'Pela bajo el agua fría y corta en cubos.'],
  },

  // ---------- Salsas ----------
  {
    id: 's_vinagreta', nombre: 'Vinagreta de mostaza y limón', rol: 'salsa',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['sin_coccion'], contiene: [],
    minutosActivos: 5, minutosTotales: 5, refrigeradorDias: 7, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Aceite de oliva', cantidad: 40, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Limón', cantidad: 1, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Mostaza', cantidad: 1, unidad: 'cdta', categoria: 'Despensa' },
      SAL,
    ],
    pasos: ['Pon todo en un frasco con tapa y agita.', 'Usa una cucharada por porción.'],
  },
  {
    id: 's_yogur', nombre: 'Aliño de yogur con limón y eneldo', rol: 'salsa',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['sin_coccion'], contiene: ['lacteos'],
    minutosActivos: 5, minutosTotales: 5, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Yogur natural sin azúcar', cantidad: 150, unidad: 'g', categoria: 'Lácteos y alternativas' },
      { nombre: 'Limón', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Eneldo o perejil', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      SAL,
    ],
    pasos: ['Mezcla el yogur con el jugo de limón, las hierbas y sal.', 'Guarda en frasco cerrado.'],
  },
  {
    id: 's_pesto', nombre: 'Pesto de espinaca y albahaca, sin queso', rol: 'salsa',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['licuadora'], contiene: ['frutos_secos'],
    minutosActivos: 10, minutosTotales: 10, refrigeradorDias: 4, congelable: true, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Espinaca', cantidad: 60, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Albahaca fresca', cantidad: 20, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Nueces', cantidad: 20, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Aceite de oliva', cantidad: 30, unidad: 'ml', categoria: 'Despensa' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      SAL,
    ],
    pasos: ['Procesa todo en la licuadora hasta formar una pasta.', 'Guarda en frasco cerrado, siempre refrigerado, y úsalo en 3 a 4 días; lo que no vayas a usar, congélalo en porciones pequeñas, por ejemplo en una cubetera.'],
    nota: 'Por el ajo en aceite, nunca lo dejes a temperatura ambiente.',
  },
  {
    id: 's_tomate', nombre: 'Salsa de tomate casera', rol: 'salsa',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla'], contiene: ['cebolla'],
    minutosActivos: 10, minutosTotales: 35, refrigeradorDias: 4, congelable: true, porciones: 5,
    ingredientes: [
      { nombre: 'Tomate en cubos, en conserva o fresco', cantidad: 300, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Cebolla', cantidad: 0.25, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      { nombre: 'Orégano seco', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      ACEITE, SAL,
    ],
    pasos: ['Sofríe la cebolla y el ajo 5 minutos.', 'Agrega el tomate y el orégano y cocina a fuego bajo 25 minutos.'],
  },
  {
    id: 's_hummus', nombre: 'Hummus', rol: 'salsa',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['licuadora'], contiene: ['sesamo'],
    minutosActivos: 10, minutosTotales: 10, refrigeradorDias: 4, congelable: true, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Garbanzos cocidos, de frasco o lata', cantidad: 200, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Limón', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Tahini o aceite de oliva', cantidad: 1, unidad: 'cda', categoria: 'Despensa' },
      { nombre: 'Ajo', cantidad: 1, unidad: 'diente', categoria: 'Verduras y frutas' },
      SAL,
    ],
    pasos: ['Procesa todo con un poco de agua fría hasta que quede cremoso.'],
  },

  // ---------- Desayunos ----------
  {
    id: 'd_avena', nombre: 'Avena remojada en frasco con fruta', rol: 'desayuno',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['sin_coccion'], contiene: ['gluten'],
    minutosActivos: 10, minutosTotales: 10, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Avena', cantidad: 200, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Leche o bebida vegetal sin azúcar', cantidad: 600, unidad: 'ml', categoria: 'Lácteos y alternativas' },
      { nombre: 'Fruta de estación', cantidad: 500, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Semillas de chía', cantidad: 25, unidad: 'g', categoria: 'Despensa' },
    ],
    pasos: ['Reparte en 5 frascos la avena, la chía y la leche o bebida vegetal y refrigera.', 'Agrega la fruta picada al servir. Se come frío desde el día siguiente.'],
    nota: NOTA_AVENA,
  },
  {
    id: 'd_chia', nombre: 'Pudín de chía con fruta', rol: 'desayuno',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['sin_coccion'], contiene: [],
    minutosActivos: 5, minutosTotales: 5, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Semillas de chía', cantidad: 125, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Leche o bebida vegetal sin azúcar', cantidad: 750, unidad: 'ml', categoria: 'Lácteos y alternativas' },
      { nombre: 'Fruta de estación', cantidad: 500, unidad: 'g', categoria: 'Verduras y frutas' },
    ],
    pasos: ['Mezcla la chía con la leche o bebida vegetal y reparte en 5 frascos.', 'Revuelve a los 10 minutos para que no se apelmace y deja hidratar al menos 2 horas o toda la noche.', 'Agrega la fruta al servir.'],
  },
  {
    id: 'd_muffins', nombre: 'Muffins de huevo y verduras', rol: 'desayuno',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['horno', 'airfryer'], contiene: ['huevo'],
    minutosActivos: 15, minutosTotales: 40, refrigeradorDias: 4, congelable: true, porciones: 5,
    ingredientes: [
      { nombre: 'Huevo', cantidad: 10, unidad: 'unidad', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Espinaca', cantidad: 60, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Pimentón', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Tomate', cantidad: 0.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Fruta de estación', cantidad: 750, unidad: 'g', categoria: 'Verduras y frutas' },
      SAL,
    ],
    pasos: [
      'Precalienta el horno a 180 °C.',
      'Bate los huevos con sal y mezcla con las verduras picadas.',
      'Reparte en moldes de muffin aceitados y hornea 20 a 25 minutos, hasta que cuajen en el centro.',
      'Una porción son 2 muffins con una fruta grande o dos chicas (unos 150 g). Sírvete lo que indica el menú.',
    ],
  },
  {
    id: 'd_granola', nombre: 'Granola casera sin azúcar con yogur', rol: 'desayuno',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['horno'], contiene: ['gluten', 'frutos_secos', 'lacteos'],
    minutosActivos: 10, minutosTotales: 35, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Avena', cantidad: 150, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Nueces o almendras', cantidad: 50, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Canela', cantidad: 1, unidad: 'cdta', categoria: 'Despensa', basico: true },
      ACEITE,
      { nombre: 'Yogur natural sin azúcar', cantidad: 625, unidad: 'g', categoria: 'Lácteos y alternativas' },
      { nombre: 'Fruta de estación', cantidad: 500, unidad: 'g', categoria: 'Verduras y frutas' },
    ],
    pasos: [
      'Mezcla la avena con los frutos secos picados, la canela y una cucharada de aceite.',
      'Hornea 15 a 20 minutos a 170 °C, moviendo a la mitad, y deja enfriar.',
      'Guarda en frasco seco. Sirve con yogur y fruta.',
    ],
    conservacion: 'La granola se guarda en frasco seco y cerrado a temperatura ambiente hasta 2 semanas. El yogur y la fruta van refrigerados y se agregan al servir.',
    nota: NOTA_AVENA,
  },
  {
    id: 'd_panqueques', nombre: 'Panqueques de avena y plátano', rol: 'desayuno',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla'], contiene: ['huevo', 'gluten'],
    minutosActivos: 20, minutosTotales: 25, refrigeradorDias: 3, congelable: true, porciones: 5,
    ingredientes: [
      { nombre: 'Avena', cantidad: 250, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Plátano', cantidad: 3, unidad: 'unidad', categoria: 'Verduras y frutas' },
      { nombre: 'Huevo', cantidad: 4, unidad: 'unidad', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Leche o bebida vegetal sin azúcar', cantidad: 250, unidad: 'ml', categoria: 'Lácteos y alternativas' },
    ],
    pasos: [
      'Licúa o muele la avena con el plátano, los huevos y la leche o bebida vegetal hasta tener una masa espesa que caiga de la cuchara; si queda muy densa, agrega un poco más de líquido.',
      'Cocina porciones pequeñas en sartén antiadherente 2 minutos por lado.',
      'Congela los que comerás desde el cuarto día.',
    ],
    nota: NOTA_AVENA,
  },

  // ---------- Once ----------
  // La cuarta comida: preparaciones simples que se arman al momento con lo que se dejó listo en la sesión.
  {
    id: 'o_tostadas_huevo', nombre: 'Tostadas integrales con huevo duro y tomate', rol: 'once',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla'], contiene: ['gluten', 'huevo'],
    minutosActivos: 5, minutosTotales: 15, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Pan integral', cantidad: 300, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Huevo', cantidad: 5, unidad: 'unidad', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Tomate', cantidad: 2.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      SAL,
    ],
    pasos: [
      'En la sesión, cocina los huevos 10 minutos desde que hierve el agua, pásalos a agua fría y guárdalos con cáscara.',
      'Una porción son 2 rebanadas de pan (unos 60 g) tostadas, un huevo pelado en rodajas y medio tomate con una pizca de sal. Sírvete lo que indica el menú.',
    ],
    conservacion: 'Los huevos duros con cáscara duran hasta 5 días refrigerados. El pan se guarda cerrado a temperatura ambiente, o congelado por rebanadas.',
  },
  {
    id: 'o_yogur', nombre: 'Yogur natural con fruta y nueces', rol: 'once',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['sin_coccion'], contiene: ['lacteos', 'frutos_secos'],
    minutosActivos: 5, minutosTotales: 5, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Yogur natural sin azúcar', cantidad: 850, unidad: 'g', categoria: 'Lácteos y alternativas' },
      { nombre: 'Fruta de estación', cantidad: 500, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Nueces', cantidad: 75, unidad: 'g', categoria: 'Despensa' },
    ],
    pasos: ['En la sesión, reparte las nueces en 5 bolsitas o frascos pequeños.', 'Una porción es un pote de yogur (170 g) con 100 g de fruta picada y una bolsita de nueces (15 g). Sírvete lo que indica el menú.'],
    conservacion: 'El yogur y la fruta van refrigerados y se sirven al momento; las nueces, en frasco cerrado.',
  },
  {
    id: 'o_palta_quesillo', nombre: 'Pan integral con palta y quesillo', rol: 'once',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['sin_coccion'], contiene: ['gluten', 'lacteos'],
    minutosActivos: 5, minutosTotales: 5, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Pan integral', cantidad: 300, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Palta', cantidad: 250, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Quesillo', cantidad: 300, unidad: 'g', categoria: 'Lácteos y alternativas' },
      SAL,
    ],
    pasos: ['Una porción son 2 rebanadas de pan (unos 60 g) con un cuarto de palta (50 g) y una rebanada de quesillo (60 g). Sírvete lo que indica el menú.'],
    conservacion: 'Compra las paltas en distintos puntos de madurez para que duren la semana. El quesillo, refrigerado y cerrado, hasta la fecha del envase.',
  },
  {
    id: 'o_atun', nombre: 'Pan integral con atún y tomate', rol: 'once',
    patrones: ['omnivoro'], equipos: ['sin_coccion'], contiene: ['gluten', 'pescado'],
    minutosActivos: 5, minutosTotales: 5, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Pan integral', cantidad: 300, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Atún o jurel en agua, en conserva', cantidad: 300, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Tomate', cantidad: 2.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
    ],
    pasos: ['Una porción son 2 rebanadas de pan (unos 60 g) con 60 g de atún o jurel escurrido y medio tomate en rodajas. Sírvete lo que indica el menú.'],
    conservacion: 'Una lata abierta, pasada a un recipiente cerrado, dura 3 días refrigerada: usa latas chicas o reparte una entre dos días seguidos.',
  },
  {
    id: 'o_fruta_mani', nombre: 'Fruta con mantequilla de maní y chía', rol: 'once',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['sin_coccion'], contiene: ['frutos_secos'],
    minutosActivos: 5, minutosTotales: 5, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Fruta de estación', cantidad: 750, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Mantequilla de maní', cantidad: 100, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Semillas de chía', cantidad: 25, unidad: 'g', categoria: 'Despensa' },
    ],
    pasos: ['Una porción es una fruta grande o dos chicas (unos 150 g) en trozos, con una cucharada colmada de mantequilla de maní (20 g) y una cucharadita de chía. Sírvete lo que indica el menú.'],
    conservacion: 'La fruta entera se guarda refrigerada; la mantequilla de maní (sin azúcar añadida) y la chía, en la despensa.',
    nota: 'El maní es una legumbre, pero por su alergia se agrupa con los frutos secos: esta once queda fuera si marcaste «Frutos secos».',
  },
  {
    id: 'o_batido', nombre: 'Batido de leche, avena y plátano', rol: 'once',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['licuadora'], contiene: ['gluten'],
    minutosActivos: 5, minutosTotales: 5, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Leche o bebida vegetal sin azúcar', cantidad: 1250, unidad: 'ml', categoria: 'Lácteos y alternativas' },
      { nombre: 'Avena', cantidad: 150, unidad: 'g', categoria: 'Legumbres, cereales y tubérculos' },
      { nombre: 'Plátano', cantidad: 5, unidad: 'unidad', categoria: 'Verduras y frutas' },
    ],
    pasos: ['Una porción es un vaso grande de leche o bebida vegetal (250 ml) licuado con 3 cucharadas de avena (30 g) y un plátano; se toma al momento. Sírvete lo que indica el menú.'],
    conservacion: 'No se prepara con anticipación: la leche y los plátanos se guardan como siempre y el batido se hace cada tarde.',
    nota: NOTA_AVENA,
  },
  {
    id: 'o_huevo_fruta', nombre: 'Huevo duro con fruta', rol: 'once',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['cocinilla'], contiene: ['huevo'],
    minutosActivos: 5, minutosTotales: 15, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Huevo', cantidad: 5, unidad: 'unidad', categoria: 'Carnes, pescados y huevos' },
      { nombre: 'Fruta de estación', cantidad: 750, unidad: 'g', categoria: 'Verduras y frutas' },
    ],
    pasos: [
      'En la sesión, cocina los huevos 10 minutos desde que hierve el agua, pásalos a agua fría y guárdalos con cáscara.',
      'Una porción es un huevo duro con una fruta grande o dos chicas (unos 150 g). Sírvete lo que indica el menú.',
    ],
    conservacion: 'Los huevos duros con cáscara duran hasta 5 días refrigerados; la fruta entera, refrigerada.',
  },
  {
    id: 'o_galletas_arroz', nombre: 'Galletas de arroz con palta y tomate', rol: 'once',
    patrones: ['omnivoro', 'vegetariano'], equipos: ['sin_coccion'], contiene: [],
    minutosActivos: 5, minutosTotales: 5, refrigeradorDias: 5, congelable: false, frio: true, porciones: 5,
    ingredientes: [
      { nombre: 'Galletas de arroz', cantidad: 150, unidad: 'g', categoria: 'Despensa' },
      { nombre: 'Palta', cantidad: 250, unidad: 'g', categoria: 'Verduras y frutas' },
      { nombre: 'Tomate', cantidad: 2.5, unidad: 'unidad', categoria: 'Verduras y frutas' },
      SAL,
    ],
    pasos: ['Una porción son 3 galletas de arroz (unos 30 g) con un cuarto de palta (50 g) y medio tomate en rodajas, con una pizca de sal. Sírvete lo que indica el menú.'],
    conservacion: 'Las galletas de arroz se guardan cerradas en la despensa; compra las paltas en distintos puntos de madurez para que duren la semana.',
  },
];

export const componentePorId = (id: string) => COMPONENTES.find((c) => c.id === id);
