// Exporta la web para el sitio de GitHub Pages del repositorio y deja la copia en la RAÍZ del repositorio
// (Pages sirve main desde / sin ninguna configuración adicional). La base es /<nombre del repositorio>; el flujo de
// GitHub Actions la toma del nombre real, así que renombrar el repositorio no exige cambiar código.
// Uso local: EXPO_BASE_URL=/<nombre-del-repositorio> node scripts/publicar-pages.js
// (sin la variable se usa /drasaldias, el nombre actual del repositorio; con EXPO_BASE_URL=/ se publica en la raíz
// del sitio, que es el caso de un dominio propio configurado en GitHub Pages).
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// La base se normaliza como lo hace Expo: una sola barra inicial y ninguna final (por ejemplo /drasaldias).
// "/" queda como base vacía: Expo exporta entonces con rutas desde la raíz del sitio.
const crudo = (process.env.EXPO_BASE_URL || '/drasaldias').trim().replace(/^\/+|\/+$/g, '');
const BASE = crudo ? `/${crudo}` : '';
const raiz = path.resolve(__dirname, '..');
const repo = path.resolve(raiz, '..');
const dist = path.join(raiz, 'dist');
// Lo único que se escribe en la raíz del repositorio: se borra y se vuelve a copiar en cada publicación.
const ARTEFACTOS = ['index.html', '404.html', '.nojekyll', 'manifest.webmanifest', 'favicon.ico', '_expo', 'assets', 'icons'];

// Solo se borra en la raíz del repositorio de esta app: si el script corre desde una copia suelta de app-autonoma,
// no se toca nada del directorio padre.
for (const marca of [path.join('.github', 'workflows', 'web-pages.yml'), path.join('app-autonoma', 'package.json')]) {
  if (!fs.existsSync(path.join(repo, marca))) throw new Error(`${repo} no parece la raíz del repositorio (falta ${marca}); no se borra nada.`);
}

// --solo-copiar: no vuelve a exportar; valida y copia a la raíz lo que ya hay en dist. Lo usa el flujo de Actions
// para rehacer el commit sobre la punta de la rama cuando esta avanzó mientras exportaba.
const soloCopiar = process.argv.includes('--solo-copiar');
if (soloCopiar) {
  if (!fs.existsSync(dist)) throw new Error(`No existe ${dist}; ejecutar primero el script sin --solo-copiar.`);
} else {
  exportar();
}

/**
 * Versión (app.json) y fecha y commit de la última confirmación que tocó app-autonoma, que Perfil muestra para saber
 * qué versión está instalada en un teléfono. Se toman del último commit y no del reloj para que exportar dos veces el
 * mismo código dé el mismo paquete (así el flujo de Actions no vuelve a publicar nada tras cada fusión). Por eso
 * conviene confirmar primero los cambios de app-autonoma y exportar después, en una confirmación aparte: si hay
 * cambios sin confirmar, el sello es «local» con la fecha de hoy y el paquete cambia en cada exportación.
 */
