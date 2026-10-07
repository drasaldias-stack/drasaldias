import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';
import { hoyISO } from '@/logic/programa';
import { evaluarSeguridad } from '@/logic/seguridad';
import type { PreferenciasCocina, PreferenciasEjercicio, RespuestasSeguridad, ResultadoSeguridad } from '@/logic/tipos';
import { COCINA_INICIAL, EJERCICIO_INICIAL, useApp } from '@/state/app-state';
import { EditorCocina, EditorEjercicio } from '@/ui/editores';
import { Aviso, Boton, Cinta, Etiqueta, Pantalla, Pequeno, SiNo, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';
import { RestaurarRespaldo } from '@/ui/respaldo';

type Paso = 'inicio' | 'restaurar' | 'seguridad' | 'resultado' | 'cocina' | 'ejercicio';

const mismoConjunto = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));

export const PREGUNTAS: { clave: keyof RespuestasSeguridad; texto: string }[] = [
  { clave: 'mayorEdad', texto: '¿Tienes 18 años o más?' },
  { clave: 'embarazoLactancia', texto: '¿Estás embarazada o amamantando?' },
  {
    clave: 'sintomasEsfuerzo',
    texto:
      '¿Has tenido dolor o presión en el pecho, cuello, mandíbula o brazos; falta de aire en reposo o con esfuerzos pequeños; mareos o desmayos con el esfuerzo; o palpitaciones o latidos irregulares que te preocupen?',
  },
  {
    clave: 'enfermedadConocida',
    texto:
      '¿Tienes diagnóstico de enfermedad del corazón o de los vasos sanguíneos (por ejemplo infarto, angina, insuficiencia cardiaca, accidente cerebrovascular o arterias tapadas en las piernas), diabetes o enfermedad renal?',
  },
  { clave: 'insulinaSulfonilurea', texto: '¿Usas insulina o pastillas para la diabetes del grupo de las sulfonilureas (por ejemplo glibenclamida o glimepirida)?' },
  {
    clave: 'conductaAlimentaria',
    texto:
      '¿Has tenido atracones con sensación de pérdida de control, o has usado vómitos, laxantes, ayunos largos o ejercicio excesivo para compensar lo que comes?',
  },
];

