import type { Clase } from '../logic/tipos';
import { SENALES_DETENERSE } from './ejercicios';

// CONTENIDO DE EJEMPLO. Guiones base para grabar las clases; el equipo debe revisarlos antes de publicar.
// Se libera una clase por semana desde el inicio del programa.

export const CLASES: Clase[] = [
  {
    id: 'c01', semana: 1, minutos: 8, videoUrl: null,
    titulo: 'Cómo usar tu plan',
    resumen: 'Qué hace la app, cómo se arma tu semana y qué no reemplaza.',
    puntos: [
      'Cada semana tienes tres sesiones de ejercicio, una meta de caminata y un menú para cocinar en una sola sesión.',
      'Puedes cambiar tus tiempos, tu equipamiento y lo que no comes cuando quieras, desde Perfil o desde la pestaña Menú.',
      'La app entrega educación general. No reemplaza la evaluación de un profesional de la salud.',
    ],
  },
  {
    id: 'c02', semana: 2, minutos: 10, videoUrl: null,
    titulo: 'El plato equilibrado',
    resumen: 'Una forma simple de armar almuerzos y cenas sin contar calorías.',
    puntos: [
      'Mitad del plato con verduras, un cuarto con proteína y un cuarto con cereales integrales, legumbres o tubérculos.',
      'Agua como bebida principal.',
      'Aceite de oliva, palta o frutos secos en porciones moderadas.',
    ],
  },
  {
    id: 'c03', semana: 3, minutos: 12, videoUrl: null,
    titulo: 'Cocinar por tandas',
    resumen: 'Cómo cocinar una vez y comer bien toda la semana, con seguridad.',
    puntos: [
      'Empieza por lo que más tarda en el horno o la olla y prepara lo rápido mientras tanto.',
      'Enfría rápido y refrigera dentro de las 2 horas; el arroz cocido, dentro de la primera hora.',
      'Las comidas cocidas duran 3 a 4 días en el refrigerador, contados desde el día que cocinas; los huevos duros con cáscara, hasta 5. Lo que comerás después, congélalo el mismo día.',
      'Recalienta solo la porción que vas a comer, hasta que esté humeante en todo el centro, y no recalientes dos veces. Lo congelado, pásalo al refrigerador la noche anterior.',
    ],
  },
  {
    id: 'c04', semana: 4, minutos: 9, videoUrl: null,
    titulo: 'Proteína en cada comida',
    resumen: 'Por qué ayuda a la saciedad y a cuidar los músculos.',
    puntos: [
      'Incluye una fuente de proteína en desayuno, almuerzo y cena: legumbres, huevos, pescado, pollo, carnes magras, lácteos o tofu.',
      'Una porción del tamaño de la palma de tu mano es una guía práctica.',
      'Si tienes enfermedad renal, sigue las indicaciones de tu equipo de salud sobre la proteína.',
    ],
  },
  {
    id: 'c05', semana: 5, minutos: 10, videoUrl: null,
    titulo: 'Moverse desde cero',
    resumen: 'Cuánto moverse, cómo progresar y cuándo detenerse.',
    puntos: [
      'La OMS recomienda entre 150 y 300 minutos semanales de actividad moderada y ejercicios de fuerza dos o más días por semana.',
      'Algo de actividad es mejor que nada. Sube de a poco: primero el tiempo, después la intensidad.',
      SENALES_DETENERSE,
    ],
  },
  {
    id: 'c06', semana: 6, minutos: 8, videoUrl: null,
    titulo: 'Leer etiquetas',
    resumen: 'Qué mirar en un envase en 30 segundos.',
    puntos: [
      'Revisa el tamaño de la porción antes que los números.',
      'Los ingredientes van de mayor a menor cantidad: si el azúcar está entre los primeros, hay mucha.',
      'Si tu país usa sellos de advertencia, prefiere productos con menos sellos.',
    ],
  },
  {
    id: 'c07', semana: 7, minutos: 10, videoUrl: null,
    titulo: 'Hambre, antojos y emociones',
    resumen: 'Distinguir el hambre física de las ganas de comer por otras razones.',
    puntos: [
      'El hambre física aparece de a poco y se calma con cualquier comida; el antojo suele ser urgente y específico.',
      'Dormir poco y saltarse comidas aumenta los antojos.',
      'Prohibir alimentos de forma rígida suele terminar en excesos. Si tienes atracones, busca ayuda profesional.',
    ],
  },
  {
    id: 'c08', semana: 8, minutos: 9, videoUrl: null,
    titulo: 'Dormir mejor',
    resumen: 'Hábitos simples que ayudan al sueño.',
    puntos: [
      'Acuéstate y levántate a horarios parecidos, también el fin de semana.',
      'Recibe luz natural en la mañana y evita cafeína en la tarde.',
      'El alcohol empeora la calidad del sueño. Si roncas fuerte con pausas al respirar, consulta: puede ser apnea del sueño.',
    ],
  },
  {
    id: 'c09', semana: 9, minutos: 11, videoUrl: null,
    titulo: 'Mitos de la alimentación en hipotiroidismo',
    resumen: 'Qué dice la evidencia sobre gluten, crucíferas y café.',
    puntos: [
      'La levotiroxina se toma en ayunas y solo con agua. Espera el tiempo que indique tu médico, habitualmente 30 a 60 minutos, antes del café o el desayuno.',
      'El brócoli, la coliflor y el repollo, en porciones habituales, cocidos o en ensalada, son seguros cuando el consumo de yodo es adecuado. Solo cantidades enormes y diarias, sobre todo crudas, podrían interferir.',
      'Eliminar el gluten solo está indicado con enfermedad celíaca u otra indicación médica.',
      'Los suplementos de calcio y de hierro, y los antiácidos, interfieren con la levotiroxina: tómalos al menos 4 horas después, salvo que tu médico te indique otra cosa.',
    ],
  },
  {
    id: 'c10', semana: 10, minutos: 10, videoUrl: null,
    titulo: 'Menopausia y cuerpo',
    resumen: 'Qué cambia en la composición corporal y qué ayuda.',
    puntos: [
      'En la transición a la menopausia aumenta la grasa y disminuye la masa muscular, aunque el peso cambie poco.',
      'Por eso conviene priorizar el entrenamiento de fuerza y la proteína repartida en el día.',
      'El ejercicio ayuda al cuerpo y al hueso, pero no ha demostrado reducir los bochornos. Para ellos existen tratamientos eficaces: consúltalos con tu médico.',
    ],
  },
  {
    id: 'c11', semana: 11, minutos: 9, videoUrl: null,
    titulo: 'Semanas difíciles',
    resumen: 'Cómo seguir cuando la semana se complica.',
    puntos: [
      'Ten un mínimo para las semanas malas: la sesión de 10 minutos y el menú de 60 minutos.',
      'Una semana incompleta no borra lo avanzado. Retoma en la siguiente comida o la siguiente sesión.',
      'Anota qué situaciones te sacan del plan y prepara una respuesta para cada una.',
    ],
  },
  {
    id: 'c12', semana: 12, minutos: 8, videoUrl: null,
    titulo: 'Cuándo consultar a un profesional',
    resumen: 'Señales para pedir ayuda y no seguir solo con la app.',
    puntos: [
      'Síntomas al hacer esfuerzo, bajas de peso que no buscabas o cansancio que no mejora.',
      'Si tomas medicamentos para la diabetes, la presión o levotiroxina: al cambiar tus hábitos o tu peso, las dosis pueden necesitar ajustes. No las cambies por tu cuenta; pide un control.',
      'Atracones, conductas para compensar lo que comes o una relación con la comida que te hace sufrir.',
    ],
  },
];

export const clasePorId = (id: string) => CLASES.find((c) => c.id === id);
