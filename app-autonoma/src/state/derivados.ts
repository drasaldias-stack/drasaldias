import { CLASES } from '@/content/clases';
import { PROGRAMAS } from '@/content/ejercicios';
import { claveSesion, metaCaminata, semanaVigente, sesionesDeSemana, SEMANAS_PROGRAMA } from '@/logic/programa';
import { seccionDisponible } from '@/logic/seguridad';
import type { EstadoApp, Perfil } from '@/state/app-state';

export const accesoEjercicio = (p: Perfil) => seccionDisponible(p.seguridad.ejercicio, p.confirmaEjercicio);
export const accesoMenu = (p: Perfil) => seccionDisponible(p.seguridad.alimentacion, p.confirmaAlimentacion);

export const programaTerminado = (semana: number) => semana > SEMANAS_PROGRAMA;

export function resumenSemana(estado: EstadoApp, semana: number) {
  const perfil = estado.perfil!;
  const programa = PROGRAMAS[perfil.ejercicio.programa];
  const sesiones = sesionesDeSemana(programa, semana).map((s) => ({ sesion: s, hecha: Boolean(estado.sesionesHechas[claveSesion(semana, s.id)]) }));
  const caminata = metaCaminata(programa, semana);
  const diasCaminata = estado.caminatas[String(semanaVigente(semana))] ?? 0;
  return { programa, sesiones, caminata, diasCaminata };
}

export function clasesConEstado(estado: EstadoApp, semana: number) {
  return CLASES.map((c) => ({ clase: c, liberada: c.semana <= semana, vista: Boolean(estado.clasesVistas[c.id]) }));
}

/** La clase sugerida: la primera liberada que no se ha visto, o la última liberada. */
export function claseSugerida(estado: EstadoApp, semana: number) {
  const lista = clasesConEstado(estado, semana).filter((c) => c.liberada);
  return lista.find((c) => !c.vista) ?? lista[lista.length - 1];
}
