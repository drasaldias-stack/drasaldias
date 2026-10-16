import type { CategoriaCompra, Componente, Ingrediente } from './tipos';
import { ORDEN_ROLES, type Menu } from './menu';
import type { FormatoVenta } from '../content/formatos';

export const ORDEN_CATEGORIAS: CategoriaCompra[] = [
  'Verduras y frutas',
  'Carnes, pescados y huevos',
  'Legumbres, cereales y tubérculos',
  'Lácteos y alternativas',
  'Despensa',
];

export type ItemCompra = {
  clave: string;
  nombre: string;
  cantidad: number;
  unidad: Ingrediente['unidad'];
  categoria: CategoriaCompra;
  /** Envases sugeridos para cubrir la cantidad, cuando el producto tiene formatos de venta conocidos. */
  envases?: Envases;
};
/** Uno o más formatos del mismo producto, de mayor a menor (por ejemplo, 1 pote de 800 g y 1 de 120 g). */
export type Envases = { numero: number; formato: FormatoVenta }[];
/** Cada envase adicional «cuesta» esta fracción del contenido: así se prefiere 1 de 800 g y 1 de 120 g antes que 6 de 150 g. */
export const PENALIZACION_ENVASE = 0.1;
export type ListaCompras = {
  categorias: { categoria: CategoriaCompra; items: ItemCompra[] }[];
  /** Básicos de despensa que conviene revisar, sin cantidad. */
  basicos: string[];
};

function redondear(cantidad: number, unidad: Ingrediente['unidad']): number {
  if (unidad === 'g' || unidad === 'ml') {
    const paso = cantidad < 100 ? 10 : 50;
    return Math.ceil(cantidad / paso) * paso;
  }
  return Math.max(1, Math.ceil(cantidad - 1e-9));
}

/**
 * Lista de compras de la semana. `consumo` son las porciones base de cada componente que se comen en la semana
 * (ver consumoSemanal en porciones.ts): las cantidades de la receta, pensadas para `porciones`, se escalan a eso.
 */
export function listaCompras(
  menu: Menu,
  catalogo: Componente[],
  personas: number,
  consumo: Map<string, number>,
  formatos: Record<string, FormatoVenta[]> = {},
): ListaCompras {
  const suma = new Map<string, ItemCompra>();
  const basicos = new Set<string>();
  for (const rol of ORDEN_ROLES) {
    for (const e of menu.porRol[rol].elecciones) {
      const c = catalogo.find((x) => x.id === e.id);
      if (!c) continue;
      const porcionesSemana = consumo.get(c.id) ?? c.porciones * (e.doble ? 2 : 1);
      const factor = (personas * porcionesSemana) / c.porciones;
      for (const ing of c.ingredientes) {
        if (ing.basico) {
          basicos.add(ing.nombre);
          continue;
        }
        const clave = `${ing.categoria}|${ing.nombre}|${ing.unidad}`;
        const previo = suma.get(clave);
        const cantidad = (previo?.cantidad ?? 0) + ing.cantidad * factor;
        suma.set(clave, { clave, nombre: ing.nombre, unidad: ing.unidad, categoria: ing.categoria, cantidad });
      }
    }
  }
  const items = [...suma.values()].map((i) => {
    const cantidad = redondear(i.cantidad, i.unidad);
    const envases = sugerirEnvases(cantidad, i.unidad, formatos[i.nombre]);
    return envases ? { ...i, cantidad, envases } : { ...i, cantidad };
  });
  return {
    categorias: ORDEN_CATEGORIAS.map((categoria) => ({
      categoria,
      items: items.filter((i) => i.categoria === categoria).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    })).filter((g) => g.items.length > 0),
    basicos: [...basicos].sort((a, b) => a.localeCompare(b, 'es')),
  };
}

/** Gramos o mililitros que representa una cantidad en cucharadas; las demás unidades quedan igual. */
function enUnidadDeVenta(cantidad: number, unidad: Ingrediente['unidad']): { cantidad: number; unidad: FormatoVenta['unidad'] } | null {
  switch (unidad) {
    case 'g':
    case 'ml':
    case 'unidad':
      return { cantidad, unidad };
    case 'cda':
      return { cantidad: cantidad * 15, unidad: 'g' };
    case 'cdta':
      return { cantidad: cantidad * 5, unidad: 'g' };
    case 'diente':
      return null;
  }
}

