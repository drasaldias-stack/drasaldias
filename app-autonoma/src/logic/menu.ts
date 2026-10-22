import { esDeHuevo } from './nutricion';
import type { Componente, EquipoReceta, PreferenciasCocina, Rol } from './tipos';

// Arma el menú semanal a partir de componentes aprobados. No genera recetas nuevas:
// solo elige y combina contenido revisado según tiempo, equipamiento, patrón y exclusiones.

export const DIAS = 5;
export const MINUTOS_ORGANIZACION = 10;
export const ORDEN_ROLES: Rol[] = ['proteina', 'carbohidrato', 'verdura', 'salsa', 'desayuno', 'once'];
const ROLES_PAR: Rol[] = ['proteina', 'carbohidrato', 'verdura'];
/** Los roles que forman el plato del almuerzo y de la cena. */
export type RolPlato = 'proteina' | 'carbohidrato' | 'verdura' | 'salsa';
export const ROLES_PLATO: RolPlato[] = ['proteina', 'carbohidrato', 'verdura', 'salsa'];

export type Eleccion = { id: string; doble: boolean };
export type Asignacion = { id: string; congelar: boolean };
export type OpcionRol = { elecciones: Eleccion[]; minutos: number; dias: Asignacion[] };
export type Menu = {
  semilla: number;
  porRol: Record<Rol, OpcionRol>;
  /** Minutos de trabajo activo de la sesión, incluida la organización. */
  minutos: number;
  /** Minutos por sobre el tiempo elegido; 0 si cabe. */
  excede: number;
  /** El exceso viene de respetar la regla del huevo: había un menú más rápido que la incumplía. */
  excedePorHuevo?: boolean;
};
export type ResultadoMenu = { ok: true; menu: Menu } | { ok: false; rolSinOpciones: Rol };

export function esCompatible(c: Componente, p: PreferenciasCocina): boolean {
  if (!c.patrones.includes(p.patron)) return false;
  if (c.contiene.some((x) => p.exclusiones.includes(x))) return false;
  const disponibles: EquipoReceta[] = ['cocinilla', 'sin_coccion', ...p.equipos];
  return c.equipos.some((e) => disponibles.includes(e));
}

const porciones = (c: Componente, doble: boolean) => c.porciones * (doble ? 2 : 1);
const minutosDe = (c: Componente, doble: boolean) => c.minutosActivos + (doble ? 5 : 0);

/**
 * Reparte los días de la semana entre los componentes elegidos: primero lo que vence antes.
 * Si un día queda fuera del tiempo de refrigeración, usa una porción congelada el día de la sesión.
 */
export function planificarDias(items: { c: Componente; doble: boolean }[], dias = DIAS): Asignacion[] | null {
  const pendientes = items
    .map((i) => ({ c: i.c, quedan: porciones(i.c, i.doble) }))
    .sort((a, b) => a.c.refrigeradorDias - b.c.refrigeradorDias || a.c.id.localeCompare(b.c.id));
  const out: Asignacion[] = [];
  for (let d = 1; d <= dias; d++) {
    let elegido = pendientes.find((p) => p.quedan > 0 && p.c.refrigeradorDias >= d);
    let congelar = false;
    if (!elegido) {
      elegido = pendientes.find((p) => p.quedan > 0 && p.c.congelable);
      congelar = Boolean(elegido);
    }
    if (!elegido) return planificarExhaustivo(items, dias);
    elegido.quedan -= 1;
    out.push({ id: elegido.c.id, congelar });
  }
  return out;
}

/**
 * Respaldo del reparto voraz: con dos componentes y cinco días hay a lo más 32 asignaciones.
 * Elige la que menos porciones congela y, a igualdad, la que menos alterna de componente entre días.
 * El voraz falla, por ejemplo, cuando consume primero el componente congelable y al final no queda nada que congelar.
 */
