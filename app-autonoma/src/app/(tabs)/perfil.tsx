import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';
import { useApp } from '@/state/app-state';
import { EditorEjercicio } from '@/ui/editores';
import { Aviso, Boton, Etiqueta, FilaCheck, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

export default function Perfil() {
  const { estado, semana, actualizarPerfil, reiniciarPrograma, borrarTodo } = useApp();
  const p = usePaleta();
  const perfil = estado.perfil!;
  const [confirmarReinicio, setConfirmarReinicio] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const seg = perfil.seguridad;

  return (
    <Pantalla>
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>Semana {Math.min(semana, 12)} · desde el {perfil.inicio.split('-').reverse().join('-')}</Etiqueta>
        <Titulo>Perfil</Titulo>
      </View>

      <Tarjeta>
        <Subtitulo>Tu nombre</Subtitulo>
        <TextInput
          value={perfil.nombre}
          onChangeText={(t) => actualizarPerfil({ nombre: t })}
          placeholder="Opcional"
          placeholderTextColor={p.ink2}
          accessibilityLabel="Tu nombre"
          style={{ borderWidth: 1, borderColor: p.line, borderRadius: 6, padding: 12, fontSize: 16, color: p.ink, backgroundColor: p.surface }}
        />
      </Tarjeta>

      <Tarjeta>
        <Subtitulo>Seguridad</Subtitulo>
        {seg.mensajes.length === 0 ? (
          <Texto>Tus respuestas iniciales no mostraron restricciones.</Texto>
        ) : (
          seg.mensajes.map((m) => (
            <Aviso key={m} tipo="alerta">
              <Pequeno tono="normal">{m}</Pequeno>
            </Aviso>
          ))
        )}
        {seg.ejercicio === 'requiere_confirmacion' ? (
          <FilaCheck
            texto="Un médico me autorizó a hacer ejercicio"
            marcado={perfil.confirmaEjercicio}
            onPress={() => actualizarPerfil({ confirmaEjercicio: !perfil.confirmaEjercicio })}
          />
        ) : null}
        {seg.alimentacion === 'requiere_confirmacion' ? (
          <FilaCheck
            texto="Hablé con mi médico sobre cambiar mi alimentación y mis medicamentos"
            marcado={perfil.confirmaAlimentacion}
            onPress={() => actualizarPerfil({ confirmaAlimentacion: !perfil.confirmaAlimentacion })}
          />
        ) : null}
        <Boton titulo="Volver a responder las preguntas" variante="secundario" onPress={() => router.push('/bienvenida')} />
      </Tarjeta>

      {seg.ejercicio !== 'bloqueado' ? (
        <Tarjeta>
          <Subtitulo>Ejercicio</Subtitulo>
          <EditorEjercicio valor={perfil.ejercicio} onCambio={(e) => actualizarPerfil({ ejercicio: e })} />
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <Subtitulo>Tu programa</Subtitulo>
        <Texto>Reiniciar vuelve a la semana 1 y borra las sesiones, clases y caminatas marcadas. Tus preferencias se mantienen.</Texto>
        {confirmarReinicio ? (
          <>
            <Boton titulo="Sí, reiniciar el programa" variante="peligro" onPress={() => { reiniciarPrograma(); setConfirmarReinicio(false); }} />
            <Boton titulo="Cancelar" variante="secundario" onPress={() => setConfirmarReinicio(false)} />
          </>
        ) : (
          <Boton titulo="Reiniciar el programa" variante="secundario" onPress={() => setConfirmarReinicio(true)} />
        )}
      </Tarjeta>

      <Tarjeta>
        <Subtitulo>Privacidad</Subtitulo>
        <Texto>Tus respuestas, preferencias y avances se guardan solo en este teléfono. La app no tiene cuentas ni envía tus datos a un servidor.</Texto>
        {confirmarBorrado ? (
          <>
            <Boton
              titulo="Sí, borrar todo"
              variante="peligro"
              onPress={() => {
                borrarTodo();
                router.replace('/bienvenida');
              }}
            />
            <Boton titulo="Cancelar" variante="secundario" onPress={() => setConfirmarBorrado(false)} />
          </>
        ) : (
          <Boton titulo="Borrar mis datos" variante="secundario" onPress={() => setConfirmarBorrado(true)} />
        )}
      </Tarjeta>

      <Pequeno>
        Ruta 90 entrega educación general sobre alimentación y actividad física. No diagnostica ni trata enfermedades y no reemplaza la atención de un profesional de la salud.
      </Pequeno>
    </Pantalla>
  );
}
