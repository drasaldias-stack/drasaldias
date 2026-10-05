import type { RespuestasSeguridad, ResultadoSeguridad } from './tipos';

// Filtro de ingreso. Sigue el modelo de evaluación previa al ejercicio del ACSM
// (actividad actual, síntomas y enfermedad cardiovascular, metabólica o renal conocida)
// y excluye de los menús a quienes necesitan supervisión antes de cambiar su alimentación.
// Los mensajes se guardan junto con el resultado y nombran la condición: son datos de salud
// aunque no salgan del teléfono.
export function evaluarSeguridad(r: RespuestasSeguridad): ResultadoSeguridad {
  if (!r.mayorEdad) {
    return {
      apta: false,
      alimentacion: 'bloqueado',
      ejercicio: 'bloqueado',
      mensajes: ['Esta app es para personas de 18 años o más.'],
    };
  }

  const mensajes: string[] = [];
  let alimentacion: ResultadoSeguridad['alimentacion'] = 'ok';
  let ejercicio: ResultadoSeguridad['ejercicio'] = 'ok';

  if (r.embarazoLactancia) {
    alimentacion = 'bloqueado';
    ejercicio = 'bloqueado';
    mensajes.push(
      'Durante el embarazo y la lactancia cambian las necesidades de alimentación y ejercicio. Los menús y los programas quedan desactivados; las clases siguen disponibles como información general.',
    );
  }
  if (r.conductaAlimentaria) {
    alimentacion = 'bloqueado';
    if (ejercicio === 'ok') ejercicio = 'requiere_confirmacion';
    mensajes.push(
      'Los atracones o las conductas para compensar lo que comes merecen una evaluación profesional antes de seguir un plan de alimentación o de ejercicio. Los menús quedan desactivados; el ejercicio se activa cuando confirmes en Perfil que ya tuviste esa evaluación.',
    );
  }
  if (r.insulinaSulfonilurea) {
    if (alimentacion === 'ok') alimentacion = 'requiere_confirmacion';
    if (ejercicio === 'ok') ejercicio = 'requiere_confirmacion';
    mensajes.push(
      'Con insulina o sulfonilureas, cambiar la alimentación y moverte más puede bajar demasiado la glucosa. Habla con tu médico sobre cómo ajustar las dosis y cuándo medirte, y confírmalo en Perfil antes de usar los menús y los programas.',
    );
  }
  if (ejercicio !== 'bloqueado') {
    if (r.sintomasEsfuerzo) {
      ejercicio = 'requiere_confirmacion';
      mensajes.push(
        'Los síntomas como dolor en el pecho, falta de aire, mareos o palpitaciones deben evaluarse antes de empezar a hacer ejercicio. Cuando un médico te autorice, confírmalo en Perfil.',
      );
    } else if (r.enfermedadConocida) {
      ejercicio = 'requiere_confirmacion';
      mensajes.push(
        'Con enfermedad del corazón o de los vasos sanguíneos, diabetes o enfermedad renal se recomienda autorización médica antes de empezar a hacer ejercicio. Cuando la tengas, confírmalo en Perfil.',
      );
    }
  }
  return { apta: true, alimentacion, ejercicio, mensajes };
}

export type Confirmaciones = { ejercicio: boolean; alimentacion: boolean };

/** Si una sección está disponible, considerando lo que la persona ya confirmó. */
export function seccionDisponible(estado: ResultadoSeguridad['alimentacion'], confirmado: boolean): boolean {
  if (estado === 'ok') return true;
  if (estado === 'requiere_confirmacion') return confirmado;
  return false;
}