function planificarExhaustivo(items: { c: Componente; doble: boolean }[], dias: number): Asignacion[] | null {
  if (items.length === 0 || items.length > 3) return null;
  const n = items.length;
  const total = Math.pow(n, dias);
  let mejor: Asignacion[] | null = null;
  let mejorClave = Infinity;
  for (let codigo = 0; codigo < total; codigo++) {
    const usados = new Array<number>(n).fill(0);
    const plan: Asignacion[] = [];
    let congelados = 0;
    let cambios = 0;
    let valido = true;
    let resto = codigo;
    for (let d = 1; d <= dias; d++) {
      const i = resto % n;
      resto = Math.floor(resto / n);
      const { c, doble } = items[i];
      usados[i] += 1;
      if (usados[i] > porciones(c, doble)) { valido = false; break; }
      const congelar = c.refrigeradorDias < d;
      if (congelar && !c.congelable) { valido = false; break; }
      if (congelar) congelados += 1;
      if (d > 1 && plan[d - 2].id !== c.id) cambios += 1;
      plan.push({ id: c.id, congelar });
    }
    if (!valido) continue;
    const clave = congelados * 10 + cambios;
    if (clave < mejorClave) { mejorClave = clave; mejor = plan; }
  }
  return mejor;
}

export function opcionesRol(rol: Rol, candidatos: Componente[]): OpcionRol[] {
  const out: OpcionRol[] = [];
  if (ROLES_PAR.includes(rol)) {
    for (let i = 0; i < candidatos.length; i++) {
      for (let j = i + 1; j < candidatos.length; j++) {
        const a = candidatos[i];
        const b = candidatos[j];
        const dias = planificarDias([{ c: a, doble: false }, { c: b, doble: false }]);
        if (dias) {
          out.push({
            elecciones: [{ id: a.id, doble: false }, { id: b.id, doble: false }],
            minutos: minutosDe(a, false) + minutosDe(b, false),
            dias,
          });
        }
      }
    }
    if (out.length > 0) return out;
    // Con pocas opciones compatibles, se duplica una sola receta.
    for (const c of candidatos) {
      const dias = planificarDias([{ c, doble: true }]);
      if (dias) out.push({ elecciones: [{ id: c.id, doble: true }], minutos: minutosDe(c, true), dias });
    }
    return out;
  }
  for (const c of candidatos) {
    const dias = planificarDias([{ c, doble: false }]);
    if (dias) out.push({ elecciones: [{ id: c.id, doble: false }], minutos: minutosDe(c, false), dias });
  }
  return out;
}

/** Hash determinista para ordenar opciones de forma distinta cada semana sin azar real. */
function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const claveOpcion = (o: OpcionRol) => o.elecciones.map((e) => e.id + (e.doble ? '*2' : '')).join('+');
function ordenar(opciones: OpcionRol[], semilla: number, rol: Rol): OpcionRol[] {
  return [...opciones].sort(
    (a, b) => hash(`${semilla}|${rol}|${claveOpcion(a)}`) - hash(`${semilla}|${rol}|${claveOpcion(b)}`) || claveOpcion(a).localeCompare(claveOpcion(b)),
  );
}

export function opcionesPorRol(prefs: PreferenciasCocina, catalogo: Componente[], semilla: number): Record<Rol, OpcionRol[]> {
  const res = {} as Record<Rol, OpcionRol[]>;
  for (const rol of ORDEN_ROLES) {
    const candidatos = catalogo.filter((c) => c.rol === rol && esCompatible(c, prefs));
    res[rol] = ordenar(opcionesRol(rol, candidatos), semilla, rol);
  }
  return res;
}

/**
 * Preparaciones de huevo como máximo entre las proteínas del plato, el desayuno y la once (`MAX_PREPARACIONES_HUEVO`):
 * así un menú no lleva huevo en todas las comidas. Un par de proteínas que algún día sirve la misma preparación de
 * huevo en almuerzo y cena (porque la otra ya venció y no se congela, o porque es una sola receta duplicada) cuenta
 * como dos. Si con esa regla no se arma ningún menú en el tiempo elegido, se busca el que menos se pase (de 5 en 5
 * minutos, hasta `EXCESO_MAXIMO_POR_HUEVO`) antes de armarlo sin la regla; el tope diario de huevos (porciones.ts)
 * queda como última barrera. «Otra receta» aplica la misma regla.
 */
