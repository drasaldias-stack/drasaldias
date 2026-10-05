import { test } from 'node:test';
import assert from 'node:assert/strict';

import { COMPONENTES } from '../../content/componentes';
import { COCINA_INICIAL, EJERCICIO_INICIAL, normalizar, VACIO, type EstadoApp } from '../estado';
import { generarMenu, menuVigente } from '../menu';
import { evaluarSeguridad, textosConfirmacion } from '../seguridad';
import type { RespuestasSeguridad } from '../tipos';

const base: RespuestasSeguridad = {
  mayorEdad: true, embarazoLactancia: false, conductaAlimentaria: false,
  insulinaSulfonilurea: false, sintomasEsfuerzo: false, enfermedadConocida: false,
};

const menuValido = () => {
  const r = generarMenu(COCINA_INICIAL, COMPONENTES, 101);
  assert.ok(r.ok);
  return r.menu;
};

const estadoValido = (): EstadoApp => ({
  version: 1,
  perfil: {
    nombre: 'Ana',
    inicio: '2026-09-01',
    seguridad: evaluarSeguridad({ ...base, enfermedadConocida: true }),
    confirmaEjercicio: true,
    confirmaAlimentacion: false,
    cocina: { ...COCINA_INICIAL, exclusiones: ['gluten'], personas: 2 },
    ejercicio: { ...EJERCICIO_INICIAL, programa: 'bajo_impacto', materiales: ['banda', 'silla'] },
  },
  clasesVistas: { c01: '2026-09-02' },
  sesionesHechas: { '1-A': '2026-09-03' },
  caminatas: { '1': 3 },
  menu: { semana: 1, regeneracion: 0, menu: menuValido() },
  compras: { '1|Verduras y frutas|Limón|unidad': true },
});

const clon = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

test('seguridad: mensajes y motivos coherentes con el estado de cada sección', () => {
  const emb = evaluarSeguridad({ ...base, embarazoLactancia: true, insulinaSulfonilurea: true, sintomasEsfuerzo: true });
  assert.deepEqual([emb.alimentacion, emb.ejercicio], ['bloqueado', 'bloqueado']);
  // Con todo bloqueado no se pide confirmar nada en Perfil, pero el aviso de síntomas sí se entrega.
  assert.ok(emb.mensajes.every((m) => !m.includes('Perfil')), emb.mensajes.join('\n'));
  assert.ok(emb.mensajes.some((m) => m.includes('síntomas')));
  assert.deepEqual(emb.motivos, { ejercicio: [], alimentacion: [] });

  const ca = evaluarSeguridad({ ...base, conductaAlimentaria: true, insulinaSulfonilurea: true });
  assert.deepEqual([ca.alimentacion, ca.ejercicio], ['bloqueado', 'requiere_confirmacion']);
  const insulina = ca.mensajes.find((m) => m.startsWith('Con insulina'))!;
  assert.ok(insulina.includes('los programas') && !insulina.includes('los menús'), insulina);
  assert.deepEqual(ca.motivos, { ejercicio: ['conducta', 'insulina'], alimentacion: [] });

  const ins = evaluarSeguridad({ ...base, insulinaSulfonilurea: true });
  assert.ok(ins.mensajes[0].includes('los menús y los programas'));
  assert.deepEqual(ins.motivos, { ejercicio: ['insulina'], alimentacion: ['insulina'] });

  const ambos = evaluarSeguridad({ ...base, sintomasEsfuerzo: true, enfermedadConocida: true });
  assert.deepEqual(ambos.motivos.ejercicio, ['sintomas', 'enfermedad']);
  assert.equal(ambos.mensajes.length, 1);
});

