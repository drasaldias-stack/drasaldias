import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { CALENTAMIENTO, EJERCICIOS, SENALES_DETENERSE, VUELTA_CALMA } from '@/content/ejercicios';
import { claveSesion, resolverEjercicio, semanaVigente, sesionesDeSemana, vueltasPorMinutos } from '@/logic/programa';
import { useApp } from '@/state/app-state';
import { accesoEjercicio } from '@/state/derivados';
import { PROGRAMAS } from '@/content/ejercicios';
import { Aviso, Boton, Chip, Etiqueta, Fila, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

export default function DetalleSesion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estado, semana, alternarSesion } = useApp();
  const perfil = estado.perfil!;
  const programa = PROGRAMAS[perfil.ejercicio.programa];
  const sesion = sesionesDeSemana(programa, semana).find((s) => s.id === String(id));
  if (!sesion || !accesoEjercicio(perfil)) {
    return (
      <Pantalla conBarra={false}>
        <Texto>Esta sesión no está disponible.</Texto>
      </Pantalla>
    );
  }
  const vueltas = vueltasPorMinutos(perfil.ejercicio.minutos);
  const clave = claveSesion(semana, sesion.id);
  const hecha = Boolean(estado.sesionesHechas[clave]);
  return (
    <Pantalla conBarra={false}>
      <Stack.Screen options={{ title: `Sesión ${sesion.id}` }} />
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>{programa.nombre} · semana {semanaVigente(semana)}</Etiqueta>
        <Titulo>{sesion.nombre}</Titulo>
        <Fila>
          <Chip texto={`${perfil.ejercicio.minutos} minutos`} tono="acento" />
          <Chip texto={`Repite ${vueltas} ${vueltas === 1 ? 'vuelta' : 'vueltas'}`} />
        </Fila>
      </View>

      <Tarjeta>
        <Etiqueta>Calentamiento</Etiqueta>
        <Texto>{CALENTAMIENTO}</Texto>
      </Tarjeta>

      <Subtitulo>
        {vueltas === 1 ? 'Haz cada ejercicio una vez, en orden' : `Haz los ejercicios en orden y repite la vuelta ${vueltas} veces`}
      </Subtitulo>
      <Pequeno>Descansa 30 a 60 segundos entre ejercicios y 1 a 2 minutos entre vueltas.</Pequeno>
      {sesion.items.map((item, i) => {
        const ej = resolverEjercicio(item.ejercicio, perfil.ejercicio.materiales, EJERCICIOS);
        if (!ej) return null;
        const cambiado = ej.id !== item.ejercicio;
        return (
          <Tarjeta key={`${item.ejercicio}-${i}`}>
            <Fila style={{ justifyContent: 'space-between' }}>
              <Etiqueta>Ejercicio {i + 1}</Etiqueta>
              <Chip texto={item.unidad === 'reps' ? `${item.cantidad} repeticiones` : `${item.cantidad} segundos`} tono="acento" />
            </Fila>
            <Subtitulo>{ej.nombre}</Subtitulo>
            {cambiado ? <Pequeno>Adaptado a los materiales que tienes.</Pequeno> : null}
            {ej.instrucciones.map((t) => (
              <Texto key={t}>{`•  ${t}`}</Texto>
            ))}
            <Pequeno>{ej.cuidado}</Pequeno>
          </Tarjeta>
        );
      })}

      <Tarjeta>
        <Etiqueta>Vuelta a la calma</Etiqueta>
        <Texto>{VUELTA_CALMA}</Texto>
      </Tarjeta>

      <Aviso tipo="alerta">
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
