import * as Clipboard from 'expo-clipboard';
import { useEffect, useMemo, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';
import type { EstadoApp } from '@/logic/estado';
import { codificarRespaldo, decodificarRespaldo, resumenAvance } from '@/logic/respaldo';
import { Boton, Pequeno } from '@/ui/kit';

const fechaCorta = (iso: string | null) => (iso ? iso.split('-').reverse().join('-') : null);

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

/** Copia al portapapeles y devuelve si de verdad se copió. En web no se confía en el módulo: su respaldo informa éxito aunque falle. */
async function copiar(texto: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      return false;
    }
  }
  try {
    return await Clipboard.setStringAsync(texto);
  } catch {
    return false;
  }
}

/** Muestra el código de respaldo del estado actual (siempre al día) y permite copiarlo. */
export function CrearRespaldo({ estado, alCrear }: { estado: EstadoApp; alCrear: () => void }) {
  const campo = useEstiloCampo();
  const [mostrar, setMostrar] = useState(false);
  const [copiado, setCopiado] = useState<'no' | 'si' | 'error'>('no');
  // Se deriva del estado para que nunca quede un código viejo en pantalla.
  const codigo = useMemo(() => (mostrar ? codificarRespaldo(estado) : null), [mostrar, estado]);
  useEffect(() => {
    setCopiado('no');
  }, [codigo]);
  if (!codigo) {
    return (
      <Boton
        titulo="Crear código de respaldo"
        variante="secundario"
        icono="key-outline"
        onPress={() => {
          alCrear();
          setMostrar(true);
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
        onPress={() => {
          copiar(codigo).then((ok) => setCopiado(ok ? 'si' : 'error'));
        }}
      />
      {copiado === 'error' ? (
        <Pequeno tono="alerta">No se pudo copiar automáticamente. Selecciona el código (manteniéndolo presionado en el teléfono) y cópialo.</Pequeno>
      ) : (
        <Pequeno>Si el botón no funciona, selecciona el código (manteniéndolo presionado en el teléfono) y cópialo.</Pequeno>
      )}
    </View>
  );
}

/**
 * Campo para pegar un código de respaldo y restaurarlo. Con `actual` compara el avance del código con el
 * de este dispositivo y pide confirmación; sin `actual` (pantalla de inicio, sin perfil) restaura directo.
 */
export function RestaurarRespaldo({ alRestaurar, actual }: { alRestaurar: (e: EstadoApp) => void; actual?: EstadoApp }) {
  const p = usePaleta();
  const campo = useEstiloCampo();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<EstadoApp | null>(null);
  const limpiar = () => {
    setTexto('');
    setError(null);
    setPendiente(null);
  };
  const revisar = () => {
    const e = decodificarRespaldo(texto);
    if (!e) {
      setError('El código no es válido o está incompleto. Revisa que lo hayas pegado entero, desde R90 hasta el final.');
      return;
    }
    setError(null);
    if (actual) setPendiente(e);
    else {
      limpiar();
      alRestaurar(e);
    }
  };
  const comparacion = pendiente && actual ? compararAvance(pendiente, actual) : null;
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
      {pendiente && comparacion ? (
        <>
          <Pequeno tono={comparacion.pierde ? 'alerta' : 'normal'}>{comparacion.texto}</Pequeno>
          <Boton
            titulo={comparacion.pierde ? 'Sí, reemplazar mi avance' : 'Sí, restaurar'}
            variante="peligro"
            onPress={() => {
              limpiar();
              alRestaurar(pendiente);
            }}
          />
          <Boton titulo="Cancelar" variante="secundario" onPress={() => setPendiente(null)} />
        </>
      ) : (
        <Boton titulo="Restaurar" variante="secundario" icono="key-outline" deshabilitado={texto.trim().length === 0} onPress={revisar} />
      )}
    </View>
  );
}

const describir = (r: ReturnType<typeof resumenAvance>) =>
  `${r.sesiones} ${r.sesiones === 1 ? 'sesión' : 'sesiones'}, ${r.clases} ${r.clases === 1 ? 'clase' : 'clases'} y ${r.caminatas} ${r.caminatas === 1 ? 'día' : 'días'} de caminata${r.ultima ? ` (última sesión o clase el ${fechaCorta(r.ultima)})` : ''}`;

/** Texto de confirmación que deja ver si el código es más antiguo que lo que hay en el dispositivo. */
export function compararAvance(codigo: EstadoApp, actual: EstadoApp): { texto: string; pierde: boolean } {
  const c = resumenAvance(codigo);
  const a = resumenAvance(actual);
  const creado = fechaCorta(codigo.respaldo.ultimo);
  const pierde = c.sesiones < a.sesiones || c.clases < a.clases || c.caminatas < a.caminatas || (a.ultima !== null && (c.ultima === null || c.ultima < a.ultima));
  const nombre = codigo.perfil?.nombre || 'sin nombre';
  const inicio = codigo.perfil ? fechaCorta(codigo.perfil.inicio) : null;
  const texto =
    `El código${creado ? `, creado el ${creado},` : ''} es de ${nombre}${inicio ? `, programa iniciado el ${inicio}` : ''}, y tiene ${describir(c)}. ` +
    `En este dispositivo llevas ${describir(a)}. ` +
    (pierde
      ? 'El código tiene menos avance que este dispositivo: si restauras, se pierde lo que hiciste después de crearlo. No se puede deshacer.'
      : 'Si restauras, se reemplaza todo lo que hay en este dispositivo. No se puede deshacer.');
  return { texto, pierde };
}