test('seguridad: la casilla de Perfil nombra lo que realmente hay que confirmar', () => {
  const soloConducta = textosConfirmacion(evaluarSeguridad({ ...base, conductaAlimentaria: true }), 'ejercicio');
  assert.ok(soloConducta.casilla.includes('evaluación profesional') && !soloConducta.casilla.includes('autorizó'), soloConducta.casilla);
  const soloInsulina = textosConfirmacion(evaluarSeguridad({ ...base, insulinaSulfonilurea: true }), 'ejercicio');
  assert.ok(soloInsulina.casilla.includes('glucosa') && !soloInsulina.casilla.includes('autorizó'), soloInsulina.casilla);
  const medico = textosConfirmacion(evaluarSeguridad({ ...base, enfermedadConocida: true }), 'ejercicio');
  assert.equal(medico.casilla, 'Un médico me autorizó a hacer ejercicio');
  const mixto = textosConfirmacion(evaluarSeguridad({ ...base, enfermedadConocida: true, insulinaSulfonilurea: true, conductaAlimentaria: true }), 'ejercicio');
  assert.ok(mixto.casilla.includes('autorizó') && mixto.casilla.includes('glucosa') && mixto.casilla.includes('evaluación'), mixto.casilla);
  // Estados guardados antes de que existieran los motivos: texto genérico.
  const antiguo = textosConfirmacion({ apta: true, alimentacion: 'ok', ejercicio: 'requiere_confirmacion', motivos: { ejercicio: [], alimentacion: [] }, mensajes: [] }, 'ejercicio');
  assert.equal(antiguo.casilla, 'Un médico me autorizó a hacer ejercicio');
  assert.ok(textosConfirmacion(medico as never, 'alimentacion').casilla.length > 0);
});

test('estado: lo válido se conserva tal cual', () => {
  const e = estadoValido();
  assert.deepEqual(normalizar(clon(e)), e);
});

test('estado: perfil incompleto o versión desconocida vuelven al inicio', () => {
  assert.equal(normalizar({ version: 2 }), VACIO);
  assert.equal(normalizar({ version: 1, perfil: { nombre: 'x' } }), VACIO);
  assert.equal(normalizar('basura'), VACIO);
  assert.equal(normalizar({ version: 1, perfil: { inicio: '2026-9-1', seguridad: {} } }), VACIO);
});

test('estado: un menú con forma inválida se descarta sin perder el perfil', () => {
  const e = clon(estadoValido()) as Record<string, unknown>;
  for (const roto of [{ semilla: 1 }, { ...menuValido(), porRol: { proteina: {} } }, null, 'x']) {
    const n = normalizar({ ...e, menu: { semana: 5, regeneracion: 0, menu: roto } });
    assert.equal(n.menu, null);
    assert.equal(n.perfil?.nombre, 'Ana');
  }
  const sinDias = clon(menuValido());
  sinDias.porRol.verdura.dias = [];
  assert.equal(menuVigente(sinDias, COMPONENTES), false);
  const idDesconocido = clon(menuValido());
  idDesconocido.porRol.salsa.elecciones[0].id = 'ya_no_existe';
  assert.equal(menuVigente(idDesconocido, COMPONENTES), false);
  assert.equal(menuVigente(menuValido(), COMPONENTES), true);
});

test('estado: preferencias con valores desconocidos vuelven a su valor inicial, campo a campo', () => {
  const e = clon(estadoValido()) as { perfil: Record<string, unknown> };
  e.perfil.ejercicio = { programa: 'antiguo', minutos: 15, materiales: null };
  e.perfil.cocina = { personas: 9, minutos: 45, equipos: 5, patron: 'vegano', exclusiones: ['gluten', 'kiwi'] };
  e.perfil.seguridad = { ...(e.perfil.seguridad as object), motivos: { ejercicio: ['otro', 'insulina'] }, alimentacion: 'raro' };
  const n = normalizar(e).perfil!;
  assert.deepEqual(n.ejercicio, EJERCICIO_INICIAL);
  assert.deepEqual(n.cocina, { ...COCINA_INICIAL, exclusiones: ['gluten'] });
  assert.deepEqual(n.seguridad.motivos, { ejercicio: ['insulina'], alimentacion: [] });
  assert.equal(n.seguridad.alimentacion, 'ok');
  assert.equal(n.nombre, 'Ana');
});
