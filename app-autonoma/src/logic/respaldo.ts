import { normalizar, type EstadoApp } from './estado';

// Código de respaldo: el estado completo, en JSON, codificado en texto (UTF-8 y base64 con alfabeto
// apto para URL, sin relleno) con un prefijo de versión. Sirve para llevar el avance a otro navegador
// o teléfono sin cuentas ni servidor. Contiene el resultado del filtro de seguridad, que es un dato
// de salud: la app lo advierte antes de mostrarlo.
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

/** Devuelve el estado contenido en el código, ya validado, o null si el código no sirve. Tolera espacios y saltos de línea. */
export function decodificarRespaldo(texto: string): EstadoApp | null {
  const limpio = texto.replace(/\s+/g, '');
  if (!limpio.startsWith(PREFIJO)) return null;
  const bytes = base64Decodificar(limpio.slice(PREFIJO.length));
  if (!bytes) return null;
  try {
    const estado = normalizar(JSON.parse(utf8Decodificar(bytes)));
    return estado.perfil ? estado : null;
  } catch {
    return null;
  }
}
