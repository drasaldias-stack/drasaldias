import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ALIMENTOS } from '../../content/alimentos';
import { COMPONENTES, componentePorId } from '../../content/componentes';
import { listaCompras } from '../compras';
import { normalizarDatos, normalizarObjetivo } from '../estado';
import { comidasDelDia, generarMenu, ROLES_PLATO } from '../menu';
import { ingredientesSinValor, nutricionIngrediente, nutricionPorPorcion, type Nutricion } from '../nutricion';
import { datosValidos, gastoReposo, objetivoPorComida, objetivoValido, pesoReferencia, REPARTO_KCAL, REPARTO_PROTEINA, sugerirObjetivo } from '../objetivo';
import { cantidadPrincipal, consumoSemanal, dimensionarPlato, dimensionarSimple, planDelDia, textoFactor } from '../porciones';
import type { PreferenciasCocina, RolPlato } from '../tipos';

test('alimentos: todos los ingredientes tienen valor y las porciones base son plausibles', () => {
  for (const c of COMPONENTES) assert.deepEqual(ingredientesSinValor(c), [], c.id);
  for (const c of COMPONENTES) {
    for (const ing of c.ingredientes) {
      if (ing.unidad === 'unidad' || ing.unidad === 'diente') assert.ok(ALIMENTOS[ing.nombre]?.porUnidad, `${ing.nombre} sin gramos por unidad`);
    }
    const n = nutricionPorPorcion(c);
    assert.ok(n.kcal >= 10 && n.kcal <= 600, `${c.id}: ${n.kcal.toFixed(0)} kcal por porción`);
    assert.ok(n.proteina >= 0 && n.proteina <= 60, `${c.id}: ${n.proteina.toFixed(1)} g de proteína por porción`);
    if (c.rol === 'proteina') assert.ok(n.proteina >= 10, `${c.id} aporta solo ${n.proteina.toFixed(1)} g de proteína`);
    if (c.rol === 'verdura') assert.ok(n.kcal <= 150, `${c.id}: ${n.kcal.toFixed(0)} kcal`);
  }
  const huevos = nutricionIngrediente({ nombre: 'Huevo', cantidad: 2, unidad: 'unidad', categoria: 'Carnes, pescados y huevos' })!;
  assert.equal(Math.round(huevos.kcal), 143);
  assert.equal(nutricionIngrediente({ nombre: 'No existe', cantidad: 1, unidad: 'g', categoria: 'Despensa' }), null);
});

test('objetivo: sugerencia con Mifflin-St Jeor, piso y peso de referencia; reparto en cuatro comidas', () => {
  const mujer = { sexo: 'mujer' as const, edad: 45, pesoKg: 80, tallaCm: 160, actividad: 'baja' as const };
  assert.equal(gastoReposo(mujer), 1414);
  const s = sugerirObjetivo(mujer);
  assert.equal(s.total, 1697);
  assert.equal(s.kcal, 1200);
  assert.equal(s.enPiso, true);
  assert.equal(Math.round(pesoReferencia(mujer)), 68);
  assert.equal(s.proteinaMin, 80);
  assert.equal(s.proteinaMax, 110);
  const hombre = sugerirObjetivo({ sexo: 'hombre', edad: 50, pesoKg: 95, tallaCm: 175, actividad: 'media' });
  assert.equal(hombre.kcal, 1950);
  assert.equal(hombre.enPiso, false);
  // Con IMC menor de 30 el peso de referencia es el real.
  assert.equal(pesoReferencia({ pesoKg: 70, tallaCm: 170 }), 70);
  assert.equal(objetivoValido(1500, 90), true);
  assert.equal(objetivoValido(500, 90), false);
  assert.equal(objetivoValido(1500, Number.NaN), false);
  assert.equal(datosValidos({ sexo: 'mujer', edad: 17, pesoKg: 60, tallaCm: 160, actividad: 'baja' }), false);
  assert.equal(datosValidos({ sexo: 'mujer', edad: 40, pesoKg: 60, tallaCm: 160, actividad: 'nada' }), false);
  const metas = objetivoPorComida({ kcal: 1500, proteina: 90, origen: 'profesional' });
  assert.deepEqual(metas.almuerzo, { kcal: 525, proteina: 32 });
  assert.deepEqual(metas.once, { kcal: 225, proteina: 9 });
  assert.deepEqual(metas.cena, { kcal: 375, proteina: 32 });
  assert.equal(Math.round(Object.values(REPARTO_KCAL).reduce((a, b) => a + b, 0) * 100), 100);
  assert.equal(Math.round(Object.values(REPARTO_PROTEINA).reduce((a, b) => a + b, 0) * 100), 100);
});

