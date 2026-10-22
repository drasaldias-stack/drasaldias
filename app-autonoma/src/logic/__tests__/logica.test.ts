import { test } from 'node:test';
import assert from 'node:assert/strict';

import { COMPONENTES, componentePorId } from '../../content/componentes';
import { EJERCICIOS, PROGRAMAS } from '../../content/ejercicios';
import { CLASES } from '../../content/clases';
import { FORMATOS_VENTA, type FormatoVenta } from '../../content/formatos';
import { evaluarSeguridad } from '../seguridad';
import { cambiarComponente, diasDelMenu, esCompatible, generarMenu, opcionesRol, ORDEN_ROLES, planificarDias } from '../menu';
import { formatearCantidad, listaCompras, sugerirEnvases, textoEnvases } from '../compras';
import { consumoSemanal } from '../porciones';
import { metaCaminata, resolverEjercicio, semanaDelPrograma, sesionesDeSemana } from '../programa';
import type { Equipo, Exclusion, Material, Patron, PreferenciasCocina, RespuestasSeguridad } from '../tipos';

const base: RespuestasSeguridad = {
  mayorEdad: true, embarazoLactancia: false, conductaAlimentaria: false,
  insulinaSulfonilurea: false, sintomasEsfuerzo: false, enfermedadConocida: false,
};

test('seguridad: deriva o bloquea según las respuestas', () => {
  assert.equal(evaluarSeguridad({ ...base, mayorEdad: false }).apta, false);
  const ok = evaluarSeguridad(base);
  assert.deepEqual([ok.alimentacion, ok.ejercicio], ['ok', 'ok']);
  const ins = evaluarSeguridad({ ...base, insulinaSulfonilurea: true });
  assert.deepEqual([ins.alimentacion, ins.ejercicio], ['requiere_confirmacion', 'requiere_confirmacion']);
  assert.equal(evaluarSeguridad({ ...base, sintomasEsfuerzo: true }).ejercicio, 'requiere_confirmacion');
  assert.equal(evaluarSeguridad({ ...base, enfermedadConocida: true }).ejercicio, 'requiere_confirmacion');
  const emb = evaluarSeguridad({ ...base, embarazoLactancia: true, insulinaSulfonilurea: true });
  assert.deepEqual([emb.alimentacion, emb.ejercicio], ['bloqueado', 'bloqueado']);
  const ca = evaluarSeguridad({ ...base, conductaAlimentaria: true, insulinaSulfonilurea: true });
  assert.deepEqual([ca.alimentacion, ca.ejercicio], ['bloqueado', 'requiere_confirmacion']);
});

