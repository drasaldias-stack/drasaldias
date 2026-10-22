import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ALIMENTOS } from '../../content/alimentos';
import { COMPONENTES, componentePorId } from '../../content/componentes';
import { listaCompras } from '../compras';
import { normalizarDatos, normalizarObjetivo } from '../estado';
import { cambiarComponente, comidasDelDia, generarMenu, MAX_PREPARACIONES_HUEVO, ORDEN_ROLES, preparacionesDeHuevo, ROLES_PLATO } from '../menu';
import { ingredientesSinValor, nutricionIngrediente, nutricionPorPorcion, type Nutricion } from '../nutricion';
import { datosValidos, deficitReal, gastoReposo, objetivoPorComida, objetivoValido, pesoReferencia, pisoSobreGasto, REPARTO_KCAL, REPARTO_PROTEINA, sugerenciaUsable, sugerirObjetivo } from '../objetivo';
import { esDeHuevo } from '../nutricion';
import {
  avisosSemana, cantidadPrincipal, complementoProteina, consumoSemanal, dimensionarPlato, dimensionarSimple, enumerar, EXTRA_CEREAL_POR_HUEVOS, huevosPorPorcion,
  MAX_HUEVOS_DIA, planDelDia, platoMinimo, textoCantidad, textoFactor, textoUnidades,
} from '../porciones';
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
  assert.equal(s.modo, 'deficit');
  assert.equal(s.total, 1697);
  assert.equal(s.sinRedondear, 1197);
  assert.equal(s.kcal, 1200);
  assert.equal(s.enPiso, true);
  assert.equal(Math.round(pesoReferencia(mujer)), 68);
  assert.equal(s.proteinaMin, 80);
  assert.equal(s.proteinaMax, 110);
  assert.equal(sugerenciaUsable(s), true);
  const hombre = sugerirObjetivo({ sexo: 'hombre', edad: 50, pesoKg: 95, tallaCm: 175, actividad: 'media' });
  assert.equal(hombre.kcal, 1950);
  assert.equal(hombre.enPiso, false);
  // Con IMC menor de 30 el peso de referencia es el real.
  assert.equal(pesoReferencia({ pesoKg: 70, tallaCm: 170 }), 70);
  // Peso normal: se propone mantener, sin déficit. Bajo peso: no se propone nada.
  const normal = sugerirObjetivo({ sexo: 'mujer', edad: 35, pesoKg: 58, tallaCm: 165, actividad: 'media' });
  assert.equal(normal.modo, 'mantenimiento');
  assert.equal(normal.imc, 21.3);
  assert.equal(normal.kcal, 1750);
  assert.equal(normal.sinRedondear, normal.total);
  const bajo = sugerirObjetivo({ sexo: 'mujer', edad: 25, pesoKg: 45, tallaCm: 165, actividad: 'baja' });
  assert.equal(bajo.modo, 'sin_sugerencia');
  assert.equal(sugerenciaUsable(bajo), false);
  // Peso normal con gasto por debajo del piso: no se propone el piso como «mantener».
  const mayor = sugerirObjetivo({ sexo: 'mujer', edad: 80, pesoKg: 48, tallaCm: 155, actividad: 'baja' });
  assert.equal(mayor.modo, 'mantenimiento');
  assert.equal(mayor.total, 1065);
  assert.equal(mayor.enPiso, true);
  assert.equal(pisoSobreGasto(mayor), true);
  assert.equal(sugerenciaUsable(mayor), false);
  // Déficit con el piso por encima del gasto: tampoco se propone (sería un superávit presentado como déficit).
  const mayorConSobrepeso = sugerirObjetivo({ sexo: 'mujer', edad: 85, pesoKg: 56, tallaCm: 148, actividad: 'baja' });
  assert.equal(mayorConSobrepeso.modo, 'deficit');
  assert.ok(mayorConSobrepeso.total < 1200, String(mayorConSobrepeso.total));
  assert.equal(mayorConSobrepeso.kcal, 1200);
  assert.equal(pisoSobreGasto(mayorConSobrepeso), true);
  assert.equal(sugerenciaUsable(mayorConSobrepeso), false);
  // Déficit con piso por debajo del gasto: sí se propone, y lo dice.
  assert.equal(pisoSobreGasto(s), false);
  assert.equal(deficitReal(s), 497);
  // Piso con un déficit real ínfimo (gasto 1202, sugerencia 1200): tampoco se propone.
  const deficitChico = sugerirObjetivo({ sexo: 'mujer', edad: 75, pesoKg: 60, tallaCm: 150, actividad: 'baja' });
  assert.equal(deficitChico.modo, 'deficit');
  assert.equal(deficitChico.total, 1202);
  assert.equal(deficitReal(deficitChico), 2);
  assert.equal(pisoSobreGasto(deficitChico), true);
  assert.equal(sugerenciaUsable(deficitChico), false);
  const deficitCero = sugerirObjetivo({ sexo: 'mujer', edad: 75, pesoKg: 59.85, tallaCm: 150, actividad: 'baja' });
  assert.equal(deficitCero.total, 1200);
  assert.equal(deficitReal(deficitCero), 0);
  assert.equal(sugerenciaUsable(deficitCero), false);
  // enPiso se decide con el valor redondeado que se muestra: 1199,7 se presenta como 1200 y no queda «bajo 1200».
  const borde = sugerirObjetivo({ sexo: 'mujer', edad: 60, pesoKg: 49.2, tallaCm: 155, actividad: 'baja' });
  assert.equal(borde.modo, 'mantenimiento');
  assert.equal(borde.total, 1200);
  assert.equal(borde.enPiso, false);
  assert.equal(borde.kcal, 1200);
  assert.equal(sugerenciaUsable(borde), true);
  // Datos extremos: la sugerencia queda acotada al rango que admite el objetivo y lo dice.
  const extremo = sugerirObjetivo({ sexo: 'hombre', edad: 18, pesoKg: 300, tallaCm: 220, actividad: 'alta' });
  assert.equal(extremo.kcal, 4000);
  assert.equal(extremo.enTope, true);
  assert.equal(sugerenciaUsable(extremo), true);
  assert.equal(objetivoValido(1500, 90), true);
  assert.equal(objetivoValido(500, 90), false);
  assert.equal(objetivoValido(1500, Number.NaN), false);
  assert.equal(datosValidos({ sexo: 'mujer', edad: 17, pesoKg: 60, tallaCm: 160, actividad: 'baja' }), false);
  assert.equal(datosValidos({ sexo: 'mujer', edad: 40, pesoKg: 60, tallaCm: 160, actividad: 'nada' }), false);
  const metas = objetivoPorComida({ kcal: 1500, proteina: 90, origen: 'profesional' });
  assert.deepEqual(metas.desayuno, { kcal: 375, proteina: 14 });
  assert.deepEqual(metas.almuerzo, { kcal: 450, proteina: 34 });
  assert.deepEqual(metas.once, { kcal: 225, proteina: 9 });
  assert.deepEqual(metas.cena, { kcal: 450, proteina: 34 });
  assert.equal(Math.round(Object.values(REPARTO_KCAL).reduce((a, b) => a + b, 0) * 100), 100);
  assert.equal(Math.round(Object.values(REPARTO_PROTEINA).reduce((a, b) => a + b, 0) * 100), 100);
});