/**
 * Elige con qué envases cubrir la cantidad: se comparan cada formato por sí solo y una combinación (los grandes
 * primero y el resto con el envase más chico que lo cubra), y gana la de menor contenido total, con cada envase
 * adicional penalizado para no proponer seis potes chicos donde cabe uno grande y uno chico.
 * Las cucharadas se convierten a gramos (15 g la cucharada, 5 g la cucharadita); para líquidos valen como mililitros.
 */
export function sugerirEnvases(cantidad: number, unidad: Ingrediente['unidad'], formatos?: FormatoVenta[]): Envases | null {
  if (!formatos?.length || cantidad <= 0) return null;
  const venta = enUnidadDeVenta(cantidad, unidad);
  if (!venta) return null;
  const cucharadas = unidad === 'cda' || unidad === 'cdta';
  // Una cucharada vale lo mismo en gramos que en mililitros para este fin.
  const utiles = formatos.filter((f) => f.unidad === venta.unidad || (cucharadas && f.unidad === 'ml')).sort((a, b) => b.tamano - a.tamano);
  if (utiles.length === 0) return null;
  const candidatos: Envases[] = utiles.map((formato) => [{ numero: Math.ceil(venta.cantidad / formato.tamano - 1e-9), formato }]);
  const mezcla: Envases = [];
  let resto = venta.cantidad;
  for (const formato of utiles) {
    const numero = Math.floor(resto / formato.tamano + 1e-9);
    if (numero > 0) {
      mezcla.push({ numero, formato });
      resto -= numero * formato.tamano;
    }
  }
  if (resto > 1e-9) {
    const chico = [...utiles].reverse().find((f) => f.tamano >= resto - 1e-9) ?? utiles[utiles.length - 1];
    const previo = mezcla.find((e) => e.formato === chico);
    if (previo) previo.numero += 1;
    else mezcla.push({ numero: 1, formato: chico });
    mezcla.sort((a, b) => b.formato.tamano - a.formato.tamano);
  }
  candidatos.push(mezcla);
  const costo = (e: Envases) => {
    const total = e.reduce((s, x) => s + x.numero * x.formato.tamano, 0);
    const envases = e.reduce((s, x) => s + x.numero, 0);
    return total * (1 + PENALIZACION_ENVASE * (envases - 1));
  };
  return candidatos.reduce((mejor, e) => (costo(e) < costo(mejor) - 1e-9 ? e : mejor));
}

export function textoEnvases(envases: Envases): string {
  return envases
    .map(({ numero, formato }, i) => {
      const n = numero.toLocaleString('es');
      const envase = numero === 1 ? formato.envase : plural(formato.envase);
      return `${n} ${i === 0 ? envase : ''}${i === 0 ? ' ' : ''}de ${formatearCantidad(formato.tamano, formato.unidad)}`;
    })
    .join(' y ');
}

function plural(envase: string): string {
  // «caja o lata» → «cajas o latas».
  return envase
    .split(' ')
    .map((p) => (p === 'o' || p === 'de' ? p : p + 's'))
    .join(' ');
}

export function formatearCantidad(cantidad: number, unidad: Ingrediente['unidad']): string {
  const n = (x: number) => x.toLocaleString('es', { maximumFractionDigits: 1 });
  switch (unidad) {
    case 'g':
      return cantidad >= 1000 ? `${n(cantidad / 1000)} kg` : `${n(cantidad)} g`;
    case 'ml':
      return cantidad >= 1000 ? `${n(cantidad / 1000)} l` : `${n(cantidad)} ml`;
    case 'unidad':
      return `${n(cantidad)} ${cantidad === 1 ? 'unidad' : 'unidades'}`;
    case 'diente':
      return `${n(cantidad)} ${cantidad === 1 ? 'diente' : 'dientes'}`;
    case 'cda':
      return `${n(cantidad)} cda`;
    case 'cdta':
      return `${n(cantidad)} cdta`;
  }
}
