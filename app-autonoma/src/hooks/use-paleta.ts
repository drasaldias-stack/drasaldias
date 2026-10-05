import { Colors, type Paleta } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function usePaleta(): Paleta {
  const esquema = useColorScheme();
  return esquema === 'dark' ? Colors.dark : Colors.light;
}
