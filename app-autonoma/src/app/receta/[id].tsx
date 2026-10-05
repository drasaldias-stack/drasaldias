import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { componentePorId } from '@/content/componentes';
import { formatearCantidad } from '@/logic/compras';
import { ORDEN_ROLES } from '@/logic/menu';
import { useApp } from '@/state/app-state';
import { TEXTO_EQUIPO } from '@/ui/editores';
import { Aviso, Chip, Etiqueta, Fila, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

export default function DetalleReceta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estado, menuActual } = useApp();
  const c = componentePorId(String(id));
  if (!c) {
    return (
      <Pantalla conBarra={false}>
        <Texto>No encontramos esta receta.</Texto>
      </Pantalla>
    );
  }
  const personas = estado.perfil?.cocina.personas ?? 1;
  const doble = menuActual?.ok
    ? ORDEN_ROLES.flatMap((r) => menuActual.menu.porRol[r].elecciones).some((e) => e.id === c.id && e.doble)
    : false;
  const factor = personas * (doble ? 2 : 1);
  const equipos = c.equipos
    .map((e) => (e === 'cocinilla' ? 'Cocinilla' : e === 'sin_coccion' ? 'Sin cocción' : TEXTO_EQUIPO[e]))
    .join(' o ');
  return (
    <Pantalla conBarra={false}>
      <Stack.Screen options={{ title: 'Receta' }} />
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>{equipos}</Etiqueta>
        <Titulo>{c.nombre}</Titulo>
        <Fila>
          <Chip texto={`${c.minutosActivos + (doble ? 5 : 0)} min activos`} tono="acento" />
          <Chip texto={`${c.minutosTotales} min en total`} />
          <Chip texto={`${c.porciones * (doble ? 2 : 1)} porciones por persona`} />
        </Fila>
      </View>
      <Tarjeta>
        <Subtitulo>Ingredientes para {personas} {personas === 1 ? 'persona' : 'personas'}</Subtitulo>
        {doble ? <Pequeno>Esta semana la receta va doble para cubrir los 5 días.</Pequeno> : null}
        {c.ingredientes.map((ing) => (
          <Fila key={ing.nombre} style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Texto style={{ flex: 1 }}>{ing.nombre}</Texto>
            <Texto tono="suave" style={{ fontVariant: ['tabular-nums'] }}>
              {ing.basico ? 'a gusto' : formatearCantidad(Math.round(ing.cantidad * factor * 10) / 10, ing.unidad)}
            </Texto>
          </Fila>
        ))}
      </Tarjeta>
      <Tarjeta>
        <Subtitulo>Preparación</Subtitulo>
        {c.pasos.map((paso, i) => (
          <Texto key={paso}>{`${i + 1}. ${paso}`}</Texto>
        ))}
      </Tarjeta>
      <Tarjeta>
        <Subtitulo>Cómo guardarlo</Subtitulo>
        <Texto>
          Refrigerado en recipiente cerrado, hasta {c.refrigeradorDias} días desde que lo cocinas.
          {c.congelable ? ' Se puede congelar en porciones el mismo día.' : ' No conviene congelarlo.'}
        </Texto>
        <Pequeno>Enfría rápido y refrigera dentro de las 2 horas. Recalienta hasta que esté bien caliente en el centro.</Pequeno>
      </Tarjeta>
      {c.nota ? (
        <Aviso>
          <Pequeno tono="normal">{c.nota}</Pequeno>
        </Aviso>
      ) : null}
    </Pantalla>
  );
}
