import type { Componente, EquipoReceta, PreferenciasCocina, Rol } from './tipos';

// Arma el menú semanal a partir de componentes aprobados. No genera recetas nuevas:
// solo elige y combina contenido revisado según tiempo, equipamiento, patrón y exclusiones.

export const DIAS = 5;
export const MINUTOS_ORGANIZACION = 10;
export const ORDEN_ROLES: Rol[] = ['proteina', 'carbohidrato', 'verdura', 'salsa', 'desayuno'];
const ROLES_PAR: Rol[] = ['proteina', 'carbohidrato', 'verdura'];

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

export function generarMenu(prefs: PreferenciasCocina, catalogo: Componente[], semilla: number): ResultadoMenu {
  const opciones = opcionesPorRol(prefs, catalogo, semilla);
  for (const rol of ORDEN_ROLES) if (opciones[rol].length === 0) return { ok: false, rolSinOpciones: rol };

  const presupuesto = prefs.minutos - MINUTOS_ORGANIZACION;
  const minimos = ORDEN_ROLES.map((rol) => Math.min(...opciones[rol].map((o) => o.minutos)));
  const restoMinimo = ORDEN_ROLES.map((_, i) => minimos.slice(i).reduce((s, m) => s + m, 0));

  const elegidas: OpcionRol[] = [];
  let pasos = 0;
  const buscar = (i: number, acumulado: number): boolean => {
    if (i === ORDEN_ROLES.length) return true;
    for (const op of opciones[ORDEN_ROLES[i]]) {
      if (++pasos > 50000) return false;
      const resto = i + 1 < ORDEN_ROLES.length ? restoMinimo[i + 1] : 0;
      if (acumulado + op.minutos + resto > presupuesto) continue;
      elegidas[i] = op;
      if (buscar(i + 1, acumulado + op.minutos)) return true;
    }
    return false;
  };

  let seleccion: OpcionRol[];
  if (buscar(0, 0)) {
    seleccion = elegidas;
  } else {
    // No cabe en el tiempo elegido: se entrega el menú más rápido posible y se informa el exceso.
    seleccion = ORDEN_ROLES.map((rol) => opciones[rol].reduce((m, o) => (o.minutos < m.minutos ? o : m)));
  }
  return { ok: true, menu: armar(seleccion, semilla, prefs.minutos) };
}

function armar(seleccion: OpcionRol[], semilla: number, minutosElegidos: number): Menu {
  const porRol = {} as Record<Rol, OpcionRol>;
  ORDEN_ROLES.forEach((rol, i) => { porRol[rol] = seleccion[i]; });
  const minutos = seleccion.reduce((s, o) => s + o.minutos, 0) + MINUTOS_ORGANIZACION;
  return { semilla, porRol, minutos, excede: Math.max(0, minutos - minutosElegidos) };
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
  const candidatas = opciones.filter((o) => {
    const ids = o.elecciones.map((e) => e.id);
    if (ids.includes(idActual)) return false;
    if (!otros.every((id) => ids.includes(id))) return false;
    return sinRol + o.minutos <= limite;
  });
  if (candidatas.length === 0) return null;
  // Rota entre alternativas: toma la primera que viene después de la actual en el orden de la semana.
  const pos = opciones.findIndex((o) => claveOpcion(o) === claveOpcion(actual));
  const siguiente = candidatas.find((o) => opciones.indexOf(o) > pos) ?? candidatas[0];
  const nuevas = ORDEN_ROLES.map((r) => (r === rol ? siguiente : menu.porRol[r]));
  return armar(nuevas, menu.semilla, prefs.minutos);
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

/** Orden sugerido para la sesión: primero lo que más tiempo pasa solo en el horno o la olla. */
export function ordenSesion(menu: Menu, catalogo: Componente[]): { c: Componente; doble: boolean }[] {
  const items = ORDEN_ROLES.flatMap((r) => menu.porRol[r].elecciones)
    .map((e) => ({ c: catalogo.find((c) => c.id === e.id)!, doble: e.doble }))
    .filter((x) => x.c);
  return items.sort(
    (a, b) => b.c.minutosTotales - b.c.minutosActivos - (a.c.minutosTotales - a.c.minutosActivos) || a.c.id.localeCompare(b.c.id),
  );
}
