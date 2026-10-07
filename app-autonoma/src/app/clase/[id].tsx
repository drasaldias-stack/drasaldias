import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { clasePorId } from '@/content/clases';
import { useApp } from '@/state/app-state';
import { Aviso, Boton, Etiqueta, Pantalla, Pequeno, Subtitulo, Texto, Titulo } from '@/ui/kit';
import { VideoClase } from '@/ui/video';

export default function DetalleClase() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estado, semana, alternarClase } = useApp();
  const clase = clasePorId(String(id));
  if (!estado.perfil) return <Redirect href="/bienvenida" />;
  if (!clase) {
    return (
      <Pantalla conBarra={false}>
        <Texto>No encontramos esta clase.</Texto>
      </Pantalla>
    );
  }
  const liberada = clase.semana <= semana;
  const vista = Boolean(estado.clasesVistas[clase.id]);
  return (
    <Pantalla conBarra={false}>
      <Stack.Screen options={{ title: `Clase ${clase.semana}` }} />
      {liberada ? (
        <>
          <VideoClase url={clase.videoUrl} />
          <View style={{ gap: Spacing.s }}>
            <Etiqueta>Semana {clase.semana} · {clase.minutos} min{clase.videoUrl ? '' : ' de lectura'}</Etiqueta>
            <Titulo>{clase.titulo}</Titulo>
            <Texto tono="suave">{clase.resumen}</Texto>
          </View>
          <View style={{ gap: Spacing.m }}>
            <Subtitulo>Lo principal</Subtitulo>
            {clase.puntos.map((pt) => (
              <Texto key={pt}>{`•  ${pt}`}</Texto>
            ))}
          </View>
          <Boton
            titulo={vista ? 'Marcar como no vista' : 'Marcar como vista'}
            variante={vista ? 'secundario' : 'primario'}
            icono={vista ? undefined : 'checkmark-circle'}
            onPress={() => alternarClase(clase.id)}
          />
          <Pequeno>Información general. Si tienes dudas sobre tu caso, consulta a tu equipo de salud.</Pequeno>
        </>
      ) : (
        <Aviso>
          <Texto>Esta clase se libera en la semana {clase.semana} de tu programa.</Texto>
        </Aviso>
      )}
    </Pantalla>
  );
}
