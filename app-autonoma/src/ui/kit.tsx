import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';

export type NombreIcono = ComponentProps<typeof Ionicons>['name'];

export function Pantalla({ children, conBarra = true }: { children: ReactNode; conBarra?: boolean }) {
  const p = usePaleta();
  const contenido = (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
      <View style={estilos.columna}>{children}</View>
    </ScrollView>
  );
  if (!conBarra) return <View style={{ flex: 1, backgroundColor: p.bg }}>{contenido}</View>;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: p.bg }}>
      {contenido}
    </SafeAreaView>
  );
}

type TextoProps = { children: ReactNode; style?: StyleProp<TextStyle>; tono?: 'normal' | 'suave' | 'acento' | 'alerta' };
function useTono(tono: TextoProps['tono']) {
  const p = usePaleta();
  return tono === 'suave' ? p.ink2 : tono === 'acento' ? p.accent : tono === 'alerta' ? p.crit : p.ink;
}
export function Titulo({ children, style }: TextoProps) {
  const p = usePaleta();
  return <Text accessibilityRole="header" style={[estilos.titulo, { color: p.ink }, style]}>{children}</Text>;
}
export function Subtitulo({ children, style }: TextoProps) {
  const p = usePaleta();
  return <Text accessibilityRole="header" style={[estilos.subtitulo, { color: p.ink }, style]}>{children}</Text>;
}
export function Texto({ children, style, tono = 'normal' }: TextoProps) {
  return <Text style={[estilos.texto, { color: useTono(tono) }, style]}>{children}</Text>;
}
export function Pequeno({ children, style, tono = 'suave' }: TextoProps) {
  return <Text style={[estilos.pequeno, { color: useTono(tono) }, style]}>{children}</Text>;
}
export function Etiqueta({ children, style, tono = 'suave' }: TextoProps) {
  return <Text style={[estilos.etiqueta, { color: useTono(tono) }, style]}>{children}</Text>;
}

export function Tarjeta({ children, style, onPress, accesible }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accesible?: string }) {
  const p = usePaleta();
  const base = [estilos.tarjeta, { backgroundColor: p.surface, borderColor: p.line }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accesible} onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export function Boton({
  titulo, onPress, variante = 'primario', icono, deshabilitado,
}: { titulo: string; onPress: () => void; variante?: 'primario' | 'secundario' | 'peligro'; icono?: NombreIcono; deshabilitado?: boolean }) {
  const p = usePaleta();
  const fondo = variante === 'primario' ? p.accent : variante === 'peligro' ? p.crit : 'transparent';
  const color = variante === 'primario' ? p.accentInk : variante === 'peligro' ? p.surface : p.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      aria-disabled={deshabilitado}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: fondo, borderColor: variante === 'secundario' ? p.line : fondo, opacity: deshabilitado ? 0.45 : pressed ? 0.85 : 1 },
      ]}>
      {icono ? <Ionicons aria-hidden name={icono} size={18} color={color} /> : null}
      <Text style={[estilos.botonTexto, { color }]}>{titulo}</Text>
    </Pressable>
  );
}

export function Fila({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[estilos.fila, style]}>{children}</View>;
}

export function Aviso({ children, tipo = 'info', icono }: { children: ReactNode; tipo?: 'info' | 'alerta' | 'critico' | 'ok'; icono?: NombreIcono }) {
  const p = usePaleta();
  const fondo = tipo === 'alerta' ? p.warnBg : tipo === 'critico' ? p.critBg : tipo === 'ok' ? p.okBg : p.accentSoft;
  const color = tipo === 'alerta' ? p.warn : tipo === 'critico' ? p.crit : tipo === 'ok' ? p.ok : p.accent;
  return (
    <View style={[estilos.aviso, { backgroundColor: fondo }]}>
      <Ionicons aria-hidden name={icono ?? (tipo === 'info' ? 'information-circle-outline' : 'alert-circle-outline')} size={20} color={color} />
      <View style={{ flex: 1, gap: Spacing.xs }}>{children}</View>
    </View>
  );
}

export function Chip({ texto, tono = 'neutro' }: { texto: string; tono?: 'neutro' | 'acento' | 'ok' | 'alerta' }) {
  const p = usePaleta();
  const fondo = tono === 'acento' ? p.accentSoft : tono === 'ok' ? p.okBg : tono === 'alerta' ? p.warnBg : p.surface2;
  const color = tono === 'acento' ? p.accent : tono === 'ok' ? p.ok : tono === 'alerta' ? p.warn : p.ink2;
  return (
    <View style={[estilos.chip, { backgroundColor: fondo }]}>
      <Text style={[estilos.chipTexto, { color }]}>{texto}</Text>
    </View>
  );
}

