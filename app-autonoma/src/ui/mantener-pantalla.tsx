import { useKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { Platform } from 'react-native';

function Nativo() {
  useKeepAwake();
  return null;
}

/**
 * En web usa la API Screen Wake Lock del navegador cuando existe; si no, no hace nada.
 * El bloqueo se pierde al cambiar de pestaña o bloquear el teléfono, por eso se vuelve a pedir al volver.
 */
function Web() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof document === 'undefined' || !('wakeLock' in navigator)) return;
    let sentinela: WakeLockSentinel | null = null;
    let activo = true;
    const pedir = () => {
      if (!activo || document.visibilityState !== 'visible') return;
      navigator.wakeLock
        .request('screen')
        .then((s) => {
          if (activo) sentinela = s;
          else s.release().catch(() => undefined);
        })
        .catch(() => undefined);
    };
    pedir();
    document.addEventListener('visibilitychange', pedir);
    return () => {
      activo = false;
      document.removeEventListener('visibilitychange', pedir);
      sentinela?.release().catch(() => undefined);
    };
  }, []);
  return null;
}

/** Mantiene la pantalla encendida mientras el componente está montado. */
export function MantenerPantalla() {
  return Platform.OS === 'web' ? <Web /> : <Nativo />;
}
