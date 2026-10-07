import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { AVISO_HIPOGLUCEMIA, SENALES_DETENERSE } from '@/content/ejercicios';
import { usePaleta } from '@/hooks/use-paleta';
import { SEMANAS_PROGRAMA, semanaVigente, vueltasDeSesion, vueltasPorMinutos } from '@/logic/programa';
import { avisoVolumen, letraSesionPropia, RUTINA_PLANTILLA } from '@/logic/propio';
import { textosConfirmacion } from '@/logic/seguridad';
import type { Sesion } from '@/logic/tipos';
import { useApp } from '@/state/app-state';
import { accesoEjercicio, accesoMenu, resumenSemana } from '@/state/derivados';
import { Aviso, Boton, Chip, Etiqueta, Fila, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';
import { AVISO_RUTINA, AVISO_RUTINA_CARGA, EditorRutina } from '@/ui/propio';

export default function Ejercicio() {
  const { estado, semana, guardarRutina } = useApp();
  const p = usePaleta();
  const perfil = estado.perfil!;
  const [editando, setEditando] = useState(false);
  const [confirmarQuitar, setConfirmarQuitar] = useState(false);
  if (!accesoEjercicio(perfil)) {
    const bloqueado = perfil.seguridad.ejercicio === 'bloqueado';
    return (
      <Pantalla>
        <Titulo>Ejercicio</Titulo>
        <Aviso tipo={bloqueado ? 'alerta' : 'info'}>
          <Texto>
            {bloqueado
              ? `Por tus respuestas iniciales, los programas de ejercicio no están disponibles en esta app. ${accesoMenu(perfil) ? 'Las clases y los menús sí.' : 'Las clases sí.'}`
              : `Falta un paso: cuando ${textosConfirmacion(perfil.seguridad, 'ejercicio').pendiente}, márcalo en Perfil y esta sección se activa.`}
          </Texto>
        </Aviso>
        {!bloqueado ? <Boton titulo="Ir a Perfil" variante="secundario" onPress={() => router.push('/perfil')} /> : null}
        {perfil.rutina ? (
          <Tarjeta>
            <Texto>Tienes guardada una rutina propia ({perfil.rutina.nombre}). No se muestra mientras el ejercicio esté desactivado o pendiente.</Texto>
            {confirmarQuitar ? (
              <>
                <Pequeno tono="alerta">Se borra tu rutina guardada y sus marcas de este dispositivo. No se puede deshacer.</Pequeno>
                <Boton titulo="Sí, quitar mi rutina guardada" variante="peligro" onPress={() => { guardarRutina(null); setConfirmarQuitar(false); }} />
                <Boton titulo="Cancelar" variante="secundario" onPress={() => setConfirmarQuitar(false)} />
              </>
            ) : (
              <Boton titulo="Quitar mi rutina guardada" variante="secundario" onPress={() => setConfirmarQuitar(true)} />
            )}
          </Tarjeta>
        ) : null}
      </Pantalla>
    );
  }

  const rutina = perfil.rutina;
  if (editando) {
    return (
      <Pantalla>
        <View style={{ gap: Spacing.s }}>
          <Etiqueta>Además de tu programa</Etiqueta>
          <Titulo>{rutina ? 'Edita tu rutina' : 'Agrega tu rutina'}</Titulo>
        </View>
        <Aviso tipo="info">
          <Pequeno tono="normal">{AVISO_RUTINA}</Pequeno>
          <Pequeno tono="normal">{AVISO_RUTINA_CARGA}</Pequeno>
        </Aviso>
        <EditorRutina
          inicial={rutina ?? RUTINA_PLANTILLA}
          onGuardar={(r) => {
            guardarRutina(r);
            setEditando(false);
          }}
          onCancelar={() => setEditando(false)}
        />
      </Pantalla>
    );
  }

  const { programa, sesiones, caminata, diasCaminata, propias } = resumenSemana(estado, semana);
  const sv = semanaVigente(semana);
  const bloque = Math.ceil(sv / 3);
  const vueltas = vueltasPorMinutos(perfil.ejercicio.minutos);
  const tarjetaSesion = (sesion: Sesion, hecha: boolean, etiqueta: string) => {
    const v = vueltasDeSesion(sesion, perfil.ejercicio.minutos);
    return (
      <Tarjeta key={sesion.id} onPress={() => router.push(`/sesion/${sesion.id}`)} accesible={`${etiqueta}: ${sesion.nombre}${hecha ? ', hecha' : ''}`}>
        <Fila style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <Etiqueta>{etiqueta}</Etiqueta>
            <Subtitulo>{sesion.nombre}</Subtitulo>
            <Pequeno>
              {sesion.items.length} {sesion.items.length === 1 ? 'ejercicio' : 'ejercicios'} · {v} {v === 1 ? 'vuelta' : 'vueltas'}
            </Pequeno>
          </View>
          <Ionicons aria-hidden name={hecha ? 'checkmark-circle' : 'chevron-forward'} size={26} color={hecha ? p.ok : p.ink2} />
        </Fila>
      </Tarjeta>
    );
  };

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
      {sesiones.map(({ sesion, hecha }) => tarjetaSesion(sesion, hecha, `Sesión ${sesion.id}`))}
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

      <View style={{ gap: Spacing.s }}>
        <Etiqueta>Además de tu programa</Etiqueta>
        <Subtitulo>{rutina ? rutina.nombre : 'Mi propia rutina'}</Subtitulo>
      </View>
      {rutina ? (
        <>
          {propias.map(({ sesion, hecha }) => tarjetaSesion(sesion, hecha, `Mi rutina · sesión ${letraSesionPropia(rutina, sesion.id) ?? ''}`))}
          {avisoVolumen(sesiones.length, rutina) ? <Pequeno>{avisoVolumen(sesiones.length, rutina)}</Pequeno> : null}
          {rutina.notas ? (
            <Tarjeta>
              <Etiqueta>Tus notas</Etiqueta>
              <Texto>{rutina.notas}</Texto>
            </Tarjeta>
          ) : null}
          <Boton titulo="Editar mi rutina" variante="secundario" icono="create-outline" onPress={() => setEditando(true)} />
          {confirmarQuitar ? (
            <>
              <Pequeno tono="alerta">Se borra tu rutina y sus marcas de este dispositivo. Tu programa de Ruta 90 no cambia. No se puede deshacer.</Pequeno>
              <Boton
                titulo="Sí, quitar mi rutina"
                variante="peligro"
                onPress={() => {
                  guardarRutina(null);
                  setConfirmarQuitar(false);
                }}
              />
              <Boton titulo="Cancelar" variante="secundario" onPress={() => setConfirmarQuitar(false)} />
            </>
          ) : (
            <Boton titulo="Quitar mi rutina" variante="secundario" onPress={() => setConfirmarQuitar(true)} />
          )}
        </>
      ) : (
        <Tarjeta>
          <Texto>Si tienes una rutina del gimnasio, de tu kinesiólogo o armada por ti, puedes agregarla aquí y marcar sus sesiones como las del programa.</Texto>
          <Boton titulo="Agregar mi rutina" variante="secundario" icono="create-outline" onPress={() => setEditando(true)} />
        </Tarjeta>
      )}

      {perfil.seguridad.motivos.ejercicio.includes('insulina') ? (
        <Aviso tipo="alerta">
          <Pequeno tono="normal">{AVISO_HIPOGLUCEMIA}</Pequeno>
        </Aviso>
      ) : null}
      <Aviso tipo="critico">
        <Pequeno tono="normal">{SENALES_DETENERSE}</Pequeno>
      </Aviso>
      <Boton titulo="Cambiar programa" variante="secundario" onPress={() => router.push('/perfil')} />
    </Pantalla>
  );
}
