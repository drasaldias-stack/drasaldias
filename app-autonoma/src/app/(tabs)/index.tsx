import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { COMPONENTES } from '@/content/componentes';
import { usePaleta } from '@/hooks/use-paleta';
import { listaCompras } from '@/logic/compras';
import { MINUTOS_ORGANIZACION } from '@/logic/menu';
import { hoyISO, SEMANAS_PROGRAMA } from '@/logic/programa';
import { textoAvisoRespaldo } from '@/logic/respaldo';
import { textosConfirmacion } from '@/logic/seguridad';
import { useApp } from '@/state/app-state';
import { accesoEjercicio, accesoMenu, claseSugerida, programaTerminado, resumenSemana } from '@/state/derivados';
import { Aviso, Boton, Chip, Cinta, Etiqueta, Fila, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

export default function Hoy() {
  const { estado, semana, menuActual, cambiarCaminata, reiniciarPrograma } = useApp();
  const p = usePaleta();
  const perfil = estado.perfil!;
  const [confirmarCiclo, setConfirmarCiclo] = useState(false);
  const terminado = programaTerminado(semana);
  const { sesiones, caminata, diasCaminata, programa, propias } = resumenSemana(estado, semana);
  const proxima = sesiones.find((s) => !s.hecha);
  const hechas = sesiones.filter((s) => s.hecha).length;
  const proximaPropia = propias.find((s) => !s.hecha);
  const hechasPropias = propias.filter((s) => s.hecha).length;
  const clase = claseSugerida(estado, semana);
  const ejercicioOk = accesoEjercicio(perfil);
  const menuOk = accesoMenu(perfil);
  const claseAntes = semana === 1 && clase && !clase.vista;
  const avisoRespaldo = textoAvisoRespaldo(estado.respaldo.ultimo, hoyISO());

  let comprasTexto = '';
  if (menuOk && menuActual?.ok) {
    const lista = listaCompras(menuActual.menu, COMPONENTES, perfil.cocina.personas);
    const items = lista.categorias.flatMap((c) => c.items);
    const marcados = items.filter((i) => estado.compras[`${semana}|${i.clave}`]).length;
    comprasTexto = `${marcados} de ${items.length} productos marcados`;
  }

  const tarjetaClase = clase ? (
    <Tarjeta onPress={() => router.push(`/clase/${clase.clase.id}`)} accesible={`Clase ${clase.clase.titulo}, ${clase.vista ? 'vista' : 'nueva'}, ${clase.clase.minutos} minutos`}>
      <Fila style={{ justifyContent: 'space-between' }}>
        <Etiqueta>{claseAntes ? 'Empieza por aquí' : 'Clase de la semana'}</Etiqueta>
        {clase.vista ? <Chip texto="Vista" tono="ok" /> : <Chip texto="Nueva" tono="acento" />}
      </Fila>
      <Fila style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <View style={{ flex: 1, gap: Spacing.xs }}>
          <Subtitulo>{clase.clase.titulo}</Subtitulo>
          <Pequeno>{clase.clase.minutos} min{clase.clase.videoUrl ? '' : ' de lectura'} · {clase.clase.resumen}</Pequeno>
        </View>
        <Ionicons aria-hidden name="chevron-forward" size={24} color={p.ink2} />
      </Fila>
    </Tarjeta>
  ) : null;

  const bloqueo = (seccion: 'ejercicio' | 'alimentacion', queSi: string) => {
    const estadoSeccion = perfil.seguridad[seccion];
    if (estadoSeccion === 'requiere_confirmacion') {
      return (
        <>
          <Aviso tipo="info">
            <Texto>
              Falta un paso: cuando {textosConfirmacion(perfil.seguridad, seccion).pendiente}, márcalo en Perfil y esta sección se activa.
            </Texto>
          </Aviso>
          <Boton titulo="Ir a Perfil" variante="secundario" onPress={() => router.push('/perfil')} />
        </>
      );
    }
    return (
      <Aviso tipo="alerta">
        <Texto>Por tus respuestas iniciales, {seccion === 'ejercicio' ? 'los programas de ejercicio' : 'los menús'} no están disponibles en esta app. {queSi}</Texto>
      </Aviso>
    );
  };

  return (
    <Pantalla>
      <View style={{ gap: Spacing.s }}>
        <Etiqueta>{terminado ? 'Programa completado' : `Semana ${semana} de ${SEMANAS_PROGRAMA}`}</Etiqueta>
        <Titulo>{perfil.nombre ? `Hola, ${perfil.nombre}` : 'Hola'}</Titulo>
        <Cinta semana={terminado ? SEMANAS_PROGRAMA : semana - 0.5} />
      </View>

      {terminado ? (
        <Tarjeta>
          <Subtitulo>Completaste las 12 semanas</Subtitulo>
          <Texto>
            Puedes seguir usando los menús y las sesiones con la última progresión, o empezar un nuevo ciclo. Un nuevo ciclo vuelve a la semana 1 y borra las marcas de sesiones, clases y caminatas; tus preferencias se mantienen.
          </Texto>
          {confirmarCiclo ? (
            <>
              <Boton titulo="Sí, empezar de nuevo" variante="peligro" onPress={() => { reiniciarPrograma(); setConfirmarCiclo(false); }} />
              <Boton titulo="Cancelar" variante="secundario" onPress={() => setConfirmarCiclo(false)} />
            </>
          ) : (
            <Boton titulo="Empezar un nuevo ciclo" variante="secundario" onPress={() => setConfirmarCiclo(true)} />
          )}
        </Tarjeta>
      ) : null}

      {claseAntes ? tarjetaClase : null}

      <Tarjeta>
        <Fila style={{ justifyContent: 'space-between' }}>
          <Etiqueta>{ejercicioOk ? `Ejercicio · ${programa.nombre}` : 'Ejercicio'}</Etiqueta>
          {ejercicioOk ? <Chip texto={`${hechas} de ${sesiones.length} sesiones`} tono={hechas === sesiones.length ? 'ok' : 'acento'} /> : null}
        </Fila>
        {ejercicioOk ? (
          <>
            {proxima ? (
              <>
                <Subtitulo>Sesión {proxima.sesion.id}: {proxima.sesion.nombre}</Subtitulo>
                <Pequeno>{perfil.ejercicio.minutos} minutos · en casa</Pequeno>
                <Boton titulo="Empezar sesión" icono="play" onPress={() => router.push(`/sesion/${proxima.sesion.id}`)} />
              </>
            ) : (
              <Texto>Hiciste las tres sesiones de esta semana. La próxima semana sigue la progresión.</Texto>
            )}
            {propias.length > 0 ? (
              <View style={{ gap: Spacing.s, marginTop: Spacing.s }}>
                <Fila style={{ justifyContent: 'space-between' }}>
                  <Texto style={{ fontWeight: '700' }}>{perfil.rutina?.nombre ?? 'Mi rutina'}</Texto>
                  <Chip texto={`${hechasPropias} de ${propias.length} ${propias.length === 1 ? 'sesión' : 'sesiones'}`} tono={hechasPropias === propias.length ? 'ok' : 'neutro'} />
                </Fila>
                {proximaPropia ? (
                  <Boton titulo={`Empezar ${proximaPropia.sesion.nombre}`} variante="secundario" icono="play" onPress={() => router.push(`/sesion/${proximaPropia.sesion.id}`)} />
                ) : (
                  <Pequeno>Hiciste todas las sesiones de tu rutina esta semana.</Pequeno>
                )}
              </View>
            ) : null}
            <View style={{ gap: Spacing.s, marginTop: Spacing.s }}>
              <Fila style={{ justifyContent: 'space-between' }}>
                <Fila>
                  <Ionicons aria-hidden name="walk-outline" size={20} color={p.accent} />
                  <Texto>Caminata: {caminata.minutosDia} min, {caminata.dias} días</Texto>
                </Fila>
              </Fila>
              <Fila style={{ justifyContent: 'space-between' }}>
                <Texto style={{ fontWeight: '700' }}>Días que caminaste</Texto>
                <Contador
                  valor={diasCaminata}
                  maximo={7}
                  onMenos={() => cambiarCaminata(semana, -1, 7)}
                  onMas={() => cambiarCaminata(semana, 1, 7)}
                />
              </Fila>
              <Pequeno>
                {diasCaminata > caminata.dias
                  ? `Superaste la meta de ${caminata.dias} días. `
                  : `Llevas ${diasCaminata} de ${caminata.dias} días. `}
                {caminata.texto}
              </Pequeno>
            </View>
          </>
        ) : (
          bloqueo('ejercicio', 'Las clases y los menús sí.')
        )}
      </Tarjeta>

      {!claseAntes ? tarjetaClase : null}

      <Tarjeta>
        <Etiqueta>Menú de la semana</Etiqueta>
        {!menuOk ? (
          bloqueo('alimentacion', 'Te recomendamos la orientación de un profesional.')
        ) : menuActual?.ok ? (
          <>
            <Subtitulo>Una sesión de cocina de unos {menuActual.menu.minutos} minutos</Subtitulo>
            <Pequeno>
              Incluye {MINUTOS_ORGANIZACION} minutos para organizarte y limpiar. Rinde almuerzos o cenas y desayunos para 5 días, para{' '}
              {perfil.cocina.personas} {perfil.cocina.personas === 1 ? 'persona' : 'personas'}.
            </Pequeno>
            <Fila>
              <View style={{ flexGrow: 1 }}>
                <Boton titulo="Ver menú" onPress={() => router.push('/menu')} />
              </View>
              <View style={{ flexGrow: 1 }}>
                <Boton titulo="Lista de compras" variante="secundario" icono="cart-outline" onPress={() => router.push('/compras')} />
              </View>
            </Fila>
            <Pequeno>{comprasTexto}</Pequeno>
          </>
        ) : (
          <Texto>Con tus filtros actuales no hay recetas suficientes. Ajusta los filtros en la pestaña Menú.</Texto>
        )}
      </Tarjeta>

      {menuOk && perfil.pauta ? (
        <Tarjeta onPress={() => router.push('/pauta')} accesible={`Tu pauta: ${perfil.pauta.titulo}`}>
          <Etiqueta>Tu pauta</Etiqueta>
          <Fila style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <View style={{ flex: 1, gap: Spacing.xs }}>
              <Subtitulo>{perfil.pauta.titulo}</Subtitulo>
              <Pequeno>
                {perfil.pauta.comidas.length} {perfil.pauta.comidas.length === 1 ? 'comida' : 'comidas'} · {perfil.pauta.origen === 'profesional' ? 'entregada por un profesional' : 'armada por ti'}
              </Pequeno>
            </View>
            <Ionicons aria-hidden name="chevron-forward" size={24} color={p.ink2} />
          </Fila>
        </Tarjeta>
      ) : null}

      {avisoRespaldo ? <Pequeno>{avisoRespaldo}</Pequeno> : null}
      <Pequeno>Educación general sobre alimentación y actividad física. No reemplaza la atención de un profesional de la salud.</Pequeno>
    </Pantalla>
  );
}

function Contador({ valor, maximo, onMenos, onMas }: { valor: number; maximo: number; onMenos: () => void; onMas: () => void }) {
  const p = usePaleta();
  const boton = (icono: 'remove' | 'add', accion: () => void, etiqueta: string, deshabilitado: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      aria-disabled={deshabilitado}
      disabled={deshabilitado}
      onPress={accion}
      hitSlop={6}
      style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center', opacity: deshabilitado ? 0.4 : 1 }}>
      <Ionicons aria-hidden name={icono} size={22} color={p.accent} />
    </Pressable>
  );
  return (
    <Fila style={{ gap: Spacing.m }}>
      {boton('remove', onMenos, 'Quitar un día caminado', valor <= 0)}
      <Texto style={{ minWidth: 24, textAlign: 'center', fontWeight: '700', fontSize: 20, fontVariant: ['tabular-nums'] }}>{valor}</Texto>
      {boton('add', onMas, 'Sumar un día caminado', valor >= maximo)}
    </Fila>
  );
}