export default function Bienvenida() {
  const { estado, guardarPerfil, actualizarPerfil, borrarTodo, restaurarEstado } = useApp();
  const p = usePaleta();
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const perfilActual = estado.perfil;
  // Desde Perfil se entra en modo "revisar": solo se repiten las preguntas y se conservan fecha de inicio, nombre y preferencias.
  const revisar = modo === 'seguridad' && perfilActual != null;

  const [paso, setPaso] = useState<Paso>(revisar ? 'seguridad' : 'inicio');
  const [respuestas, setRespuestas] = useState<Partial<RespuestasSeguridad>>({});
  const [intento, setIntento] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSeguridad | null>(null);
  const [nombre, setNombre] = useState(perfilActual?.nombre ?? '');
  const [cocina, setCocina] = useState<PreferenciasCocina>(perfilActual?.cocina ?? COCINA_INICIAL);
  const [ejercicio, setEjercicio] = useState<PreferenciasEjercicio>(perfilActual?.ejercicio ?? EJERCICIO_INICIAL);

  const recienGuardado = useRef(false);

  // Con un perfil ya creado, esta pantalla solo se usa para revisar respuestas; por URL o enlace profundo vuelve a Hoy.
  if (perfilActual && !revisar && !recienGuardado.current) return <Redirect href="/" />;

  const pendientes = PREGUNTAS.filter((q) => respuestas[q.clave] === undefined);
  const volverAPerfil = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));

  const terminar = (seg: ResultadoSeguridad) => {
    if (revisar && perfilActual) {
      // Una confirmación ya marcada se conserva si lo que debe confirmarse no cambió.
      const previo = perfilActual.seguridad;
      // Un estado guardado sin motivos (versión anterior) solo puede comparar el estado de acceso.
      const igual = (sec: 'ejercicio' | 'alimentacion') =>
        previo[sec] === seg[sec] && (previo.motivos[sec].length === 0 || mismoConjunto(previo.motivos[sec], seg.motivos[sec]));
      actualizarPerfil({
        seguridad: seg,
        confirmaEjercicio: igual('ejercicio') && perfilActual.confirmaEjercicio,
        confirmaAlimentacion: igual('alimentacion') && perfilActual.confirmaAlimentacion,
      });
      volverAPerfil();
      return;
    }
    recienGuardado.current = true;
    guardarPerfil({
      nombre: nombre.trim(),
      inicio: hoyISO(),
      seguridad: seg,
      confirmaEjercicio: false,
      confirmaAlimentacion: false,
      cocina,
      ejercicio,
      pauta: null,
      rutina: null,
    });
    router.replace('/');
  };

  const siguienteTrasSeguridad = (seg: ResultadoSeguridad) => {
    if (revisar) return terminar(seg);
    if (seg.alimentacion !== 'bloqueado') return setPaso('cocina');
    if (seg.ejercicio !== 'bloqueado') return setPaso('ejercicio');
    return terminar(seg);
  };

  const totalPasos = resultado ? 1 + (resultado.alimentacion !== 'bloqueado' ? 1 : 0) + (resultado.ejercicio !== 'bloqueado' ? 1 : 0) : 3;

  const campoNombre = (
    <View style={{ gap: Spacing.s }}>
      <Subtitulo>¿Cómo te llamamos?</Subtitulo>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Tu nombre (opcional)"
        placeholderTextColor={p.ink2}
        autoComplete="given-name"
        accessibilityLabel="Tu nombre"
        style={{ borderWidth: 1, borderColor: p.line, borderRadius: 6, padding: 12, fontSize: 16, color: p.ink, backgroundColor: p.surface, minHeight: 46 }}
      />
    </View>
  );

  if (paso === 'inicio') {
    return (
      <Pantalla key={paso}>
        <Etiqueta tono="acento">Ruta 90</Etiqueta>
        <Titulo>Empieza a moverte y a comer mejor, a tu ritmo</Titulo>
        <Cinta semana={0} decorativa />
        <Texto>Durante 12 semanas tendrás:</Texto>
        <Tarjeta>
          <Texto>Una clase corta cada semana.</Texto>
          <Texto>Tres sesiones de ejercicio en casa, de 10, 20 o 30 minutos.</Texto>
          <Texto>Un menú para cocinar una vez a la semana según tu tiempo, tu cocina y lo que no comes, con su lista de compras.</Texto>
        </Tarjeta>
        <Aviso>
          <Pequeno tono="normal">
            Esta app entrega educación general y no reemplaza la atención de un profesional de la salud. Tus respuestas, preferencias y avances se guardan solo en este dispositivo.
          </Pequeno>
        </Aviso>
        <Boton titulo="Empezar" onPress={() => setPaso('seguridad')} />
        <Boton titulo="Tengo un código de respaldo" variante="secundario" icono="key-outline" onPress={() => setPaso('restaurar')} />
      </Pantalla>
    );
  }

  if (paso === 'restaurar') {
    return (
      <Pantalla key={paso}>
        <Etiqueta>Código de respaldo</Etiqueta>
        <Titulo>Recupera tu avance</Titulo>
        <Texto tono="suave">Pega el código de respaldo que creaste en Perfil en tu otro navegador o teléfono. Se restauran tus respuestas, tus preferencias y el avance que tenías el día en que creaste el código.</Texto>
        <RestaurarRespaldo
          alRestaurar={(e) => {
            recienGuardado.current = true;
            restaurarEstado(e);
            router.replace('/');
          }}
        />
        <Boton titulo="Volver" variante="secundario" onPress={() => setPaso('inicio')} />
      </Pantalla>
    );
  }

  if (paso === 'seguridad') {
    return (
      <Pantalla key={paso}>
        {revisar ? <Etiqueta>Revisar mis respuestas</Etiqueta> : <Etiqueta>Paso 1</Etiqueta>}
        <Titulo>{revisar ? 'Actualiza tus respuestas' : 'Antes de empezar'}</Titulo>
        <Texto tono="suave">
          {revisar
            ? 'Solo cambian tus respuestas de seguridad. Tu semana, tu nombre y tus preferencias se conservan.'
            : 'Estas preguntas sirven para saber si puedes usar la app sin supervisión. Tus respuestas no salen de tu dispositivo.'}
        </Texto>
        {!revisar ? campoNombre : null}
        {PREGUNTAS.map((q) => {
          const falta = intento && respuestas[q.clave] === undefined;
          return (
            <View key={q.clave} style={{ gap: Spacing.xs }}>
              <SiNo pregunta={q.texto} valor={respuestas[q.clave]} onCambio={(v) => setRespuestas((r) => ({ ...r, [q.clave]: v }))} />
              {falta ? <Pequeno tono="alerta">Falta responder esta pregunta.</Pequeno> : null}
            </View>
          );
        })}
        {intento && pendientes.length > 0 ? (
          <Pequeno tono="alerta">{pendientes.length === 1 ? 'Te falta 1 pregunta.' : `Te faltan ${pendientes.length} preguntas.`}</Pequeno>
        ) : null}
        <Boton
          titulo="Continuar"
          onPress={() => {
            if (pendientes.length > 0) {
              setIntento(true);
              return;
            }
            const seg = evaluarSeguridad(respuestas as RespuestasSeguridad);
            setResultado(seg);
            if (!seg.apta || seg.mensajes.length > 0) setPaso('resultado');
            else siguienteTrasSeguridad(seg);
          }}
        />
        {revisar ? <Boton titulo="Cancelar" variante="secundario" onPress={volverAPerfil} /> : null}
      </Pantalla>
    );
  }

  if (paso === 'resultado' && resultado) {
    if (!resultado.apta) {
      return (
        <Pantalla key={paso}>
          <Titulo>Esta app no es para ti por ahora</Titulo>
          {resultado.mensajes.map((m) => (
            <Aviso key={m} tipo="alerta"><Texto>{m}</Texto></Aviso>
          ))}
          {revisar ? (
            <Texto tono="suave">Estas respuestas no se guardaron. Puedes corregirlas, volver a Perfil sin cambios o borrar tus datos de este dispositivo.</Texto>
          ) : null}
          <Boton titulo={revisar ? 'Corregir respuestas' : 'Volver'} variante="secundario" onPress={() => setPaso('seguridad')} />
          {revisar ? <Boton titulo="Cancelar sin cambios" variante="secundario" onPress={volverAPerfil} /> : null}
          {revisar ? (
            <Boton
              titulo="Borrar mis datos y salir"
              variante="peligro"
              onPress={() => {
                borrarTodo();
                setRespuestas({});
                setResultado(null);
                setPaso('inicio');
              }}
            />
          ) : null}
        </Pantalla>
      );
    }
    return (
      <Pantalla key={paso}>
        <Titulo>Lo que debes saber</Titulo>
        {resultado.mensajes.map((m) => (
          <Aviso key={m} tipo="alerta"><Texto>{m}</Texto></Aviso>
        ))}
        <Texto tono="suave">
          {revisar
            ? 'Las secciones pendientes de confirmación se activan desde Perfil. Si cambió lo que debes confirmar, tendrás que marcarlo de nuevo.'
            : 'Puedes seguir y usar lo que está disponible para ti. Las secciones pendientes de confirmación se activan desde Perfil.'}
        </Texto>
        <Boton titulo={revisar ? 'Guardar respuestas' : 'Continuar'} onPress={() => siguienteTrasSeguridad(resultado)} />
        <Boton titulo="Corregir respuestas" variante="secundario" onPress={() => setPaso('seguridad')} />
      </Pantalla>
    );
  }

  if (paso === 'cocina') {
    return (
      <Pantalla key={paso}>
        <Etiqueta>Paso 2 de {totalPasos}</Etiqueta>
        <Titulo>Tu cocina</Titulo>
        <EditorCocina valor={cocina} onCambio={setCocina} />
        <Boton
          titulo={resultado && resultado.ejercicio !== 'bloqueado' ? 'Continuar' : 'Crear mi plan'}
          onPress={() => (resultado && resultado.ejercicio !== 'bloqueado' ? setPaso('ejercicio') : resultado && terminar(resultado))}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla key={paso}>
      <Etiqueta>Paso {totalPasos} de {totalPasos}</Etiqueta>
      <Titulo>Tu ejercicio</Titulo>
      <EditorEjercicio valor={ejercicio} onCambio={setEjercicio} />
      <Boton titulo="Crear mi plan" onPress={() => resultado && terminar(resultado)} />
    </Pantalla>
  );
}
