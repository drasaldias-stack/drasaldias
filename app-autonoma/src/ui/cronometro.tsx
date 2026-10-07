import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';

/** Cuenta regresiva para los ejercicios medidos en segundos. Vibra al llegar a cero (en web no hace nada). */
export function Cronometro({ segundos }: { segundos: number }) {
  const p = usePaleta();
  const [restante, setRestante] = useState(segundos);
  const [corriendo, setCorriendo] = useState(false);
  const fin = useRef<number | null>(null);

  useEffect(() => {
    setRestante(segundos);
    setCorriendo(false);
    fin.current = null;
  }, [segundos]);

  useEffect(() => {
    if (!corriendo) return;
    if (fin.current == null) fin.current = Date.now() + restante * 1000;
    const id = setInterval(() => {
      const quedan = Math.max(0, Math.ceil(((fin.current ?? Date.now()) - Date.now()) / 1000));
      setRestante(quedan);
      if (quedan === 0) {
        setCorriendo(false);
        fin.current = null;
        try {
          Vibration.vibrate(400);
        } catch {
          // en web no hay vibración
        }
      }
    }, 250);
    return () => clearInterval(id);
    // restante solo se usa para fijar el fin al iniciar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo]);

  const terminado = restante === 0;
  const alternar = () => {
    if (terminado) {
      setRestante(segundos);
      fin.current = null;
      setCorriendo(true);
      return;
    }
    if (corriendo) {
      fin.current = null;
      setCorriendo(false);
    } else {
      setCorriendo(true);
    }
  };
  const reiniciar = () => {
    fin.current = null;
    setCorriendo(false);
    setRestante(segundos);
  };
  const etiqueta = terminado ? 'Repetir' : corriendo ? 'Pausar' : restante === segundos ? `Iniciar ${segundos} s` : 'Seguir';

  return (
    <View style={estilos.fila}>
      <Text
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${restante} segundos`}
        style={[estilos.numero, { color: terminado ? p.ok : p.ink }]}>
        {restante}
        <Text style={[estilos.unidad, { color: p.ink2 }]}> s</Text>
      </Text>
      <View style={estilos.botones}>
        <Pressable
          accessibilityRole="button"
          onPress={alternar}
          style={({ pressed }) => [estilos.boton, { backgroundColor: p.accent, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[estilos.botonTexto, { color: p.accentInk }]}>{etiqueta}</Text>
        </Pressable>
        {restante !== segundos ? (
          <Pressable
            accessibilityRole="button"
            onPress={reiniciar}
            style={({ pressed }) => [estilos.boton, { borderWidth: 1, borderColor: p.line, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={[estilos.botonTexto, { color: p.accent }]}>Reiniciar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.m, flexWrap: 'wrap' },
  numero: { fontSize: 44, lineHeight: 50, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unidad: { fontSize: 20, fontWeight: '600' },
  botones: { flexDirection: 'row', gap: Spacing.s, flexWrap: 'wrap' },
  boton: { minHeight: 44, paddingHorizontal: Spacing.l, borderRadius: Radius.s, alignItems: 'center', justifyContent: 'center' },
  botonTexto: { fontSize: 16, fontWeight: '700' },
});
