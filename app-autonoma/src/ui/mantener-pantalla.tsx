import { useKeepAwake } from 'expo-keep-awake';
import { Platform } from 'react-native';

function Nativo() {
  useKeepAwake();
  return null;
}

/** Mantiene la pantalla encendida mientras el componente está montado. En web no hace nada. */
export function MantenerPantalla() {
  if (Platform.OS === 'web') return null;
  return <Nativo />;
}
