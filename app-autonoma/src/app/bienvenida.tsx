import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';
import { hoyISO } from '@/logic/programa';
import { evaluarSeguridad } from '@/logic/seguridad';
import type { PreferenciasCocina, PreferenciasEjercicio, RespuestasSeguridad, ResultadoSeguridad } from '@/logic/tipos';
import { COCINA_INICIAL, EJERCICIO_INICIAL, useApp } from '@/state/app-state';
import { EditorCocina, EditorEjercicio } from '@/ui/editores';
import { Aviso, Boton, Cinta, Etiqueta, Pantalla, Pequeno, SiNo, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

type Paso = 'inicio' | 'seguridad' | 'resultado' | 'cocina' | 'ejercicio';

const PREGUNTAS: { clave: keyof RespuestasSeguridad; texto: string }[] = [
  { clave: 'mayorEdad', texto: '¿Tienes 18 años o más?' },
  { clave: 'embarazoLactancia', texto: '¿Estás embarazada o amamantando?' },
  { clave: 'sintomasEsfuerzo', texto: '¿Has tenido dolor o presión en el pecho, falta de aire desproporcionada, mareos o desmayos al hacer esfuerzo?' },
  { clave: 'enfermedadConocida', texto: '¿Tienes diagnóstico de enfermedad del corazón, diabetes o enfermedad renal?' },
  { clave: 'insulinaSulfonilurea', texto: '¿Usas insulina o pastillas para la diabetes del grupo de las sulfonilureas (por ejemplo glibenclamida o glimepirida)?' },
  { clave: 'conductaAlimentaria', texto: '¿Has tenido atracones con sensación de pérdida de control, o has usado vómitos, laxantes o ayunos largos para compensar lo que comes?' },
];

export default function Bienvenida() {
  const { guardarPerfil } = useApp();
  const p = usePaleta();
  const [paso, setPaso] = useState<Paso>('inicio');
  const [respuestas, setRespuestas] = useState<Partial<RespuestasSeguridad>>({});
  const [resultado, setResultado] = useState<ResultadoSeguridad | null>(null);
  const [nombre, setNombre] = useState('');
  const [cocina, setCocina] = useState<PreferenciasCocina>(COCINA_INICIAL);
  const [ejercicio, setEjercicio] = useState<PreferenciasEjercicio>(EJERCICIO_INICIAL);

  const completas = PREGUNTAS.every((q) => respuestas[q.clave] !== undefined);

  const terminar = (seg: ResultadoSeguridad) => {
    guardarPerfil({
      nombre: nombre.trim(),
      inicio: hoyISO(),
      seguridad: seg,
      confirmaEjercicio: false,
      confirmaAlimentacion: false,
      cocina,
      ejercicio,
    });
    router.replace('/');
  };

  const siguienteTrasSeguridad = (seg: ResultadoSeguridad) => {
    if (seg.alimentacion !== 'bloqueado') return setPaso('cocina');
    if (seg.ejercicio !== 'bloqueado') return setPaso('ejercicio');
    return terminar(seg);
  };

  if (paso === 'inicio') {
    return (
      <Pantalla>
        <Etiqueta tono="acento">Ruta 90</Etiqueta>
        <Titulo>Empieza a moverte y a comer mejor, a tu ritmo</Titulo>
        <Cinta semana={0} />
        <Texto>Durante 12 semanas tendrás:</Texto>
        <Tarjeta>
          <Texto>Una clase corta cada semana.</Texto>
          <Texto>Tres sesiones de ejercicio en casa, de 10, 20 o 30 minutos.</Texto>
          <Texto>Un menú para cocinar una vez a la semana según tu tiempo, tu cocina y lo que no comes, con su lista de compras.</Texto>
        </Tarjeta>
        <Aviso>
          <Pequeno tono="normal">
            Esta app entrega educación general y no reemplaza la atención de un profesional de la salud. Tus respuestas se guardan solo en este teléfono.
          </Pequeno>
        </Aviso>
        <Boton titulo="Empezar" onPress={() => setPaso('seguridad')} />
      </Pantalla>
    );
  }

  if (paso === 'seguridad') {
    return (
      <Pantalla>
        <Etiqueta>Paso 1 de 3</Etiqueta>
        <Titulo>Antes de empezar</Titulo>
        <Texto tono="suave">Estas preguntas sirven para saber si puedes usar la app sin supervisión. Tus respuestas no salen de tu teléfono.</Texto>
        {PREGUNTAS.map((q) => (
          <SiNo
            key={q.clave}
            pregunta={q.texto}
            valor={respuestas[q.clave]}
            onCambio={(v) => setRespuestas((r) => ({ ...r, [q.clave]: v }))}
          />
        ))}
        <Boton
          titulo="Continuar"
          deshabilitado={!completas}
          onPress={() => {
            const seg = evaluarSeguridad(respuestas as RespuestasSeguridad);
            setResultado(seg);
            if (!seg.apta || seg.mensajes.length > 0) setPaso('resultado');
            else siguienteTrasSeguridad(seg);
          }}
        />
        {!completas ? <Pequeno>Responde todas las preguntas para continuar.</Pequeno> : null}
      </Pantalla>
    );
  }

  if (paso === 'resultado' && resultado) {
    if (!resultado.apta) {
      return (
        <Pantalla>
          <Titulo>Esta app no es para ti por ahora</Titulo>
          {resultado.mensajes.map((m) => (
            <Aviso key={m} tipo="alerta"><Texto>{m}</Texto></Aviso>
          ))}
          <Boton titulo="Volver" variante="secundario" onPress={() => setPaso('seguridad')} />
        </Pantalla>
      );
    }
    return (
      <Pantalla>
        <Titulo>Lo que debes saber</Titulo>
        {resultado.mensajes.map((m) => (
          <Aviso key={m} tipo="alerta"><Texto>{m}</Texto></Aviso>
        ))}
        <Texto tono="suave">Puedes seguir y usar lo que está disponible para ti.</Texto>
        <Boton titulo="Continuar" onPress={() => siguienteTrasSeguridad(resultado)} />
        <Boton titulo="Corregir respuestas" variante="secundario" onPress={() => setPaso('seguridad')} />
      </Pantalla>
    );
  }

  if (paso === 'cocina') {
    return (
      <Pantalla>
        <Etiqueta>Paso 2 de 3</Etiqueta>
        <Titulo>Tu cocina</Titulo>
        <View style={{ gap: Spacing.s }}>
          <Subtitulo>¿Cómo te llamamos?</Subtitulo>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre (opcional)"
            placeholderTextColor={p.ink2}
            autoComplete="given-name"
            accessibilityLabel="Tu nombre"
            style={{ borderWidth: 1, borderColor: p.line, borderRadius: 6, padding: 12, fontSize: 16, color: p.ink, backgroundColor: p.surface }}
          />
        </View>
        <EditorCocina valor={cocina} onCambio={setCocina} />
        <Boton
          titulo="Continuar"
          onPress={() => (resultado && resultado.ejercicio !== 'bloqueado' ? setPaso('ejercicio') : resultado && terminar(resultado))}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <Etiqueta>Paso 3 de 3</Etiqueta>
      <Titulo>Tu ejercicio</Titulo>
      <EditorEjercicio valor={ejercicio} onCambio={setEjercicio} />
      <Boton titulo="Crear mi plan" onPress={() => resultado && terminar(resultado)} />
    </Pantalla>
  );
}