const totalPlato = (partes: Record<RolPlato, Nutricion>, f: Record<RolPlato, number>): Nutricion =>
  ROLES_PLATO.reduce((s, r) => ({ kcal: s.kcal + partes[r].kcal * f[r], proteina: s.proteina + partes[r].proteina * f[r] }), { kcal: 0, proteina: 0 });

test('porciones: el plato se ajusta al objetivo y, si no alcanza, manda la energía y se avisa la proteína', () => {
  const quinoa = nutricionPorPorcion(componentePorId('c_quinoa')!);
  const verdura = nutricionPorPorcion(componentePorId('v_asadas')!);
  const salsa = nutricionPorPorcion(componentePorId('s_vinagreta')!);
  const meta = { kcal: 450, proteina: 34 };
  const conPollo = { proteina: nutricionPorPorcion(componentePorId('p_pollo_horno')!), carbohidrato: quinoa, verdura, salsa };
  const f = dimensionarPlato(conPollo, meta);
  const t = totalPlato(conPollo, f);
  assert.ok(Math.abs(t.kcal - meta.kcal) <= 0.12 * meta.kcal, `energía ${t.kcal.toFixed(0)}`);
  assert.ok(Math.abs(t.proteina - meta.proteina) <= 0.2 * meta.proteina + 1, `proteína ${t.proteina.toFixed(1)}`);
  for (const r of ROLES_PLATO) assert.equal((f[r] * 4) % 1, 0, `${r}: ${f[r]} no es múltiplo de un cuarto`);
  assert.equal(f.verdura, 1);
  assert.equal(f.salsa, 1);
  // Lentejas: no se llega a la proteína sin pasarse de energía; el cereal baja a media porción y se respeta la energía (con tolerancia).
  const conLentejas = { proteina: nutricionPorPorcion(componentePorId('p_lentejas')!), carbohidrato: quinoa, verdura, salsa };
  const g = dimensionarPlato(conLentejas, meta);
  const tl = totalPlato(conLentejas, g);
  assert.ok(tl.kcal <= meta.kcal * 1.2, `energía ${tl.kcal.toFixed(0)}`);
  assert.equal(g.carbohidrato, 0.5);
  assert.ok(tl.proteina < meta.proteina, 'con lentejas la proteína queda corta');
  // Comida pequeña: con el aliño entero no cabe ni el plato mínimo, así que el aliño baja a la mitad.
  const chica = dimensionarPlato({ proteina: nutricionPorPorcion(componentePorId('p_porotos')!), carbohidrato: nutricionPorPorcion(componentePorId('c_pasta')!), verdura: nutricionPorPorcion(componentePorId('v_zapallo')!), salsa: nutricionPorPorcion(componentePorId('s_hummus')!) }, { kcal: 240, proteina: 18 });
  assert.equal(chica.salsa, 0.5);
  assert.equal(chica.proteina, 0.5);
  assert.equal(chica.carbohidrato, 0.5);
  assert.deepEqual(dimensionarPlato(conPollo, null), { proteina: 1, carbohidrato: 1, verdura: 1, salsa: 1 });
  assert.equal(dimensionarSimple({ kcal: 240, proteina: 10 }, { kcal: 375, proteina: 22 }), 1.5);
  assert.equal(dimensionarSimple({ kcal: 240, proteina: 10 }, { kcal: 1000, proteina: 22 }), 1.5);
  assert.equal(dimensionarSimple({ kcal: 240, proteina: 10 }, { kcal: 60, proteina: 22 }), 0.5);
  assert.equal(dimensionarSimple({ kcal: 240, proteina: 10 }, null), 1);
  // El redondeo no deja la comida por sobre el 115 %: 151/240 = 0,63 redondearía a ¾ (119 %), queda en ½.
  assert.equal(dimensionarSimple({ kcal: 240, proteina: 10 }, { kcal: 151, proteina: 10 }), 0.5);
  assert.equal(dimensionarSimple({ kcal: 240, proteina: 10 }, { kcal: 375, proteina: 22 }, 1), 1);
  // Con tope de proteína el plato no lo supera y el cereal ocupa la energía que sobra.
  const topado = dimensionarPlato(conPollo, meta, { proteina: 0.5 });
  assert.equal(topado.proteina, 0.5);
  assert.ok(topado.carbohidrato > f.carbohidrato);
  // Con tope de cereal además, el cereal no sube más allá de él.
  const topadoCereal = dimensionarPlato(conPollo, meta, { proteina: 0.5, carbohidrato: f.carbohidrato + 0.5 });
  assert.ok(topadoCereal.carbohidrato <= f.carbohidrato + 0.5 + 1e-9);
  assert.equal(textoFactor(1), '1 porción');
  assert.equal(textoFactor(0.5), 'media porción');
  assert.equal(textoFactor(0.75), '¾ de porción');
  assert.equal(textoFactor(1.25), '1¼ porciones');
  assert.equal(textoFactor(2), '2 porciones');
  assert.equal(cantidadPrincipal(componentePorId('p_pollo_horno')!, 0.75), '90 g de pechuga o trutro deshuesado de pollo');
  assert.equal(cantidadPrincipal(componentePorId('p_huevos')!, 1), '2 huevos');
  assert.equal(cantidadPrincipal(componentePorId('p_frittata')!, 1.25), '2 huevos');
  assert.equal(textoUnidades(0.4, 'Huevo'), 'medio huevo');
  assert.equal(textoUnidades(1, 'Limón'), '1 limón');
  assert.equal(textoUnidades(2.6, 'Limón'), '2½ limones');
  assert.equal(textoUnidades(3, 'Plátano'), '3 plátanos');
  assert.equal(textoCantidad(0.8, 'unidad'), '1 unidad');
  assert.equal(textoCantidad(1.3, 'unidad'), '1½ unidades');
  assert.equal(textoCantidad(0.4, 'diente'), '½ diente');
  assert.equal(textoCantidad(123, 'g'), '125 g');
});

