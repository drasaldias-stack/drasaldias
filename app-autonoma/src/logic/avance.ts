// Avance dentro de una sesión de ejercicio: a qué ejercicio pasar después de marcar uno como hecho.

/**
 * Índice del siguiente ejercicio pendiente después de `desde`; si no queda ninguno más adelante, el primero
 * pendiente de la vuelta (uno que se haya saltado); null si ya están todos hechos.
 */
export function siguientePendiente(hechos: readonly boolean[], desde: number): number | null {
  for (let i = desde + 1; i < hechos.length; i++) if (!hechos[i]) return i;
  for (let i = 0; i < hechos.length && i <= desde; i++) if (!hechos[i]) return i;
  return null;
}