test('contenido: ids únicos, referencias válidas y una sola unidad por ingrediente', () => {
  const ids = COMPONENTES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  const ej = new Set(EJERCICIOS.map((e) => e.id));
  for (const e of EJERCICIOS) if (e.alternativa) assert.ok(ej.has(e.alternativa), e.id);
  for (const p of Object.values(PROGRAMAS)) {
    for (const b of p.bloques) for (const s of b.sesiones) for (const it of s.items) assert.ok(ej.has(it.ejercicio), `${p.id} ${it.ejercicio}`);
  }
  assert.equal(CLASES.length, 12);
  const unidades = new Map<string, string>();
  for (const c of COMPONENTES) {
    for (const ing of c.ingredientes) {
      if (ing.basico) continue;
      const previa = unidades.get(ing.nombre);
      assert.ok(!previa || previa === ing.unidad, `${ing.nombre} usa ${previa} y ${ing.unidad}`);
      unidades.set(ing.nombre, ing.unidad);
    }
    assert.ok(c.refrigeradorDias <= 5 || c.rol === 'salsa', `${c.id}: ${c.refrigeradorDias} días refrigerado`);
  }
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
  // Caso en que el voraz fallaba: arroz (congelable, 3 días) con papas asadas (no congelable, 4 días).
  const arroz = componentePorId('c_arroz')!;
  const papas = componentePorId('c_papas')!;
  const plan = planificarDias([{ c: arroz, doble: false }, { c: papas, doble: false }])!;
  assert.ok(plan, 'arroz + papas debe tener reparto');
  assert.equal(plan.length, 5);
  // El reparto elegido congela lo mínimo (una porción) y nunca congela algo que no se puede congelar.
  assert.equal(plan.filter((d) => d.congelar).length, 1);
  for (const d of plan) {
    const c = componentePorId(d.id)!;
    assert.ok(!d.congelar || c.congelable);
  }
  assert.deepEqual([...new Set(plan.map((d) => d.id))].sort(), ['c_arroz', 'c_papas']);
  // Todo par factible de un mismo rol debe aceptarse: se compara contra una comprobación independiente.
  let rechazadosFactibles = 0;
  for (const rol of ['proteina', 'carbohidrato', 'verdura'] as const) {
    const lista = COMPONENTES.filter((c) => c.rol === rol);
    for (let i = 0; i < lista.length; i++)
      for (let j = i + 1; j < lista.length; j++) {
        const a = lista[i], b = lista[j];
        const factible = existeReparto(a, b);
        const plan = planificarDias([{ c: a, doble: false }, { c: b, doble: false }]);
        if (factible && !plan) rechazadosFactibles++;
        if (!factible) assert.equal(plan, null, `${a.id}+${b.id} no debería tener reparto`);
      }
  }
  assert.equal(rechazadosFactibles, 0);
});