test('minuta: el exceso de energía solo queda en el plato mínimo, los huevos del día tienen tope y el complemento respeta exclusiones', () => {
  assert.equal(huevosPorPorcion(componentePorId('p_huevos')!), 2);
  assert.equal(huevosPorPorcion(componentePorId('c_quinoa')!), 0);
  assert.equal(esDeHuevo(componentePorId('p_huevos')!), true);
  assert.equal(esDeHuevo(componentePorId('p_albondigas')!), false);
  assert.equal(esDeHuevo(componentePorId('o_huevo_fruta')!), true);
  const escenarios: PreferenciasCocina[] = [
    { personas: 1, minutos: 60, equipos: [], patron: 'omnivoro', exclusiones: [] },
    { personas: 1, minutos: 120, equipos: ['horno', 'olla', 'microondas', 'airfryer', 'licuadora'], patron: 'omnivoro', exclusiones: [] },
    { personas: 2, minutos: 90, equipos: ['horno'], patron: 'vegetariano', exclusiones: ['lacteos', 'huevo'] },
    { personas: 1, minutos: 60, equipos: ['horno', 'olla', 'microondas', 'airfryer', 'licuadora'], patron: 'vegetariano', exclusiones: ['soya', 'frutos_secos'] },
    { personas: 1, minutos: 120, equipos: ['horno', 'olla', 'microondas', 'airfryer', 'licuadora'], patron: 'omnivoro', exclusiones: ['huevo', 'lacteos', 'soya'] },
  ];
  let excesos = 0;
  let recortes = 0;
  let conHuevoDeMas = 0;
  for (const prefs of escenarios)
    for (const kcal of [1200, 1500, 1800, 2200, 2500])
      for (const semilla of [1, 2, 3, 4]) {
        const r = generarMenu(prefs, COMPONENTES, semilla);
        assert.ok(r.ok);
        if (!r.ok) continue;
        const objetivo = { kcal, proteina: Math.round(kcal / 16), origen: 'profesional' as const };
        const plan = planDelDia(r.menu, COMPONENTES, objetivo);
        // Sin objetivo no hay recorte por huevos.
        for (const d of planDelDia(r.menu, COMPONENTES, null)) for (const c of d.comidas) assert.equal(c.porHuevos, false);
        // A lo más una preparación de huevo entre proteínas, desayuno y once (contando como dos un par que repite huevo
        // en almuerzo y cena), salvo que no haya otra forma de armar el menú.
        const deHuevo = ORDEN_ROLES.filter((rol) => rol === 'proteina' || rol === 'desayuno' || rol === 'once').reduce((t, rol) => t + preparacionesDeHuevo(r.menu.porRol[rol], COMPONENTES), 0);
        if (deHuevo > MAX_PREPARACIONES_HUEVO) {
          conHuevoDeMas++;
          // Solo se admite cuando el menú no cabe ni con exceso en el tiempo: debe estar informando exceso.
          assert.ok(r.menu.excede > 0, `${prefs.patron} ${prefs.minutos} ${JSON.stringify(prefs.exclusiones)} s${semilla}: dos preparaciones de huevo sin exceder el tiempo`);
        }
        const comidasDia = comidasDelDia(r.menu, COMPONENTES);
        for (const d of plan) {
          assert.ok(Math.abs(d.huevos - d.comidas.reduce((s, c) => s + c.porciones.reduce((t, p) => t + p.factor * huevosPorPorcion(componentePorId(p.id)!), 0), 0)) < 1e-9);
          // Exceso solo cuando ya no se puede servir menos.
          for (const c of d.comidas) {
            if (c.energiaExcede) {
              excesos++;
              assert.ok(platoMinimo(c), `${prefs.patron} ${kcal} s${semilla} d${d.dia} ${c.comida}: excede sin ser el plato mínimo (${c.porciones.map((p) => `${p.id}×${p.factor}`).join(' ')})`);
            }
          }
          // Tope de huevos por día, salvo que todo lo que lleva huevo ya esté en el mínimo.
          const huevos = d.comidas.reduce((s, c) => s + c.porciones.reduce((t, p) => t + p.factor * huevosPorPorcion(componentePorId(p.id)!), 0), 0);
          const todoAlMinimo = d.comidas.every((c) => !esDeHuevo(componentePorId(c.porciones[0].id)!) || c.porciones[0].factor <= 0.5);
          if (huevos > MAX_HUEVOS_DIA + 1e-9) assert.ok(todoAlMinimo, `${prefs.patron} ${kcal} s${semilla} d${d.dia}: ${huevos.toFixed(1)} huevos`);
          for (const c of d.comidas) {
            if (c.porHuevos) recortes++;
            // Nada que no sea una preparación de huevo se recorta por el tope; un plato recortado no es «un huevo con medio kilo de arroz».
            if (c.porHuevos) assert.ok(esDeHuevo(componentePorId(c.porciones[0].id)!), `${c.porciones[0].id} recortado sin ser de huevo`);
            if (c.porHuevos && c.porciones.length > 1) {
              // El cereal del plato recortado no sube más de EXTRA_CEREAL_POR_HUEVOS sobre lo que tenía sin recorte.
              const partes = comidasDia[d.dia - 1][c.comida === 'almuerzo' ? 'almuerzo' : 'cena'];
              const nutr = {} as Record<RolPlato, Nutricion>;
              for (const rol of ROLES_PLATO) nutr[rol] = nutricionPorPorcion(componentePorId(partes[rol].id)!);
              const inicial = dimensionarPlato(nutr, c.meta);
              assert.ok(c.porciones[1].factor <= inicial.carbohidrato + EXTRA_CEREAL_POR_HUEVOS + 1e-9, `${c.comida} d${d.dia}: cereal ${c.porciones[1].factor} > ${inicial.carbohidrato} + ${EXTRA_CEREAL_POR_HUEVOS}`);
              assert.ok(c.porciones[0].factor < inicial.proteina, 'un plato recortado tiene menos proteína que sin recorte');
            }
            // Desayuno u once de huevo no bajan de una porción mientras un plato de huevo siga por sobre media.
            if (c.porciones.length === 1 && c.porHuevos && c.porciones[0].factor < 1) {
              const platosArriba = d.comidas.filter((x) => x.porciones.length > 1 && esDeHuevo(componentePorId(x.porciones[0].id)!) && x.porciones[0].factor > 0.5);
              assert.equal(platosArriba.length, 0, `${prefs.patron} ${kcal} s${semilla} d${d.dia}: ${c.comida} bajo 1 con platos recortables`);
            }
          }
        }
        // Ningún aviso nombra un alimento excluido, ni pide un huevo en un día que ya está en el tope.
        const avisos = avisosSemana(plan, COMPONENTES, prefs);
        for (const a of avisos) {
          if (prefs.exclusiones.includes('huevo')) assert.ok(!/un huevo/.test(a.texto), a.texto);
          if (prefs.exclusiones.includes('lacteos')) assert.ok(!/yogur|quesillo/.test(a.texto), a.texto);
          if (prefs.exclusiones.includes('soya')) assert.ok(!/tofu/.test(a.texto), a.texto);
          if (prefs.patron === 'vegetariano') assert.ok(!/atún|pollo/.test(a.texto), a.texto);
          if (a.texto.includes('más chico que la app arma')) assert.ok(!/Súmales/.test(a.texto), a.texto);
          const [comida, principal] = a.clave.split('|');
          const diasDelAviso = plan.filter((d) => d.comidas.some((c) => c.comida === comida && c.porciones[0].id === principal && (c.proteinaCorta || c.energiaCorta || c.energiaExcede)));
          if (/un huevo/.test(a.texto)) for (const d of diasDelAviso) assert.ok(d.huevos + 1 <= MAX_HUEVOS_DIA + 1e-9, `${a.texto} (día ${d.dia}: ${d.huevos} huevos)`);
          // Si no son todos los días, el aviso los nombra; toda comida corta de proteína de la clave está reflejada.
          const todasLasDeLaClave = plan.filter((d) => d.comidas.some((c) => c.comida === comida && c.porciones[0].id === principal));
          if (diasDelAviso.length < todasLasDeLaClave.length) {
            assert.ok(/ del día \d+ | de los días /.test(a.texto), a.texto);
            assert.ok(!/ de los días \d+(?! y |,)/.test(a.texto), `un solo día en plural: ${a.texto}`);
            // Los días nombrados en cada frase existen y están marcados.
            for (const m of a.texto.matchAll(/d(?:el día|e los días) ([\d, y]+)/g)) {
              const nombrados = m[1].split(/,| y /).map((x) => Number(x.trim())).filter((x) => x > 0);
              for (const n of nombrados) assert.ok(diasDelAviso.some((d) => d.dia === n), `día ${n} no marcado: ${a.texto}`);
            }
          }
          const cortas = diasDelAviso.flatMap((d) => d.comidas.filter((c) => c.comida === comida && c.porciones[0].id === principal && c.proteinaCorta));
          if (cortas.length > 0) {
            const minimo = Math.round(Math.min(...cortas.map((c) => c.total.proteina)));
            assert.ok(a.texto.includes(`unos ${minimo} g de proteína`), `${a.texto} (mínimo ${minimo})`);
            // La frase de proteína nombra exactamente los días cortos de proteína (o ninguno si son todos).
            const frase = a.texto.split('. ').find((f) => f.includes('g de proteína'))!.split(' (')[0];
            const nombrados = [...frase.matchAll(/d(?:el día|e los días) ([\d, y]+)/g)].flatMap((m) => m[1].split(/,| y /).map((x) => Number(x.trim())).filter((x) => x > 0));
            const diasCortos = diasDelAviso.filter((d) => d.comidas.some((c) => c.comida === comida && c.porciones[0].id === principal && c.proteinaCorta)).map((d) => d.dia);
            if (diasCortos.length < todasLasDeLaClave.length) assert.deepEqual(nombrados, diasCortos, frase);
            else assert.equal(nombrados.length, 0, frase);
          }
          if (cortas.some((c) => c.porHuevos)) assert.ok(a.texto.includes('por el máximo de'), a.texto);
          // La causa del tope se atribuye a la cifra solo si el peor día fue recortado.
          if (cortas.length > 0) {
            const peor = cortas.reduce((p, c) => (c.total.proteina < p.total.proteina ? c : p));
            assert.equal(/previstos, por el máximo de/.test(a.texto), peor.porHuevos, a.texto);
          }
        }
      }
  assert.ok(excesos < 20, `demasiados excesos: ${excesos}`);
  // Con la regla al armar el menú, el tope diario no actúa en los escenarios; se ejercita abajo con un menú forzado.
  assert.equal(recortes, 0);
  // La cuenta doble es solo para la proteína del plato: un desayuno o una once de huevo valen una preparación y siguen
  // apareciendo en los menús.
  const muffins = { elecciones: [{ id: 'd_muffins', doble: false }], minutos: 15, dias: Array.from({ length: 5 }, () => ({ id: 'd_muffins', congelar: false })) };
  assert.equal(preparacionesDeHuevo(muffins, COMPONENTES), 1);
  const huevosDobles = { elecciones: [{ id: 'p_huevos', doble: true }], minutos: 10, dias: Array.from({ length: 5 }, () => ({ id: 'p_huevos', congelar: false })) };
  assert.equal(preparacionesDeHuevo(huevosDobles, COMPONENTES), 2);
  let conDesayunoOOnceDeHuevo = 0;
  for (const prefs of escenarios.filter((p) => !p.exclusiones.includes('huevo')))
    for (const semilla of [1, 2, 3, 4, 5, 6]) {
      const r = generarMenu(prefs, COMPONENTES, semilla);
      if (r.ok && (['desayuno', 'once'] as const).some((rol) => esDeHuevo(componentePorId(r.menu.porRol[rol].elecciones[0].id)!))) conDesayunoOOnceDeHuevo++;
    }
  assert.ok(conDesayunoOOnceDeHuevo > 0, 'ningún menú lleva desayuno ni once de huevo');
  assert.ok(conHuevoDeMas <= 4, `menús con más de una preparación de huevo: ${conHuevoDeMas}`);
  // Respaldo cuando no cabe en el tiempo: vegetariano con 60 minutos y sin equipos no cabe en 50 minutos, y aun así el
  // menú no lleva dos preparaciones de huevo porque hay onces sin huevo de los mismos minutos.
  for (const semilla of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const r = generarMenu({ personas: 1, minutos: 60, equipos: [], patron: 'vegetariano', exclusiones: [] }, COMPONENTES, semilla);
    assert.ok(r.ok);
    if (!r.ok) continue;
    assert.ok(r.menu.excede > 0, 'el escenario debe exceder el tiempo para probar el respaldo');
    const deHuevo = (['proteina', 'desayuno', 'once'] as const).reduce((t, rol) => t + preparacionesDeHuevo(r.menu.porRol[rol], COMPONENTES), 0);
    assert.ok(deHuevo <= MAX_PREPARACIONES_HUEVO, `semilla ${semilla}: ${ORDEN_ROLES.map((rol) => r.menu.porRol[rol].elecciones.map((e) => e.id).join('+')).join(' | ')}`);
  }
  // «Otra receta» aplica la misma regla: rotando cada rol varias veces nunca aparecen dos preparaciones de huevo.
  {
    const prefs: PreferenciasCocina = { personas: 1, minutos: 120, equipos: ['horno', 'olla', 'microondas', 'airfryer', 'licuadora'], patron: 'omnivoro', exclusiones: [] };
    for (const semilla of [1, 2, 3]) {
      const r = generarMenu(prefs, COMPONENTES, semilla);
      assert.ok(r.ok);
      if (!r.ok) continue;
      let menu = r.menu;
      for (let vuelta = 0; vuelta < 6; vuelta++)
        for (const rol of ['proteina', 'desayuno', 'once'] as const) {
          const nuevo = cambiarComponente(menu, prefs, COMPONENTES, rol, menu.porRol[rol].elecciones[0].id);
          if (!nuevo) continue;
          menu = nuevo;
          const deHuevo = (['proteina', 'desayuno', 'once'] as const).reduce((t, x) => t + preparacionesDeHuevo(menu.porRol[x], COMPONENTES), 0);
          assert.ok(deHuevo <= MAX_PREPARACIONES_HUEVO, `otra receta (${rol}) dejó ${deHuevo} preparaciones de huevo`);
        }
    }
    // Un menú guardado con una once de huevo y una proteína de huevo (de una versión anterior): «Otra receta» en la
    // proteína no suma huevo si hay alternativas sin huevo.
    const r = generarMenu(prefs, COMPONENTES, 2);
    assert.ok(r.ok);
    if (r.ok) {
      const viejo = {
        ...r.menu,
        porRol: {
          ...r.menu.porRol,
          once: { elecciones: [{ id: 'o_huevo_fruta', doble: false }], minutos: 5, dias: Array.from({ length: 5 }, () => ({ id: 'o_huevo_fruta', congelar: false })) },
        },
      };
      const cambiado = cambiarComponente(viejo, prefs, COMPONENTES, 'proteina', viejo.porRol.proteina.elecciones[0].id);
      assert.ok(cambiado);
      if (cambiado) assert.equal(preparacionesDeHuevo(cambiado.porRol.proteina, COMPONENTES), 0, cambiado.porRol.proteina.elecciones.map((e) => e.id).join('+'));
    }
  }
  // El exceso de tiempo por la regla del huevo se marca; el respaldo sin regla no.
  {
    const r = generarMenu({ personas: 1, minutos: 60, equipos: [], patron: 'omnivoro', exclusiones: [] }, COMPONENTES, 3);
    assert.ok(r.ok);
    if (r.ok) {
      assert.ok(r.menu.excede > 0);
      assert.equal(r.menu.excedePorHuevo, true);
    }
    const holgado = generarMenu({ personas: 1, minutos: 120, equipos: ['horno', 'olla', 'microondas', 'airfryer', 'licuadora'], patron: 'omnivoro', exclusiones: [] }, COMPONENTES, 1);
    assert.ok(holgado.ok && holgado.menu.excede === 0 && !holgado.menu.excedePorHuevo);
  }
  // El tope no toca preparaciones donde el huevo es ligante (albóndigas: ⅙ de huevo por porción): un día con albóndigas
  // en el plato y muffins de huevo al desayuno recorta los muffins, no las albóndigas.
  {
    const prefs: PreferenciasCocina = { personas: 1, minutos: 120, equipos: ['horno', 'olla', 'microondas', 'airfryer', 'licuadora'], patron: 'omnivoro', exclusiones: [] };
    const r = generarMenu(prefs, COMPONENTES, 1);
    assert.ok(r.ok);
    if (r.ok) {
      const forzado = {
        ...r.menu,
        porRol: {
          ...r.menu.porRol,
          proteina: { elecciones: [{ id: 'p_albondigas', doble: true }], minutos: 25, dias: Array.from({ length: 5 }, (_, i) => ({ id: 'p_albondigas', congelar: i >= 4 })) },
          desayuno: { elecciones: [{ id: 'd_muffins', doble: false }], minutos: 15, dias: Array.from({ length: 5 }, () => ({ id: 'd_muffins', congelar: false })) },
          once: { elecciones: [{ id: 'o_huevo_fruta', doble: false }], minutos: 5, dias: Array.from({ length: 5 }, () => ({ id: 'o_huevo_fruta', congelar: false })) },
        },
      };
      const plan = planDelDia(forzado, COMPONENTES, { kcal: 2200, proteina: 140, origen: 'profesional' });
      let recortadas = 0;
      for (const d of plan) {
        for (const c of d.comidas) {
          if (c.porciones[0].id === 'p_albondigas') assert.equal(c.porHuevos, false, 'albóndigas recortadas por el tope');
          if (c.porHuevos) recortadas++;
        }
        assert.ok(d.huevos <= MAX_HUEVOS_DIA + 1e-9 || d.comidas.every((c) => !esDeHuevo(componentePorId(c.porciones[0].id)!) || c.porciones[0].factor <= 0.5));
      }
      assert.ok(recortadas > 0, 'con muffins y huevo en la once a 2200 kcal el tope debe actuar');
      // Huevos duros en almuerzo y cena (una sola receta duplicada): el tope deja 2 y 2, nombra la causa y no pide huevo.
      const dobles = {
        ...forzado,
        porRol: {
          ...forzado.porRol,
          proteina: { elecciones: [{ id: 'p_huevos', doble: true }], minutos: 10, dias: Array.from({ length: 5 }, () => ({ id: 'p_huevos', congelar: false })) },
          desayuno: { elecciones: [{ id: 'd_chia', doble: false }], minutos: 10, dias: Array.from({ length: 5 }, () => ({ id: 'd_chia', congelar: false })) },
          once: { elecciones: [{ id: 'o_fruta_mani', doble: false }], minutos: 5, dias: Array.from({ length: 5 }, () => ({ id: 'o_fruta_mani', congelar: false })) },
        },
      };
      const planDobles = planDelDia(dobles, COMPONENTES, { kcal: 1800, proteina: 110, origen: 'profesional' });
      for (const d of planDobles) {
        assert.ok(Math.abs(d.huevos - MAX_HUEVOS_DIA) < 1e-9, `día ${d.dia}: ${d.huevos} huevos`);
        assert.equal(d.comidas[1].porciones[0].factor, 1);
        assert.equal(d.comidas[3].porciones[0].factor, 1);
        assert.ok(d.comidas[1].porHuevos && d.comidas[3].porHuevos);
      }
      const avisosDobles = avisosSemana(planDobles, COMPONENTES, { patron: 'omnivoro', exclusiones: [] });
      assert.ok(avisosDobles.some((a) => /por el máximo de 4 huevos al día/.test(a.texto)), avisosDobles.map((a) => a.texto).join('\n'));
      for (const a of avisosDobles) assert.ok(!/un huevo/.test(a.texto), a.texto);
    }
  }
  assert.ok(EXTRA_CEREAL_POR_HUEVOS <= 1);
  // Complemento: sin repetir lo que trae el plato ni lo excluido.
  const huevosDuros = [componentePorId('p_huevos')!];
  assert.equal(complementoProteina(huevosDuros), 'Súmales un yogur natural o un trozo de quesillo, o tofu.');
  assert.equal(complementoProteina(huevosDuros, { exclusiones: ['lacteos'] }), 'Súmales tofu.');
  assert.equal(complementoProteina([componentePorId('p_lentejas')!], { exclusiones: ['soya'] }), 'Súmales un huevo, o un yogur natural o un trozo de quesillo.');
  assert.equal(complementoProteina([componentePorId('p_lentejas')!]), 'Súmales un huevo, un yogur natural o un trozo de quesillo, o tofu.');
  assert.equal(complementoProteina([componentePorId('p_tofu')!], { exclusiones: ['lacteos'] }), 'Súmales un huevo.');
  assert.equal(complementoProteina([componentePorId('p_lentejas')!], {}, true), 'Súmales un yogur natural o un trozo de quesillo, o tofu.');
  assert.equal(complementoProteina(huevosDuros, { patron: 'vegetariano', exclusiones: ['lacteos', 'soya'] }), 'Pide a tu equipo de salud una fuente de proteína que puedas comer para completarlas.');
  assert.equal(complementoProteina(huevosDuros, { patron: 'omnivoro', exclusiones: ['lacteos', 'soya'] }), 'Súmales una lata chica de atún en agua o un trozo de pollo cocido.');
  assert.equal(complementoProteina(huevosDuros, { patron: 'omnivoro', exclusiones: ['lacteos', 'soya', 'pescado'] }), 'Súmales un trozo de pollo cocido.');
  assert.equal(enumerar(['3', '4', '5']), '3, 4 y 5');
  assert.equal(enumerar(['4']), '4');
  assert.equal(enumerar(['a', 'b'], 'o'), 'a o b');
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
        for (const p of c.porciones) assert.ok(p.factor >= 0.5 && p.factor <= 2.5, `${p.id} ×${p.factor}`);
        // Las banderas de aviso coinciden con los umbrales.
        assert.equal(c.proteinaCorta, c.meta!.proteina - c.total.proteina >= 5 && c.total.proteina < 0.85 * c.meta!.proteina);
        assert.equal(c.energiaCorta, c.total.kcal < 0.8 * c.meta!.kcal);
        assert.equal(c.energiaExcede, c.total.kcal > 1.15 * c.meta!.kcal);
      }
    }
    for (const d of planDelDia(r.menu, COMPONENTES, null)) for (const c of d.comidas) for (const p of c.porciones) assert.equal(p.factor, 1);
    // Los avisos se agrupan por comida y preparación: nunca más de uno por combinación.
    const avisos = avisosSemana(plan, COMPONENTES);
    assert.equal(new Set(avisos.map((a) => a.clave)).size, avisos.length);
    for (const a of avisos) assert.ok(/^(Los|Las) (desayunos|almuerzos|onces|cenas) con /.test(a.texto), a.texto);
    assert.deepEqual(avisosSemana(planDelDia(r.menu, COMPONENTES, null), COMPONENTES), []);
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
