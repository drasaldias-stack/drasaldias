import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { AVISO_HIPOGLUCEMIA, SENALES_DETENERSE } from '@/content/ejercicios';
import { usePaleta } from '@/hooks/use-paleta';
import { SEMANAS_PROGRAMA, semanaVigente, vueltasPorMinutos } from '@/logic/programa';
import { useApp } from '@/state/app-state';
import { accesoEjercicio, resumenSemana } from '@/state/derivados';
import { Aviso, Boton, Chip, Etiqueta, Fila, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

export default function Ejercicio() {
  const { estado, semana } = useApp();
  const p = usePaleta();
  const perfil = estado.perfil!;
  if (!accesoEjercicio(perfil)) {
    const bloqueado = perfil.seguridad.ejercicio === 'bloqueado';
    return (
      <Pantalla>
        <Titulo>Ejercicio</Titulo>
        <Aviso tipo={bloqueado ? 'alerta' : 'info'}>
          <Texto>
            {bloqueado
              ? 'Por tus respuestas iniciales, los programas de ejercicio no están disponibles en esta app. Las clases y los menús sí.'
              : 'Falta un paso: cuando un médico te autorice a hacer ejercicio, márcalo en Perfil y esta sección se activa.'}
          </Texto>
        </Aviso>
        {!bloqueado ? <Boton titulo="Ir a Perfil" variante="secundario" onPress={() => router.push('/perfil')} /> : null}
      </Pantalla>
    );
  }
  const { programa, sesiones, caminata, diasCaminata } = resumenSemana(estado, semana);
  const sv = semanaVigente(semana);
  const bloque = Math.ceil(sv / 3);
  const vueltas = vueltasPorMinutos(perfil.ejercicio.minutos);
  return (
    <Pantalla>
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>Semana {sv} de {SEMANAS_PROGRAMA} · bloque {bloque} de 4</Etiqueta>
        <Titulo>{programa.nombre}</Titulo>
        <Texto tono="suave">{programa.paraQuien}</Texto>
        <Fila>
          <Chip texto={`${perfil.ejercicio.minutos} min por sesión`} tono="acento" />
          <Chip texto={`${vueltas} ${vueltas === 1 ? 'vuelta' : 'vueltas'}`} />
        </Fila>
      </View>

      <Subtitulo>Sesiones de esta semana</Subtitulo>
      {sesiones.map(({ sesion, hecha }) => (
        <Tarjeta key={sesion.id} onPress={() => router.push(`/sesion/${sesion.id}`)} accesible={`Sesión ${sesion.id}: ${sesion.nombre}${hecha ? ', hecha' : ''}`}>
          <Fila style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <View style={{ flex: 1, gap: Spacing.xs }}>
              <Etiqueta>Sesión {sesion.id}</Etiqueta>
              <Subtitulo>{sesion.nombre}</Subtitulo>
              <Pequeno>{sesion.items.length} ejercicios</Pequeno>
            </View>
            <Ionicons aria-hidden name={hecha ? 'checkmark-circle' : 'chevron-forward'} size={26} color={hecha ? p.ok : p.ink2} />
          </Fila>
        </Tarjeta>
      ))}
      <Pequeno>Deja al menos un día entre sesiones de fuerza. Cada 3 semanas los ejercicios suben de nivel.</Pequeno>

      <Tarjeta>
        <Fila>
          <Ionicons aria-hidden name="walk-outline" size={22} color={p.accent} />
          <Subtitulo>Caminata de la semana</Subtitulo>
        </Fila>
        <Texto>{caminata.minutosDia} minutos, {caminata.dias} días por semana.</Texto>
        <Pequeno>{caminata.texto}</Pequeno>
        <Pequeno>Llevas {diasCaminata} {diasCaminata === 1 ? 'día' : 'días'}. Regístralos en Hoy.</Pequeno>
      </Tarjeta>

      {perfil.seguridad.motivos.ejercicio.includes('insulina') ? (
        <Aviso tipo="alerta">
          <Pequeno tono="normal">{AVISO_HIPOGLUCEMIA}</Pequeno>
        </Aviso>
      ) : null}
      <Aviso tipo="critico">
        <Pequeno tono="normal">{SENALES_DETENERSE}</Pequeno>
      </Aviso>
      <Boton titulo="Cambiar ejercicio" variante="secundario" onPress={() => router.push('/perfil')} />
    </Pantalla>
  );
}
