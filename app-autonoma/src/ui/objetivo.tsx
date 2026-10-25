import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import {
  datosValidos, DEFICIT_KCAL, DEFICIT_MINIMO_KCAL, deficitReal, IMC_BAJO_PESO, IMC_SOBREPESO, LIMITES_DATOS, LIMITES_OBJETIVO, NOMBRE_COMIDA, objetivoPorComida,
  objetivoValido, PISO_KCAL, pisoSobreGasto, PROTEINA_G_POR_KG, REPARTO_KCAL, REPARTO_PROTEINA, sugerenciaUsable, sugerirObjetivo, type Sugerencia,
} from '@/logic/objetivo';
import { COMIDAS, type Actividad, type DatosCalculo, type Objetivo, type OrigenObjetivo, type Sexo } from '@/logic/tipos';
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
/** Números en pantalla con coma decimal («18,5»). */
const num = (n: number) => n.toLocaleString('es', { maximumFractionDigits: 1 });

function Campo({ children }: { children: React.ReactNode }) {
  return <View style={{ flexGrow: 1, flexBasis: 140 }}>{children}</View>;
}

function explicacionEnergia(s: Sugerencia): string {
  if (s.modo === 'deficit') {
    const resta = `${s.total} menos ${DEFICIT_KCAL} = ${s.sinRedondear}`;
    if (s.enPiso) return `${resta}, por debajo del mínimo de ${s.kcal} que la app sugiere por sí sola; con ${s.kcal} el déficit real respecto de tu gasto es de ${deficitReal(s)} kcal`;
    if (s.enTope) return `${resta}, acotado al máximo de ${s.kcal} que admite la app`;
    return `${resta}, redondeado a ${s.kcal}`;
  }
  return s.enTope ? `tu gasto estimado, acotado al máximo de ${s.kcal} que admite la app` : `tu gasto estimado, redondeado a ${s.kcal}`;
}

const mismoObjetivo = (a: Objetivo | null, b: Objetivo | null) => a === b || (a !== null && b !== null && a.kcal === b.kcal && a.proteina === b.proteina && a.origen === b.origen);
const mismosDatos = (a: DatosCalculo | null, b: DatosCalculo | null) =>
  a === b || (a !== null && b !== null && a.sexo === b.sexo && a.edad === b.edad && a.pesoKg === b.pesoKg && a.tallaCm === b.tallaCm && a.actividad === b.actividad);

export type CambioObjetivo = { objetivo?: Objetivo | null; datos?: DatosCalculo | null };
/** Por qué cambió: botón de guardar, «Usar esta sugerencia», «Quitar objetivo» o autoguardado al escribir. */
export type MotivoCambio = 'guardar' | 'sugerencia' | 'quitar' | 'auto';

/**
 * Objetivo diario de energía y proteína: ingreso directo (lo que indicó el profesional) o sugerencia calculada por la
 * app. Se usa en Perfil, en Menú y en el registro inicial. Con `autoguardar`, no hay botón de guardar: cada valor
 * válido se comunica al instante (y uno inválido, como objetivo nulo), para pantallas que guardan al continuar.
 */
