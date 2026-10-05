import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { PROGRAMAS } from '@/content/ejercicios';
import type { Equipo, Exclusion, Material, PreferenciasCocina, PreferenciasEjercicio, ProgramaId } from '@/logic/tipos';
import { Opciones, Pequeno } from '@/ui/kit';

export const TEXTO_EQUIPO: Record<Equipo, string> = {
  horno: 'Horno',
  olla: 'Olla a presión (manual o eléctrica)',
  airfryer: 'Freidora de aire',
  microondas: 'Microondas',
  licuadora: 'Licuadora o procesadora',
};

export const TEXTO_EXCLUSION: Record<Exclusion, string> = {
  lacteos: 'Lácteos',
  gluten: 'Gluten',
  huevo: 'Huevo',
  pescado: 'Pescado',
  cerdo: 'Cerdo',
  vacuno: 'Vacuno',
  pollo: 'Pollo',
  soya: 'Soya',
  frutos_secos: 'Frutos secos',
  mostaza: 'Mostaza',
  sesamo: 'Sésamo (tahini)',
  cebolla: 'Cebolla',
  champinones: 'Champiñones',
  picante: 'Picante',
  cilantro: 'Cilantro',
};

export const TEXTO_MATERIAL: Record<Material, string> = {
  silla: 'Silla firme',
  banda: 'Banda elástica',
  pesas: 'Mancuernas o botellas de agua',
  colchoneta: 'Colchoneta o alfombra',
};

export function EditorCocina({ valor, onCambio }: { valor: PreferenciasCocina; onCambio: (v: PreferenciasCocina) => void }) {
  return (
    <View style={{ gap: Spacing.xl }}>
      <Opciones<60 | 90 | 120>
        etiqueta="¿Cuánto tiempo tienes para cocinar una vez a la semana?"
        opciones={[{ valor: 60, texto: '60 minutos' }, { valor: 90, texto: '90 minutos' }, { valor: 120, texto: '2 horas' }]}
        valor={valor.minutos}
        onCambio={(v) => onCambio({ ...valor, minutos: v as 60 | 90 | 120 })}
      />
      <Opciones<Equipo>
        etiqueta="¿Qué tienes en tu cocina?"
        ayuda="Damos por hecho que tienes cocinilla o encimera. Marca lo demás. Una olla de cocción lenta no cuenta como olla a presión."
        multiple
        opciones={(Object.keys(TEXTO_EQUIPO) as Equipo[]).map((k) => ({ valor: k, texto: TEXTO_EQUIPO[k] }))}
        valor={valor.equipos}
        onCambio={(v) => onCambio({ ...valor, equipos: v as Equipo[] })}
      />
      <Opciones<number>
        etiqueta="¿Para cuántas personas cocinas?"
        opciones={[1, 2, 3, 4].map((n) => ({ valor: n, texto: String(n) }))}
        valor={valor.personas}
        onCambio={(v) => onCambio({ ...valor, personas: v as number })}
      />
      <Opciones<'omnivoro' | 'vegetariano'>
        etiqueta="¿Cómo comes?"
        opciones={[{ valor: 'omnivoro', texto: 'Como de todo' }, { valor: 'vegetariano', texto: 'Vegetariano' }]}
        valor={valor.patron}
        onCambio={(v) => onCambio({ ...valor, patron: v as 'omnivoro' | 'vegetariano' })}
      />
      <Opciones<Exclusion>
        etiqueta="¿Qué no comes?"
        ayuda="Por alergia, intolerancia o porque no te gusta. Si tienes una alergia grave, revisa igual la lista de ingredientes de cada receta y las etiquetas de lo que compres."
        multiple
        opciones={(Object.keys(TEXTO_EXCLUSION) as Exclusion[]).map((k) => ({ valor: k, texto: TEXTO_EXCLUSION[k] }))}
        valor={valor.exclusiones}
        onCambio={(v) => onCambio({ ...valor, exclusiones: v as Exclusion[] })}
      />
    </View>
  );
}

export function EditorEjercicio({ valor, onCambio }: { valor: PreferenciasEjercicio; onCambio: (v: PreferenciasEjercicio) => void }) {
  const programa = PROGRAMAS[valor.programa];
  return (
    <View style={{ gap: Spacing.xl }}>
      <View style={{ gap: Spacing.s }}>
        <Opciones<ProgramaId>
          etiqueta="Elige tu programa de ejercicio"
          opciones={(Object.keys(PROGRAMAS) as ProgramaId[]).map((k) => ({ valor: k, texto: PROGRAMAS[k].nombre }))}
          valor={valor.programa}
          onCambio={(v) => onCambio({ ...valor, programa: v as ProgramaId })}
        />
        <Pequeno>{programa.paraQuien}</Pequeno>
      </View>
      <Opciones<10 | 20 | 30>
        etiqueta="¿Cuánto dura cada sesión?"
        ayuda="Tres sesiones por semana. Puedes cambiarlo cuando quieras."
        opciones={[{ valor: 10, texto: '10 minutos' }, { valor: 20, texto: '20 minutos' }, { valor: 30, texto: '30 minutos' }]}
        valor={valor.minutos}
        onCambio={(v) => onCambio({ ...valor, minutos: v as 10 | 20 | 30 })}
      />
      <Opciones<Material>
        etiqueta="¿Qué tienes para entrenar?"
        ayuda="Si te falta algo, la app cambia el ejercicio por otro que no lo necesite."
        multiple
        opciones={(Object.keys(TEXTO_MATERIAL) as Material[]).map((k) => ({ valor: k, texto: TEXTO_MATERIAL[k] }))}
        valor={valor.materiales}
        onCambio={(v) => onCambio({ ...valor, materiales: v as Material[] })}
      />
    </View>
  );
}
