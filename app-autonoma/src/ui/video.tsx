import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';

/** Reproductor de clase. Sin dirección de video no muestra nada: la clase se lee. */
export function VideoClase({ url }: { url: string | null }) {
  if (!url) return null;
  return <Reproductor url={url} />;
}

function Reproductor({ url }: { url: string }) {
  const reproductor = useVideoPlayer(url);
  return (
    <View style={estilos.marco}>
      <VideoView player={reproductor} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" />
    </View>
  );
}

const estilos = StyleSheet.create({
  marco: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.m, overflow: 'hidden', backgroundColor: '#000' },
});
