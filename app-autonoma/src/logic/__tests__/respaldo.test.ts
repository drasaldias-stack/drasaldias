import { test } from 'node:test';
import assert from 'node:assert/strict';

import { COMPONENTES } from '../../content/componentes';
import { COCINA_INICIAL, EJERCICIO_INICIAL, type EstadoApp } from '../estado';
import { generarMenu } from '../menu';
import { codificarRespaldo, decodificarRespaldo } from '../respaldo';
import { evaluarSeguridad } from '../seguridad';

const estado = (): EstadoApp => {
  const r = generarMenu(COCINA_INICIAL, COMPONENTES, 301);
  assert.ok(r.ok);
  return {
    version: 1,
    perfil: {
      nombre: 'Ñandú Pérez 🙂',
      inicio: '2026-09-15',
      seguridad: evaluarSeguridad({ mayorEdad: true, embarazoLactancia: false, conductaAlimentaria: true, insulinaSulfonilurea: true, sintomasEsfuerzo: false, enfermedadConocida: false }),
      confirmaEjercicio: true,
      confirmaAlimentacion: false,
      cocina: { ...COCINA_INICIAL, exclusiones: ['lacteos', 'cilantro'], personas: 3 },
      ejercicio: { ...EJERCICIO_INICIAL, programa: 'fuerza_casa', materiales: ['banda', 'pesas'] },
    },
    clasesVistas: { c01: '2026-09-16', c02: '2026-09-23' },
    sesionesHechas: { '1-A': '2026-09-16', '2-B': '2026-09-25' },
    caminatas: { '1': 4, '2': 2 },
    menu: { semana: 3, regeneracion: 2, menu: r.menu },
    compras: { '3|Verduras y frutas|Limón|unidad': true },
  };
};

test('respaldo: el código recupera el estado completo, incluidos acentos y emojis', () => {
  const e = estado();
  const codigo = codificarRespaldo(e);
  assert.ok(codigo.startsWith('R90-1-'));
  assert.match(codigo, /^R90-1-[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodificarRespaldo(codigo), e);
});

test('respaldo: tolera espacios y saltos de línea al pegar, y rechaza lo que no sirve', () => {
  const codigo = codificarRespaldo(estado());
  const conEspacios = '  ' + codigo.slice(0, 40) + '\n' + codigo.slice(40, 90) + ' \t' + codigo.slice(90) + '\n';
  assert.deepEqual(decodificarRespaldo(conEspacios), estado());
  assert.equal(decodificarRespaldo(''), null);
  assert.equal(decodificarRespaldo('hola'), null);
  assert.equal(decodificarRespaldo('R90-1-###'), null);
  assert.equal(decodificarRespaldo(codigo.slice(0, codigo.length - 30)), null);
  assert.equal(decodificarRespaldo('R91-1-' + codigo.slice(6)), null);
  // Un código válido pero sin perfil no sirve para restaurar.
  const vacio: EstadoApp = { version: 1, perfil: null, clasesVistas: {}, sesionesHechas: {}, caminatas: {}, menu: null, compras: {} };
  assert.equal(decodificarRespaldo(codificarRespaldo(vacio)), null);
});
