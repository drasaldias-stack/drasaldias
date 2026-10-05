import { test } from 'node:test';
import assert from 'node:assert/strict';

import { COMPONENTES, componentePorId } from '../../content/componentes';
import { EJERCICIOS, PROGRAMAS } from '../../content/ejercicios';
import { CLASES } from '../../content/clases';
import { evaluarSeguridad } from '../seguridad';
import { cambiarComponente, diasDelMenu, esCompatible, generarMenu, ORDEN_ROLES, planificarDias } from '../menu';
import { formatearCantidad, listaCompras } from '../compras';
import { metaCaminata, resolverEjercicio, semanaDelPrograma, sesionesDeSemana } from '../programa';
import type { Equipo, Exclusion, Patron, PreferenciasCocina, RespuestasSeguridad } from '../tipos';

const base: RespuestasSeguridad = {
  mayorEdad: true, embarazoLactancia: false, conductaAlimentaria: false,
  insulinaSulfonilurea: false, sintomasEsfuerzo: false, enfermedadConocida: false,
};

test('seguridad: deriva o bloquea según las respuestas', () => {
  assert.equal(evaluarSeguridad({ ...base, mayorEdad: false }).apta, false);
  const ok = evaluarSeguridad(base);
  assert.deepEqual([ok.alimentacion, ok.ejercicio], ['ok', 'ok']);
  assert.equal(evaluarSeguridad({ ...base, insulinaSulfonilurea: true }).alimentacion, 'requiere_confirmacion');
  assert.equal(evaluarSeguridad({ ...base, sintomasEsfuerzo: true }).ejercicio, 'requiere_confirmacion');
  assert.equal(evaluarSeguridad({ ...base, enfermedadConocida: true }).ejercicio, 'requiere_confirmacion');
  const emb = evaluarSeguridad({ ...base, embarazoLactancia: true });
  assert.deepEqual([emb.alimentacion, emb.ejercicio], ['bloqueado', 'bloqueado']);
  const ca = evaluarSeguridad({ ...base, conductaAlimentaria: true, insulinaSulfonilurea: true });
  assert.equal(ca.alimentacion, 'bloqueado');
});

test('contenido: ids únicos y referencias válidas', () => {
  const ids = COMPONENTES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  const ej = new Set(EJERCICIOS.map((e) => e.id));
  for (const e of EJERCICIOS) if (e.alternativa) assert.ok(ej.has(e.alternativa), e.id);
  for (const p of Object.values(PROGRAMAS)) {
    for (const b of p.bloques) for (const s of b.sesiones) for (const it of s.items) assert.ok(ej.has(it.ejercicio), `${p.id} ${it.ejercicio}`);
  }
  assert.equal(CLASES.length, 12);
});

test('planificarDias: lo que vence antes va primero y se congela lo que no alcanza', () => {
  const pescado = componentePorId('p_pescado')!;
  const pollo = componentePorId('p_pollo_horno')!;
  const dias = planificarDias([{ c: pollo, doble: false }, { c: pescado, doble: false }])!;
  assert.deepEqual(dias.map((d) => d.id), ['p_pescado', 'p_pescado', 'p_pollo_horno', 'p_pollo_horno', 'p_pollo_horno']);
  assert.deepEqual(dias.map((d) => d.congelar), [false, false, false, false, true]);
  // Dos componentes que no se congelan y vencen pronto no cubren la semana.
  const espinaca = componentePorId('v_espinaca')!;
  const champ = componentePorId('v_champinones')!;
  assert.equal(planificarDias([{ c: espinaca, doble: false }, { c: champ, doble: false }]), null);
});

