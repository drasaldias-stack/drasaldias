import { useState } from 'react';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import {
  datosValidos, DEFICIT_KCAL, IMC_BAJO_PESO, IMC_SOBREPESO, LIMITES_DATOS, LIMITES_OBJETIVO, NOMBRE_COMIDA, objetivoPorComida, objetivoValido, PISO_KCAL,
  PROTEINA_G_POR_KG, REPARTO_KCAL, REPARTO_PROTEINA, sugerenciaUsable, sugerirObjetivo, type Sugerencia,
} from '@/logic/objetivo';
import { COMIDAS, type Actividad, type DatosCalculo, type Objetivo, type OrigenObjetivo, type Sexo } from '@/logic/tipos';
import type { Perfil } from '@/state/app-state';
import { CampoTexto } from '@/ui/campos';
import { Aviso, Boton, Fila, Opciones, Pequeno, Separador, Texto } from '@/ui/kit';

export const TEXTO_ACTIVIDAD: Record<Actividad, string> = {
  baja: 'Baja: casi todo el día sentada o sentado',
  media: 'Media: de pie o caminando buena parte del día',
  alta: 'Alta: ejercicio moderado 3 a 5 días por semana',
};
const TEXTO_SEXO: Record<Sexo, string> = { mujer: 'Mujer', hombre: 'Hombre' };
const TEXTO_ORIGEN: Record<OrigenObjetivo, string> = { profesional: 'Me lo indicó mi médico o nutricionista', calculado: 'Lo calculé con la app' };

const numero = (t: string): number | null => {
  const limpio = t.trim().replace(',', '.');
  if (limpio === '') return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
};
const texto = (n: number | null | undefined) => (n == null ? '' : String(n));

function Campo({ children }: { children: React.ReactNode }) {
  return <View style={{ flexGrow: 1, flexBasis: 140 }}>{children}</View>;
}

function explicacionEnergia(s: Sugerencia): string {
  if (s.modo === 'deficit') {
    const resta = `${s.total} menos ${DEFICIT_KCAL} = ${s.sinRedondear}`;
    if (s.enPiso) return `${resta}, por debajo del mínimo de ${s.kcal} que la app sugiere: un plan más bajo necesita supervisión directa`;
    if (s.enTope) return `${resta}, acotado al máximo de ${s.kcal} que admite la app`;
    return `${resta}, redondeado a ${s.kcal}`;
  }
  return s.enTope ? `tu gasto estimado, acotado al máximo de ${s.kcal} que admite la app` : `tu gasto estimado, redondeado a ${s.kcal}`;
}