export const MAX_PREPARACIONES_HUEVO = 1;
export const EXCESO_MAXIMO_POR_HUEVO = 30;
/** Preparaciones de huevo que aporta una opción; para la proteína, dos si algún día se repite en almuerzo y cena. */
export function preparacionesDeHuevo(o: OpcionRol, catalogo: Componente[]): number {
  const porId = new Map(catalogo.map((c) => [c.id, c]));
  const deHuevo = o.elecciones.filter((e) => {
    const c = porId.get(e.id);
    return c !== undefined && esDeHuevo(c);
  }).length;
  if (deHuevo === 0) return 0;
  // Solo en la proteína del plato (par o receta duplicada): desayuno y once se sirven una vez al día.
  const esPlato = o.elecciones.length > 1 || o.elecciones.some((e) => e.doble);
  const repite = esPlato && o.dias.some((a, i) => {
    const c = porId.get(a.id);
    if (!c || !esDeHuevo(c)) return false;
    const dia = i + 1;
    return !o.elecciones.some((e) => {
      const otro = porId.get(e.id);
      return otro && otro.id !== c.id && (otro.refrigeradorDias >= dia || otro.congelable);
    });
  });
  return repite ? Math.max(deHuevo, MAX_PREPARACIONES_HUEVO + 1) : deHuevo;
}

export function generarMenu(prefs: PreferenciasCocina, catalogo: Componente[], semilla: number): ResultadoMenu {
  const opciones = opcionesPorRol(prefs, catalogo, semilla);
  for (const rol of ORDEN_ROLES) if (opciones[rol].length === 0) return { ok: false, rolSinOpciones: rol };

  const presupuesto = prefs.minutos - MINUTOS_ORGANIZACION;
  const minimos = ORDEN_ROLES.map((rol) => Math.min(...opciones[rol].map((o) => o.minutos)));
  const restoMinimo = ORDEN_ROLES.map((_, i) => minimos.slice(i).reduce((s, m) => s + m, 0));
  const huevosDe = ORDEN_ROLES.map((rol) => new Map(opciones[rol].map((o) => [o, preparacionesDeHuevo(o, catalogo)])));

  const elegidas: OpcionRol[] = [];
  let pasos = 0;
  const buscar = (i: number, acumulado: number, huevos: number, limitarHuevo: boolean, tope: number): boolean => {
    if (i === ORDEN_ROLES.length) return true;
    for (const op of opciones[ORDEN_ROLES[i]]) {
      if (++pasos > 50000) return false;
      const resto = i + 1 < ORDEN_ROLES.length ? restoMinimo[i + 1] : 0;
      if (acumulado + op.minutos + resto > tope) continue;
      const conHuevo = huevos + (huevosDe[i].get(op) ?? 0);
      if (limitarHuevo && conHuevo > MAX_PREPARACIONES_HUEVO) continue;
      elegidas[i] = op;
      if (buscar(i + 1, acumulado + op.minutos, conHuevo, limitarHuevo, tope)) return true;
    }
    return false;
  };
  const intentar = (limitarHuevo: boolean, tope: number) => {
    pasos = 0;
    return buscar(0, 0, 0, limitarHuevo, tope);
  };

  let encontrado = intentar(true, presupuesto);
  // No cabe en el tiempo con la regla del huevo: se busca el menú que menos se pase, y solo después se cede la regla.
  const minimoPosible = Math.max(presupuesto, restoMinimo[0]);
  let porHuevo = false;
  for (let tope = minimoPosible; !encontrado && tope <= minimoPosible + EXCESO_MAXIMO_POR_HUEVO; tope += 5) {
    encontrado = intentar(true, tope);
    // Si sin la regla sí cabría en el tiempo, el exceso se debe a la regla.
    if (encontrado && tope > presupuesto) {
      const seleccionConRegla = [...elegidas];
      porHuevo = intentar(false, presupuesto);
      elegidas.splice(0, elegidas.length, ...seleccionConRegla);
    }
  }
  if (!encontrado) encontrado = intentar(false, presupuesto) || intentar(false, restoMinimo[0]);
  const seleccion = encontrado
    ? [...elegidas]
    : // Último recurso: la opción más rápida de cada rol, y se informa el exceso.
      ORDEN_ROLES.map((rol) => opciones[rol].reduce((m, o) => (o.minutos < m.minutos ? o : m)));
  return { ok: true, menu: armar(seleccion, semilla, prefs.minutos, porHuevo) };
}

