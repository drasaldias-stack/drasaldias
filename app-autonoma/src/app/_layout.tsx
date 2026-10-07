import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, Pressable } from 'react-native';

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
  useEffect(() => {
    // La interfaz es solo en español; en web el documento debe declararlo para los lectores de pantalla.
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = 'es';
  }, []);
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
        // El botón de volver del encabezado web mide 30 px; aquí se reemplaza por uno de 44 px con etiqueta en español.
        headerLeft: Platform.OS === 'web' ? () => <BotonVolver color={p.accent} /> : undefined,
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="bienvenida" options={{ headerShown: false }} />
      <Stack.Screen name="clase/[id]" options={{ title: 'Clase' }} />
      <Stack.Screen name="sesion/[id]" options={{ title: 'Sesión de ejercicio' }} />
      <Stack.Screen name="receta/[id]" options={{ title: 'Receta' }} />
      <Stack.Screen name="compras" options={{ title: 'Lista de compras' }} />
      <Stack.Screen name="pauta" options={{ title: 'Mi pauta' }} />
    </Stack>
  );
}

function BotonVolver({ color }: { color: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
      <Ionicons aria-hidden name="chevron-back" size={28} color={color} />
    </Pressable>
  );
}
