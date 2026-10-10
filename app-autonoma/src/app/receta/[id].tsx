import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { COMPONENTES, componentePorId } from '@/content/componentes';
import { formatearCantidad } from '@/logic/compras';
import { nutricionPorPorcion, redondearKcal, redondearProteina } from '@/logic/nutricion';
import { consumoSemanal, textoFactor } from '@/logic/porciones';
import { useApp } from '@/state/app-state';
import { TEXTO_EQUIPO } from '@/ui/editores';
import { Aviso, Chip, Etiqueta, Fila, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

const redondear = (cantidad: number, unidad: string) => (unidad === 'g' || unidad === 'ml' ? Math.max(5, Math.round(cantidad / 5) * 5) : Math.round(cantidad * 10) / 10);

export default function DetalleReceta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estado, menuActual } = useApp();
  if (!estado.perfil) return <Redirect href="/bienvenida" />;
  const c = componentePorId(String(id));
  if (!c) {
    return (
      <Pantalla conBarra={false}>
        <Texto>No encontramos esta receta.</Texto>
      </Pantalla>
    );
  }
  const personas = estado.perfil.cocina.personas;
  const consumo = menuActual?.ok ? consumoSemanal(menuActual.menu, COMPONENTES, estado.perfil.objetivo).get(c.id) : undefined;
  const enMenu = consumo !== undefined;
  const porcionesSemana = consumo ?? c.porciones;
  const factor = (personas * porcionesSemana) / c.porciones;
  const nutricion = nutricionPorPorcion(c);
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
          <Chip texto={`${c.minutosActivos} min de trabajo`} tono="acento" />
          <Chip texto={`${c.minutosTotales} min en total para 1 persona`} />
          <Chip texto={`≈ ${redondearKcal(nutricion.kcal)} kcal · ${redondearProteina(nutricion.proteina)} g de proteína por porción`} />
        </Fila>
      </View>
      <Tarjeta>
        <Subtitulo>Ingredientes para {personas} {personas === 1 ? 'persona' : 'personas'}</Subtitulo>
        <Pequeno>
          {enMenu
            ? `Cantidades para ${textoFactor(porcionesSemana)} por persona: lo que el menú de esta semana come de esta receta en sus ${c.rol === 'desayuno' || c.rol === 'once' ? 'cinco días' : 'almuerzos y cenas'}. La receta base rinde ${c.porciones} porciones.`
            : `Cantidades de la receta base: ${c.porciones} porciones por persona.`}
        </Pequeno>
        {c.ingredientes.map((ing) => (
          <Fila key={ing.nombre} style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <Texto style={{ flex: 1 }}>{ing.nombre}</Texto>
            <Texto tono="suave" style={{ fontVariant: ['tabular-nums'] }}>
              {ing.basico ? 'a gusto' : formatearCantidad(redondear(ing.cantidad * factor, ing.unidad), ing.unidad)}
            </Texto>
          </Fila>
        ))}
      </Tarjeta>
      <Tarjeta>
        <Subtitulo>Preparación</Subtitulo>
        {c.pasos.map((paso, i) => (
          <Texto key={paso}>{`${i + 1}. ${paso}`}</Texto>
        ))}
        {factor > 1.2 ? (
          <Pequeno>
            Los tiempos de los pasos están pensados para la receta base de una persona. Con más cantidad, reparte en dos piezas, moldes o bandejas y guíate por el punto indicado (color o temperatura), no por el reloj.
          </Pequeno>
        ) : null}
      </Tarjeta>
      <Tarjeta>
        <Subtitulo>Cómo guardarlo</Subtitulo>
        {c.conservacion ? (
          <Texto>{c.conservacion}</Texto>
        ) : (
          <Texto>
            Refrigerado en recipiente cerrado, hasta {c.refrigeradorDias} días contados desde el día que lo cocinas.
            {c.congelable ? ' Se puede congelar en porciones el mismo día.' : ' No conviene congelarlo.'}
          </Texto>
        )}
        {c.frio ? (
          <Pequeno>Saca del refrigerador solo la porción que vas a comer y vuelve a tapar el resto enseguida.</Pequeno>
        ) : (
          <Pequeno>
            Enfría rápido y refrigera dentro de las 2 horas. Recalienta solo la porción que vas a comer, hasta que esté humeante en todo el centro, y no recalientes dos veces.
          </Pequeno>
        )}
      </Tarjeta>
      {c.nota ? (
        <Aviso>
          <Pequeno tono="normal">{c.nota}</Pequeno>
        </Aviso>
      ) : null}
      <Pequeno>Energía y proteína calculadas con valores de referencia de los ingredientes en crudo; son aproximadas.</Pequeno>
    </Pantalla>
  );
}
