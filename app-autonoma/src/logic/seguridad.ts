import type { EstadoAcceso, MotivoAlimentacion, MotivoEjercicio, RespuestasSeguridad, ResultadoSeguridad } from './tipos';

// Filtro de ingreso. Sigue el modelo de evaluación previa al ejercicio del ACSM
// (síntomas y enfermedad cardiovascular, metabólica o renal conocida)
// y excluye de los menús a quienes necesitan supervisión antes de cambiar su alimentación.
// Los mensajes se guardan junto con el resultado y nombran la condición: son datos de salud
// aunque no salgan del teléfono.
export function evaluarSeguridad(r: RespuestasSeguridad): ResultadoSeguridad {
  const motivos = { ejercicio: [] as MotivoEjercicio[], alimentacion: [] as MotivoAlimentacion[] };
  if (!r.mayorEdad) {
    return {
      apta: false,
      alimentacion: 'bloqueado',
      ejercicio: 'bloqueado',
      motivos,
      mensajes: ['Esta app es para personas de 18 años o más.'],
    };
  }

  const mensajes: string[] = [];
  let alimentacion: EstadoAcceso = 'ok';
  let ejercicio: EstadoAcceso = 'ok';

  if (r.embarazoLactancia) {
    alimentacion = 'bloqueado';
    ejercicio = 'bloqueado';
    mensajes.push(
      'Durante el embarazo y la lactancia cambian las necesidades de alimentación y ejercicio. Los menús y los programas quedan desactivados; las clases siguen disponibles como información general.',
    );
  }
  if (r.conductaAlimentaria) {
    alimentacion = 'bloqueado';
    if (ejercicio !== 'bloqueado') {
      ejercicio = 'requiere_confirmacion';
      motivos.ejercicio.push('conducta');
    }
    mensajes.push(
      ejercicio === 'bloqueado'
        ? 'Los atracones o las conductas para compensar lo que comes merecen una evaluación profesional. Los menús quedan desactivados.'
        : 'Los atracones o las conductas para compensar lo que comes merecen una evaluación profesional antes de seguir un plan de alimentación o de ejercicio. Los menús quedan desactivados; el ejercicio se activa cuando marques en Perfil que ya tuviste esa evaluación y te indicaron que puedes hacer ejercicio.',
    );
  }
  if (r.insulinaSulfonilurea) {
    if (alimentacion === 'ok') {
      alimentacion = 'requiere_confirmacion';
      motivos.alimentacion.push('insulina');
    }
    if (ejercicio !== 'bloqueado') {
      ejercicio = 'requiere_confirmacion';
      motivos.ejercicio.push('insulina');
    }
    const pendientes = [
      alimentacion === 'requiere_confirmacion' ? 'los menús' : null,
      ejercicio === 'requiere_confirmacion' ? 'los programas' : null,
    ].filter((x): x is string => x !== null);
    const base =
      'Con insulina o sulfonilureas, cambiar la alimentación y moverte más puede bajar demasiado la glucosa. Habla con tu médico sobre cómo ajustar las dosis y cuándo medirte';
    mensajes.push(pendientes.length > 0 ? `${base}, y márcalo en Perfil antes de usar ${pendientes.join(' y ')}.` : `${base}.`);
  }
  if (r.sintomasEsfuerzo || r.enfermedadConocida) {
    // El aviso se entrega aunque el ejercicio ya esté bloqueado: es información de salud relevante.
    if (ejercicio !== 'bloqueado') {
      ejercicio = 'requiere_confirmacion';
      if (r.sintomasEsfuerzo) motivos.ejercicio.push('sintomas');
      if (r.enfermedadConocida) motivos.ejercicio.push('enfermedad');
    }
    const bloqueado = ejercicio === 'bloqueado';
    if (r.sintomasEsfuerzo) {
      mensajes.push(
        bloqueado
          ? 'Los síntomas como dolor en el pecho, falta de aire, mareos o palpitaciones deben evaluarse pronto con un médico, aunque no uses los programas de ejercicio.'
          : 'Los síntomas como dolor en el pecho, falta de aire, mareos o palpitaciones deben evaluarse antes de empezar a hacer ejercicio. Cuando un médico te autorice, márcalo en Perfil.',
      );
    } else {
      mensajes.push(
        bloqueado
          ? 'Con enfermedad del corazón o de los vasos sanguíneos, diabetes o enfermedad renal, consulta con tu médico antes de cambiar tu actividad física, aunque no uses los programas.'
          : 'Con enfermedad del corazón o de los vasos sanguíneos, diabetes o enfermedad renal se recomienda autorización médica antes de empezar a hacer ejercicio. Cuando la tengas, márcalo en Perfil.',
      );
    }
  }
  return { apta: true, alimentacion, ejercicio, motivos, mensajes };
}

export type Confirmaciones = { ejercicio: boolean; alimentacion: boolean };

/** Si una sección está disponible, considerando lo que la persona ya confirmó. */
export function seccionDisponible(estado: EstadoAcceso, confirmado: boolean): boolean {
  if (estado === 'ok') return true;
  if (estado === 'requiere_confirmacion') return confirmado;
  return false;
}

export type TextosConfirmacion = {
  /** Texto de la casilla de Perfil, en primera persona. */
  casilla: string;
  /** Completa la frase "Falta un paso: cuando ..., márcalo en Perfil". */
  pendiente: string;
};

/** Qué debe confirmar la persona para activar una sección, según lo que la dejó pendiente. */
export function textosConfirmacion(seg: ResultadoSeguridad, seccion: 'ejercicio' | 'alimentacion'): TextosConfirmacion {
  if (seccion === 'alimentacion') {
    return {
      casilla: 'Hablé con mi médico sobre cambiar mi alimentación y ajustar mis medicamentos',
      pendiente: 'hayas hablado con tu médico sobre cambiar tu alimentación y ajustar tus medicamentos',
    };
  }
  const m = seg.motivos.ejercicio;
  const medico = m.includes('sintomas') || m.includes('enfermedad') || m.length === 0;
  const insulina = m.includes('insulina');
  const conducta = m.includes('conducta');
  const yo: string[] = [];
  const tu: string[] = [];
  if (medico && insulina) {
    yo.push('un médico me autorizó a hacer ejercicio y revisamos cómo ajustar mis dosis y cuándo medir mi glucosa');
    tu.push('un médico te autorice a hacer ejercicio y revisen cómo ajustar tus dosis y cuándo medir tu glucosa');
  } else if (medico) {
    yo.push('un médico me autorizó a hacer ejercicio');
    tu.push('un médico te autorice a hacer ejercicio');
  } else if (insulina) {
    yo.push('hablé con mi médico sobre cómo ajustar mis dosis y cuándo medir mi glucosa al hacer ejercicio');
    tu.push('hayas hablado con tu médico sobre cómo ajustar tus dosis y cuándo medir tu glucosa al hacer ejercicio');
  }
  if (conducta) {
    yo.push('ya tuve una evaluación profesional por mi relación con la comida y me indicaron que puedo hacer ejercicio');
    tu.push('hayas tenido una evaluación profesional por tu relación con la comida y te indiquen que puedes hacer ejercicio');
  }
  const casilla = yo.join(', y ');
  return { casilla: casilla.charAt(0).toUpperCase() + casilla.slice(1), pendiente: tu.join(', y ') };
}
