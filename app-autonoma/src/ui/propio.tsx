import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { enlaceValido, IDS_SESION, LIMITES, normalizarPauta, normalizarRutina } from '@/logic/propio';
import type { IdSesionRutina, OrigenPauta, PautaPropia, RutinaPropia } from '@/logic/tipos';
import { CampoTexto } from '@/ui/campos';
import { Aviso, Boton, Etiqueta, Fila, Opciones, Pequeno, Separador, Subtitulo, Tarjeta, Texto } from '@/ui/kit';

// Textos clínicos de estas pantallas: pendientes de validación por el equipo médico.
export const AVISO_PAUTA =
  'Ruta 90 muestra tu pauta tal como la escribes; no la revisa ni la corrige. Si la armaste tú, pídele a tu médico o nutricionista que la revise. Saltarse comidas o comer menos de tres veces al día no es recomendable sin supervisión.';
export const AVISO_RUTINA =
  'Ruta 90 muestra tu rutina tal como la escribes; no la revisa. Se suma a las sesiones de tu programa: si haces las dos, deja al menos un día de descanso entre sesiones de fuerza y empieza con menos vueltas de las que crees poder hacer. Mantén las señales para detenerse.';

const TEXTO_ORIGEN: Record<OrigenPauta, string> = { profesional: 'Me la entregó un profesional', propia: 'La armé yo' };

// ---------- Pauta ----------

export const textoOrigen = (pauta: PautaPropia) => (pauta.origen === 'profesional' ? 'Entregada por un profesional' : 'Armada por ti');

export function VistaPauta({ pauta }: { pauta: PautaPropia }) {
  return (
    <>
      {pauta.comidas.map((c, i) => (
        <Tarjeta key={`${c.nombre}-${i}`}>
          <Subtitulo>{c.nombre || `Comida ${i + 1}`}</Subtitulo>
          {c.detalle ? <Texto>{c.detalle}</Texto> : <Pequeno>Sin detalle.</Pequeno>}
        </Tarjeta>
      ))}
      {pauta.notas ? (
        <Aviso tipo="info">
          <Pequeno tono="normal">{pauta.notas}</Pequeno>
        </Aviso>
      ) : null}
      {pauta.enlace ? (
        <Boton titulo="Abrir el documento original" variante="secundario" icono="open-outline" onPress={() => Linking.openURL(pauta.enlace).catch(() => undefined)} />
      ) : null}
    </>
  );
}