/** Grupo de opciones tipo píldora. Con `multiple`, permite elegir varias. */
export function Opciones<T extends string | number>({
  etiqueta, opciones, valor, onCambio, multiple, ayuda,
}: {
  etiqueta: string;
  opciones: { valor: T; texto: string }[];
  valor: T | T[];
  onCambio: (v: T | T[]) => void;
  multiple?: boolean;
  ayuda?: string;
}) {
  const p = usePaleta();
  const elegido = (v: T) => (Array.isArray(valor) ? valor.includes(v) : valor === v);
  const tocar = (v: T) => {
    if (!multiple) return onCambio(v);
    const lista = Array.isArray(valor) ? valor : [];
    onCambio(lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);
  };
  return (
    <View style={{ gap: Spacing.s }} accessibilityRole={multiple ? undefined : 'radiogroup'}>
      <Text style={[estilos.opcionesEtiqueta, { color: p.ink }]}>{etiqueta}</Text>
      {ayuda ? <Pequeno>{ayuda}</Pequeno> : null}
      <View style={estilos.opciones}>
        {opciones.map((o) => {
          const sel = elegido(o.valor);
          return (
            <Pressable
              key={String(o.valor)}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: sel }}
              aria-checked={sel}
              onPress={() => tocar(o.valor)}
              style={({ pressed }) => [
                estilos.pildora,
                { backgroundColor: sel ? p.accent : p.surface, borderColor: sel ? p.accent : p.line, opacity: pressed ? 0.85 : 1 },
              ]}>
              <Text style={[estilos.pildoraTexto, { color: sel ? p.accentInk : p.ink }]}>{o.texto}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SiNo({ pregunta, valor, onCambio }: { pregunta: string; valor: boolean | undefined; onCambio: (v: boolean) => void }) {
  return (
    <Opciones<'si' | 'no'>
      etiqueta={pregunta}
      opciones={[{ valor: 'si', texto: 'Sí' }, { valor: 'no', texto: 'No' }]}
      valor={valor === undefined ? ([] as ('si' | 'no')[]) : valor ? 'si' : 'no'}
      onCambio={(v) => onCambio(v === 'si')}
    />
  );
}

export function FilaCheck({ texto, detalle, marcado, onPress }: { texto: string; detalle?: string; marcado: boolean; onPress: () => void }) {
  const p = usePaleta();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcado }}
      aria-checked={marcado}
      onPress={onPress}
      style={({ pressed }) => [estilos.filaCheck, { borderBottomColor: p.line, opacity: pressed ? 0.8 : 1 }]}>
      <Ionicons aria-hidden name={marcado ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={marcado ? p.ok : p.ink2} />
      <View style={{ flex: 1 }}>
        <Text style={[estilos.texto, { color: marcado ? p.ink2 : p.ink, textDecorationLine: marcado ? 'line-through' : 'none' }]}>{texto}</Text>
        {detalle ? <Pequeno>{detalle}</Pequeno> : null}
      </View>
    </Pressable>
  );
}

/** Avance del programa dibujado como una cinta métrica de 12 semanas. */
export function Cinta({ semana, total = 12, decorativa }: { semana: number; total?: number; decorativa?: boolean }) {
  const p = usePaleta();
  const hecho = Math.min(total, Math.max(0, semana));
  const anunciada = Math.min(total, Math.max(1, Math.ceil(semana)));
  return (
    <View
      accessible={!decorativa}
      aria-hidden={decorativa}
      accessibilityLabel={decorativa ? undefined : `Semana ${anunciada} de ${total} del programa`}
      style={{ gap: Spacing.xs }}>
      <View style={[estilos.cinta, { backgroundColor: p.surface2 }]}>
        <View style={[estilos.cintaRelleno, { backgroundColor: p.tape, width: `${(hecho / total) * 100}%` }]} />
        {Array.from({ length: total - 1 }, (_, i) => {
          const n = i + 1;
          return (
            <View
              key={n}
              style={[
                estilos.marca,
                { left: `${(n / total) * 100}%`, height: n % 3 === 0 ? 18 : 10, backgroundColor: n < hecho + 1 ? p.tapeInk : p.ink2 },
              ]}
            />
          );
        })}
      </View>
      <View style={estilos.cintaEtiquetas}>
        {['S1', 'S4', 'S7', 'S10', 'Fin'].map((t) => (
          <Text key={t} style={[estilos.cintaNumero, { color: p.ink2 }]}>{t}</Text>
        ))}
      </View>
    </View>
  );
}

export function Separador() {
  const p = usePaleta();
  return <View style={{ height: 1, backgroundColor: p.line, marginVertical: Spacing.xs }} />;
}

const estilos = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.l, paddingTop: Spacing.l, paddingBottom: Spacing.xxl, alignItems: 'center' },
  columna: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.l },
  titulo: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.3 },
  subtitulo: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  texto: { fontSize: 16, lineHeight: 23 },
  pequeno: { fontSize: 14, lineHeight: 20 },
  etiqueta: { fontSize: 13, lineHeight: 18, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  tarjeta: { borderWidth: 1, borderRadius: Radius.m, padding: Spacing.l, gap: Spacing.m },
  boton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.s,
    borderWidth: 1, borderRadius: Radius.s, paddingVertical: 12, paddingHorizontal: Spacing.l, minHeight: 46,
  },
  botonTexto: { fontSize: 16, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s, alignItems: 'center' },
  aviso: { flexDirection: 'row', gap: Spacing.m, padding: Spacing.m, borderRadius: Radius.s, alignItems: 'flex-start' },
  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: Radius.pill, alignSelf: 'flex-start' },
  chipTexto: { fontSize: 14, fontWeight: '700' },
  opcionesEtiqueta: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s },
  pildora: { borderWidth: 1, borderRadius: Radius.pill, paddingVertical: 10, paddingHorizontal: 16, minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
  pildoraTexto: { fontSize: 15, fontWeight: '600' },
  filaCheck: { flexDirection: 'row', gap: Spacing.m, alignItems: 'center', paddingVertical: Spacing.m, borderBottomWidth: 1 },
  cinta: { height: 30, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  cintaRelleno: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  marca: { position: 'absolute', top: 0, width: 1.5 },
  cintaEtiquetas: { flexDirection: 'row', justifyContent: 'space-between' },
  cintaNumero: { fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
