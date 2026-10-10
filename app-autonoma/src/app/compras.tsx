import { Redirect } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { COMPONENTES } from '@/content/componentes';
import { formatearCantidad, listaCompras } from '@/logic/compras';
import { consumoSemanal } from '@/logic/porciones';
import { useApp } from '@/state/app-state';
import { accesoMenu } from '@/state/derivados';
import { Boton, Etiqueta, FilaCheck, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

export default function Compras() {
  const { estado, semana, menuActual, alternarCompra, limpiarCompras } = useApp();
  const [confirmar, setConfirmar] = useState(false);
  if (!estado.perfil) return <Redirect href="/bienvenida" />;
  const perfil = estado.perfil;
  if (!accesoMenu(perfil) || !menuActual?.ok) {
    return (
      <Pantalla conBarra={false}>
        <Texto>No hay un menú activo para armar la lista de compras.</Texto>
      </Pantalla>
    );
  }
  const lista = listaCompras(menuActual.menu, COMPONENTES, perfil.cocina.personas, consumoSemanal(menuActual.menu, COMPONENTES, perfil.objetivo));
  const total = lista.categorias.reduce((s, c) => s + c.items.length, 0);
  const marcados = lista.categorias.flatMap((c) => c.items).filter((i) => estado.compras[`${semana}|${i.clave}`]).length;
  return (
    <Pantalla conBarra={false}>
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>
          {perfil.cocina.personas} {perfil.cocina.personas === 1 ? 'persona' : 'personas'} · 4 comidas · 5 días
        </Etiqueta>
        <Titulo>Lista de compras</Titulo>
        <Texto tono="suave">
          {marcados} de {total} productos marcados. Las cantidades están redondeadas hacia arriba
          {perfil.objetivo ? ' y escaladas a tu objetivo diario' : ''}.
        </Texto>
      </View>
      {lista.categorias.map((g) => (
        <Tarjeta key={g.categoria}>
          <Subtitulo>{g.categoria}</Subtitulo>
          <View>
            {g.items.map((i) => (
              <FilaCheck
                key={i.clave}
                texto={i.nombre}
                detalle={formatearCantidad(i.cantidad, i.unidad)}
                marcado={Boolean(estado.compras[`${semana}|${i.clave}`])}
                onPress={() => alternarCompra(`${semana}|${i.clave}`)}
              />
            ))}
          </View>
        </Tarjeta>
      ))}
      {lista.basicos.length > 0 ? (
        <Tarjeta>
          <Subtitulo>Revisa si tienes en la despensa</Subtitulo>
          <Pequeno tono="normal">{lista.basicos.join(', ')}.</Pequeno>
        </Tarjeta>
      ) : null}
      {marcados > 0 ? (
        confirmar ? (
          <>
            <Pequeno>¿Desmarcar los {marcados} productos de esta semana?</Pequeno>
            <Boton titulo="Sí, desmarcar" variante="peligro" onPress={() => { limpiarCompras(semana); setConfirmar(false); }} />
            <Boton titulo="Cancelar" variante="secundario" onPress={() => setConfirmar(false)} />
          </>
        ) : (
          <Boton titulo="Desmarcar todo" variante="secundario" onPress={() => setConfirmar(true)} />
        )
      ) : null}
    </Pantalla>
  );
}
