import { test } from 'node:test';
import assert from 'node:assert/strict';

import { siguientePendiente } from '../avance';

test('sesión: el siguiente ejercicio pendiente va hacia adelante, vuelve al que se saltó y es null al terminar', () => {
  assert.equal(siguientePendiente([true, false, false], 0), 1);
  assert.equal(siguientePendiente([true, true, false], 1), 2);
  // Se saltó el primero: al marcar el último, vuelve a él.
  assert.equal(siguientePendiente([false, true, true], 2), 0);
  assert.equal(siguientePendiente([true, false, true], 2), 1);
  assert.equal(siguientePendiente([true, true, true], 2), null);
  assert.equal(siguientePendiente([], 0), null);
  assert.equal(siguientePendiente([true], 0), null);
});