export function EditorPauta({ inicial, onGuardar, onCancelar }: { inicial: PautaPropia; onGuardar: (p: PautaPropia) => void; onCancelar?: () => void }) {
  const [b, setB] = useState<PautaPropia>(inicial);
  const comida = (i: number, cambios: Partial<PautaPropia['comidas'][number]>) =>
    setB({ ...b, comidas: b.comidas.map((c, j) => (j === i ? { ...c, ...cambios } : c)) });
  const enlaceMal = b.enlace.trim().length > 0 && !enlaceValido(b.enlace.trim());
  const lista = normalizarPauta(b);
  return (
    <View style={{ gap: Spacing.l }}>
      <Opciones<OrigenPauta>
        etiqueta="¿De dónde viene esta pauta?"
        opciones={(Object.keys(TEXTO_ORIGEN) as OrigenPauta[]).map((k) => ({ valor: k, texto: TEXTO_ORIGEN[k] }))}
        valor={b.origen}
        onCambio={(v) => setB({ ...b, origen: v as OrigenPauta })}
      />
      <CampoTexto etiqueta="Nombre de la pauta" valor={b.titulo} onCambio={(t) => setB({ ...b, titulo: t })} maxLength={LIMITES.titulo} placeholder="Pauta de mi nutricionista" />
      <Texto style={{ fontWeight: '700' }}>Comidas del día</Texto>
      <Pequeno>Escribe cada comida como te la indicaron: qué, cuánto y a qué hora si lo sabes. Puedes copiar el texto desde el documento. Las comidas que dejes sin detalle no se guardan.</Pequeno>
      {b.comidas.map((c, i) => (
        <Tarjeta key={i}>
          <CampoTexto etiqueta={`Comida ${i + 1}`} valor={c.nombre} onCambio={(t) => comida(i, { nombre: t })} maxLength={LIMITES.nombreComida} placeholder="Desayuno, almuerzo, colación…" />
          <CampoTexto etiqueta={`Qué comer en la comida ${i + 1}`} valor={c.detalle} onCambio={(t) => comida(i, { detalle: t })} multiline maxLength={LIMITES.detalle} placeholder="Por ejemplo: 1 taza de avena con fruta y 1 yogur natural" />
          {b.comidas.length > 1 ? <Boton titulo="Quitar esta comida" variante="secundario" onPress={() => setB({ ...b, comidas: b.comidas.filter((_, j) => j !== i) })} /> : null}
        </Tarjeta>
      ))}
      {b.comidas.length < LIMITES.comidas ? (
        <Boton titulo="Agregar una comida" variante="secundario" icono="add" onPress={() => setB({ ...b, comidas: [...b.comidas, { nombre: '', detalle: '' }] })} />
      ) : null}
      <CampoTexto etiqueta="Indicaciones generales" valor={b.notas} onCambio={(t) => setB({ ...b, notas: t })} multiline maxLength={LIMITES.notas} placeholder="Agua, horarios, qué evitar, cuándo es el próximo control…" />
      <CampoTexto
        etiqueta="Enlace al documento original (opcional)"
        ayuda="Si tu pauta está en un PDF o una foto guardados en la nube, pega aquí la dirección para abrirla desde la app."
        valor={b.enlace}
        onCambio={(t) => setB({ ...b, enlace: t })}
        maxLength={LIMITES.enlace}
        placeholder="https://…"
      />
      {enlaceMal ? <Pequeno tono="alerta">El enlace debe empezar con http:// o https://.</Pequeno> : null}
      {!lista ? <Pequeno tono="alerta">Escribe el detalle de al menos una comida para guardar.</Pequeno> : null}
      <Boton titulo="Guardar pauta" icono="checkmark" deshabilitado={!lista || enlaceMal} onPress={() => lista && onGuardar(normalizarPauta({ ...b, enlace: enlaceMal ? '' : b.enlace }) ?? lista)} />
      {onCancelar ? <Boton titulo="Cancelar" variante="secundario" onPress={onCancelar} /> : null}
    </View>
  );
}

// ---------- Rutina ----------

type ItemBorrador = { nombre: string; cantidad: string; unidad: 'reps' | 'seg' };
type SesionBorrador = { id: IdSesionRutina; nombre: string; vueltas: number; items: ItemBorrador[] };
type Borrador = { nombre: string; sesiones: SesionBorrador[]; notas: string };

const aBorrador = (r: RutinaPropia): Borrador => ({
  nombre: r.nombre,
  sesiones: r.sesiones.map((s) => ({ ...s, items: s.items.map((it) => ({ ...it, cantidad: String(it.cantidad) })) })),
  notas: r.notas,
});

const aRutina = (b: Borrador): RutinaPropia | null =>
  normalizarRutina({
    nombre: b.nombre,
    sesiones: b.sesiones.map((s) => ({ ...s, items: s.items.map((it) => ({ ...it, cantidad: parseInt(it.cantidad, 10) })) })),
    notas: b.notas,
  });

const itemCompleto = (it: ItemBorrador) => it.nombre.trim().length > 0 && parseInt(it.cantidad, 10) >= 1;

export function EditorRutina({ inicial, onGuardar, onCancelar }: { inicial: RutinaPropia; onGuardar: (r: RutinaPropia) => void; onCancelar?: () => void }) {
  const [b, setB] = useState<Borrador>(() => aBorrador(inicial));
  const sesion = (i: number, cambios: Partial<SesionBorrador>) => setB({ ...b, sesiones: b.sesiones.map((s, j) => (j === i ? { ...s, ...cambios } : s)) });
  const item = (i: number, k: number, cambios: Partial<ItemBorrador>) =>
    sesion(i, { items: b.sesiones[i].items.map((it, l) => (l === k ? { ...it, ...cambios } : it)) });
  const completa = b.sesiones.length > 0 && b.sesiones.every((s) => s.items.length > 0 && s.items.every(itemCompleto));
  const rutina = completa ? aRutina(b) : null;
  return (
    <View style={{ gap: Spacing.l }}>
      <CampoTexto etiqueta="Nombre de la rutina" valor={b.nombre} onCambio={(t) => setB({ ...b, nombre: t })} maxLength={LIMITES.nombreRutina} placeholder="Mi rutina, rutina del gimnasio…" />
      <Pequeno>Hasta tres sesiones por semana, además de las de tu programa. En cada una escribe los ejercicios en orden, con repeticiones o segundos; los ejercicios por segundos tienen cronómetro.</Pequeno>
      {b.sesiones.map((s, i) => (
        <Tarjeta key={s.id}>
          <Etiqueta>Sesión {s.id}</Etiqueta>
          <CampoTexto etiqueta={`Nombre de la sesión ${s.id}`} valor={s.nombre} onCambio={(t) => sesion(i, { nombre: t })} maxLength={LIMITES.nombreRutina} placeholder="Piernas, tren superior, circuito…" />
          <Opciones<number>
            etiqueta="Vueltas"
            opciones={Array.from({ length: LIMITES.vueltasMax }, (_, v) => ({ valor: v + 1, texto: String(v + 1) }))}
            valor={s.vueltas}
            onCambio={(v) => sesion(i, { vueltas: v as number })}
          />
          <Separador />
          {s.items.map((it, k) => (
            <View key={k} style={{ gap: Spacing.s }}>
              <Texto style={{ fontWeight: '700' }}>Ejercicio {k + 1}</Texto>
              <CampoTexto etiqueta={`Nombre del ejercicio ${k + 1} de la sesión ${s.id}`} compacto valor={it.nombre} onCambio={(t) => item(i, k, { nombre: t })} maxLength={LIMITES.nombreEjercicio} placeholder="Sentadilla, caminata en cinta, plancha…" />
              <Fila style={{ alignItems: 'flex-end' }}>
                <View style={{ width: 110 }}>
                  <CampoTexto etiqueta={`Cantidad del ejercicio ${k + 1} de la sesión ${s.id}`} compacto numerico valor={it.cantidad} onCambio={(t) => item(i, k, { cantidad: t.replace(/\D/g, '').slice(0, 3) })} placeholder="12" />
                </View>
                <Opciones<'reps' | 'seg'>
                  etiqueta="Unidad"
                  opciones={[{ valor: 'reps', texto: 'repeticiones' }, { valor: 'seg', texto: 'segundos' }]}
                  valor={it.unidad}
                  onCambio={(v) => item(i, k, { unidad: v as 'reps' | 'seg' })}
                />
              </Fila>
              {!itemCompleto(it) ? <Pequeno tono="alerta">Falta el nombre o la cantidad.</Pequeno> : null}
              <Boton titulo="Quitar ejercicio" variante="secundario" onPress={() => sesion(i, { items: s.items.filter((_, l) => l !== k) })} />
              <Separador />
            </View>
          ))}
          {s.items.length < LIMITES.itemsPorSesion ? (
            <Boton titulo="Agregar ejercicio" variante="secundario" icono="add" onPress={() => sesion(i, { items: [...s.items, { nombre: '', cantidad: '', unidad: 'reps' }] })} />
          ) : null}
          {b.sesiones.length > 1 ? <Boton titulo={`Quitar la sesión ${s.id}`} variante="secundario" onPress={() => setB({ ...b, sesiones: b.sesiones.filter((_, j) => j !== i).map((x, j) => ({ ...x, id: IDS_SESION[j] })) })} /> : null}
        </Tarjeta>
      ))}
      {b.sesiones.length < LIMITES.sesiones ? (
        <Boton
          titulo="Agregar una sesión"
          variante="secundario"
          icono="add"
          onPress={() => setB({ ...b, sesiones: [...b.sesiones, { id: IDS_SESION[b.sesiones.length], nombre: '', vueltas: 1, items: [] }] })}
        />
      ) : null}
      <CampoTexto etiqueta="Notas (opcional)" valor={b.notas} onCambio={(t) => setB({ ...b, notas: t })} multiline maxLength={LIMITES.notas} placeholder="Indicaciones de tu kinesiólogo o entrenador, pesos que usas…" />
      {!completa ? <Pequeno tono="alerta">Cada sesión necesita al menos un ejercicio con nombre y cantidad.</Pequeno> : null}
      <Boton titulo="Guardar rutina" icono="checkmark" deshabilitado={!rutina} onPress={() => rutina && onGuardar(rutina)} />
      {onCancelar ? <Boton titulo="Cancelar" variante="secundario" onPress={onCancelar} /> : null}
    </View>
  );
}
