import { Text, TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';
import { Pequeno } from '@/ui/kit';

/** Campo de texto con etiqueta visible y accesible. */
export function CampoTexto({
  etiqueta, valor, onCambio, multiline, placeholder, numerico, maxLength, ayuda, compacto,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  numerico?: boolean;
  maxLength?: number;
  ayuda?: string;
  /** Sin etiqueta visible (queda solo como etiqueta accesible), para filas compactas. */
  compacto?: boolean;
}) {
  const p = usePaleta();
  return (
    <View style={{ gap: Spacing.xs, flexGrow: 1 }}>
      {!compacto ? <Text style={{ fontSize: 15, fontWeight: '700', color: p.ink }}>{etiqueta}</Text> : null}
      {ayuda ? <Pequeno>{ayuda}</Pequeno> : null}
      <TextInput
        value={valor}
        onChangeText={onCambio}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={p.ink2}
        keyboardType={numerico ? 'number-pad' : 'default'}
        inputMode={numerico ? 'numeric' : undefined}
        maxLength={maxLength}
        autoCapitalize={numerico ? 'none' : 'sentences'}
        accessibilityLabel={etiqueta}
        style={{
          borderWidth: 1,
          borderColor: p.line,
          borderRadius: 6,
          padding: 12,
          fontSize: 16,
          lineHeight: 22,
          color: p.ink,
          backgroundColor: p.surface,
          minHeight: multiline ? 88 : 46,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}
