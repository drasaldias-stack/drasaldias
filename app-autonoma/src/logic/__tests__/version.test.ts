import { test } from 'node:test';
import assert from 'node:assert/strict';

import { fechaLarga, textoVersion } from '../version';

test('versión: fecha larga y línea de Perfil', () => {
  assert.equal(fechaLarga('2026-10-22'), '22 de octubre de 2026');
  assert.equal(fechaLarga('2026-01-05T14:05:15-03:00'), '5 de enero de 2026');
  assert.equal(fechaLarga('22-10-2026'), null);
  assert.equal(fechaLarga('2026-13-01'), null);
  assert.equal(fechaLarga(undefined), null);
  assert.equal(textoVersion({ version: '1.0.0', fecha: '2026-10-22', commit: '9a5c784' }), 'Ruta 90, versión 1.0.0, publicada el 22 de octubre de 2026 (9a5c784).');
  assert.equal(textoVersion({ version: '1.0.0', fecha: '2026-10-22' }), 'Ruta 90, versión 1.0.0, publicada el 22 de octubre de 2026.');
  assert.equal(textoVersion({ version: '1.0.0', fecha: '2026-10-22', commit: 'local' }), 'Ruta 90, versión 1.0.0, publicada el 22 de octubre de 2026 (local).');
  assert.equal(textoVersion({}), 'Ruta 90, versión de desarrollo, copia sin publicar.');
  assert.equal(textoVersion({ version: '1.0.0' }), 'Ruta 90, versión 1.0.0, copia sin publicar.');
});
