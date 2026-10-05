import { Redirect, router, Stack } from 'expo-router';

import { useApp } from '@/state/app-state';
import { Boton, Pantalla, Texto, Titulo } from '@/ui/kit';

export default function NoEncontrada() {
  const { estado } = useApp();
  if (!estado.perfil) return <Redirect href="/bienvenida" />;
  return (
    <Pantalla conBarra={false}>
      <Stack.Screen options={{ title: 'Página no encontrada' }} />
      <Titulo>Esta pantalla no existe</Titulo>
      <Texto>El enlace que abriste no corresponde a ninguna pantalla de Ruta 90.</Texto>
      <Boton titulo="Ir a Hoy" onPress={() => router.replace('/')} />
    </Pantalla>
  );
}
