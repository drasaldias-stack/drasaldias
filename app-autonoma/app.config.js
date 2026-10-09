// Configuración dinámica: toma app.json y, si se define EXPO_BASE_URL, exporta la web bajo esa subcarpeta
// (por ejemplo /drasaldias, el nombre del repositorio, para su sitio de GitHub Pages). Sin la variable, la app se exporta para la raíz de un dominio.
module.exports = ({ config }) => {
  const base = process.env.EXPO_BASE_URL;
  if (!base) return config;
  return { ...config, experiments: { ...config.experiments, baseUrl: base } };
};
// c3