function armar(seleccion: OpcionRol[], semilla: number, minutosElegidos: number, excedePorHuevo = false): Menu {
  const porRol = {} as Record<Rol, OpcionRol>;
  ORDEN_ROLES.forEach((rol, i) => { porRol[rol] = seleccion[i]; });
  const minutos = seleccion.reduce((s, o) => s + o.minutos, 0) + MINUTOS_ORGANIZACION;
  const excede = Math.max(0, minutos - minutosElegidos);
  return { semilla, porRol, minutos, excede, ...(excede > 0 && excedePorHuevo ? { excedePorHuevo: true } : {}) };
}

/**
 * Cambia un componente por otra opción compatible del mismo grupo, manteniendo el resto.
 * Devuelve null si no hay alternativas que quepan en el tiempo.
 */
export function cambiarComponente(
  menu: Menu,
  prefs: PreferenciasCocina,
  catalogo: Componente[],
  rol: Rol,
  idActual: string,
): Menu | null {
  const opciones = opcionesPorRol(prefs, catalogo, menu.semilla)[rol];
  const actual = menu.porRol[rol];
  const otros = actual.elecciones.filter((e) => e.id !== idActual).map((e) => e.id);
  const sinRol = menu.minutos - actual.minutos;
  const limite = Math.max(prefs.minutos, menu.minutos);
  const posibles = opciones.filter((o) => {
    const ids = o.elecciones.map((e) => e.id);
    if (ids.includes(idActual)) return false;
    if (!otros.every((id) => ids.includes(id))) return false;
    return sinRol + o.minutos <= limite;
  });
  if (posibles.length === 0) return null;
  // La misma regla del huevo que al generar el menú; si ninguna alternativa la cumple, al menos no se suma más huevo,
  // y solo si tampoco hay de esas se cede del todo.
  const huevosOtros = ORDEN_ROLES.filter((r) => r !== rol).reduce((s, r) => s + preparacionesDeHuevo(menu.porRol[r], catalogo), 0);
  const conRegla = posibles.filter((o) => huevosOtros + preparacionesDeHuevo(o, catalogo) <= MAX_PREPARACIONES_HUEVO);
  const sinHuevoPropio = posibles.filter((o) => preparacionesDeHuevo(o, catalogo) === 0);
  const candidatas = conRegla.length > 0 ? conRegla : sinHuevoPropio.length > 0 ? sinHuevoPropio : posibles;
  // Rota entre alternativas: toma la primera que viene después de la actual en el orden de la semana.
  const pos = opciones.findIndex((o) => claveOpcion(o) === claveOpcion(actual));
  const siguiente = candidatas.find((o) => opciones.indexOf(o) > pos) ?? candidatas[0];
  const nuevas = ORDEN_ROLES.map((r) => (r === rol ? siguiente : menu.porRol[r]));
  // Si el menú excedía por la regla del huevo y la alternativa la sigue cumpliendo, la causa se conserva.
  return armar(nuevas, menu.semilla, prefs.minutos, menu.excedePorHuevo === true && conRegla.includes(siguiente));
}

