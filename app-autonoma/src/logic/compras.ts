import type { CategoriaCompra, Componente, Ingrediente } from './tipos';
import { ORDEN_ROLES, type Menu } from './menu';

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
};
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
export function listaCompras(menu: Menu, catalogo: Componente[], personas: number, consumo: Map<string, number>): ListaCompras {
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
  const items = [...suma.values()].map((i) => ({ ...i, cantidad: redondear(i.cantidad, i.unidad) }));
  return {
    categorias: ORDEN_CATEGORIAS.map((categoria) => ({
      categoria,
      items: items.filter((i) => i.categoria === categoria).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    })).filter((g) => g.items.length > 0),
    basicos: [...basicos].sort((a, b) => a.localeCompare(b, 'es')),
  };
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
