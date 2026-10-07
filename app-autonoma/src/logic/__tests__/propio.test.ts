import { test } from 'node:test';
import assert from 'node:assert/strict';

import { EJERCICIOS, PROGRAMAS } from '../../content/ejercicios';
import { COCINA_INICIAL, EJERCICIO_INICIAL, normalizar } from '../estado';
import { catalogoActivo, normalizarPauta, normalizarRutina, programaActivo, programaDeRutina } from '../propio';
import { claveSesion, metaCaminata, resolverEjercicio, sesionesDeSemana, vueltasDeSesion } from '../programa';
import { evaluarSeguridad } from '../seguridad';
import type { RutinaPropia } from '../tipos';

const base = { mayorEdad: true, embarazoLactancia: false, conductaAlimentaria: false, insulinaSulfonilurea: false, sintomasEsfuerzo: false, enfermedadConocida: false };

test('pauta propia: forma válida, límites y descarte de lo vacío', () => {
  assert.equal(normalizarPauta(null), null);
  assert.equal(normalizarPauta({ comidas: [] }), null);
  assert.equal(normalizarPauta({ comidas: [{ nombre: '  ', detalle: '' }] }), null);
  assert.equal(normalizarPauta({ comidas: [{ nombre: 'Desayuno', detalle: '' }, { nombre: 'Cena', detalle: '  ' }] }), null, 'solo nombres no basta');
  const p = normalizarPauta({
    origen: 'otro',
    titulo: '  ',
    comidas: [{ nombre: 'Desayuno', detalle: ' 1 taza de avena ' }, 'x', { nombre: 'Colación', detalle: '' }, { nombre: 'Cena', detalle: 'Z'.repeat(5000) }],
    notas: 7,
    enlace: 'javascript:alert(1)',
  })!;
  assert.equal(p.origen, 'profesional');
  assert.equal(p.titulo, 'Pauta de mi nutricionista');
  assert.deepEqual(p.comidas.map((c) => c.nombre), ['Desayuno', 'Cena']);
  assert.equal(p.comidas[0].detalle, '1 taza de avena');
  assert.equal(p.comidas[1].detalle.length, 2000);
  assert.equal(p.notas, '');
  assert.equal(p.enlace, '');
  assert.equal(normalizarPauta({ comidas: [{ nombre: 'A', detalle: 'b' }], enlace: 'https://drive.google.com/x' })!.enlace, 'https://drive.google.com/x');
  const muchas = normalizarPauta({ comidas: Array.from({ length: 12 }, (_, i) => ({ nombre: `C${i}`, detalle: 'x' })) })!;
  assert.equal(muchas.comidas.length, 8);
});

test('rutina propia: sesiones con ids A, B, C en orden, ítems inválidos fuera y caminata opcional', () => {
  assert.equal(normalizarRutina(null), null);
  assert.equal(normalizarRutina({ sesiones: [{ items: [{ nombre: 'x', cantidad: 0, unidad: 'reps' }] }] }), null);
  const r = normalizarRutina({
    nombre: '',
    sesiones: [
      { id: 'C', nombre: 'Piernas', vueltas: 9, items: [{ nombre: 'Sentadilla', cantidad: 12, unidad: 'reps' }, { nombre: 'Plancha', cantidad: 30.5, unidad: 'seg' }, { nombre: '', cantidad: 10, unidad: 'reps' }] },
      { id: 'A', nombre: '', vueltas: 2, items: [{ nombre: 'Caminar', cantidad: 600, unidad: 'seg' }] },
      { nombre: 'Vacía', items: [] },
      { nombre: 'Cuarta', items: [{ nombre: 'x', cantidad: 1, unidad: 'reps' }] },
      { nombre: 'Quinta', items: [{ nombre: 'y', cantidad: 1, unidad: 'reps' }] },
    ],
    caminata: { minutosDia: 30, dias: 9 },
    notas: 'n',
  })!;
  assert.equal(r.nombre, 'Mi rutina');
  assert.deepEqual(r.sesiones.map((s) => [s.id, s.nombre, s.vueltas, s.items.length]), [['A', 'Piernas', 1, 1], ['B', 'Sesión B', 2, 1], ['C', 'Cuarta', 1, 1]]);
  assert.equal(r.caminata, null);
  assert.deepEqual(normalizarRutina({ sesiones: [{ items: [{ nombre: 'x', cantidad: 5 }] }], caminata: { minutosDia: 30, dias: 5 } })!.caminata, { minutosDia: 30, dias: 5 });
});

