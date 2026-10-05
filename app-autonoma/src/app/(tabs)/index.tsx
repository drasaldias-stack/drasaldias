import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { usePaleta } from '@/hooks/use-paleta';
import { listaCompras } from '@/logic/compras';
import { MINUTOS_ORGANIZACION } from '@/logic/menu';
import { SEMANAS_PROGRAMA } from '@/logic/programa';
import { COMPONENTES } from '@/content/componentes';
import { useApp } from '@/state/app-state';
import { accesoEjercicio, accesoMenu, claseSugerida, programaTerminado, resumenSemana } from '@/state/derivados';
import { Aviso, Boton, Chip, Cinta, Etiqueta, Fila, Pantalla, Pequeno, Subtitulo, Tarjeta, Texto, Titulo } from '@/ui/kit';

export default function Hoy() {
  const { estado, semana, menuActual, cambiarCaminata, reiniciarPrograma } = useApp();
  const p = usePaleta();
  const perfil = estado.perfil!;
  const terminado = programaTerminado(semana);
  const { sesiones, caminata, diasCaminata, programa } = resumenSemana(estado, semana);
  const proxima = sesiones.find((s) => !s.hecha);
  const hechas = sesiones.filter((s) => s.hecha).length;
  const clase = claseSugerida(estado, semana);

  let comprasTexto = '';
  if (menuActual?.ok) {
    const lista = listaCompras(menuActual.menu, COMPONENTES, perfil.cocina.personas);
    const items = lista.categorias.flatMap((c) => c.items);
    const marcados = items.filter((i) => estado.compras[`${semana}|${i.clave}`]).length;
    comprasTexto = `${marcados} de ${items.length} productos marcados`;
  }

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
          <Texto>Puedes repetir el programa con otro nivel de ejercicio o seguir usando los menús. Las sesiones siguen disponibles con la última progresión.</Texto>
          <Boton titulo="Empezar un nuevo ciclo" variante="secundario" onPress={reiniciarPrograma} />
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <Fila style={{ justifyContent: 'space-between' }}>
          <Etiqueta>Ejercicio · {programa.nombre}</Etiqueta>
          <Chip texto={`${hechas} de ${sesiones.length} sesiones`} tono={hechas === sesiones.length ? 'ok' : 'acento'} />
        </Fila>
        {accesoEjercicio(perfil) ? (
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
            <View style={{ gap: Spacing.s, marginTop: Spacing.s }}>
              <Fila style={{ justifyContent: 'space-between' }}>
                <Fila>
                  <Ionicons name="walk-outline" size={20} color={p.accent} />
                  <Texto>Caminata: {caminata.minutosDia} min, {caminata.dias} días</Texto>
                </Fila>
                <Contador
                  valor={diasCaminata}
                  maximo={7}
                  onMenos={() => cambiarCaminata(semana, -1, 7)}
                  onMas={() => cambiarCaminata(semana, 1, 7)}
                />
              </Fila>
              <Pequeno>{diasCaminata} de {caminata.dias} días esta semana. {caminata.texto}</Pequeno>
            </View>
          </>
        ) : (
          <Aviso tipo="alerta">
            <Texto>El ejercicio está desactivado por tus respuestas iniciales. Revisa el detalle en Perfil.</Texto>
          </Aviso>
        )}
      </Tarjeta>

      {clase ? (
        <Tarjeta onPress={() => router.push(`/clase/${clase.clase.id}`)} accesible={`Clase: ${clase.clase.titulo}`}>
          <Fila style={{ justifyContent: 'space-between' }}>
            <Etiqueta>Clase de la semana</Etiqueta>
            {clase.vista ? <Chip texto="Vista" tono="ok" /> : <Chip texto="Nueva" tono="acento" />}
          </Fila>
          <Subtitulo>{clase.clase.titulo}</Subtitulo>
          <Pequeno>{clase.clase.minutos} minutos · {clase.clase.resumen}</Pequeno>
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <Etiqueta>Menú de la semana</Etiqueta>
        {!accesoMenu(perfil) ? (
          <Aviso tipo="alerta">
            <Texto>Los menús están desactivados por tus respuestas iniciales. Revisa el detalle en Perfil.</Texto>
          </Aviso>
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
      disabled={deshabilitado}
      onPress={accion}
      hitSlop={8}
      style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center', opacity: deshabilitado ? 0.4 : 1 }}>
      <Ionicons name={icono} size={20} color={p.accent} />
    </Pressable>
  );
  return (
    <Fila>
      {boton('remove', onMenos, 'Restar un día de caminata', valor <= 0)}
      <Texto style={{ minWidth: 20, textAlign: 'center', fontWeight: '700', fontVariant: ['tabular-nums'] }}>{valor}</Texto>
      {boton('add', onMas, 'Sumar un día de caminata', valor >= maximo)}
    </Fila>
  );
}
