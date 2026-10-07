import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { AVISO_HIPOGLUCEMIA, CALENTAMIENTO, CONSEJOS_SESION, PROGRAMAS, SENALES_DETENERSE, VUELTA_CALMA } from '@/content/ejercicios';
import { usePaleta } from '@/hooks/use-paleta';
import { claveSesion, resolverEjercicio, semanaVigente, sesionesDeSemana, vueltasDeSesion } from '@/logic/programa';
import { catalogoCompleto, esSesionPropia, sesionesPropias } from '@/logic/propio';
import { useApp } from '@/state/app-state';
import { accesoEjercicio } from '@/state/derivados';
import { Cronometro } from '@/ui/cronometro';
import { Aviso, Boton, Chip, Etiqueta, Fila, Opciones, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';
import { MantenerPantalla } from '@/ui/mantener-pantalla';

export default function DetalleSesion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estado, semana, alternarSesion } = useApp();
  const p = usePaleta();
  const [vuelta, setVuelta] = useState(1);
  const [hechos, setHechos] = useState<Record<string, boolean>>({});
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

  return (
    <Pantalla conBarra={false}>
      <Stack.Screen options={{ title: propia ? `Mi rutina · sesión ${sesion.id.replace(/^mi-/, '')}` : `Sesión ${sesion.id}` }} />
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
      </Tarjeta>

      {perfil.seguridad.motivos.ejercicio.includes('insulina') ? (
        <Aviso tipo="alerta">
          <Pequeno tono="normal">{AVISO_HIPOGLUCEMIA}</Pequeno>
        </Aviso>
      ) : null}

      {vueltas > 1 ? (
        <Opciones<number>
          etiqueta={`Vuelta ${vuelta} de ${vueltas}`}
          ayuda="Haz los ejercicios en orden y repite la vuelta. Descansa 30 a 60 segundos entre ejercicios y 1 a 2 minutos entre vueltas."
          opciones={Array.from({ length: vueltas }, (_, i) => ({ valor: i + 1, texto: `Vuelta ${i + 1}` }))}
          valor={vuelta}
          onCambio={(v) => setVuelta(v as number)}
        />
      ) : (
        <Pequeno>Haz cada ejercicio una vez, en orden. Descansa 30 a 60 segundos entre ejercicios.</Pequeno>
      )}

      {sesion.items.map((item, i) => {
        const ej = resolverEjercicio(item.ejercicio, perfil.ejercicio.materiales, catalogo);
        if (!ej) return null;
        const cambiado = ej.id !== item.ejercicio;
        const listo = Boolean(hechos[claveItem(i)]);
        return (
          <Tarjeta key={`${item.ejercicio}-${i}`} style={listo ? { opacity: 0.75 } : undefined}>
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
            {ej.cuidado ? <Pequeno>{ej.cuidado}</Pequeno> : null}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: listo }}
              aria-checked={listo}
              onPress={() => setHechos((h) => ({ ...h, [claveItem(i)]: !listo }))}
              style={({ pressed }) => [estilos.marcar, { borderColor: listo ? p.ok : p.line, backgroundColor: listo ? p.okBg : 'transparent', opacity: pressed ? 0.85 : 1 }]}>
              <Text style={[estilos.marcarTexto, { color: listo ? p.ok : p.accent }]}>{listo ? 'Hecho en esta vuelta' : 'Marcar como hecho'}</Text>
            </Pressable>
          </Tarjeta>
        );
      })}

      {vueltas > 1 && completadosEstaVuelta === sesion.items.length && vuelta < vueltas ? (
        <Boton titulo={`Pasar a la vuelta ${vuelta + 1}`} onPress={() => setVuelta(vuelta + 1)} />
      ) : null}

      <Tarjeta>
        <Etiqueta>Vuelta a la calma</Etiqueta>
        <Texto>{VUELTA_CALMA}</Texto>
      </Tarjeta>

      <Aviso tipo="critico">
        <Pequeno tono="normal">{SENALES_DETENERSE}</Pequeno>
      </Aviso>

      <Boton
        titulo={hecha ? 'Marcar como no hecha' : 'Terminé esta sesión'}
        variante={hecha ? 'secundario' : 'primario'}
        icono={hecha ? undefined : 'checkmark-circle'}
        onPress={() => alternarSesion(clave)}
      />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  cantidad: { fontSize: 22, lineHeight: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  marcar: { minHeight: 44, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.l },
  marcarTexto: { fontSize: 16, fontWeight: '700' },
});