function selloPublicacion() {
  const version = JSON.parse(fs.readFileSync(path.join(raiz, 'app.json'), 'utf8')).expo.version;
  const sello = { EXPO_PUBLIC_VERSION: String(version) };
  try {
    const git = (args) => execSync(`git ${args}`, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (git('status --porcelain -- app-autonoma') !== '') {
      console.warn('Aviso: app-autonoma tiene cambios sin confirmar; el sello de publicación será «local» con la fecha de hoy. Confirma el código y vuelve a exportar para un sello definitivo.');
      sello.EXPO_PUBLIC_FECHA_PUBLICACION = new Date().toISOString().slice(0, 10);
      sello.EXPO_PUBLIC_COMMIT = 'local';
    } else {
      const [commit, fecha] = git('log -1 --format=%h%n%cs -- app-autonoma').split('\n');
      if (commit && fecha) {
        sello.EXPO_PUBLIC_COMMIT = commit;
        sello.EXPO_PUBLIC_FECHA_PUBLICACION = fecha;
      }
    }
  } catch {
    console.warn('Aviso: no se pudo leer git; la app mostrará la versión sin fecha de publicación.');
  }
  return sello;
}

function exportar() {
  fs.rmSync(dist, { recursive: true, force: true });
  const sello = selloPublicacion();
  console.log(`Sello de publicación: versión ${sello.EXPO_PUBLIC_VERSION}, fecha ${sello.EXPO_PUBLIC_FECHA_PUBLICACION ?? '(sin fecha)'}, commit ${sello.EXPO_PUBLIC_COMMIT ?? '(sin commit)'}`);
  // --clear: la caché del empaquetador guarda los módulos ya transformados con las variables EXPO_PUBLIC_* de la
  // exportación anterior; sin limpiarla, el sello de versión incrustado quedaba desactualizado.
  execSync('npx expo export --platform web --clear', { cwd: raiz, stdio: 'inherit', env: { ...process.env, CI: '1', EXPO_BASE_URL: BASE, ...sello } });

  // Lo que viene de public/ (manifiesto e íconos) no lo reescribe Expo: se le antepone la base a mano.
  // El favicon lo genera Expo desde app.json y ya sale con la base.
  const conBase = (texto) => texto.replace(/(href|src|content)="\/(manifest\.webmanifest|icons\/)/g, `$1="${BASE}/$2`);
  const index = path.join(dist, 'index.html');
  fs.writeFileSync(index, conBase(fs.readFileSync(index, 'utf8')));
  const manifiesto = path.join(dist, 'manifest.webmanifest');
  const m = JSON.parse(fs.readFileSync(manifiesto, 'utf8'));
  m.start_url = `${BASE}/`;
  m.scope = `${BASE}/`;
  m.icons = m.icons.map((i) => ({ ...i, src: `${BASE}${i.src}` }));
  fs.writeFileSync(manifiesto, JSON.stringify(m, null, 2) + '\n');
  fs.rmSync(path.join(dist, '_redirects'), { force: true });
  fs.rmSync(path.join(dist, 'metadata.json'), { force: true });
  // GitHub Pages sirve 404.html para cualquier ruta desconocida: así /perfil carga la app al recargar.
  fs.copyFileSync(index, path.join(dist, '404.html'));
  // Sin .nojekyll, Pages procesa el sitio con Jekyll y omite las carpetas que empiezan con guion bajo, entre ellas
  // _expo, donde está el código: la página abre pero la app nunca carga.
  fs.writeFileSync(path.join(dist, '.nojekyll'), '');
}

// La exportación se comprueba completa ANTES de borrar nada en la raíz: si trae algo fuera de la lista (por ejemplo
// un CNAME nuevo en public/) o le falta un artefacto, el script se detiene y la copia publicada queda intacta.
const producidos = fs.readdirSync(dist);
const extra = producidos.filter((nombre) => !ARTEFACTOS.includes(nombre));
if (extra.length > 0) throw new Error(`La exportación produjo ${extra.join(', ')}, que no está en la lista de artefactos; revisar el script antes de publicar.`);
const faltan = ARTEFACTOS.filter((nombre) => !producidos.includes(nombre));
if (faltan.length > 0) throw new Error(`La exportación no produjo ${faltan.join(', ')}; revisar el script antes de publicar.`);
for (const nombre of ARTEFACTOS) fs.rmSync(path.join(repo, nombre), { recursive: true, force: true });
for (const nombre of producidos) fs.cpSync(path.join(dist, nombre), path.join(repo, nombre), { recursive: true });
console.log(
  soloCopiar
    ? `Copiado ${dist} a la raíz de ${repo}: ${ARTEFACTOS.join(', ')}`
    : `Publicado en la raíz de ${repo} (base ${BASE || '/'}): ${ARTEFACTOS.join(', ')}`,
);
