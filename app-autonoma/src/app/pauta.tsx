import { Redirect, router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { PAUTA_PLANTILLA } from '@/logic/propio';
import { useApp } from '@/state/app-state';
import { accesoMenu } from '@/state/derivados';
import { Aviso, Boton, Etiqueta, Pantalla, Pequeno, Texto, Titulo } from '@/ui/kit';
import { AVISO_PAUTA, EditorPauta, textoOrigen, VistaPauta } from '@/ui/propio';

/** La pauta propia o de la nutricionista, además del menú de la app. */
export default function Pauta() {
  const { estado, actualizarPerfil } = useApp();
  const [editando, setEditando] = useState(false);
  const [confirmarQuitar, setConfirmarQuitar] = useState(false);
  if (!estado.perfil) return <Redirect href="/bienvenida" />;
  const perfil = estado.perfil;
  if (!accesoMenu(perfil)) {
    return (
      <Pantalla conBarra={false}>
        <Stack.Screen options={{ title: 'Mi pauta' }} />
        <Texto>Esta sección no está disponible mientras los menús estén desactivados o pendientes de confirmación.</Texto>
      </Pantalla>
    );
  }
  const pauta = perfil.pauta;
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/menu'));
  return (
    <Pantalla conBarra={false}>
      <Stack.Screen options={{ title: 'Mi pauta' }} />
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>{pauta ? textoOrigen(pauta) : 'Además del menú de Ruta 90'}</Etiqueta>
        <Titulo>{pauta ? pauta.titulo : 'Agrega tu pauta'}</Titulo>
      </View>
      <Aviso tipo="info">
        <Pequeno tono="normal">{AVISO_PAUTA}</Pequeno>
      </Aviso>
      {!pauta || editando ? (
        <EditorPauta
          inicial={pauta ?? PAUTA_PLANTILLA}
          onGuardar={(nueva) => {
            actualizarPerfil({ pauta: nueva });
            setEditando(false);
            if (!pauta) volver();
          }}
          onCancelar={pauta ? () => setEditando(false) : volver}
        />
      ) : (
        <>
          <VistaPauta pauta={pauta} />
          <Boton titulo="Editar mi pauta" variante="secundario" icono="create-outline" onPress={() => setEditando(true)} />
          {confirmarQuitar ? (
            <>
              <Pequeno tono="alerta">Se borra la pauta de este dispositivo. El menú de Ruta 90 no cambia. No se puede deshacer.</Pequeno>
              <Boton
                titulo="Sí, quitar mi pauta"
                variante="peligro"
                onPress={() => {
                  actualizarPerfil({ pauta: null });
                  setConfirmarQuitar(false);
                  volver();
                }}
              />
              <Boton titulo="Cancelar" variante="secundario" onPress={() => setConfirmarQuitar(false)} />
            </>
          ) : (
            <Boton titulo="Quitar mi pauta" variante="secundario" onPress={() => setConfirmarQuitar(true)} />
          )}
        </>
      )}
    </Pantalla>
  );
}
