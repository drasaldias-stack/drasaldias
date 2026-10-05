import Ionicons from '@expo/vector-icons/Ionicons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';
import { Pequeno } from '@/ui/kit';

/** Reproductor de clase. Mientras no exista el video, muestra un espacio que lo indica. */
export function VideoClase({ url }: { url: string | null }) {
  if (!url) return <SinVideo />;
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

function SinVideo() {
  const p = usePaleta();
  return (
    <View style={[estilos.marco, { backgroundColor: p.surface2, alignItems: 'center', justifyContent: 'center', gap: Spacing.s }]}>
      <Ionicons name="play-circle-outline" size={44} color={p.ink2} />
      <Pequeno>Video en producción. Mientras tanto, lee el resumen.</Pequeno>
    </View>
  );
}

const estilos = StyleSheet.create({
  marco: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.m, overflow: 'hidden', backgroundColor: '#000' },
});
