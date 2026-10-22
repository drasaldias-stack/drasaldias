// Versión y fecha de publicación que muestra Perfil, para saber qué versión está instalada en un teléfono.
// Los valores los fija scripts/publicar-pages.js al exportar (variables EXPO_PUBLIC_*, que Expo incrusta en el
// paquete): la versión de app.json y la fecha y el commit de la última confirmación que tocó app-autonoma. En
// desarrollo no existen y se muestra «versión de desarrollo».

export type InfoVersion = { version?: string; fecha?: string; commit?: string };

export const INFO_VERSION: InfoVersion = {
  version: process.env.EXPO_PUBLIC_VERSION,
  fecha: process.env.EXPO_PUBLIC_FECHA_PUBLICACION,
  commit: process.env.EXPO_PUBLIC_COMMIT,
};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** «2026-10-22» → «22 de octubre de 2026»; null si no es una fecha AAAA-MM-DD válida. */
export function fechaLarga(iso: string | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return null;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}

/** Línea que ve la persona en Perfil: «Ruta 90, versión 1.0.0, publicada el 22 de octubre de 2026 (9a5c784).» */
export function textoVersion(info: InfoVersion): string {
  const version = info.version ? `versión ${info.version}` : 'versión de desarrollo';
  const fecha = fechaLarga(info.fecha);
  const commit = info.commit ? ` (${info.commit})` : '';
  if (!fecha) return `Ruta 90, ${version}, copia sin publicar${commit}.`;
  return `Ruta 90, ${version}, publicada el ${fecha}${commit}.`;
}
