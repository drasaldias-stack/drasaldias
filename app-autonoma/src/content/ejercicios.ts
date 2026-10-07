import type { Ejercicio, ItemSesion, Programa, ProgramaId, Sesion } from '../logic/tipos';

// CONTENIDO DE EJEMPLO. Los videos se graban después con un profesional del ejercicio;
// mientras tanto cada ejercicio muestra su descripción escrita.

export const CALENTAMIENTO = '3 minutos de marcha suave y círculos de hombros.';
export const VUELTA_CALMA = '2 minutos caminando lento y respirando profundo.';
export const SENALES_DETENERSE =
  'Detente de inmediato si sientes dolor o presión en el pecho, cuello, mandíbula o brazos; falta de aire intensa o que no cede al descansar; mareo o desmayo; palpitaciones fuertes; o dolor agudo en una articulación. Llama al número de emergencias de tu país si te desmayas o sientes que vas a desmayarte, si el dolor o la presión en el pecho no desaparece en pocos minutos de reposo, si la falta de aire no mejora al descansar o si las palpitaciones no ceden en reposo. En los demás casos, no sigas entrenando hasta consultar con un médico.';
// Se muestra solo a quien declaró insulina o sulfonilureas. Redacción pendiente de validación por el equipo médico.
export const AVISO_HIPOGLUCEMIA =
  'Si usas insulina o sulfonilureas: mide tu glucosa antes de empezar según lo que acordaste con tu médico, ten a mano algo con azúcar y detente si sientes temblor, sudor frío, hambre intensa, confusión o visión borrosa. Si no mejora después de comer algo con azúcar, pide ayuda.';
export const CONSEJOS_SESION =
  'Respira de forma continua durante cada ejercicio: suelta el aire en el esfuerzo y no aguantes la respiración. Si tienes fiebre, malestar general o una infección, no entrenes hasta que hayan pasado y retoma con una sesión más corta.';