const totalPlato = (partes: Record<RolPlato, Nutricion>, f: Record<RolPlato, number>): Nutricion =>
  ROLES_PLATO.reduce((s, r) => ({ kcal: s.kcal + partes[r].kcal * f[r], proteina: s.proteina + partes[r].proteina * f[r] }), { kcal: 0, proteina: 0 });

test('porciones: el plato se ajusta al objetivo y, si no alcanza, manda la energía y se avisa la proteína', () => {
  const quinoa = nutricionPorPorcion(componentePorId('c_quinoa')!);
  const verdura = nutricionPorPorcion(componentePorId('v_asadas')!);
  const salsa = nutricionPorPorcion(componentePorId('s_vinagreta')!);
  const meta = { kcal: 525, proteina: 32 };
  const conPollo = { proteina: nutricionPorPorcion(componentePorId('p_pollo_horno')!), carbohidrato: quinoa, verdura, salsa };
  const f = dimensionarPlato(conPollo, meta);
  const t = totalPlato(conPollo, f);
  assert.ok(Math.abs(t.kcal - meta.kcal) <= 0.12 * meta.kcal, `energía ${t.kcal.toFixed(0)}`);
  assert.ok(Math.abs(t.proteina - meta.proteina) <= 0.2 * meta.proteina + 1, `proteína ${t.proteina.toFixed(1)}`);
  for (const r of ROLES_PLATO) assert.equal((f[r] * 4) % 1, 0, `${r}: ${f[r]} no es múltiplo de un cuarto`);
  assert.equal(f.verdura, 1);
  assert.equal(f.salsa, 1);
  // Lentejas: no se llega a la proteína sin pasarse de energía; se acota el cereal y se respeta la energía.
  const conLentejas = { proteina: nutricionPorPorcion(componentePorId('p_lentejas')!), carbohidrato: quinoa, verdura, salsa };
  const g = dimensionarPlato(conLentejas, meta);
  const tl = totalPlato(conLentejas, g);
  assert.ok(tl.kcal <= meta.kcal * 1.12, `energía ${tl.kcal.toFixed(0)}`);
  assert.equal(g.carbohidrato, 0.25);
  assert.ok(tl.proteina < meta.proteina, 'con lentejas la proteína queda corta');
  assert.deepEqual(dimensionarPlato(conPollo, null), { proteina: 1, carbohidrato: 1, verdura: 1, salsa: 1 });
  assert.equal(dimensionarSimple({ kcal: 240, proteina: 10 }, { kcal: 375, proteina: 22 }), 1.5);
  assert.equal(dimensionarSimple({ kcal: 240, proteina: 10 }, { kcal: 1000, proteina: 22 }), 1.5);
  assert.equal(dimensionarSimple({ kcal: 240, proteina: 10 }, { kcal: 60, proteina: 22 }), 0.5);
  assert.equal(dimensionarSimple({ kcal: 240, proteina: 10 }, null), 1);
  assert.equal(textoFactor(1), '1 porción');
  assert.equal(textoFactor(0.5), 'media porción');
  assert.equal(textoFactor(0.75), '¾ de porción');
  assert.equal(textoFactor(1.25), '1¼ porciones');
  assert.equal(textoFactor(2), '2 porciones');
  assert.equal(cantidadPrincipal(componentePorId('p_pollo_horno')!, 0.75), '90 g de pechuga o trutro deshuesado de pollo');
  assert.equal(cantidadPrincipal(componentePorId('p_huevos')!, 1), '2 unidades de huevo');
});

