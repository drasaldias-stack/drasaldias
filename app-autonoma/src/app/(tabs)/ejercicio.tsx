import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';
import { SEMANAS_PROGRAMA, semanaVigente, vueltasPorMinutos } from '@/logic/programa';
import { useApp } from '@/state/app-state';
import { accesoEjercicio, resumenSemana } from '@/state/derivados';
import { Aviso, Boton, Chip, Etiqueta, Fila, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';
import { SENALES_DETENERSE } from '@/content/ejercicios';

export default function Ejercicio() {
  const { estado, semana } = useApp();
  const p = usePaleta();
  const perfil = estado.perfil!;
  if (!accesoEjercicio(perfil)) {
    return (
      <Pantalla>
        <Titulo>Ejercicio</Titulo>
        <Aviso tipo="alerta">
          <Texto>
            {perfil.seguridad.ejercicio === 'bloqueado'
              ? 'Por tus respuestas iniciales, los programas de ejercicio no están disponibles en esta app.'
              : 'Necesitas autorización médica antes de empezar. Cuando la tengas, confírmala en Perfil.'}
          </Texto>
        </Aviso>
        {perfil.seguridad.ejercicio === 'requiere_confirmacion' ? (
          <Boton titulo="Ir a Perfil" variante="secundario" onPress={() => router.push('/perfil')} />
        ) : null}
      </Pantalla>
    );
  }
  const { programa, sesiones, caminata, diasCaminata } = resumenSemana(estado, semana);
  const sv = semanaVigente(semana);
  const bloque = Math.ceil(sv / 3);
  return (
    <Pantalla>
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>Semana {sv} de {SEMANAS_PROGRAMA} · bloque {bloque} de 4</Etiqueta>
        <Titulo>{programa.nombre}</Titulo>
        <Texto tono="suave">{programa.paraQuien}</Texto>
        <Fila>
          <Chip texto={`${perfil.ejercicio.minutos} min por sesión`} tono="acento" />
          <Chip texto={`${vueltasPorMinutos(perfil.ejercicio.minutos)} ${vueltasPorMinutos(perfil.ejercicio.minutos) === 1 ? 'vuelta' : 'vueltas'}`} />
        </Fila>
      </View>

      <Subtitulo>Sesiones de esta semana</Subtitulo>
      {sesiones.map(({ sesion, hecha }) => (
        <Tarjeta key={sesion.id} onPress={() => router.push(`/sesion/${sesion.id}`)} accesible={`Sesión ${sesion.id}: ${sesion.nombre}`}>
          <Fila style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: Spacing.xs }}>
              <Etiqueta>Sesión {sesion.id}</Etiqueta>
              <Subtitulo>{sesion.nombre}</Subtitulo>
              <Pequeno>{sesion.items.length} ejercicios</Pequeno>
            </View>
            <Ionicons name={hecha ? 'checkmark-circle' : 'chevron-forward'} size={26} color={hecha ? p.ok : p.ink2} />
          </Fila>
        </Tarjeta>
      ))}
      <Pequeno>Deja al menos un día entre sesiones de fuerza. Cada 3 semanas los ejercicios suben de nivel.</Pequeno>

      <Tarjeta>
        <Fila>
          <Ionicons name="walk-outline" size={22} color={p.accent} />
          <Subtitulo>Caminata de la semana</Subtitulo>
        </Fila>
        <Texto>{caminata.minutosDia} minutos, {caminata.dias} días por semana.</Texto>
        <Pequeno>{caminata.texto}</Pequeno>
        <Pequeno>Llevas {diasCaminata} {diasCaminata === 1 ? 'día' : 'días'}. Regístralos en Hoy.</Pequeno>
      </Tarjeta>

      <Aviso tipo="alerta">
        <Pequeno tono="normal">{SENALES_DETENERSE}</Pequeno>
      </Aviso>
      <Boton titulo="Cambiar programa, tiempo o materiales" variante="secundario" onPress={() => router.push('/perfil')} />
    </Pantalla>
  );
}
