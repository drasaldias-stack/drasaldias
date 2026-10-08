// Exporta la web bajo la subcarpeta del sitio de GitHub Pages y deja la copia en ../ruta90 (más 404.html en la raíz
// del repositorio para que las rutas internas funcionen al recargar). Uso: node scripts/publicar-pages.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = process.env.EXPO_BASE_URL || '/hipotiroidismo/ruta90';
const raiz = path.resolve(__dirname, '..');
const repo = path.resolve(raiz, '..');
const dist = path.join(raiz, 'dist');
const destino = path.join(repo, BASE.split('/').filter(Boolean).slice(1).join('/') || 'ruta90');

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

fs.rmSync(destino, { recursive: true, force: true });
fs.cpSync(dist, destino, { recursive: true });
// GitHub Pages sirve 404.html para cualquier ruta desconocida: así /ruta90/perfil carga la app al recargar.
fs.copyFileSync(index, path.join(repo, '404.html'));
console.log(`Publicado en ${destino} (base ${BASE}) y 404.html en ${repo}`);
