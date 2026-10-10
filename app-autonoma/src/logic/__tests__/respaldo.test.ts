import { test } from 'node:test';
import assert from 'node:assert/strict';

import { COMPONENTES } from '../../content/componentes';
import { COCINA_INICIAL, EJERCICIO_INICIAL, type EstadoApp } from '../estado';
import { generarMenu } from '../menu';
import { codificarRespaldo, decodificarRespaldo, resumenAvance } from '../respaldo';
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
      pauta: { origen: 'profesional', titulo: 'Pauta de mi nutricionista', comidas: [{ nombre: 'Desayuno', detalle: 'Avena con fruta' }], notas: '', enlace: '' },
      rutina: { nombre: 'Gimnasio', sesiones: [{ id: 'A', clave: 'pier', nombre: 'Piernas', vueltas: 2, items: [{ nombre: 'Sentadilla', cantidad: 12, unidad: 'reps' }] }, { id: 'B', clave: 'braz', nombre: 'Brazos', vueltas: 1, items: [{ nombre: 'Plancha', cantidad: 40, unidad: 'seg' }] }], notas: 'Subir de a poco' },
      objetivo: { kcal: 1500, proteina: 90, origen: 'profesional' },
      datos: { sexo: 'mujer', edad: 45, pesoKg: 80, tallaCm: 160, actividad: 'baja' },
    },
    clasesVistas: { c01: '2026-09-16', c02: '2026-09-23' },
    sesionesHechas: { '1-A': '2026-09-16', '2-B': '2026-09-25' },
    caminatas: { '1': 4, '2': 2 },
    menu: { semana: 3, regeneracion: 2, menu: r.menu },
    compras: { '3|Verduras y frutas|Limón|unidad': true },
    respaldo: { ultimo: '2026-10-01' },
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
  const vacio: EstadoApp = { version: 1, perfil: null, clasesVistas: {}, sesionesHechas: {}, caminatas: {}, menu: null, compras: {}, respaldo: { ultimo: null } };
  assert.equal(decodificarRespaldo(codificarRespaldo(vacio)), null);
});

test('respaldo: encuentra el código aunque venga con texto alrededor', () => {
  const codigo = codificarRespaldo(estado());
  for (const envuelto of [`Código: ${codigo}`, `Código de respaldo:\n${codigo}`, `"${codigo}"`, `«${codigo}».`, `${codigo}.`, `r90-1-${codigo.slice(6)}`, `Te envío mi código ${codigo} saludos`]) {
    assert.deepEqual(decodificarRespaldo(envuelto), estado(), envuelto.slice(0, 20));
  }
  // Dos códigos pegados: se usa el primero completo.
  assert.deepEqual(decodificarRespaldo(codigo + '\n' + codigo), estado());
});

test('respaldo: el resumen del avance cuenta sesiones y clases y toma la fecha más reciente', () => {
  assert.deepEqual(resumenAvance(estado()), { sesiones: 2, clases: 2, caminatas: 6, ultima: '2026-09-25' });
  const sin: EstadoApp = { ...estado(), sesionesHechas: {}, clasesVistas: {}, caminatas: {} };
  assert.deepEqual(resumenAvance(sin), { sesiones: 0, clases: 0, caminatas: 0, ultima: null });
});

test('respaldo: el recordatorio aparece hasta el primer código y cuando el último tiene dos semanas o más', () => {
  const { textoAvisoRespaldo } = require('../respaldo') as typeof import('../respaldo');
  assert.match(textoAvisoRespaldo(null, '2026-10-07') ?? '', /Crea un código de respaldo en Perfil/);
  assert.equal(textoAvisoRespaldo('2026-10-01', '2026-10-07'), null);
  assert.equal(textoAvisoRespaldo('2026-09-24', '2026-10-07'), null);
  assert.match(textoAvisoRespaldo('2026-09-23', '2026-10-07') ?? '', /23-09-2026/);
});
