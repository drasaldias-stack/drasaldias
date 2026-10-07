import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, TextInput, View } from 'react-native';

import { URL_CONDICIONES, URL_PRIVACIDAD } from '@/constants/enlaces';
import { Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';
import { textosConfirmacion } from '@/logic/seguridad';
import { useApp } from '@/state/app-state';
import { EditorCocina, EditorEjercicio } from '@/ui/editores';
import { Aviso, Boton, Etiqueta, FilaCheck, Pantalla, Pequeno, Separador, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';
import { CrearRespaldo, RestaurarRespaldo } from '@/ui/respaldo';

export default function Perfil() {
  const { estado, semana, actualizarPerfil, actualizarCocina, reiniciarPrograma, borrarTodo, restaurarEstado, marcarRespaldo } = useApp();
  const p = usePaleta();
  const perfil = estado.perfil!;
  const [confirmarReinicio, setConfirmarReinicio] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const seg = perfil.seguridad;
  const abrir = (url: string) => () => Linking.openURL(url).catch(() => undefined);
  const urlPrivacidad = URL_PRIVACIDAD;
  const urlCondiciones = URL_CONDICIONES;

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
          style={{ borderWidth: 1, borderColor: p.line, borderRadius: 6, padding: 12, fontSize: 16, color: p.ink, backgroundColor: p.surface, minHeight: 46 }}
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
            texto={textosConfirmacion(seg, 'ejercicio').casilla}
            marcado={perfil.confirmaEjercicio}
            onPress={() => actualizarPerfil({ confirmaEjercicio: !perfil.confirmaEjercicio })}
          />
        ) : null}
        {seg.alimentacion === 'requiere_confirmacion' ? (
          <FilaCheck
            texto={textosConfirmacion(seg, 'alimentacion').casilla}
            marcado={perfil.confirmaAlimentacion}
            onPress={() => actualizarPerfil({ confirmaAlimentacion: !perfil.confirmaAlimentacion })}
          />
        ) : null}
        <Boton titulo="Responder de nuevo" variante="secundario" onPress={() => router.push({ pathname: '/bienvenida', params: { modo: 'seguridad' } })} />
        <Pequeno>Solo cambia tus respuestas de seguridad. No reinicia tu semana ni tus preferencias.</Pequeno>
      </Tarjeta>

      {seg.alimentacion !== 'bloqueado' ? (
        <Tarjeta>
          <Subtitulo>Cocina</Subtitulo>
          <Pequeno>Los cambios se aplican al instante al menú de la semana.</Pequeno>
          <EditorCocina valor={perfil.cocina} onCambio={actualizarCocina} />
        </Tarjeta>
      ) : null}

      {seg.ejercicio !== 'bloqueado' ? (
        <Tarjeta>
          <Subtitulo>Ejercicio</Subtitulo>
          <EditorEjercicio valor={perfil.ejercicio} onCambio={(e) => actualizarPerfil({ ejercicio: e })} />
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <Subtitulo>Copia de respaldo</Subtitulo>
        <Texto>
          Tu avance se guarda solo en este navegador o teléfono. Un código de respaldo guarda tus respuestas, tus preferencias y tu avance hasta el día en que lo creas; no se actualiza solo. Crea uno nuevo cada cierto tiempo, por ejemplo al terminar cada semana, y antes de cambiar de teléfono o de navegador.
        </Texto>
        <Aviso tipo="info">
          <Pequeno tono="normal">
            El código contiene información de salud (por ejemplo, si marcaste embarazo, diabetes con insulina o problemas con la comida), tu avance y, si las cargaste, tu pauta y tu rutina con todo lo que escribiste, incluido el enlace a tu documento. Guárdalo en un lugar privado, como las notas de tu teléfono o un correo que solo tú uses, y no lo compartas.
          </Pequeno>
        </Aviso>
        <Pequeno>{estado.respaldo.ultimo ? `Último código creado el ${estado.respaldo.ultimo.split('-').reverse().join('-')}.` : 'Todavía no has creado ningún código.'}</Pequeno>
        <CrearRespaldo estado={estado} alCrear={marcarRespaldo} />
        <Separador />
        <Subtitulo>Restaurar desde un código</Subtitulo>
        <Pequeno>Reemplaza lo que hay en este dispositivo por lo que tenía el código el día en que se creó.</Pequeno>
        <RestaurarRespaldo
          actual={estado}
          alRestaurar={(e) => {
            restaurarEstado(e);
            router.replace('/');
          }}
        />
      </Tarjeta>

      <Tarjeta>
        <Subtitulo>Tu programa</Subtitulo>
        <Texto>Reiniciar vuelve a la semana 1 y borra las sesiones, clases y caminatas marcadas. Tus preferencias se mantienen. No se puede deshacer.</Texto>
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
        <Texto>
          Tus respuestas, preferencias y avances se guardan solo en este dispositivo. La app no tiene cuentas ni envía esos datos a ningún servidor; por eso no se recuperan si cambias de teléfono o de navegador, salvo que uses un código de respaldo.
        </Texto>
        {urlPrivacidad ? <Boton titulo="Política de privacidad" variante="secundario" onPress={abrir(urlPrivacidad)} /> : null}
        {urlCondiciones ? <Boton titulo="Condiciones de uso" variante="secundario" onPress={abrir(urlCondiciones)} /> : null}
        {confirmarBorrado ? (
          <>
            <Pequeno tono="alerta">Se borrarán tus respuestas, preferencias y avances de este dispositivo. No se puede deshacer y volverás a la pantalla de inicio.</Pequeno>
            <Boton
              titulo="Sí, borrar todo y salir"
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
