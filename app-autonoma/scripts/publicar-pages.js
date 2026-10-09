// Exporta la web para el sitio de GitHub Pages del repositorio y deja la copia en la RAÍZ del repositorio
// (Pages sirve main desde / sin ninguna configuración adicional). La base es /<nombre del repositorio>; el flujo de
// GitHub Actions la toma del nombre real, así que renombrar el repositorio no exige cambiar código.
// Uso local: EXPO_BASE_URL=/<nombre-del-repositorio> node scripts/publicar-pages.js
// (sin la variable se usa /drasaldias, el nombre actual del repositorio).
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = (process.env.EXPO_BASE_URL || '/drasaldias').replace(/\/+$/, '');
const raiz = path.resolve(__dirname, '..');
const repo = path.resolve(raiz, '..');
const dist = path.join(raiz, 'dist');
// Lo único que se escribe en la raíz del repositorio: se borra y se vuelve a copiar en cada publicación.
const ARTEFACTOS = ['index.html', '404.html', '.nojekyll', 'manifest.webmanifest', 'favicon.ico', '_expo', 'assets', 'icons'];

fs.rmSync(dist, { recursive: true, force: true });
execSync('npx expo export --platform web', { cwd: raiz, stdio: 'inherit', env: { ...process.env, CI: '1', EXPO_BASE_URL: BASE } });

// Lo que viene de public/ no lo reescribe Expo: se le antepone la base a mano.
const conBase = (texto) => texto.replace(/(href|src|content)="\/(manifest\.webmanifest|icons\/|favicon\.ico)/g, `$1="${BASE}/$2`);
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
// Sin .nojekyll, Pages procesa el sitio con Jekyll y omite las carpetas que empiezan con guion bajo (_expo)
// y las rutas con node_modules (la fuente de los íconos): la página abre pero la app nunca carga.
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

for (const nombre of ARTEFACTOS) fs.rmSync(path.join(repo, nombre), { recursive: true, force: true });
for (const nombre of fs.readdirSync(dist)) {
  if (!ARTEFACTOS.includes(nombre)) throw new Error(`La exportación produjo "${nombre}", que no está en la lista de artefactos; revisar el script antes de publicar.`);
  fs.cpSync(path.join(dist, nombre), path.join(repo, nombre), { recursive: true });
}
console.log(`Publicado en la raíz de ${repo} (base ${BASE}): ${ARTEFACTOS.join(', ')}`);
