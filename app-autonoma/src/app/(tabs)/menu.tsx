import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { COMPONENTES, componentePorId } from '@/content/componentes';
import { usePaleta } from '@/hooks/use-paleta';
import { cambiarComponente, diasDelMenu, MINUTOS_ORGANIZACION, ordenSesion } from '@/logic/menu';
import { PAUTA_PLANTILLA } from '@/logic/propio';
import { textosConfirmacion } from '@/logic/seguridad';
import type { FuenteMenu, Rol } from '@/logic/tipos';
import { useApp } from '@/state/app-state';
import { accesoMenu } from '@/state/derivados';
import { EditorCocina, TEXTO_EQUIPO, TEXTO_EXCLUSION } from '@/ui/editores';
import { Aviso, Boton, Chip, Etiqueta, Fila, Opciones, Pantalla, Pequeno, Separador, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';
import { AVISO_PAUTA, EditorPauta, textoOrigen, VistaPauta } from '@/ui/propio';

const NOMBRE_ROL: Record<Rol, string> = {
  proteina: 'Proteína',
  carbohidrato: 'Cereal, legumbre o tubérculo',
  verdura: 'Verduras',
  salsa: 'Aliño o salsa',
  desayuno: 'Desayuno',
};
const DIAS = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5'];

export default function MenuSemana() {
  const { estado, menuActual, actualizarCocina, actualizarPerfil, nuevaCombinacion, reemplazarMenu } = useApp();
  const p = usePaleta();
  const perfil = estado.perfil!;
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [sinAlternativa, setSinAlternativa] = useState<string | null>(null);
  const [editandoPauta, setEditandoPauta] = useState(false);
  const prefs = perfil.cocina;

  if (!accesoMenu(perfil)) {
    return (
      <Pantalla>
        <Titulo>Menú</Titulo>
        <Aviso tipo="alerta">
          <Texto>
            {perfil.seguridad.alimentacion === 'bloqueado'
              ? 'Por tus respuestas iniciales, los menús no están disponibles en esta app. Te recomendamos la orientación de un profesional.'
              : `Falta un paso: cuando ${textosConfirmacion(perfil.seguridad, 'alimentacion').pendiente}, márcalo en Perfil y esta sección se activa.`}
          </Texto>
        </Aviso>
      </Pantalla>
    );
  }

  const selectorFuente = (
    <Tarjeta>
      <Opciones<FuenteMenu>
        etiqueta="¿Qué quieres usar?"
        ayuda="El menú de Ruta 90 se arma con tus filtros. Tu pauta es la que te entregó tu nutricionista o la que armaste tú."
        opciones={[{ valor: 'app', texto: 'Menú de Ruta 90' }, { valor: 'propia', texto: 'Mi pauta' }]}
        valor={prefs.fuente}
        onCambio={(v) => actualizarCocina({ ...prefs, fuente: v as FuenteMenu })}
      />
    </Tarjeta>
  );

  if (prefs.fuente === 'propia') {
    const pauta = perfil.pauta;
    return (
      <Pantalla>
        <View style={{ gap: Spacing.s }}>
          <Etiqueta>{pauta ? textoOrigen(pauta) : 'Alimentación'}</Etiqueta>
          <Titulo>{pauta ? pauta.titulo : 'Mi pauta'}</Titulo>
        </View>
        {selectorFuente}
        <Aviso tipo="info">
          <Pequeno tono="normal">{AVISO_PAUTA}</Pequeno>
        </Aviso>
        {!pauta || editandoPauta ? (
          <EditorPauta
            inicial={pauta ?? PAUTA_PLANTILLA}
            onGuardar={(nueva) => {
              actualizarPerfil({ pauta: nueva });
              setEditandoPauta(false);
            }}
            onCancelar={pauta ? () => setEditandoPauta(false) : undefined}
          />
        ) : (
          <>
            <VistaPauta pauta={pauta} />
            <Boton titulo="Editar mi pauta" variante="secundario" icono="create-outline" onPress={() => setEditandoPauta(true)} />
          </>
        )}
      </Pantalla>
    );
  }

  const resumenFiltros = [
    `${prefs.minutos} min`,
    `${prefs.personas} ${prefs.personas === 1 ? 'persona' : 'personas'}`,
    prefs.patron === 'vegetariano' ? 'Vegetariano' : 'Como de todo',
    ...prefs.equipos.map((e) => TEXTO_EQUIPO[e]),
    ...prefs.exclusiones.map((e) => `Sin ${TEXTO_EXCLUSION[e].toLowerCase()}`),
  ];

  const cambiar = (rol: Rol, id: string) => {
    if (!menuActual?.ok) return;
    const nuevo = cambiarComponente(menuActual.menu, prefs, COMPONENTES, rol, id);
    if (nuevo) {
      setSinAlternativa(null);
      reemplazarMenu(nuevo);
    } else {
      setSinAlternativa(id);
    }
  };

  return (
    <Pantalla>
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>Cocina una vez, come 5 días</Etiqueta>
        <Titulo>Menú de la semana</Titulo>
      </View>

      {selectorFuente}

      <Tarjeta>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: filtrosAbiertos }}
          aria-expanded={filtrosAbiertos}
          onPress={() => setFiltrosAbiertos((v) => !v)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
          <Subtitulo>Tus filtros</Subtitulo>
          <Fila>
            <Texto tono="acento" style={{ fontWeight: '700' }}>{filtrosAbiertos ? 'Listo' : 'Cambiar'}</Texto>
            <Ionicons aria-hidden name={filtrosAbiertos ? 'chevron-up' : 'chevron-down'} size={18} color={p.accent} />
          </Fila>
        </Pressable>
        {filtrosAbiertos ? (
          <>
            <Pequeno>Los cambios se aplican al instante al menú de abajo.</Pequeno>
            <EditorCocina valor={prefs} onCambio={actualizarCocina} />
          </>
        ) : (
          <Fila>{resumenFiltros.map((t) => <Chip key={t} texto={t} />)}</Fila>
        )}
      </Tarjeta>

      {!menuActual?.ok ? (
        <Aviso tipo="alerta">
          <Texto>
            Con tus filtros no hay recetas suficientes de {NOMBRE_ROL[menuActual?.ok === false ? menuActual.rolSinOpciones : 'proteina'].toLowerCase()}. Quita alguna exclusión o suma equipamiento.
          </Texto>
        </Aviso>
      ) : (
        <>
          <Tarjeta>
            <Fila style={{ justifyContent: 'space-between' }}>
              <Subtitulo>Sesión de cocina</Subtitulo>
              <Chip texto={`${menuActual.menu.minutos} min`} tono={menuActual.menu.excede > 0 ? 'alerta' : 'ok'} />
            </Fila>
            <Pequeno>Minutos de trabajo activo, incluidos {MINUTOS_ORGANIZACION} para organizarte y limpiar. Lo que está en el horno o la olla avanza mientras preparas lo demás.</Pequeno>
            <Pequeno>
              Los días de refrigeración se cuentan desde que cocinas: cocina el día anterior al día 1 (por ejemplo, el domingo si empiezas el lunes). Si cocinas antes, congela también lo que comerás desde el cuarto día.
            </Pequeno>
            {menuActual.menu.excede > 0 ? (
              <Aviso tipo="alerta">
                <Pequeno tono="normal">
                  Con tu equipamiento y exclusiones, el menú más rápido toma {menuActual.menu.excede} minutos más de lo que elegiste.
                </Pequeno>
              </Aviso>
            ) : null}
            <Boton titulo="Otra combinación" variante="secundario" icono="refresh" onPress={nuevaCombinacion} />
          </Tarjeta>

          <Subtitulo>Qué cocinar, en este orden</Subtitulo>
          <Pequeno>Empieza por lo que pasa más tiempo solo en el horno o la olla.</Pequeno>
          {ordenSesion(menuActual.menu, COMPONENTES).map(({ c, doble }, i) => (
            <Tarjeta key={c.id}>
              <Fila style={{ justifyContent: 'space-between' }}>
                <Etiqueta>{`${i + 1}. ${NOMBRE_ROL[c.rol]}`}</Etiqueta>
                <Chip texto={`${c.minutosActivos + (doble ? 5 : 0)} min activos`} />
              </Fila>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Ver receta: ${c.nombre}`}
                onPress={() => router.push(`/receta/${c.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.s, minHeight: 44 }}>
                <Subtitulo style={{ textDecorationLine: 'underline', flex: 1 }}>{c.nombre}</Subtitulo>
                <Ionicons aria-hidden name="chevron-forward" size={22} color={p.ink2} />
              </Pressable>
              <Pequeno>
                {doble ? 'Se prepara en cantidad doble para cubrir los 5 días. ' : ''}Dura {c.refrigeradorDias} días refrigerado{c.congelable ? ' y se puede congelar' : ''}.
              </Pequeno>
              {sinAlternativa === c.id ? <Pequeno tono="alerta">No hay otra receta que calce con tus filtros y tu tiempo. Quita alguna exclusión, suma equipamiento o elige más tiempo.</Pequeno> : null}
              <Fila>
                <Boton titulo="Otra receta" variante="secundario" icono="swap-horizontal" onPress={() => cambiar(c.rol, c.id)} />
              </Fila>
            </Tarjeta>
          ))}

          <Subtitulo>Tu semana</Subtitulo>
          <Pequeno>El día 1 es el primer día que comes del menú: si cocinas el domingo, el día 1 es el lunes.</Pequeno>
          {diasDelMenu(menuActual.menu).map(({ dia, comida }) => {
            const nombre = (id: string) => componentePorId(id)?.nombre ?? id;
            const principal = (['proteina', 'carbohidrato', 'verdura', 'salsa'] as Rol[]).map((r) => comida[r]);
            const congelados = [...principal, comida.desayuno].filter((a) => a.congelar);
            return (
              <Tarjeta key={dia}>
                <Etiqueta tono="acento">{DIAS[dia - 1]}</Etiqueta>
                <Texto style={{ fontWeight: '700' }}>Almuerzo o cena</Texto>
                <Texto>{principal.map((a) => nombre(a.id)).join(' + ')}</Texto>
                <Separador />
                <Texto style={{ fontWeight: '700' }}>Desayuno</Texto>
                <Texto>{nombre(comida.desayuno.id)}</Texto>
                {congelados.length > 0 ? (
                  <Fila style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                    <Ionicons aria-hidden name="snow-outline" size={18} color={p.accent} />
                    <Pequeno style={{ flex: 1 }}>
                      Congela el mismo día que cocinas y pásalo al refrigerador la noche anterior: {congelados.map((a) => nombre(a.id)).join(', ')}.
                    </Pequeno>
                  </Fila>
                ) : null}
              </Tarjeta>
            );
          })}
          <Pequeno>Arma el plato con la mitad de verduras, un cuarto de proteína y un cuarto de cereal, legumbre o tubérculo.</Pequeno>
          <Boton titulo="Ver lista de compras" icono="cart-outline" onPress={() => router.push('/compras')} />
        </>
      )}
    </Pantalla>
  );
}
