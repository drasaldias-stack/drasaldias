import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';
import { useApp } from '@/state/app-state';
import { clasesConEstado } from '@/state/derivados';
import { Chip, Etiqueta, Fila, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

export default function Clases() {
  const { estado, semana } = useApp();
  const p = usePaleta();
  const lista = clasesConEstado(estado, semana);
  const vistas = lista.filter((c) => c.vista).length;
  return (
    <Pantalla>
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>Biblioteca</Etiqueta>
        <Titulo>Clases</Titulo>
        <Texto tono="suave">Se libera una clase nueva cada semana. Llevas {vistas} de {lista.length}.</Texto>
      </View>
      {lista.map(({ clase, liberada, vista }) => (
        <Tarjeta
          key={clase.id}
          onPress={liberada ? () => router.push(`/clase/${clase.id}`) : undefined}
          accesible={liberada ? `Abrir clase ${clase.titulo}` : undefined}
          style={!liberada ? { opacity: 0.6 } : undefined}>
          <Fila style={{ justifyContent: 'space-between' }}>
            <Etiqueta>Semana {clase.semana} · {clase.minutos} min{clase.videoUrl ? '' : ' de lectura'}</Etiqueta>
            {vista ? <Chip texto="Vista" tono="ok" /> : liberada ? <Chip texto="Disponible" tono="acento" /> : (
              <Fila>
                <Ionicons aria-hidden name="lock-closed-outline" size={14} color={p.ink2} />
                <Pequeno>Semana {clase.semana}</Pequeno>
              </Fila>
            )}
          </Fila>
          <Subtitulo>{clase.titulo}</Subtitulo>
          <Pequeno>{clase.resumen}</Pequeno>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}