export const EJERCICIOS: Ejercicio[] = [
  { id: 'marcha', nombre: 'Marcha en el lugar', tipo: 'cardio', requiere: [],
    instrucciones: ['De pie, levanta las rodillas de forma alternada a un ritmo cómodo.', 'Mueve los brazos como al caminar.'],
    cuidado: 'Debes poder hablar mientras lo haces. Si no puedes, baja el ritmo.' },
  { id: 'marcha_sentada', nombre: 'Marcha sentada', tipo: 'cardio', requiere: ['silla'], alternativa: 'marcha',
    instrucciones: ['Siéntate al borde de una silla firme, con la espalda recta.', 'Levanta las rodillas de forma alternada y mueve los brazos.'],
    cuidado: 'Buena opción si te duelen las rodillas o los pies al estar de pie.' },
  { id: 'pasos_laterales', nombre: 'Pasos laterales', tipo: 'cardio', requiere: [],
    instrucciones: ['Da un paso al lado y junta el otro pie.', 'Vuelve hacia el otro lado con un ritmo constante.'],
    cuidado: 'Sin saltos. Apóyate en una pared si pierdes el equilibrio.' },
  { id: 'sentarse_pararse', nombre: 'Sentarse y pararse de la silla', tipo: 'fuerza', requiere: ['silla'], alternativa: 'sentadilla_pared',
    instrucciones: [
      'Siéntate al borde de una silla firme, con los pies separados al ancho de las caderas.',
      'Inclina el tronco adelante y párate empujando el piso.',
      'Vuelve a sentarte lento, contando 3 segundos.',
    ],
    cuidado: 'Si te cuesta, apoya las manos en los muslos. Las rodillas siguen la dirección de los pies.' },
  { id: 'sentadilla_pared', nombre: 'Sentadilla corta apoyada en la pared', tipo: 'fuerza', requiere: [],
    instrucciones: ['Apoya la espalda en una pared con los pies un paso adelante.', 'Baja unos centímetros doblando las rodillas y vuelve a subir.'],
    cuidado: 'Baja solo hasta donde no sientas dolor en las rodillas.' },
  { id: 'sentadilla', nombre: 'Sentadilla a la silla', tipo: 'fuerza', requiere: ['silla'], alternativa: 'sentadilla_pared',
    instrucciones: ['De pie delante de la silla, lleva la cadera atrás hasta rozar el asiento sin sentarte.', 'Sube empujando el piso con todo el pie.'],
    cuidado: 'Pecho alto y rodillas alineadas con los pies.' },
  { id: 'zancada_apoyo', nombre: 'Zancada fija con apoyo', tipo: 'fuerza', requiere: ['silla'], alternativa: 'sentadilla_pared',
    instrucciones: [
      'Un pie adelante y otro atrás, con una mano en el respaldo de una silla.',
      'Baja la rodilla de atrás hacia el piso y vuelve a subir.',
      'Cambia de pierna a mitad de las repeticiones.',
    ],
    cuidado: 'Baja solo hasta donde mantengas el equilibrio y no sientas dolor.' },
  { id: 'flexion_pared', nombre: 'Flexión de brazos en la pared', tipo: 'fuerza', requiere: [],
    instrucciones: ['Manos en la pared a la altura de los hombros, algo más separadas que ellos.', 'Lleva el pecho a la pared doblando los codos y empuja para volver.'],
    cuidado: 'Cuerpo en línea recta. Mientras más lejos estén los pies, más difícil.' },
  { id: 'flexion_inclinada', nombre: 'Flexión inclinada en mesa o encimera', tipo: 'fuerza', requiere: [],
    instrucciones: ['Manos en el borde de una mesa firme o una encimera.', 'Baja el pecho hacia el borde y empuja para subir.'],
    cuidado: 'Verifica que la superficie no se mueva.' },
  { id: 'remo_banda', nombre: 'Remo con banda elástica', tipo: 'fuerza', requiere: ['banda'], alternativa: 'remo_mochila',
    instrucciones: [
      'Sentado, pasa la banda por la planta de los pies y toma los extremos.',
      'Tira hacia ti llevando los codos atrás y junta los omóplatos.',
      'Vuelve lento.',
    ],
    cuidado: 'Hombros lejos de las orejas y espalda recta.' },
  { id: 'remo_mochila', nombre: 'Remo con mochila o botella', tipo: 'fuerza', requiere: [],
    instrucciones: [
      'Apoya una mano en una mesa e inclina el tronco adelante con la espalda recta.',
      'Con la otra mano sube una mochila o una botella de agua hacia la cadera.',
      'Cambia de lado a mitad de las repeticiones.',
    ],
    cuidado: 'El movimiento lo hace el brazo; el tronco se queda quieto.' },
  { id: 'press_hombros', nombre: 'Empuje sobre la cabeza con botellas o mancuernas', tipo: 'fuerza', requiere: ['pesas'], alternativa: 'brazos_arriba',
    instrucciones: ['Sentado o de pie, con el peso a la altura de los hombros.', 'Empuja hacia arriba sin bloquear los codos y baja lento.'],
    cuidado: 'Si duele el hombro, sube solo hasta la altura de la cara.' },
  { id: 'brazos_arriba', nombre: 'Elevación de brazos sin peso', tipo: 'fuerza', requiere: [],
    instrucciones: ['Lleva los brazos estirados adelante y arriba hasta donde te sea cómodo.', 'Baja lento.'],
    cuidado: 'Movimiento sin dolor.' },
  { id: 'puente', nombre: 'Puente de glúteos', tipo: 'fuerza', requiere: ['colchoneta'], alternativa: 'extension_cadera_pie',
    instrucciones: ['Boca arriba, con las rodillas dobladas y los pies apoyados.', 'Sube la cadera apretando los glúteos y baja lento.'],
    cuidado: 'No arquees la espalda; la fuerza la hacen los glúteos.' },
  { id: 'extension_cadera_pie', nombre: 'Extensión de cadera de pie', tipo: 'fuerza', requiere: [],
    instrucciones: [
      'De pie, apoyado en una pared o una mesa, lleva una pierna estirada hacia atrás.',
      'Aprieta el glúteo, vuelve y cambia de pierna a mitad de las repeticiones.',
    ],
    cuidado: 'No inclines el tronco adelante.' },
  { id: 'bisagra', nombre: 'Bisagra de cadera con palo de escoba', tipo: 'fuerza', requiere: [],
    instrucciones: [
      'De pie, con un palo de escoba apoyado en la espalda tocando cabeza, espalda alta y glúteos.',
      'Lleva la cadera hacia atrás inclinando el tronco sin perder los tres contactos, y vuelve.',
    ],
    cuidado: 'Rodillas levemente dobladas; la espalda no se curva.' },
  { id: 'talones', nombre: 'Elevación de talones', tipo: 'fuerza', requiere: [],
    instrucciones: ['De pie, apoyado en una pared o en el respaldo de una silla.', 'Sube en puntas de pie y baja lento.'],
    cuidado: 'Fortalece las pantorrillas y ayuda al equilibrio.' },
  { id: 'extension_rodilla', nombre: 'Extensión de rodilla sentado', tipo: 'fuerza', requiere: ['silla'], alternativa: 'extension_cadera_pie',
    instrucciones: ['Sentado con la espalda apoyada, estira una rodilla hasta dejar la pierna recta.', 'Mantén 2 segundos y baja lento. Cambia de pierna a mitad.'],
    cuidado: 'Movimiento sin dolor de rodilla.' },
  { id: 'apertura_lateral', nombre: 'Apertura lateral de pierna de pie', tipo: 'fuerza', requiere: [],
    instrucciones: ['Apoyado en una pared o una silla, separa una pierna hacia el lado sin inclinar el tronco.', 'Vuelve lento y cambia de pierna a mitad.'],
    cuidado: 'Movimiento corto y controlado.' },
  { id: 'plancha_pared', nombre: 'Plancha en la pared', tipo: 'fuerza', requiere: [],
    instrucciones: ['Antebrazos apoyados en la pared, cuerpo inclinado en línea recta.', 'Aprieta el abdomen y respira normal.'],
    cuidado: 'No contengas la respiración.' },
  { id: 'plancha_inclinada', nombre: 'Plancha inclinada en mesa', tipo: 'fuerza', requiere: [],
    instrucciones: ['Manos o antebrazos en el borde de una mesa firme, cuerpo recto.', 'Mantén la posición respirando normal.'],
    cuidado: 'Si duele la zona lumbar, vuelve a la plancha en la pared.' },
];

