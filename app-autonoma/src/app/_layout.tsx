import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePaleta } from '@/hooks/use-paleta';
import { AppStateProvider, useApp } from '@/state/app-state';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const esquema = useColorScheme();
  const p = usePaleta();
  const base = esquema === 'dark' ? DarkTheme : DefaultTheme;
  const tema = {
    ...base,
    colors: { ...base.colors, primary: p.accent, background: p.bg, card: p.surface, text: p.ink, border: p.line },
  };
  return (
    <AppStateProvider>
      <ThemeProvider value={tema}>
        <StatusBar style={esquema === 'dark' ? 'light' : 'dark'} />
        <Navegacion />
      </ThemeProvider>
    </AppStateProvider>
  );
}

function Navegacion() {
  const { listo } = useApp();
  const p = usePaleta();
  useEffect(() => {
    if (listo) SplashScreen.hideAsync().catch(() => undefined);
  }, [listo]);
  if (!listo) return null;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: p.surface },
        headerTintColor: p.accent,
        headerTitleStyle: { color: p.ink },
        contentStyle: { backgroundColor: p.bg },
        headerBackTitle: 'Volver',
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="bienvenida" options={{ headerShown: false }} />
      <Stack.Screen name="clase/[id]" options={{ title: 'Clase' }} />
      <Stack.Screen name="sesion/[id]" options={{ title: 'Sesión de ejercicio' }} />
      <Stack.Screen name="receta/[id]" options={{ title: 'Receta' }} />
      <Stack.Screen name="compras" options={{ title: 'Lista de compras' }} />
    </Stack>
  );
}
