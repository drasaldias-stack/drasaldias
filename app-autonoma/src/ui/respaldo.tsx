import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';
import type { EstadoApp } from '@/logic/estado';
import { codificarRespaldo, decodificarRespaldo } from '@/logic/respaldo';
import { Boton, Pequeno } from '@/ui/kit';

const fechaCorta = (iso: string) => iso.split('-').reverse().join('-');

function useEstiloCampo() {
  const p = usePaleta();
  return {
    borderWidth: 1,
    borderColor: p.line,
    borderRadius: 6,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
    color: p.ink,
    backgroundColor: p.surface,
    minHeight: 120,
    textAlignVertical: 'top' as const,
  };
}

/** Muestra el código de respaldo del estado actual y permite copiarlo. */
export function CrearRespaldo({ estado }: { estado: EstadoApp }) {
  const campo = useEstiloCampo();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<'no' | 'si' | 'error'>('no');
  if (!codigo) {
    return (
      <Boton
        titulo="Crear código de respaldo"
        variante="secundario"
        icono="key-outline"
        onPress={() => {
          setCodigo(codificarRespaldo(estado));
          setCopiado('no');
        }}
      />
    );
  }
  return (
    <View style={{ gap: Spacing.s }}>
      <TextInput value={codigo} editable={false} multiline selectTextOnFocus accessibilityLabel="Código de respaldo" style={campo} />
      <Boton
        titulo={copiado === 'si' ? 'Copiado' : 'Copiar código'}
        icono={copiado === 'si' ? 'checkmark' : 'copy-outline'}
        onPress={() =>
          Clipboard.setStringAsync(codigo)
            .then((ok) => setCopiado(ok ? 'si' : 'error'))
            .catch(() => setCopiado('error'))
        }
      />
      {copiado === 'error' ? (
        <Pequeno tono="alerta">No se pudo copiar automáticamente. Mantén presionado el código para seleccionarlo y copiarlo.</Pequeno>
      ) : null}
      <Pequeno>
        Guárdalo donde puedas encontrarlo (por ejemplo, envíatelo por correo o por mensaje). El código contiene tus respuestas de seguridad y tu
        avance: cualquiera que lo tenga puede verlos.
      </Pequeno>
    </View>
  );
}

/** Campo para pegar un código de respaldo y restaurarlo, con confirmación opcional. */
export function RestaurarRespaldo({ alRestaurar, confirmar }: { alRestaurar: (e: EstadoApp) => void; confirmar?: boolean }) {
  const p = usePaleta();
  const campo = useEstiloCampo();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<EstadoApp | null>(null);
  const revisar = () => {
    const e = decodificarRespaldo(texto);
    if (!e) {
      setError('El código no es válido o está incompleto. Revisa que lo hayas pegado entero, desde R90 hasta el final.');
      return;
    }
    setError(null);
    if (confirmar) setPendiente(e);
    else alRestaurar(e);
  };
  return (
    <View style={{ gap: Spacing.s }}>
      <TextInput
        value={texto}
        onChangeText={(t) => {
          setTexto(t);
          setError(null);
          setPendiente(null);
        }}
        multiline
        placeholder="Pega aquí tu código de respaldo"
        placeholderTextColor={p.ink2}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Código de respaldo para restaurar"
        style={campo}
      />
      {error ? <Pequeno tono="alerta">{error}</Pequeno> : null}
      {pendiente ? (
        <>
          <Pequeno tono="alerta">
            Se reemplazarán tus respuestas, preferencias y avances actuales por los del código
            {pendiente.perfil ? ` (${pendiente.perfil.nombre || 'sin nombre'}, programa iniciado el ${fechaCorta(pendiente.perfil.inicio)})` : ''}. No se puede
            deshacer.
          </Pequeno>
          <Boton titulo="Sí, restaurar" variante="peligro" onPress={() => alRestaurar(pendiente)} />
          <Boton titulo="Cancelar" variante="secundario" onPress={() => setPendiente(null)} />
        </>
      ) : (
        <Boton titulo="Restaurar" variante="secundario" icono="cloud-download-outline" deshabilitado={texto.trim().length === 0} onPress={revisar} />
      )}
    </View>
  );
}