test('rutina propia: se comporta como un programa en todas las semanas y resuelve sus propios ejercicios', () => {
  const rutina: RutinaPropia = {
    nombre: 'Gimnasio',
    sesiones: [
      { id: 'A', nombre: 'Tren superior', vueltas: 3, items: [{ nombre: 'Press', cantidad: 10, unidad: 'reps' }, { nombre: 'Plancha', cantidad: 40, unidad: 'seg' }] },
      { id: 'B', nombre: 'Tren inferior', vueltas: 2, items: [{ nombre: 'Sentadilla', cantidad: 15, unidad: 'reps' }] },
    ],
    caminata: null,
    notas: '',
  };
  const perfil = { ejercicio: { ...EJERCICIO_INICIAL, programa: 'propio' as const }, rutina };
  const programa = programaActivo(perfil);
  const catalogo = catalogoActivo(perfil);
  for (const semana of [1, 5, 12, 20]) {
    const sesiones = sesionesDeSemana(programa, semana);
    assert.deepEqual(sesiones.map((s) => s.id), ['A', 'B']);
    assert.equal(vueltasDeSesion(sesiones[0], 10), 3);
    assert.equal(vueltasDeSesion(sesiones[1], 30), 2);
    for (const s of sesiones) for (const it of s.items) {
      const ej = resolverEjercicio(it.ejercicio, [], catalogo);
      assert.ok(ej && ej.id === it.ejercicio, it.ejercicio);
    }
  }
  assert.equal(metaCaminata(programa, 3), null);
  assert.equal(claveSesion(14, 'A'), '12-A');
  // Sin rutina cargada, el programa propio no tiene sesiones y no lanza.
  assert.deepEqual(sesionesDeSemana(programaDeRutina(null), 1), []);
  // Los programas de la app siguen igual.
  const app = programaActivo({ ejercicio: EJERCICIO_INICIAL, rutina });
  assert.equal(app, PROGRAMAS.desde_cero);
  assert.equal(catalogoActivo({ ejercicio: EJERCICIO_INICIAL, rutina }), EJERCICIOS);
  assert.equal(vueltasDeSesion(sesionesDeSemana(app, 1)[0], 20), 2);
  assert.ok(metaCaminata(app, 1));
});

test('estado: pauta, rutina y fuente se guardan y se validan; un programa "propio" sin rutina es válido', () => {
  const e = normalizar({
    version: 1,
    perfil: {
      inicio: '2026-10-01',
      seguridad: evaluarSeguridad(base),
      cocina: { ...COCINA_INICIAL, fuente: 'propia' },
      ejercicio: { ...EJERCICIO_INICIAL, programa: 'propio' },
      pauta: { origen: 'propia', comidas: [{ nombre: 'Almuerzo', detalle: 'Ensalada y pollo' }] },
      rutina: { sesiones: [{ nombre: 'A', items: [{ nombre: 'Bici', cantidad: 20, unidad: 'seg' }] }] },
    },
  });
  assert.equal(e.perfil?.cocina.fuente, 'propia');
  assert.equal(e.perfil?.ejercicio.programa, 'propio');
  assert.equal(e.perfil?.pauta?.titulo, 'Mi pauta');
  assert.equal(e.perfil?.rutina?.sesiones[0].items[0].unidad, 'seg');
  const sin = normalizar({ version: 1, perfil: { inicio: '2026-10-01', seguridad: evaluarSeguridad(base), cocina: { fuente: 'x' }, ejercicio: { programa: 'propio' } } });
  assert.equal(sin.perfil?.cocina.fuente, 'app');
  assert.equal(sin.perfil?.pauta, null);
  assert.equal(sin.perfil?.rutina, null);
  assert.deepEqual(sesionesDeSemana(programaActivo(sin.perfil!), 1), []);
});