test('minuta: cuatro comidas por día, la cena alterna con el almuerzo y el consumo escala las compras', () => {
  const prefs: PreferenciasCocina = { personas: 1, minutos: 120, equipos: ['horno', 'olla', 'microondas'], patron: 'omnivoro', exclusiones: [] };
  const objetivo = { kcal: 1500, proteina: 90, origen: 'profesional' as const };
  let distintas = 0;
  for (const semilla of [1, 2, 3, 4, 5]) {
    const r = generarMenu(prefs, COMPONENTES, semilla);
    assert.ok(r.ok);
    if (!r.ok) continue;
    const dias = comidasDelDia(r.menu, COMPONENTES);
    assert.equal(dias.length, 5);
    for (const d of dias) {
      for (const rol of ROLES_PLATO) {
        const op = r.menu.porRol[rol];
        if (op.elecciones.length === 2 && d.cena[rol].id !== d.almuerzo[rol].id) distintas++;
        const c = componentePorId(d.cena[rol].id)!;
        assert.ok(c.refrigeradorDias >= d.dia || d.cena[rol].congelar, `${c.id} el día ${d.dia}`);
        if (d.cena[rol].congelar) assert.ok(c.congelable, `${c.id} se congela sin ser congelable`);
        assert.ok(op.elecciones.some((e) => e.id === d.cena[rol].id), 'la cena usa un componente elegido');
      }
    }
    const plan = planDelDia(r.menu, COMPONENTES, objetivo);
    for (const d of plan) {
      assert.deepEqual(d.comidas.map((c) => c.comida), ['desayuno', 'almuerzo', 'once', 'cena']);
      assert.ok(Math.abs(d.total.kcal - objetivo.kcal) <= 0.2 * objetivo.kcal, `semilla ${semilla}, día ${d.dia}: ${d.total.kcal.toFixed(0)} kcal`);
      for (const c of d.comidas) {
        for (const p of c.porciones) assert.ok(p.factor >= 0.25 && p.factor <= 2.5);
        // Las banderas de aviso coinciden con los umbrales.
        assert.equal(c.proteinaCorta, c.total.proteina < 0.85 * c.meta!.proteina);
        assert.equal(c.energiaCorta, c.total.kcal < 0.8 * c.meta!.kcal);
      }
    }
    for (const d of planDelDia(r.menu, COMPONENTES, null)) for (const c of d.comidas) for (const p of c.porciones) assert.equal(p.factor, 1);
    // Sin objetivo, cada rol del plato se come en 10 comidas (5 almuerzos y 5 cenas) repartidas entre sus elegidos.
    const base = consumoSemanal(r.menu, COMPONENTES, null);
    for (const rol of ROLES_PLATO) assert.equal(r.menu.porRol[rol].elecciones.reduce((s, e) => s + (base.get(e.id) ?? 0), 0), 10, rol);
    assert.equal(base.get(r.menu.porRol.desayuno.elecciones[0].id), 5);
    assert.equal(base.get(r.menu.porRol.once.elecciones[0].id), 5);
    const consumo = consumoSemanal(r.menu, COMPONENTES, objetivo);
    const lista = listaCompras(r.menu, COMPONENTES, 1, consumo);
    assert.ok(lista.categorias.length >= 3);
    const id = r.menu.porRol.proteina.elecciones[0].id;
    const c = componentePorId(id)!;
    const ing = c.ingredientes.find((i) => !i.basico)!;
    const item = lista.categorias.flatMap((g) => g.items).find((i) => i.nombre === ing.nombre)!;
    const esperado = (ing.cantidad / c.porciones) * consumo.get(id)!;
    assert.ok(item.cantidad >= esperado - 1e-9 && item.cantidad <= esperado + 50, `${ing.nombre}: ${item.cantidad} frente a ${esperado}`);
  }
  assert.ok(distintas > 0, 'alguna cena debería usar el otro componente del par');
});

test('estado: objetivo y datos corporales se validan al cargar', () => {
  assert.deepEqual(normalizarObjetivo({ kcal: 1500.4, proteina: 90, origen: 'otro' }), { kcal: 1500, proteina: 90, origen: 'profesional' });
  assert.deepEqual(normalizarObjetivo({ kcal: 1800, proteina: 100, origen: 'calculado' }), { kcal: 1800, proteina: 100, origen: 'calculado' });
  assert.equal(normalizarObjetivo({ kcal: 500, proteina: 90 }), null);
  assert.equal(normalizarObjetivo('nada'), null);
  const datos = { sexo: 'hombre', edad: 50, pesoKg: 95, tallaCm: 175, actividad: 'media' };
  assert.deepEqual(normalizarDatos(datos), datos);
  assert.equal(normalizarDatos({ ...datos, pesoKg: 20 }), null);
  assert.equal(normalizarDatos(null), null);
});