/** Objetivo diario de energía y proteína: ingreso directo (lo que indicó el profesional) o sugerencia calculada por la app. */
export function EditorObjetivo({ perfil, onCambio }: { perfil: Perfil; onCambio: (cambios: { objetivo?: Objetivo | null; datos?: DatosCalculo | null }) => void }) {
  const [kcal, setKcal] = useState(texto(perfil.objetivo?.kcal));
  const [proteina, setProteina] = useState(texto(perfil.objetivo?.proteina));
  const [origen, setOrigen] = useState<OrigenObjetivo>(perfil.objetivo?.origen ?? 'profesional');
  const [calculadora, setCalculadora] = useState(false);
  const [sexo, setSexo] = useState<Sexo>(perfil.datos?.sexo ?? 'mujer');
  const [edad, setEdad] = useState(texto(perfil.datos?.edad));
  const [peso, setPeso] = useState(texto(perfil.datos?.pesoKg));
  const [talla, setTalla] = useState(texto(perfil.datos?.tallaCm));
  const [actividad, setActividad] = useState<Actividad>(perfil.datos?.actividad ?? 'baja');

  const k = numero(kcal);
  const pr = numero(proteina);
  const valido = k !== null && pr !== null && objetivoValido(k, pr);
  const sinCambios =
    perfil.objetivo !== null && valido && perfil.objetivo.kcal === Math.round(k) && perfil.objetivo.proteina === Math.round(pr) && perfil.objetivo.origen === origen;
  const candidato = { sexo, edad: numero(edad) ?? undefined, pesoKg: numero(peso) ?? undefined, tallaCm: numero(talla) ?? undefined, actividad };
  const datos = datosValidos(candidato) ? candidato : null;
  const sugerencia = datos ? sugerirObjetivo(datos) : null;
  const usable = sugerencia !== null && sugerenciaUsable(sugerencia);
  const metas = perfil.objetivo ? objetivoPorComida(perfil.objetivo) : null;
  const conInsulina = perfil.seguridad.motivos.alimentacion.includes('insulina');

  const guardar = () => {
    if (!valido) return;
    // Los datos corporales válidos se guardan también aquí, para no perderlos si se calculó y luego se escribió a mano.
    onCambio({ objetivo: { kcal: Math.round(k), proteina: Math.round(pr), origen }, ...(datos ? { datos } : {}) });
  };
  const usarSugerencia = () => {
    if (!sugerencia || !datos || !usable) return;
    setKcal(String(sugerencia.kcal));
    setProteina(String(sugerencia.proteinaMin));
    setOrigen('calculado');
    onCambio({ objetivo: { kcal: sugerencia.kcal, proteina: sugerencia.proteinaMin, origen: 'calculado' }, datos });
  };

  return (
    <View style={{ gap: Spacing.m }}>
      <Texto>
        Con un objetivo diario de energía y proteína, el menú reparte las cantidades en cuatro comidas (desayuno, almuerzo, once y cena) y ajusta las porciones de cada receta. Sin objetivo, el menú muestra porciones base iguales para todas las personas.
      </Texto>
      <Fila style={{ alignItems: 'flex-start' }}>
        <Campo><CampoTexto etiqueta="Calorías al día (kcal)" valor={kcal} onCambio={setKcal} numerico placeholder="Por ejemplo, 1500" /></Campo>
        <Campo><CampoTexto etiqueta="Proteína al día (g)" valor={proteina} onCambio={setProteina} numerico placeholder="Por ejemplo, 90" /></Campo>
      </Fila>
      <Opciones<OrigenObjetivo>
        etiqueta="¿De dónde salen estos números?"
        opciones={(Object.keys(TEXTO_ORIGEN) as OrigenObjetivo[]).map((o) => ({ valor: o, texto: TEXTO_ORIGEN[o] }))}
        valor={origen}
        onCambio={(v) => setOrigen(v as OrigenObjetivo)}
      />
      {(kcal !== '' || proteina !== '') && !valido ? (
        <Pequeno tono="alerta">
          Revisa los valores: entre {LIMITES_OBJETIVO.kcal[0]} y {LIMITES_OBJETIVO.kcal[1]} kcal y entre {LIMITES_OBJETIVO.proteina[0]} y {LIMITES_OBJETIVO.proteina[1]} g de proteína al día.
        </Pequeno>
      ) : null}
      <Boton titulo={perfil.objetivo ? 'Guardar cambios' : 'Guardar objetivo'} onPress={guardar} deshabilitado={!valido || sinCambios} />
      {sinCambios ? <Pequeno tono="normal">Objetivo guardado. El menú ya usa estas cantidades.</Pequeno> : null}
      {perfil.objetivo && metas ? (
        <>
          <Pequeno>
            Reparto en cuatro comidas: {COMIDAS.map((c) => `${NOMBRE_COMIDA[c].toLowerCase()} ${metas[c].kcal} kcal y ${metas[c].proteina} g`).join(' · ')}. El reparto es fijo en esta versión:{' '}
            {COMIDAS.map((c) => Math.round(REPARTO_KCAL[c] * 100)).join('/')} % de la energía y {COMIDAS.map((c) => Math.round(REPARTO_PROTEINA[c] * 1000) / 10).join('/')} % de la proteína, con más proteína en almuerzo y cena.
          </Pequeno>
          <Boton
            titulo="Quitar objetivo"
            variante="secundario"
            onPress={() => {
              onCambio({ objetivo: null });
              setKcal('');
              setProteina('');
            }}
          />
        </>
      ) : null}
      <Separador />
      <Boton titulo={calculadora ? 'Ocultar la calculadora' : 'Calcular una sugerencia'} variante="secundario" icono="calculator-outline" onPress={() => setCalculadora((v) => !v)} />
      {calculadora ? (
        <View style={{ gap: Spacing.m }}>
          <Pequeno>
            La app estima el gasto en reposo con la ecuación de Mifflin-St Jeor y lo multiplica por un factor según tu actividad. Con IMC de {IMC_SOBREPESO} o más propone restar {DEFICIT_KCAL} kcal, sin bajar de {PISO_KCAL.mujer} kcal en mujeres ni de {PISO_KCAL.hombre} en hombres; con IMC entre {IMC_BAJO_PESO} y {IMC_SOBREPESO} propone mantener tu gasto; con IMC bajo {IMC_BAJO_PESO} no propone nada. La proteína se propone entre {PROTEINA_G_POR_KG[0]} y {PROTEINA_G_POR_KG[1]} g por kilo de peso de referencia (tu peso, o uno ajustado si el IMC es 30 o más). Es un punto de partida, no una indicación médica: lo que te indique tu profesional manda.
          </Pequeno>
          {conInsulina ? <Pequeno tono="alerta">Como usas insulina o sulfonilureas, acuerda el objetivo con tu médico antes de usarlo: cambiar cuánto comes cambia tus dosis.</Pequeno> : null}
          <Opciones<Sexo>
            etiqueta="Sexo"
            opciones={(Object.keys(TEXTO_SEXO) as Sexo[]).map((s) => ({ valor: s, texto: TEXTO_SEXO[s] }))}
            valor={sexo}
            onCambio={(v) => setSexo(v as Sexo)}
          />
          <Fila style={{ alignItems: 'flex-start' }}>
            <Campo><CampoTexto etiqueta="Edad (años)" valor={edad} onCambio={setEdad} numerico /></Campo>
            <Campo><CampoTexto etiqueta="Peso (kg)" valor={peso} onCambio={setPeso} numerico /></Campo>
            <Campo><CampoTexto etiqueta="Talla (cm)" valor={talla} onCambio={setTalla} numerico /></Campo>
          </Fila>
          <Opciones<Actividad>
            etiqueta="Actividad habitual"
            opciones={(Object.keys(TEXTO_ACTIVIDAD) as Actividad[]).map((a) => ({ valor: a, texto: TEXTO_ACTIVIDAD[a] }))}
            valor={actividad}
            onCambio={(v) => setActividad(v as Actividad)}
          />
          {sugerencia ? (
            sugerencia.modo === 'sin_sugerencia' ? (
              <Aviso tipo="alerta">
                <Texto>
                  Con tu peso y talla el IMC es {sugerencia.imc}, por debajo de {IMC_BAJO_PESO}. La app no propone un objetivo de energía en ese caso: acuerda cualquier plan de alimentación con tu médico o nutricionista.
                </Texto>
              </Aviso>
            ) : (
              <>
                <Aviso tipo="info">
                  <Texto>
                    IMC {sugerencia.imc}. Gasto en reposo estimado: {sugerencia.reposo} kcal. Gasto total estimado con tu actividad: {sugerencia.total} kcal.{' '}
                    {sugerencia.modo === 'mantenimiento'
                      ? `Con IMC entre ${IMC_BAJO_PESO} y ${IMC_SOBREPESO} la app no propone un déficit: la sugerencia es mantener, ${sugerencia.kcal} kcal al día (${explicacionEnergia(sugerencia)}).`
                      : `Sugerencia: ${sugerencia.kcal} kcal al día (${explicacionEnergia(sugerencia)}).`}{' '}
                    Proteína: entre {sugerencia.proteinaMin} y {sugerencia.proteinaMax} g al día (peso de referencia {sugerencia.pesoReferencia} kg).
                  </Texto>
                  <Pequeno tono="normal">Al usar la sugerencia se guarda la proteína mínima del rango; puedes cambiarla arriba.</Pequeno>
                </Aviso>
                <Boton titulo="Usar esta sugerencia" onPress={usarSugerencia} deshabilitado={!usable} />
              </>
            )
          ) : (
            <Pequeno>
              Completa los datos para ver la sugerencia: edad de {LIMITES_DATOS.edad[0]} a {LIMITES_DATOS.edad[1]} años, peso de {LIMITES_DATOS.pesoKg[0]} a {LIMITES_DATOS.pesoKg[1]} kg y talla de {LIMITES_DATOS.tallaCm[0]} a {LIMITES_DATOS.tallaCm[1]} cm.
            </Pequeno>
          )}
          <Pequeno>Al guardar un objetivo o usar la sugerencia, estos datos quedan guardados solo en este dispositivo y viajan dentro del código de respaldo.</Pequeno>
        </View>
      ) : null}
    </View>
  );
}