function existeReparto(a: typeof COMPONENTES[number], b: typeof COMPONENTES[number]): boolean {
  for (let codigo = 0; codigo < 32; codigo++) {
    let ua = 0, ub = 0, ok = true;
    for (let d = 1; d <= 5; d++) {
      const usaA = ((codigo >> (d - 1)) & 1) === 0;
      const c = usaA ? a : b;
      if (usaA) ua++; else ub++;
      if ((usaA ? ua : ub) > c.porciones || (c.refrigeradorDias < d && !c.congelable)) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

test('menú: siempre arma una semana compatible con las preferencias', () => {
  const equipos: Equipo[][] = [[], ['horno'], ['microondas'], ['horno', 'olla', 'airfryer', 'microondas', 'licuadora']];
  const exclusiones: Exclusion[][] = [
    [], ['gluten', 'lacteos'], ['huevo', 'cebolla'], ['pollo', 'vacuno', 'cerdo'], ['mostaza', 'sesamo', 'frutos_secos'],
    // Alergias combinadas: celiaquía con intolerancia a la lactosa y alergia a frutos secos, con y sin huevo.
    ['gluten', 'lacteos', 'frutos_secos'], ['gluten', 'lacteos', 'frutos_secos', 'huevo'],
  ];
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
              for (const d of op.dias) {
                const c = componentePorId(d.id)!;
                if (d.congelar) assert.ok(c.congelable, `${c.id} se congela sin ser congelable`);
              }
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
  const consumo = consumoSemanal(r.menu, COMPONENTES, null);
  const uno = listaCompras(r.menu, COMPONENTES, 1, consumo);
  const tres = listaCompras(r.menu, COMPONENTES, 3, consumo);
  assert.ok(uno.categorias.length >= 3);
  const totalUno = uno.categorias.flatMap((c) => c.items).find((i) => i.unidad === 'g')!;
  const totalTres = tres.categorias.flatMap((c) => c.items).find((i) => i.clave === totalUno.clave)!;
  assert.ok(totalTres.cantidad >= totalUno.cantidad * 2.5);
  assert.equal(formatearCantidad(1350, 'g'), '1,4 kg');
  assert.equal(formatearCantidad(1, 'unidad'), '1 unidad');
});

test('lista de compras: envases sugeridos según formatos de venta', () => {
  const bolsas: FormatoVenta[] = [
    { envase: 'bolsa', tamano: 500, unidad: 'g' },
    { envase: 'bolsa', tamano: 1000, unidad: 'g' },
  ];
  // Cubre la cantidad comprando lo menos posible, con cada envase adicional penalizado.
  assert.deepEqual(sugerirEnvases(450, 'g', bolsas), [{ numero: 1, formato: bolsas[0] }]);
  assert.deepEqual(sugerirEnvases(1000, 'g', bolsas), [{ numero: 1, formato: bolsas[1] }]);
  assert.equal(textoEnvases(sugerirEnvases(1200, 'g', bolsas)!), '1 bolsa de 1 kg y 1 de 500 g');
  assert.equal(textoEnvases(sugerirEnvases(2500, 'g', bolsas)!), '2 bolsas de 1 kg y 1 de 500 g');
  // Combinaciones que la mezcla «grandes primero» no encontraba.
  const envases = (tamanos: number[], envase = 'envase'): FormatoVenta[] => tamanos.map((tamano) => ({ envase, tamano, unidad: 'g' }));
  assert.equal(textoEnvases(sugerirEnvases(800, 'g', envases([200, 350, 500]))!), '1 envase de 500 g y 1 de 350 g');
  assert.equal(textoEnvases(sugerirEnvases(600, 'g', envases([250, 350, 400], 'bolsa'))!), '1 bolsa de 350 g y 1 de 250 g');
  assert.equal(textoEnvases(sugerirEnvases(1070, 'g', envases([120, 150, 800], 'pote'))!), '1 pote de 800 g, 1 de 150 g y 1 de 120 g');
  assert.equal(sugerirEnvases(450, 'ml', bolsas), null);
  assert.equal(sugerirEnvases(450, 'g', []), null);
  assert.equal(sugerirEnvases(0, 'g', bolsas), null);
  // Yogur: un pote grande y uno chico antes que seis chicos.
  const potes: FormatoVenta[] = [120, 150, 800].map((tamano) => ({ envase: 'pote', tamano, unidad: 'g' }));
  assert.equal(textoEnvases(sugerirEnvases(850, 'g', potes)!), '1 pote de 800 g y 1 de 120 g');
  assert.equal(textoEnvases(sugerirEnvases(300, 'g', potes)!), '2 potes de 150 g');
  // Huevos: caja de 20 antes que dos de 12.
  const cajas: FormatoVenta[] = [12, 20, 30].map((tamano) => ({ envase: 'caja', tamano, unidad: 'unidad' }));
  assert.equal(textoEnvases(sugerirEnvases(13, 'unidad', cajas)!), '1 caja de 20 unidades');
  assert.equal(textoEnvases(sugerirEnvases(12, 'unidad', cajas)!), '1 caja de 12 unidades');
  assert.equal(textoEnvases(sugerirEnvases(25, 'unidad', cajas)!), '1 caja de 30 unidades');
  assert.equal(textoEnvases(sugerirEnvases(32, 'unidad', cajas)!), '1 caja de 20 unidades y 1 de 12 unidades');
  // Cucharadas: 2 cda de salsa son 30 ml, cabe en la botella chica; una cantidad en gramos no usa formatos en ml.
  const botellas: FormatoVenta[] = [{ envase: 'botella', tamano: 165, unidad: 'ml' }];
  assert.equal(textoEnvases(sugerirEnvases(2, 'cda', botellas)!), '1 botella de 165 ml');
  assert.equal(sugerirEnvases(30, 'g', botellas), null);
  assert.equal(textoEnvases([{ numero: 2, formato: { envase: 'caja o lata', tamano: 230, unidad: 'g' } }]), '2 cajas o latas de 230 g');
  // Envases distintos dentro del mismo producto se nombran cada uno.
  const garbanzos: FormatoVenta[] = [{ envase: 'caja', tamano: 230, unidad: 'g' }, { envase: 'lata', tamano: 138, unidad: 'g' }];
  assert.equal(textoEnvases(sugerirEnvases(480, 'g', garbanzos)!), '1 caja de 230 g y 2 latas de 138 g');
  assert.equal(textoEnvases(sugerirEnvases(230, 'g', garbanzos)!), '1 caja de 230 g');
  assert.equal(textoEnvases([{ numero: 2, formato: { envase: 'caja', tamano: 1000, unidad: 'ml' } }]), '2 cajas de 1 l');
  // En la lista real, los productos con formato conocido llevan envases y los demás no.
  const prefs: PreferenciasCocina = { personas: 1, minutos: 120, equipos: ['horno'], patron: 'omnivoro', exclusiones: [] };
  const r = generarMenu(prefs, COMPONENTES, 4);
  assert.ok(r.ok);
  if (!r.ok) return;
  const lista = listaCompras(r.menu, COMPONENTES, 1, consumoSemanal(r.menu, COMPONENTES, null), FORMATOS_VENTA);
  const items = lista.categorias.flatMap((c) => c.items);
  const huevos = items.find((i) => i.nombre === 'Huevo');
  if (huevos) assert.ok(huevos.envases && huevos.envases[0].formato.envase === 'caja');
  for (const i of items) {
    if (i.envases) {
      assert.ok(FORMATOS_VENTA[i.nombre], `${i.nombre} tiene envases sin formato`);
      assert.ok(i.envases.length >= 1 && i.envases.every((e) => e.numero >= 1));
      // Los envases cubren la cantidad.
      const total = i.envases.reduce((s, e) => s + e.numero * e.formato.tamano, 0);
      const pedida = i.unidad === 'cda' ? i.cantidad * 15 : i.unidad === 'cdta' ? i.cantidad * 5 : i.cantidad;
      assert.ok(total >= pedida - 1e-9, `${i.nombre}: ${total} < ${pedida}`);
    } else {
      assert.ok(!FORMATOS_VENTA[i.nombre] || i.unidad === 'diente', `${i.nombre} tiene formato pero no envases`);
    }
  }
  // Los formatos declarados corresponden a ingredientes que existen en el catálogo.
  const nombres = new Set(COMPONENTES.flatMap((c) => c.ingredientes.map((i) => i.nombre)));
  for (const nombre of Object.keys(FORMATOS_VENTA)) assert.ok(nombres.has(nombre), `formato sin ingrediente: ${nombre}`);
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

test('programa: ninguna sesión repite un ejercicio con cualquier combinación de materiales', () => {
  const materiales: Material[] = ['silla', 'banda', 'pesas', 'colchoneta'];
  for (let mascara = 0; mascara < 16; mascara++) {
    const tengo = materiales.filter((_, i) => (mascara >> i) & 1);
    for (const p of Object.values(PROGRAMAS))
      for (const b of p.bloques)
        for (const s of b.sesiones) {
          const resueltos = s.items.map((it) => resolverEjercicio(it.ejercicio, tengo, EJERCICIOS)!.id);
          assert.equal(new Set(resueltos).size, resueltos.length, `${p.id} semanas ${b.semanas.join('-')} sesión ${s.id} con [${tengo.join(',')}]: ${resueltos.join(', ')}`);
        }
  }
});

test('contenido: cada componente puede usarse en al menos una opción de su rol', () => {
  const todo: PreferenciasCocina = { personas: 1, minutos: 120, equipos: ['horno', 'olla', 'airfryer', 'microondas', 'licuadora'], patron: 'omnivoro', exclusiones: [] };
  for (const rol of ORDEN_ROLES) {
    const candidatos = COMPONENTES.filter((c) => c.rol === rol && esCompatible(c, todo));
    const usados = new Set(opcionesRol(rol, candidatos).flatMap((o) => o.elecciones.map((e) => e.id)));
    for (const c of candidatos) assert.ok(usados.has(c.id), `${c.id} no entra en ninguna opción de ${rol}`);
  }
});
