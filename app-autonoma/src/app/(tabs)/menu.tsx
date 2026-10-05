import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { COMPONENTES, componentePorId } from '@/content/componentes';
import { usePaleta } from '@/hooks/use-paleta';
import { cambiarComponente, diasDelMenu, MINUTOS_ORGANIZACION, ordenSesion } from '@/logic/menu';
import type { Rol } from '@/logic/tipos';
import { useApp } from '@/state/app-state';
import { accesoMenu } from '@/state/derivados';
import { EditorCocina, TEXTO_EQUIPO, TEXTO_EXCLUSION } from '@/ui/editores';
import { Aviso, Boton, Chip, Etiqueta, Fila, Pantalla, Pequeno, Separador, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

const NOMBRE_ROL: Record<Rol, string> = {
  proteina: 'Proteína',
  carbohidrato: 'Cereal, legumbre o tubérculo',
  verdura: 'Verduras',
  salsa: 'Aliño o salsa',
  desayuno: 'Desayuno',
};
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export default function MenuSemana() {
  const { estado, menuActual, actualizarCocina, nuevaCombinacion, reemplazarMenu } = useApp();
  const p = usePaleta();
  const perfil = estado.perfil!;
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [sinAlternativa, setSinAlternativa] = useState<string | null>(null);
  const prefs = perfil.cocina;

  if (!accesoMenu(perfil)) {
    return (
      <Pantalla>
        <Titulo>Menú</Titulo>
        <Aviso tipo="alerta">
          <Texto>
            {perfil.seguridad.alimentacion === 'bloqueado'
              ? 'Por tus respuestas iniciales, los menús no están disponibles en esta app. Te recomendamos la orientación de un profesional.'
              : 'Antes de usar los menús, habla con tu médico por los medicamentos que usas. Cuando lo hayas hecho, confírmalo en Perfil.'}
          </Texto>
        </Aviso>
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

      <Tarjeta>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: filtrosAbiertos }}
          onPress={() => setFiltrosAbiertos((v) => !v)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Subtitulo>Tus filtros</Subtitulo>
          <Fila>
            <Texto tono="acento" style={{ fontWeight: '700' }}>{filtrosAbiertos ? 'Listo' : 'Cambiar'}</Texto>
            <Ionicons name={filtrosAbiertos ? 'chevron-up' : 'chevron-down'} size={18} color={p.accent} />
          </Fila>
        </Pressable>
        {filtrosAbiertos ? (
          <EditorCocina valor={prefs} onCambio={actualizarCocina} />
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
              <Pressable accessibilityRole="link" onPress={() => router.push(`/receta/${c.id}`)}>
                <Subtitulo style={{ textDecorationLine: 'underline' }}>{c.nombre}</Subtitulo>
              </Pressable>
              <Pequeno>
                {doble ? 'Receta doble. ' : ''}Dura {c.refrigeradorDias} días refrigerado{c.congelable ? ' y se puede congelar' : ''}.
              </Pequeno>
              {sinAlternativa === c.id ? <Pequeno tono="alerta">No hay otra opción que calce con tus filtros y tu tiempo.</Pequeno> : null}
              <Fila>
                <Boton titulo="Cambiar" variante="secundario" icono="swap-horizontal" onPress={() => cambiar(c.rol, c.id)} />
              </Fila>
            </Tarjeta>
          ))}

          <Subtitulo>Tu semana</Subtitulo>
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
                    <Ionicons name="snow-outline" size={18} color={p.accent} />
                    <Pequeno style={{ flex: 1 }}>
                      Congela el día de la sesión y pasa al refrigerador la noche anterior: {congelados.map((a) => nombre(a.id)).join(', ')}.
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