test('menú: siempre arma una semana compatible con las preferencias', () => {
  const equipos: Equipo[][] = [[], ['horno'], ['microondas'], ['horno', 'olla', 'airfryer', 'microondas', 'licuadora']];
  const exclusiones: Exclusion[][] = [[], ['gluten', 'lacteos'], ['huevo', 'cebolla'], ['pollo', 'vacuno', 'cerdo']];
  const patrones: Patron[] = ['omnivoro', 'vegetariano'];
  let combinaciones = 0;
  let exceden60 = 0;
  for (const minutos of [60, 90, 120] as const)
    for (const eq of equipos)
      for (const ex of exclusiones)
        for (const patron of patrones)
          for (const semilla of [1, 2, 3]) {
            const prefs: PreferenciasCocina = { personas: 2, minutos, equipos: eq, patron, exclusiones: ex };
            const r = generarMenu(prefs, COMPONENTES, semilla);
            assert.ok(r.ok, `sin menú: ${JSON.stringify(prefs)} ${!r.ok ? r.rolSinOpciones : ''}`);
            if (!r.ok) continue;
            combinaciones++;
            for (const rol of ORDEN_ROLES) {
              const op = r.menu.porRol[rol];
              assert.equal(op.dias.length, 5);
              for (const e of op.elecciones) assert.ok(esCompatible(componentePorId(e.id)!, prefs), `${e.id} no compatible`);
            }
            if (minutos >= 90 && eq.length === 5) assert.equal(r.menu.excede, 0, JSON.stringify(prefs));
            if (minutos === 60 && r.menu.excede > 0) exceden60++;
            assert.equal(diasDelMenu(r.menu).length, 5);
          }
  assert.ok(combinaciones > 0);
  console.log(`menús generados: ${combinaciones}; de 60 minutos que exceden el tiempo: ${exceden60}`);
});

test('menú: la semilla cambia el menú y cambiar un componente mantiene el otro', () => {
  const prefs: PreferenciasCocina = { personas: 1, minutos: 120, equipos: ['horno', 'olla', 'microondas'], patron: 'omnivoro', exclusiones: [] };
  const firmas = new Set<string>();
  for (let s = 1; s <= 6; s++) {
    const r = generarMenu(prefs, COMPONENTES, s);
    assert.ok(r.ok);
    if (r.ok) firmas.add(r.menu.porRol.proteina.elecciones.map((e) => e.id).join('+'));
  }
  assert.ok(firmas.size > 1, 'las semanas deberían variar');
  const r = generarMenu(prefs, COMPONENTES, 1);
  assert.ok(r.ok);
  if (!r.ok) return;
  const [a, b] = r.menu.porRol.proteina.elecciones;
  const nuevo = cambiarComponente(r.menu, prefs, COMPONENTES, 'proteina', a.id);
  assert.ok(nuevo);
  const ids = nuevo!.porRol.proteina.elecciones.map((e) => e.id);
  assert.ok(!ids.includes(a.id));
  assert.ok(ids.includes(b.id));
});

test('lista de compras: escala por personas y agrupa', () => {
  const prefs: PreferenciasCocina = { personas: 1, minutos: 120, equipos: ['horno'], patron: 'omnivoro', exclusiones: [] };
  const r = generarMenu(prefs, COMPONENTES, 4);
  assert.ok(r.ok);
  if (!r.ok) return;
  const uno = listaCompras(r.menu, COMPONENTES, 1);
  const tres = listaCompras(r.menu, COMPONENTES, 3);
  assert.ok(uno.categorias.length >= 3);
  const totalUno = uno.categorias.flatMap((c) => c.items).find((i) => i.unidad === 'g')!;
  const totalTres = tres.categorias.flatMap((c) => c.items).find((i) => i.clave === totalUno.clave)!;
  assert.ok(totalTres.cantidad >= totalUno.cantidad * 2.5);
  assert.equal(formatearCantidad(1350, 'g'), '1,4 kg');
  assert.equal(formatearCantidad(1, 'unidad'), '1 unidad');
});

test('programa: semanas, bloques y alternativas por material', () => {
  assert.equal(semanaDelPrograma('2026-01-05', '2026-01-05'), 1);
  assert.equal(semanaDelPrograma('2026-01-05', '2026-01-12'), 2);
  assert.equal(semanaDelPrograma('2026-01-05', '2026-03-30'), 13);
  assert.equal(sesionesDeSemana(PROGRAMAS.desde_cero, 8)[0].items[0].ejercicio, 'sentadilla');
  assert.equal(sesionesDeSemana(PROGRAMAS.desde_cero, 20)[0].items[0].cantidad, 12);
  assert.equal(resolverEjercicio('remo_banda', [], EJERCICIOS)?.id, 'remo_mochila');
  assert.equal(resolverEjercicio('remo_banda', ['banda'], EJERCICIOS)?.id, 'remo_banda');
  assert.equal(resolverEjercicio('puente', ['silla'], EJERCICIOS)?.id, 'extension_cadera_pie');
  assert.equal(resolverEjercicio('marcha_sentada', [], EJERCICIOS)?.id, 'marcha');
  assert.equal(metaCaminata(PROGRAMAS.desde_cero, 5).minutosDia, 15);
});
