import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { AVISO_HIPOGLUCEMIA, SENALES_DETENERSE } from '@/content/ejercicios';
import { usePaleta } from '@/hooks/use-paleta';
import { SEMANAS_PROGRAMA, semanaVigente, vueltasDeSesion } from '@/logic/programa';
import { esRutinaPropia, RUTINA_PLANTILLA } from '@/logic/propio';
import { textosConfirmacion } from '@/logic/seguridad';
import { useApp } from '@/state/app-state';
import { accesoEjercicio, resumenSemana } from '@/state/derivados';
import { Aviso, Boton, Chip, Etiqueta, Fila, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';
import { AVISO_RUTINA, EditorRutina } from '@/ui/propio';

export default function Ejercicio() {
  const { estado, semana, actualizarPerfil } = useApp();
  const p = usePaleta();
  const perfil = estado.perfil!;
  const [editando, setEditando] = useState(false);
  if (!accesoEjercicio(perfil)) {
    const bloqueado = perfil.seguridad.ejercicio === 'bloqueado';
    return (
      <Pantalla>
        <Titulo>Ejercicio</Titulo>
        <Aviso tipo={bloqueado ? 'alerta' : 'info'}>
          <Texto>
            {bloqueado
              ? 'Por tus respuestas iniciales, los programas de ejercicio no están disponibles en esta app. Las clases y los menús sí.'
              : `Falta un paso: cuando ${textosConfirmacion(perfil.seguridad, 'ejercicio').pendiente}, márcalo en Perfil y esta sección se activa.`}
          </Texto>
        </Aviso>
        {!bloqueado ? <Boton titulo="Ir a Perfil" variante="secundario" onPress={() => router.push('/perfil')} /> : null}
      </Pantalla>
    );
  }

  const propia = esRutinaPropia(perfil);
  const sinRutina = propia && !perfil.rutina;
  const usarApp = () => actualizarPerfil({ ejercicio: { ...perfil.ejercicio, programa: 'desde_cero' } });

  if (propia && (editando || sinRutina)) {
    return (
      <Pantalla>
        <View style={{ gap: Spacing.s }}>
          <Etiqueta>Mi rutina</Etiqueta>
          <Titulo>{sinRutina ? 'Carga tu rutina' : 'Edita tu rutina'}</Titulo>
        </View>
        <Aviso tipo="info">
          <Pequeno tono="normal">{AVISO_RUTINA}</Pequeno>
        </Aviso>
        <EditorRutina
          inicial={perfil.rutina ?? RUTINA_PLANTILLA}
          onGuardar={(r) => {
            actualizarPerfil({ rutina: r });
            setEditando(false);
          }}
          onCancelar={sinRutina ? undefined : () => setEditando(false)}
        />
        {sinRutina ? <Boton titulo="Prefiero un programa de Ruta 90" variante="secundario" onPress={usarApp} /> : null}
      </Pantalla>
    );
  }

  const { programa, sesiones, caminata, diasCaminata } = resumenSemana(estado, semana);
  const sv = semanaVigente(semana);
  const bloque = Math.ceil(sv / 3);
  return (
    <Pantalla>
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>{propia ? `Semana ${sv} de ${SEMANAS_PROGRAMA} · tu rutina` : `Semana ${sv} de ${SEMANAS_PROGRAMA} · bloque ${bloque} de 4`}</Etiqueta>
        <Titulo>{programa.nombre}</Titulo>
        <Texto tono="suave">{programa.paraQuien}</Texto>
        {!propia ? (
          <Fila>
            <Chip texto={`${perfil.ejercicio.minutos} min por sesión`} tono="acento" />
            <Chip texto={`${vueltasDeSesion(sesiones[0]?.sesion ?? { id: '', nombre: '', items: [] }, perfil.ejercicio.minutos)} ${perfil.ejercicio.minutos === 10 ? 'vuelta' : 'vueltas'}`} />
          </Fila>
        ) : null}
      </View>

      <Subtitulo>Sesiones de esta semana</Subtitulo>
      {sesiones.map(({ sesion, hecha }) => {
        const vueltas = vueltasDeSesion(sesion, perfil.ejercicio.minutos);
        return (
          <Tarjeta key={sesion.id} onPress={() => router.push(`/sesion/${sesion.id}`)} accesible={`Sesión ${sesion.id}: ${sesion.nombre}${hecha ? ', hecha' : ''}`}>
            <Fila style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <View style={{ flex: 1, gap: Spacing.xs }}>
                <Etiqueta>Sesión {sesion.id}</Etiqueta>
                <Subtitulo>{sesion.nombre}</Subtitulo>
                <Pequeno>
                  {sesion.items.length} {sesion.items.length === 1 ? 'ejercicio' : 'ejercicios'} · {vueltas} {vueltas === 1 ? 'vuelta' : 'vueltas'}
                </Pequeno>
              </View>
              <Ionicons aria-hidden name={hecha ? 'checkmark-circle' : 'chevron-forward'} size={26} color={hecha ? p.ok : p.ink2} />
            </Fila>
          </Tarjeta>
        );
      })}
      <Pequeno>{propia ? 'Deja al menos un día entre sesiones de fuerza.' : 'Deja al menos un día entre sesiones de fuerza. Cada 3 semanas los ejercicios suben de nivel.'}</Pequeno>

      {caminata ? (
        <Tarjeta>
          <Fila>
            <Ionicons aria-hidden name="walk-outline" size={22} color={p.accent} />
            <Subtitulo>Caminata de la semana</Subtitulo>
          </Fila>
          <Texto>{caminata.minutosDia} minutos, {caminata.dias} días por semana.</Texto>
          <Pequeno>{caminata.texto}</Pequeno>
          <Pequeno>Llevas {diasCaminata} {diasCaminata === 1 ? 'día' : 'días'}. Regístralos en Hoy.</Pequeno>
        </Tarjeta>
      ) : null}

      {propia && perfil.rutina?.notas ? (
        <Aviso tipo="info">
          <Pequeno tono="normal">{perfil.rutina.notas}</Pequeno>
        </Aviso>
      ) : null}
      {perfil.seguridad.motivos.ejercicio.includes('insulina') ? (
        <Aviso tipo="alerta">
          <Pequeno tono="normal">{AVISO_HIPOGLUCEMIA}</Pequeno>
        </Aviso>
      ) : null}
      <Aviso tipo="critico">
        <Pequeno tono="normal">{SENALES_DETENERSE}</Pequeno>
      </Aviso>
      {propia ? (
        <>
          <Boton titulo="Editar mi rutina" variante="secundario" icono="create-outline" onPress={() => setEditando(true)} />
          <Boton titulo="Usar un programa de Ruta 90" variante="secundario" onPress={usarApp} />
        </>
      ) : (
        <>
          <Boton titulo="Cambiar ejercicio" variante="secundario" onPress={() => router.push('/perfil')} />
          <Boton
            titulo="Usar mi propia rutina"
            variante="secundario"
            icono="create-outline"
            onPress={() => actualizarPerfil({ ejercicio: { ...perfil.ejercicio, programa: 'propio' } })}
          />
        </>
      )}
    </Pantalla>
  );
}
