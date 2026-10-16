import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ALIMENTOS } from '@/content/alimentos';
import { COMPONENTES, componentePorId } from '@/content/componentes';
import { nutricionPorPorcion, redondearKcal, redondearProteina } from '@/logic/nutricion';
import { NOMBRE_COMIDA } from '@/logic/objetivo';
import { cantidadPrincipal, consumoSemanal, porcionesEnMenu, textoCantidad, textoFactor } from '@/logic/porciones';
import { useApp } from '@/state/app-state';
import { TEXTO_EQUIPO } from '@/ui/editores';
import { Aviso, Chip, Etiqueta, Fila, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

const LECHE = 'Leche o bebida vegetal sin azúcar';

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
  const objetivo = estado.perfil.objetivo;
  const consumo = menuActual?.ok ? consumoSemanal(menuActual.menu, COMPONENTES, objetivo).get(c.id) : undefined;
  const enMenu = consumo !== undefined;
  const porcionesSemana = consumo ?? c.porciones;
  const factor = (personas * porcionesSemana) / c.porciones;
  const nutricion = nutricionPorPorcion(c);
  const enComidas = enMenu && objetivo && menuActual?.ok ? porcionesEnMenu(menuActual.menu, COMPONENTES, objetivo, c.id) : [];
  const conLeche = c.ingredientes.some((i) => i.nombre === LECHE);
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
      {enComidas.length > 0 ? (
        <Tarjeta>
          <Subtitulo>En tu menú</Subtitulo>
          {enComidas.map((e) => (
            <Texto key={`${e.comida}|${e.factor}`}>
              {NOMBRE_COMIDA[e.comida]}: {textoFactor(e.factor)}
              {c.rol !== 'verdura' && c.rol !== 'salsa' ? ` (${cantidadPrincipal(c, e.factor)})` : ''}
            </Texto>
          ))}
          <Pequeno>Una porción es la que describen los pasos de abajo; las cantidades en crudo son por persona.</Pequeno>
        </Tarjeta>
      ) : null}
      <Tarjeta>
        <Subtitulo>Ingredientes para {personas} {personas === 1 ? 'persona' : 'personas'}</Subtitulo>
        <Pequeno>
          {enMenu
            ? `Cantidades para ${textoFactor(porcionesSemana)} por persona: lo que el menú de esta semana come de esta receta en sus ${c.rol === 'desayuno' || c.rol === 'once' ? 'cinco días' : 'almuerzos y cenas'}. La receta base rinde ${c.porciones} porciones.`
            : `Cantidades de la receta base: ${c.porciones} porciones por persona.`}
        </Pequeno>
        {c.ingredientes.map((ing) => {
          const conEnergia = (ALIMENTOS[ing.nombre]?.kcal ?? 0) > 0;
          return (
            <Fila key={ing.nombre} style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <Texto style={{ flex: 1 }}>{ing.nombre}</Texto>
              <Texto tono="suave" style={{ fontVariant: ['tabular-nums'] }}>
                {ing.basico && !conEnergia ? 'a gusto' : textoCantidad(ing.cantidad * factor, ing.unidad)}
              </Texto>
            </Fila>
          );
        })}
        {c.ingredientes.some((i) => i.basico && (ALIMENTOS[i.nombre]?.kcal ?? 0) > 0) ? (
          <Pequeno>El aceite está contado en la energía de cada porción con la cantidad indicada; si usas más, la cuenta sube (unas 40 kcal por cucharadita).</Pequeno>
        ) : null}
        {conLeche ? <Pequeno>La energía y la proteína suponen leche de vaca. Con bebida de soya el resultado es parecido; con bebida de almendras la proteína es mucho menor.</Pequeno> : null}
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
