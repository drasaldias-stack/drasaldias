import { normalizar, type EstadoApp } from './estado';

// Código de respaldo: el estado completo, en JSON, codificado en texto (UTF-8 y base64 con alfabeto
// apto para URL, sin relleno) con un prefijo de versión. Sirve para llevar el avance a otro navegador
// o teléfono sin cuentas ni servidor. Contiene el resultado del filtro de seguridad, que es un dato
// de salud: la app lo advierte junto al botón que lo crea.
const PREFIJO = 'R90-1-';
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function utf8Codificar(texto: string): number[] {
  const bytes: number[] = [];
  for (const ch of texto) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp < 0x80) bytes.push(cp);
    else if (cp < 0x800) bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    else if (cp < 0x10000) bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    else bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
  }
  return bytes;
}

function utf8Decodificar(bytes: number[]): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    let cp: number;
    let n: number;
    if (b < 0x80) { cp = b; n = 0; }
    else if ((b & 0xe0) === 0xc0) { cp = b & 0x1f; n = 1; }
    else if ((b & 0xf0) === 0xe0) { cp = b & 0x0f; n = 2; }
    else if ((b & 0xf8) === 0xf0) { cp = b & 0x07; n = 3; }
    else throw new Error('utf8');
    for (let k = 1; k <= n; k++) {
      const c = bytes[i + k];
      if (c === undefined || (c & 0xc0) !== 0x80) throw new Error('utf8');
      cp = (cp << 6) | (c & 0x3f);
    }
    out += String.fromCodePoint(cp);
    i += n + 1;
  }
  return out;
}

function base64Codificar(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    out += ALFABETO[(n >> 18) & 63] + ALFABETO[(n >> 12) & 63];
    if (b !== undefined) out += ALFABETO[(n >> 6) & 63];
    if (c !== undefined) out += ALFABETO[n & 63];
  }
  return out;
}

function base64Decodificar(texto: string): number[] | null {
  const bytes: number[] = [];
  let acumulado = 0;
  let bits = 0;
  for (const ch of texto) {
    const v = ALFABETO.indexOf(ch);
    if (v < 0) return null;
    acumulado = (acumulado << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((acumulado >> bits) & 0xff);
      acumulado &= (1 << bits) - 1;
    }
  }
  return bytes;
}

export function codificarRespaldo(estado: EstadoApp): string {
  return PREFIJO + base64Codificar(utf8Codificar(JSON.stringify(estado)));
}

/** Intenta leer un estado válido con perfil desde bytes UTF-8 de JSON; null si no sirve. */
function leerEstado(bytes: number[]): EstadoApp | null {
  try {
    const estado = normalizar(JSON.parse(utf8Decodificar(bytes)));
    return estado.perfil ? estado : null;
  } catch {
    return null;
  }
}

/**
 * Devuelve el estado contenido en el código, ya validado, o null si el código no sirve.
 * Tolera espacios y saltos de línea dentro del código y texto alrededor (comillas, «Código:», un punto final,
 * una despedida pegada después o el mismo código pegado dos veces).
 */
export function decodificarRespaldo(texto: string): EstadoApp | null {
  const limpio = texto.replace(/\s+/g, '');
  const tramo = /R90-1-([A-Za-z0-9_-]+)/i.exec(limpio);
  if (!tramo) return null;
  const bytes = base64Decodificar(tramo[1]);
  if (!bytes) return null;
  // Si después del código hay texto con letras, el JSON termina antes: se prueba desde cada llave de cierre hacia atrás.
  let fin = bytes.length;
  while (fin > 0) {
    const estado = leerEstado(bytes.slice(0, fin));
    if (estado) return estado;
    fin = bytes.lastIndexOf(0x7d, fin - 2) + 1;
  }
  return null;
}

export type ResumenAvance = { sesiones: number; clases: number; caminatas: number; ultima: string | null };

/** Cuánto avance contiene un estado: sesiones y clases marcadas, días de caminata y la fecha más reciente de sesiones o clases. */
export function resumenAvance(estado: EstadoApp): ResumenAvance {
  const fechas = [...Object.values(estado.sesionesHechas), ...Object.values(estado.clasesVistas)].filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f));
  return {
    sesiones: Object.keys(estado.sesionesHechas).length,
    clases: Object.keys(estado.clasesVistas).length,
    caminatas: Object.values(estado.caminatas).reduce((a, b) => a + b, 0),
    ultima: fechas.length ? fechas.reduce((a, b) => (a > b ? a : b)) : null,
  };
}

const DIAS_RECORDATORIO_RESPALDO = 14;
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/** Recuerda crear un código de respaldo: siempre hasta el primero, y después solo cuando el último tiene más de dos semanas. */
export function textoAvisoRespaldo(ultimo: string | null, hoy: string): string | null {
  if (!ultimo) {
    return 'Tu avance se guarda solo en este navegador o teléfono. Crea un código de respaldo en Perfil; guarda tu avance hasta el día en que lo creas, así que conviene repetirlo cada cierto tiempo.';
  }
  if (diasEntre(ultimo, hoy) >= DIAS_RECORDATORIO_RESPALDO) {
    return `Tu último código de respaldo es del ${ultimo.split('-').reverse().join('-')}. Crea uno nuevo en Perfil para guardar lo que avanzaste desde entonces.`;
  }
  return null;
}