export function EditorObjetivo({
  objetivo: objetivoActual,
  datos: datosActuales,
  conInsulina,
  onCambio,
  autoguardar = false,
  sinIntroduccion = false,
}: {
  objetivo: Objetivo | null;
  datos: DatosCalculo | null;
  conInsulina: boolean;
  onCambio: (cambios: CambioObjetivo, motivo: MotivoCambio) => void;
  autoguardar?: boolean;
  /** La pantalla que lo envuelve ya explica para qué sirve el objetivo. */
  sinIntroduccion?: boolean;
}) {
  const perfil = { objetivo: objetivoActual, datos: datosActuales };
  const [kcal, setKcal] = useState(texto(perfil.objetivo?.kcal));
  const [proteina, setProteina] = useState(texto(perfil.objetivo?.proteina));
  const [origen, setOrigen] = useState<OrigenObjetivo>(perfil.objetivo?.origen ?? 'profesional');
  const [calculadora, setCalculadora] = useState(false);
  const [sexo, setSexo] = useState<Sexo>(perfil.datos?.sexo ?? 'mujer');
  const [edad, setEdad] = useState(texto(perfil.datos?.edad));
  const [peso, setPeso] = useState(texto(perfil.datos?.pesoKg));
  const [talla, setTalla] = useState(texto(perfil.datos?.tallaCm));
  const [actividad, setActividad] = useState<Actividad>(perfil.datos?.actividad ?? 'baja');
  // Lo último que este editor guardó. Si el perfil cambia por otra vía (por ejemplo, al restaurar un respaldo), los
  // campos se vuelven a cargar; si cambia porque aquí se guardó, se conserva lo escrito y la calculadora abierta.
  const guardado = useRef({ objetivo: perfil.objetivo, datos: perfil.datos });
  useEffect(() => {
    if (mismoObjetivo(perfil.objetivo, guardado.current.objetivo) && mismosDatos(perfil.datos, guardado.current.datos)) return;
    guardado.current = { objetivo: perfil.objetivo, datos: perfil.datos };
    setKcal(texto(perfil.objetivo?.kcal));
    setProteina(texto(perfil.objetivo?.proteina));
    setOrigen(perfil.objetivo?.origen ?? 'profesional');
    setSexo(perfil.datos?.sexo ?? 'mujer');
    setEdad(texto(perfil.datos?.edad));
    setPeso(texto(perfil.datos?.pesoKg));
    setTalla(texto(perfil.datos?.tallaCm));
    setActividad(perfil.datos?.actividad ?? 'baja');
  }, [perfil.objetivo, perfil.datos]);

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
  // Autoguardado: cada cambio válido se comunica; si lo escrito deja de ser válido, el objetivo vuelve a nulo.
  useEffect(() => {
    if (!autoguardar) return;
    if (valido) {
      const objetivo = { kcal: Math.round(k), proteina: Math.round(pr), origen };
      if (mismoObjetivo(objetivo, guardado.current.objetivo) && mismosDatos(datos ?? perfil.datos, guardado.current.datos)) return;
      guardado.current = { objetivo, datos: datos ?? perfil.datos };
      onCambio({ objetivo, ...(datos ? { datos } : {}) }, 'auto');
    } else if (guardado.current.objetivo !== null) {
      guardado.current = { objetivo: null, datos: guardado.current.datos };
      onCambio({ objetivo: null }, 'auto');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoguardar, valido, k, pr, origen, datos?.sexo, datos?.edad, datos?.pesoKg, datos?.tallaCm, datos?.actividad]);

  const guardar = () => {
    if (!valido) return;
    // Los datos corporales válidos se guardan también aquí, para no perderlos si se calculó y luego se escribió a mano.
    const objetivo = { kcal: Math.round(k), proteina: Math.round(pr), origen };
    guardado.current = { objetivo, datos: datos ?? perfil.datos };
    onCambio({ objetivo, ...(datos ? { datos } : {}) }, 'guardar');
  };
  const usarSugerencia = () => {
    if (!sugerencia || !datos || !usable) return;
    setKcal(String(sugerencia.kcal));
    setProteina(String(sugerencia.proteinaMin));
    setOrigen('calculado');
    const objetivo = { kcal: sugerencia.kcal, proteina: sugerencia.proteinaMin, origen: 'calculado' as const };
    guardado.current = { objetivo, datos };
    onCambio({ objetivo, datos }, 'sugerencia');
  };
  const quitar = () => {
    guardado.current = { objetivo: null, datos: perfil.datos };
    onCambio({ objetivo: null }, 'quitar');
    setKcal('');
    setProteina('');
  };

  return (
    <View style={{ gap: Spacing.m }}>
      {!sinIntroduccion ? (
        <Texto>
          Con un objetivo diario de energía y proteína, el menú reparte las cantidades en cuatro comidas (desayuno, almuerzo, once y cena) y ajusta las porciones de cada receta. Sin objetivo, el menú muestra porciones base iguales para todas las personas.
        </Texto>
      ) : null}
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
      {!autoguardar ? <Boton titulo={perfil.objetivo ? 'Guardar cambios' : 'Guardar objetivo'} onPress={guardar} deshabilitado={!valido || sinCambios} /> : null}
      {!autoguardar && sinCambios ? <Pequeno tono="normal">Objetivo guardado. El menú ya usa estas cantidades.</Pequeno> : null}
      {perfil.objetivo && metas ? (
        <>
          <Pequeno>
            Reparto en cuatro comidas: {COMIDAS.map((c) => `${NOMBRE_COMIDA[c].toLowerCase()} ${metas[c].kcal} kcal y ${metas[c].proteina} g`).join(' · ')}. El reparto es fijo en esta versión:{' '}
            {COMIDAS.map((c) => Math.round(REPARTO_KCAL[c] * 100)).join('/')} % de la energía y {COMIDAS.map((c) => Math.round(REPARTO_PROTEINA[c] * 1000) / 10).join('/')} % de la proteína, con más proteína en almuerzo y cena.
          </Pequeno>
          {!autoguardar ? <Boton titulo="Quitar objetivo" variante="secundario" onPress={quitar} /> : null}
        </>
      ) : null}
      <Separador />
      <Boton titulo={calculadora ? 'Ocultar la calculadora' : 'Calcular una sugerencia'} variante="secundario" icono="calculator-outline" onPress={() => setCalculadora((v) => !v)} />
      {calculadora ? (
        <View style={{ gap: Spacing.m }}>
          <Pequeno>
            La app estima el gasto en reposo con la ecuación de Mifflin-St Jeor y lo multiplica por un factor según tu actividad. Con IMC de {num(IMC_SOBREPESO)} o más propone restar {DEFICIT_KCAL} kcal, sin bajar de {PISO_KCAL.mujer} kcal en mujeres ni de {PISO_KCAL.hombre} en hombres; con IMC entre {num(IMC_BAJO_PESO)} y {num(IMC_SOBREPESO)} propone mantener tu gasto; si esos mínimos no dejan un déficit real de al menos {DEFICIT_MINIMO_KCAL} kcal respecto de tu gasto (o en mantenimiento no caben en él), no propone una cifra; con IMC bajo {num(IMC_BAJO_PESO)} no propone nada. La proteína se propone entre {PROTEINA_G_POR_KG[0]} y {PROTEINA_G_POR_KG[1]} g por kilo de peso de referencia (tu peso, o uno ajustado si el IMC es 30 o más). Es un punto de partida, no una indicación médica: lo que te indique tu profesional manda.
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
                  Con tu peso y talla el IMC es {num(sugerencia.imc)}, por debajo de {num(IMC_BAJO_PESO)}. La app no propone un objetivo de energía en ese caso: acuerda cualquier plan de alimentación con tu médico o nutricionista.
                </Texto>
              </Aviso>
            ) : (
              <>
                <Aviso tipo="info">
                  <Texto>
                    IMC {num(sugerencia.imc)}. Gasto en reposo estimado: {sugerencia.reposo} kcal. Gasto total estimado con tu actividad: {sugerencia.total} kcal.{' '}
                    {pisoSobreGasto(sugerencia)
                      ? sugerencia.modo === 'mantenimiento'
                        ? `Con IMC entre ${num(IMC_BAJO_PESO)} y ${num(IMC_SOBREPESO)} la app no propone un déficit, y tu gasto estimado no supera los ${PISO_KCAL[sexo]} kcal mínimos que la app sugiere por sí sola, así que no propone una cifra: acuerda el plan con tu médico o nutricionista.`
                        : `Restar ${DEFICIT_KCAL} kcal daría ${sugerencia.sinRedondear}, pero el mínimo de ${PISO_KCAL[sexo]} kcal que la app sugiere por sí sola ${deficitReal(sugerencia) > 0 ? `dejaría un déficit real de solo ${deficitReal(sugerencia)} kcal` : deficitReal(sugerencia) === 0 ? 'no dejaría ningún déficit (comerías lo mismo que gastas)' : `te haría comer ${-deficitReal(sugerencia)} kcal más de lo que gastas`}, y la app exige un déficit real de al menos ${DEFICIT_MINIMO_KCAL} kcal para proponerlo: acuerda el plan con tu médico o nutricionista.`
                      : sugerencia.modo === 'mantenimiento'
                        ? `Con IMC entre ${num(IMC_BAJO_PESO)} y ${num(IMC_SOBREPESO)} la app no propone un déficit: la sugerencia es mantener, ${sugerencia.kcal} kcal al día (${explicacionEnergia(sugerencia)}).`
                        : `Sugerencia: ${sugerencia.kcal} kcal al día (${explicacionEnergia(sugerencia)}).`}{' '}
                    Proteína: entre {sugerencia.proteinaMin} y {sugerencia.proteinaMax} g al día (peso de referencia {sugerencia.pesoReferencia} kg).
                  </Texto>
                  {usable ? <Pequeno tono="normal">Al usar la sugerencia se guarda la proteína mínima del rango; puedes cambiarla arriba.</Pequeno> : null}
                </Aviso>
                {usable ? <Boton titulo="Usar esta sugerencia" onPress={usarSugerencia} /> : null}
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
