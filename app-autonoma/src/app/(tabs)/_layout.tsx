import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import type { ColorValue } from 'react-native';

import { usePaleta } from '@/hooks/use-paleta';
import { useApp } from '@/state/app-state';
import type { NombreIcono } from '@/ui/kit';

const icono = (nombre: NombreIcono) =>
  function Icono({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={nombre} color={color} size={size} />;
  };

export default function TabsLayout() {
  const { estado } = useApp();
  const p = usePaleta();
  if (!estado.perfil) return <Redirect href="/bienvenida" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.ink2,
        tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.line },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Hoy', tabBarIcon: icono('today-outline') }} />
      <Tabs.Screen name="clases" options={{ title: 'Clases', tabBarIcon: icono('play-circle-outline') }} />
      <Tabs.Screen name="ejercicio" options={{ title: 'Ejercicio', tabBarIcon: icono('barbell-outline') }} />
      <Tabs.Screen name="menu" options={{ title: 'Menú', tabBarIcon: icono('restaurant-outline') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('person-circle-outline') }} />
    </Tabs>
  );
}