export const ejercicioPorId = (id: string) => EJERCICIOS.find((e) => e.id === id);

const r = (ejercicio: string, cantidad: number): ItemSesion => ({ ejercicio, cantidad, unidad: 'reps' });
const s = (ejercicio: string, cantidad: number): ItemSesion => ({ ejercicio, cantidad, unidad: 'seg' });
const ses = (id: string, nombre: string, items: ItemSesion[]): Sesion => ({ id, nombre, items });

export const PROGRAMAS: Record<ProgramaId, Programa> = {
  desde_cero: {
    id: 'desde_cero',
    nombre: 'Desde cero',
    paraQuien: 'Si hoy casi no haces actividad física. Empieza con ejercicios de pie y con silla.',
    bloques: [
      { semanas: [1, 3], sesiones: [
        ses('A', 'Piernas y brazos', [r('sentarse_pararse', 8), r('flexion_pared', 8), r('remo_banda', 10), r('talones', 10), s('marcha', 60)]),
        ses('B', 'Movimiento y abdomen', [s('marcha', 60), r('sentarse_pararse', 8), s('plancha_pared', 15), r('extension_cadera_pie', 8), r('flexion_pared', 8)]),
        ses('C', 'Equilibrio y espalda', [s('pasos_laterales', 60), r('remo_banda', 10), r('sentarse_pararse', 8), r('talones', 12), s('plancha_pared', 15)]),
      ]},
      { semanas: [4, 6], sesiones: [
        ses('A', 'Piernas y brazos', [r('sentarse_pararse', 10), r('flexion_pared', 10), r('remo_banda', 12), r('talones', 12), s('marcha', 90)]),
        ses('B', 'Movimiento y abdomen', [s('marcha', 90), r('sentarse_pararse', 10), s('plancha_pared', 20), r('extension_cadera_pie', 10), r('flexion_pared', 10)]),
        ses('C', 'Equilibrio y espalda', [s('pasos_laterales', 90), r('remo_banda', 12), r('sentarse_pararse', 10), r('talones', 15), s('plancha_pared', 20)]),
      ]},
      { semanas: [7, 9], sesiones: [
        ses('A', 'Piernas y brazos', [r('sentadilla', 10), r('flexion_inclinada', 8), r('remo_banda', 12), r('puente', 10), s('marcha', 90)]),
        ses('B', 'Movimiento y abdomen', [s('marcha', 90), r('sentadilla', 10), s('plancha_inclinada', 20), r('bisagra', 10), r('press_hombros', 10)]),
        ses('C', 'Equilibrio y espalda', [s('pasos_laterales', 90), r('remo_banda', 12), r('puente', 10), r('flexion_inclinada', 8), s('plancha_inclinada', 20)]),
      ]},
      { semanas: [10, 12], sesiones: [
        ses('A', 'Piernas y brazos', [r('sentadilla', 12), r('flexion_inclinada', 10), r('remo_banda', 12), r('puente', 12), s('marcha', 120)]),
        ses('B', 'Movimiento y abdomen', [s('marcha', 120), r('sentadilla', 12), s('plancha_inclinada', 30), r('bisagra', 12), r('press_hombros', 12)]),
        ses('C', 'Equilibrio y espalda', [s('pasos_laterales', 120), r('remo_banda', 15), r('puente', 12), r('flexion_inclinada', 10), s('plancha_inclinada', 30)]),
      ]},
    ],
    caminata: [
      { semanaDesde: 1, minutosDia: 10, dias: 5, texto: 'Camina a un ritmo en que puedas hablar, pero no cantar.' },
      { semanaDesde: 4, minutosDia: 15, dias: 5, texto: 'Si te cuesta hacerlo seguido, divídelo en dos caminatas.' },
      { semanaDesde: 7, minutosDia: 20, dias: 5, texto: 'Prueba un tramo con subida suave o a paso más rápido.' },
      { semanaDesde: 10, minutosDia: 30, dias: 5, texto: 'Con 30 minutos cinco días alcanzas el mínimo de 150 minutos semanales que recomienda la OMS; la meta es 150 a 300. Tus tres sesiones de fuerza también suman.' },
    ],
  },
  fuerza_casa: {
    id: 'fuerza_casa',
    nombre: 'Fuerza en casa',
    paraQuien: 'Si ya caminas o te mueves algo y quieres empezar a entrenar fuerza en casa.',
    bloques: [
      { semanas: [1, 3], sesiones: [
        ses('A', 'Cuerpo completo', [r('sentadilla', 10), r('flexion_inclinada', 8), r('remo_banda', 12), r('puente', 12), s('plancha_inclinada', 20)]),
        ses('B', 'Piernas y hombros', [r('zancada_apoyo', 8), r('press_hombros', 10), r('bisagra', 10), r('talones', 15), s('marcha', 90)]),
        ses('C', 'Cuerpo completo y ritmo', [r('sentadilla', 10), r('remo_banda', 12), r('flexion_inclinada', 8), r('puente', 12), s('pasos_laterales', 90)]),
      ]},
      { semanas: [4, 6], sesiones: [
        ses('A', 'Cuerpo completo', [r('sentadilla', 12), r('flexion_inclinada', 10), r('remo_banda', 12), r('puente', 15), s('plancha_inclinada', 30)]),
        ses('B', 'Piernas y hombros', [r('zancada_apoyo', 10), r('press_hombros', 12), r('bisagra', 12), r('talones', 18), s('marcha', 120)]),
        ses('C', 'Cuerpo completo y ritmo', [r('sentadilla', 12), r('remo_banda', 15), r('flexion_inclinada', 10), r('puente', 15), s('pasos_laterales', 120)]),
      ]},
      { semanas: [7, 9], sesiones: [
        ses('A', 'Cuerpo completo', [r('sentadilla', 15), r('flexion_inclinada', 12), r('remo_banda', 15), r('puente', 15), s('plancha_inclinada', 35)]),
        ses('B', 'Piernas y hombros', [r('zancada_apoyo', 12), r('press_hombros', 12), r('bisagra', 15), r('talones', 20), s('marcha', 120)]),
        ses('C', 'Cuerpo completo y ritmo', [r('sentadilla', 15), r('remo_banda', 15), r('flexion_inclinada', 12), r('puente', 18), s('pasos_laterales', 120)]),
      ]},
      { semanas: [10, 12], sesiones: [
        ses('A', 'Cuerpo completo', [r('sentadilla', 15), r('flexion_inclinada', 15), r('remo_banda', 15), r('puente', 20), s('plancha_inclinada', 40)]),
        ses('B', 'Piernas y hombros', [r('zancada_apoyo', 12), r('press_hombros', 15), r('bisagra', 15), r('talones', 20), s('marcha', 150)]),
        ses('C', 'Cuerpo completo y ritmo', [r('sentadilla', 18), r('remo_banda', 18), r('flexion_inclinada', 12), r('puente', 20), s('pasos_laterales', 150)]),
      ]},
    ],
    caminata: [
      { semanaDesde: 1, minutosDia: 20, dias: 5, texto: 'Camina a paso rápido: puedes hablar, pero no cantar.' },
      { semanaDesde: 4, minutosDia: 25, dias: 5, texto: 'Mantén el paso rápido durante toda la caminata.' },
      { semanaDesde: 7, minutosDia: 30, dias: 5, texto: 'Con 30 minutos cinco días alcanzas el mínimo de 150 minutos semanales que recomienda la OMS; la meta es 150 a 300. Tus tres sesiones de fuerza también suman.' },
      { semanaDesde: 10, minutosDia: 30, dias: 6, texto: 'Suma un día más o alarga una caminata del fin de semana.' },
    ],
  },
  bajo_impacto: {
    id: 'bajo_impacto',
    nombre: 'Bajo impacto',
    paraQuien: 'Si te duelen las rodillas, la espalda o los pies, o si estar mucho rato de pie te cuesta. Muchos ejercicios son sentados.',
    bloques: [
      { semanas: [1, 3], sesiones: [
        ses('A', 'Piernas sentado', [s('marcha_sentada', 60), r('sentarse_pararse', 6), r('extension_rodilla', 8), r('flexion_pared', 6), r('talones', 8)]),
        ses('B', 'Brazos y cadera', [s('marcha_sentada', 60), r('remo_banda', 8), r('press_hombros', 8), r('apertura_lateral', 8), r('extension_rodilla', 8)]),
        ses('C', 'Equilibrio', [s('pasos_laterales', 45), r('sentarse_pararse', 6), r('remo_banda', 8), r('flexion_pared', 6), s('marcha_sentada', 60)]),
      ]},
      { semanas: [4, 6], sesiones: [
        ses('A', 'Piernas sentado', [s('marcha_sentada', 90), r('sentarse_pararse', 8), r('extension_rodilla', 10), r('flexion_pared', 8), r('talones', 10)]),
        ses('B', 'Brazos y cadera', [s('marcha_sentada', 90), r('remo_banda', 10), r('press_hombros', 10), r('apertura_lateral', 10), r('extension_rodilla', 10)]),
        ses('C', 'Equilibrio', [s('pasos_laterales', 60), r('sentarse_pararse', 8), r('remo_banda', 10), r('flexion_pared', 8), s('marcha_sentada', 90)]),
      ]},
      { semanas: [7, 9], sesiones: [
        ses('A', 'Piernas sentado', [s('marcha_sentada', 120), r('sentarse_pararse', 10), r('extension_rodilla', 12), r('flexion_pared', 10), r('talones', 12)]),
        ses('B', 'Brazos y cadera', [s('marcha_sentada', 120), r('remo_banda', 12), r('press_hombros', 10), r('apertura_lateral', 12), r('extension_rodilla', 12)]),
        ses('C', 'Equilibrio', [s('pasos_laterales', 90), r('sentarse_pararse', 10), r('remo_banda', 12), r('flexion_pared', 10), s('marcha_sentada', 120)]),
      ]},
      { semanas: [10, 12], sesiones: [
        ses('A', 'Piernas sentado', [s('marcha_sentada', 120), r('sentarse_pararse', 12), r('extension_rodilla', 12), r('flexion_pared', 12), r('talones', 15)]),
        ses('B', 'Brazos y cadera', [s('marcha_sentada', 120), r('remo_banda', 12), r('press_hombros', 12), r('apertura_lateral', 12), r('extension_rodilla', 15)]),
        ses('C', 'Equilibrio', [s('pasos_laterales', 120), r('sentarse_pararse', 12), r('remo_banda', 12), r('flexion_pared', 12), s('marcha_sentada', 120)]),
      ]},
    ],
    caminata: [
      { semanaDesde: 1, minutosDia: 10, dias: 4, texto: 'Camina, pedalea en bicicleta estática o camina en el agua. Todo cuenta.' },
      { semanaDesde: 4, minutosDia: 10, dias: 5, texto: 'Si duele, divídelo en dos tramos de 5 minutos.' },
      { semanaDesde: 7, minutosDia: 15, dias: 5, texto: 'Sube de a poco el tiempo, no la velocidad.' },
      { semanaDesde: 10, minutosDia: 20, dias: 5, texto: 'Mantén la actividad que te resulte cómoda para las articulaciones.' },
    ],
  },
};
