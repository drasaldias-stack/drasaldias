import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type ScrollView } from 'react-native';

import { Spacing } from '@/constants/theme';
import { AVISO_HIPOGLUCEMIA, CALENTAMIENTO, CONSEJOS_SESION, PROGRAMAS, SENALES_DETENERSE, VUELTA_CALMA } from '@/content/ejercicios';
import { usePaleta } from '@/hooks/use-paleta';
import { siguientePendiente } from '@/logic/avance';
import { claveSesion, resolverEjercicio, semanaVigente, sesionesDeSemana, vueltasDeSesion } from '@/logic/programa';
import { catalogoCompleto, CUIDADO_PROPIO, esSesionPropia, letraSesionPropia, sesionesPropias } from '@/logic/propio';
import { useApp } from '@/state/app-state';
import { accesoEjercicio } from '@/state/derivados';
import { Cronometro } from '@/ui/cronometro';
import { Aviso, Boton, Chip, Etiqueta, Fila, MARGEN_SUPERIOR_PANTALLA, Opciones, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';
import { MantenerPantalla } from '@/ui/mantener-pantalla';

export default function DetalleSesion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estado, semana, alternarSesion } = useApp();
  const p = usePaleta();
  const [vuelta, setVuelta] = useState(1);
  const [hechos, setHechos] = useState<Record<string, boolean>>({});
  // Para desplazar la pantalla al siguiente ejercicio al marcar uno como hecho: posición de cada bloque en la columna.
  const scrollRef = useRef<ScrollView>(null);
  const posiciones = useRef<Record<string, number>>({});
  const registrar = (clave: string) => (e: LayoutChangeEvent) => {
    posiciones.current[clave] = e.nativeEvent.layout.y;
  };
  const irA = (clave: string) => {
    // Un instante después, para que la posición ya refleje el estado nuevo (chip «Hecho», vuelta siguiente).
    setTimeout(() => {
      const y = posiciones.current[clave];
      if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y + MARGEN_SUPERIOR_PANTALLA - Spacing.s), animated: true });
    }, 60);
  };
  if (!estado.perfil) return <Redirect href="/bienvenida" />;
  const perfil = estado.perfil;
  const programa = PROGRAMAS[perfil.ejercicio.programa];
  const catalogo = catalogoCompleto(perfil.rutina);
  // La sesión puede ser del programa de la app o de la rutina propia (ids con prefijo).
  const propia = esSesionPropia(String(id));
  const sesion = (propia ? sesionesPropias(perfil.rutina, semana) : sesionesDeSemana(programa, semana)).find((s) => s.id === String(id));
  if (!sesion || !accesoEjercicio(perfil)) {
    return (
      <Pantalla conBarra={false}>
        <Texto>Esta sesión no está disponible.</Texto>
      </Pantalla>
    );
  }
  const vueltas = vueltasDeSesion(sesion, perfil.ejercicio.minutos);
  const clave = claveSesion(semana, sesion.id);
  const hecha = Boolean(estado.sesionesHechas[clave]);
  const claveItem = (i: number) => `${vuelta}-${i}`;
  const completadosEstaVuelta = sesion.items.filter((_, i) => hechos[claveItem(i)]).length;
  /** Marca o desmarca un ejercicio; al marcar, la pantalla pasa al siguiente pendiente, a la vuelta siguiente o a la vuelta a la calma. */
  const marcar = (i: number, listo: boolean) => {
    const nuevos = { ...hechos, [claveItem(i)]: !listo };
    setHechos(nuevos);
    if (listo) return;
    const siguiente = siguientePendiente(sesion.items.map((_, j) => Boolean(nuevos[claveItem(j)])), i);
    if (siguiente !== null) irA(`ejercicio-${siguiente}`);
    else if (vuelta < vueltas) {
      setVuelta(vuelta + 1);
      irA('vueltas');
    } else irA('calma');
  };
  const terminar = () => {
    alternarSesion(clave);
    // Al terminar, se vuelve a donde se abrió la sesión (Hoy o Ejercicio), que ya la muestra como hecha.
    if (!hecha) {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/ejercicio');
    }
  };

  return (
    <Pantalla conBarra={false} scrollRef={scrollRef}>
      <Stack.Screen options={{ title: propia ? `Mi rutina · sesión ${letraSesionPropia(perfil.rutina, sesion.id) ?? ''}` : `Sesión ${sesion.id}` }} />
      {/* La pantalla se usa con las manos ocupadas durante 10 a 30 minutos: no debe apagarse sola. */}
      <MantenerPantalla />
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>{propia ? (perfil.rutina?.nombre ?? 'Mi rutina') : programa.nombre} · semana {semanaVigente(semana)}</Etiqueta>
        <Titulo>{sesion.nombre}</Titulo>
        <Fila>
          {!propia ? <Chip texto={`${perfil.ejercicio.minutos} minutos`} tono="acento" /> : null}
          <Chip texto={`${vueltas} ${vueltas === 1 ? 'vuelta' : 'vueltas'}`} />
        </Fila>
      </View>

      <Tarjeta>
        <Etiqueta>Calentamiento</Etiqueta>
        <Texto>{CALENTAMIENTO}</Texto>
        <Pequeno>{CONSEJOS_SESION}</Pequeno>
        {propia ? <Pequeno>{CUIDADO_PROPIO}</Pequeno> : null}
      </Tarjeta>

      {perfil.seguridad.motivos.ejercicio.includes('insulina') ? (
        <Aviso tipo="alerta">
          <Pequeno tono="normal">{AVISO_HIPOGLUCEMIA}</Pequeno>
        </Aviso>
      ) : null}

      <View onLayout={registrar('vueltas')}>
        {vueltas > 1 ? (
          <Opciones<number>
            etiqueta={`Vuelta ${vuelta} de ${vueltas}`}
            ayuda="Haz los ejercicios en orden y repite la vuelta. Al marcar el último, la app pasa sola a la vuelta siguiente. Descansa 30 a 60 segundos entre ejercicios y 1 a 2 minutos entre vueltas."
            opciones={Array.from({ length: vueltas }, (_, i) => ({ valor: i + 1, texto: `Vuelta ${i + 1}` }))}
            valor={vuelta}
            onCambio={(v) => setVuelta(v as number)}
          />
        ) : (
          <Pequeno>Haz cada ejercicio una vez, en orden. Al marcar uno como hecho, la pantalla pasa al siguiente. Descansa 30 a 60 segundos entre ejercicios.</Pequeno>
        )}
      </View>

      {sesion.items.map((item, i) => {
        const ej = resolverEjercicio(item.ejercicio, perfil.ejercicio.materiales, catalogo);
        if (!ej) return null;
        const cambiado = ej.id !== item.ejercicio;
        const listo = Boolean(hechos[claveItem(i)]);
        return (
          <View key={`${item.ejercicio}-${i}`} onLayout={registrar(`ejercicio-${i}`)}>
            <Tarjeta style={listo ? { opacity: 0.8 } : undefined}>
              <Fila style={{ justifyContent: 'space-between' }}>
                <Etiqueta>Ejercicio {i + 1} de {sesion.items.length}</Etiqueta>
                {listo ? <Chip texto="Hecho" tono="ok" /> : null}
              </Fila>
              <Subtitulo>{ej.nombre}</Subtitulo>
              <Text style={[estilos.cantidad, { color: p.ink }]}>
                {item.cantidad} {item.unidad === 'reps' ? 'repeticiones' : 'segundos'}
              </Text>
              {item.unidad === 'seg' ? <Cronometro segundos={item.cantidad} /> : null}
              {cambiado ? <Pequeno>Adaptado a los materiales que tienes.</Pequeno> : null}
              {ej.instrucciones.map((t) => (
                <Texto key={t}>{`•  ${t}`}</Texto>
              ))}
              {ej.cuidado ? (
                // El cuidado es la indicación de seguridad del ejercicio: va con ícono y en tinta normal, no en gris.
                <Fila style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                  <Ionicons aria-hidden name="alert-circle-outline" size={20} color={p.warn} style={{ marginTop: 1 }} />
                  <Texto style={{ flex: 1 }}>{ej.cuidado}</Texto>
                </Fila>
              ) : null}
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: listo }}
                aria-checked={listo}
                onPress={() => marcar(i, listo)}
                style={({ pressed }) => [estilos.marcar, { borderColor: listo ? p.ok : p.line, backgroundColor: listo ? p.okBg : 'transparent', opacity: pressed ? 0.85 : 1 }]}>
                <Text style={[estilos.marcarTexto, { color: listo ? p.ok : p.accent }]}>{listo ? 'Hecho en esta vuelta' : 'Marcar como hecho'}</Text>
              </Pressable>
            </Tarjeta>
          </View>
        );
      })}

      {vueltas > 1 && completadosEstaVuelta === sesion.items.length && vuelta < vueltas ? (
        <Boton titulo={`Pasar a la vuelta ${vuelta + 1}`} onPress={() => { setVuelta(vuelta + 1); irA('vueltas'); }} />
      ) : null}

      <View onLayout={registrar('calma')}>
        <Tarjeta>
          <Etiqueta>Vuelta a la calma</Etiqueta>
          <Texto>{VUELTA_CALMA}</Texto>
        </Tarjeta>
      </View>

      <Aviso tipo="critico">
        <Pequeno tono="normal">{SENALES_DETENERSE}</Pequeno>
      </Aviso>

      <Boton
        titulo={hecha ? 'Marcar como no hecha' : 'Terminé esta sesión'}
        variante={hecha ? 'secundario' : 'primario'}
        icono={hecha ? undefined : 'checkmark-circle'}
        onPress={terminar}
      />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  cantidad: { fontSize: 22, lineHeight: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  marcar: { minHeight: 44, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.l },
  marcarTexto: { fontSize: 16, fontWeight: '700' },
});
