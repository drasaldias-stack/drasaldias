import { test } from 'node:test';
import assert from 'node:assert/strict';

import { EJERCICIOS } from '../../content/ejercicios';
import { COCINA_INICIAL, EJERCICIO_INICIAL, normalizar } from '../estado';
import { catalogoCompleto, esSesionPropia, letraSesionPropia, normalizarPauta, normalizarRutina, sesionesPropias } from '../propio';
import { claveSesion, resolverEjercicio, vueltasDeSesion } from '../programa';
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
  assert.equal(p.origen, 'propia', 'sin origen válido se asume propia');
  assert.equal(p.titulo, 'Mi pauta');
  assert.deepEqual(p.comidas.map((c) => c.nombre), ['Desayuno', 'Cena']);
  assert.equal(p.comidas[0].detalle, '1 taza de avena');
  assert.equal(p.comidas[1].detalle.length, 2000);
  assert.equal(p.notas, '');
  assert.equal(p.enlace, '');
  // Caracteres de control fuera; saltos de línea y tabulaciones se conservan.
  const control = normalizarPauta({ comidas: [{ nombre: '\u0000\u0001ab\u001f', detalle: '\u0007uno\r\ndos\tx\u0000' }] })!;
  assert.deepEqual(control.comidas[0], { nombre: 'ab', detalle: 'uno\ndos\tx' });
  assert.equal(normalizarPauta({ comidas: [{ nombre: 'A', detalle: 'b' }], enlace: 'https://drive.google.com/x' })!.enlace, 'https://drive.google.com/x');
  const muchas = normalizarPauta({ comidas: Array.from({ length: 12 }, (_, i) => ({ nombre: `C${i}`, detalle: 'x' })) })!;
  assert.equal(muchas.comidas.length, 8);
});

test('rutina propia: sesiones con ids A, B, C en orden e ítems inválidos fuera', () => {
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
    notas: 'n',
  })!;
  assert.equal(r.nombre, 'Mi rutina');
  assert.deepEqual(r.sesiones.map((s) => [s.id, s.nombre, s.vueltas, s.items.length]), [['A', 'Piernas', 1, 1], ['B', 'Sesión B', 2, 1], ['C', 'Cuarta', 1, 1]]);
  assert.equal(r.notas, 'n');
  // Sin clave o con clave repetida se asigna una por posición; una clave válida se conserva.
  assert.deepEqual(r.sesiones.map((s) => s.clave), ['p1', 'p2', 'p3']);
  const conClaves = normalizarRutina({ sesiones: [{ clave: 'k9x', items: [{ nombre: 'a', cantidad: 1 }] }, { clave: 'k9x', items: [{ nombre: 'b', cantidad: 1 }] }, { clave: 'MAL!', items: [{ nombre: 'c', cantidad: 1 }] }] })!;
  assert.deepEqual(conClaves.sesiones.map((s) => s.clave), ['k9x', 'p2', 'p3']);
});

test('rutina propia: se suma al programa con ids propios, en todas las semanas, y resuelve sus ejercicios', () => {
  const rutina: RutinaPropia = {
    nombre: 'Gimnasio',
    sesiones: [
      { id: 'A', clave: 'sup', nombre: 'Tren superior', vueltas: 3, items: [{ nombre: 'Press', cantidad: 10, unidad: 'reps' }, { nombre: 'Plancha', cantidad: 40, unidad: 'seg' }] },
      { id: 'B', clave: 'inf', nombre: 'Tren inferior', vueltas: 2, items: [{ nombre: 'Press', cantidad: 15, unidad: 'reps' }] },
    ],
    notas: '',
  };
  const catalogo = catalogoCompleto(rutina);
  assert.equal(new Set(catalogo.map((e) => e.id)).size, catalogo.length, 'ids únicos entre la app y la rutina');
  assert.equal(catalogo.length, EJERCICIOS.length + 3);
  for (const semana of [1, 5, 12, 20]) {
    const sesiones = sesionesPropias(rutina, semana);
    assert.deepEqual(sesiones.map((s) => s.id), ['mi-sup', 'mi-inf']);
    assert.deepEqual(sesiones.map((s) => letraSesionPropia(rutina, s.id)), ['A', 'B']);
    assert.equal(letraSesionPropia(rutina, 'mi-otra'), null);
    assert.ok(sesiones.every((s) => esSesionPropia(s.id)));
    assert.equal(vueltasDeSesion(sesiones[0], 10), 3);
    assert.equal(vueltasDeSesion(sesiones[1], 30), 2);
    for (const s of sesiones) for (const it of s.items) {
      const ej = resolverEjercicio(it.ejercicio, [], catalogo);
      assert.ok(ej && ej.id === it.ejercicio && ej.instrucciones.length === 0, it.ejercicio);
    }
  }
  assert.equal(claveSesion(14, 'mi-sup'), '12-mi-sup');
  assert.notEqual(claveSesion(3, 'mi-sup'), claveSesion(3, 'A'));
  assert.deepEqual(sesionesPropias(null, 1), []);
  assert.equal(catalogoCompleto(null), EJERCICIOS);
});

test('estado: pauta y rutina se guardan junto al menú y al programa; un programa desconocido vuelve al inicial', () => {
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
  assert.equal(e.perfil?.ejercicio.programa, 'desde_cero');
  assert.equal('fuente' in (e.perfil?.cocina ?? {}), false);
  assert.equal(e.perfil?.pauta?.titulo, 'Mi pauta');
  assert.equal(normalizarPauta({ origen: 'profesional', comidas: [{ nombre: 'A', detalle: 'b' }] })!.titulo, 'Pauta de mi profesional');
  assert.equal(e.perfil?.rutina?.sesiones[0].items[0].unidad, 'seg');
  const sin = normalizar({ version: 1, perfil: { inicio: '2026-10-01', seguridad: evaluarSeguridad(base) } });
  assert.equal(sin.perfil?.pauta, null);
  assert.equal(sin.perfil?.rutina, null);
});