/** Menú válido para el catálogo actual (los ids siguen existiendo). */
const esObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Si un menú guardado tiene la forma esperada y solo usa componentes que siguen en el catálogo. */
export function menuVigente(menu: unknown, catalogo: Componente[]): menu is Menu {
  if (!esObj(menu) || typeof menu.semilla !== 'number' || typeof menu.minutos !== 'number' || typeof menu.excede !== 'number' || !esObj(menu.porRol)) {
    return false;
  }
  const ids = new Set(catalogo.map((c) => c.id));
  const porRol = menu.porRol;
  return ORDEN_ROLES.every((r) => {
    const o = porRol[r];
    if (!esObj(o) || typeof o.minutos !== 'number' || !Array.isArray(o.elecciones) || !Array.isArray(o.dias)) return false;
    if (o.elecciones.length === 0 || o.dias.length !== DIAS) return false;
    const eleccionOk = (e: unknown) => esObj(e) && typeof e.id === 'string' && ids.has(e.id) && typeof e.doble === 'boolean';
    const diaOk = (d: unknown) => esObj(d) && typeof d.id === 'string' && ids.has(d.id) && typeof d.congelar === 'boolean';
    return o.elecciones.every(eleccionOk) && o.dias.every(diaOk);
  });
}

export type DiaMenu = { dia: number; comida: Record<Rol, Asignacion> };
export function diasDelMenu(menu: Menu): DiaMenu[] {
  return Array.from({ length: DIAS }, (_, i) => {
    const comida = {} as Record<Rol, Asignacion>;
    for (const rol of ORDEN_ROLES) comida[rol] = menu.porRol[rol].dias[i];
    return { dia: i + 1, comida };
  });
}

export type DiaComidas = {
  dia: number;
  desayuno: Asignacion;
  almuerzo: Record<RolPlato, Asignacion>;
  once: Asignacion;
  cena: Record<RolPlato, Asignacion>;
};

/**
 * Las cuatro comidas de cada día. El almuerzo usa lo que el reparto asignó al día. La cena usa el otro componente
 * elegido del mismo rol cuando ese día sigue apto (refrigerado o congelable), para no repetir el plato del almuerzo;
 * si no hay otro, repite el del almuerzo. Las cantidades no entran aquí: las fija el objetivo (ver porciones.ts).
 */
export function comidasDelDia(menu: Menu, catalogo: Componente[]): DiaComidas[] {
  const porId = new Map(catalogo.map((c) => [c.id, c]));
  return Array.from({ length: DIAS }, (_, i) => {
    const dia = i + 1;
    const almuerzo = {} as Record<RolPlato, Asignacion>;
    const cena = {} as Record<RolPlato, Asignacion>;
    for (const rol of ROLES_PLATO) {
      const op = menu.porRol[rol];
      const a = op.dias[i];
      almuerzo[rol] = a;
      const otro = op.elecciones
        .map((e) => porId.get(e.id))
        .find((c) => c && c.id !== a.id && (c.refrigeradorDias >= dia || c.congelable));
      cena[rol] = otro ? { id: otro.id, congelar: otro.refrigeradorDias < dia } : a;
    }
    return { dia, desayuno: menu.porRol.desayuno.dias[i], almuerzo, once: menu.porRol.once.dias[i], cena };
  });
}

/** Orden sugerido para la sesión: primero lo que más tiempo pasa solo en el horno o la olla. */
export function ordenSesion(menu: Menu, catalogo: Componente[]): { c: Componente; doble: boolean }[] {
  const items = ORDEN_ROLES.flatMap((r) => menu.porRol[r].elecciones)
    .map((e) => ({ c: catalogo.find((c) => c.id === e.id)!, doble: e.doble }))
    .filter((x) => x.c);
  return items.sort(
    (a, b) => b.c.minutosTotales - b.c.minutosActivos - (a.c.minutosTotales - a.c.minutosActivos) || a.c.id.localeCompare(b.c.id),
  );
}
