# Ruta 90 · app autónoma

Aplicación web (Expo SDK 57, React Native para web, Expo Router) para personas que están empezando a moverse y a ordenar su alimentación. Funciona sin cuenta y sin servidor propio: todo se guarda en el navegador o en el teléfono, y un código de respaldo permite llevar el avance a otro dispositivo. La vía elegida es publicarla como sitio web (ver «Publicar en web»); el mismo código puede compilarse para iOS y Android si más adelante hace falta (ver el anexo).

## Qué hace

- **Filtro de seguridad al inicio.** Seis preguntas basadas en el modelo de evaluación previa al ejercicio del ACSM, más embarazo o lactancia, conducta alimentaria e insulina o sulfonilureas. Según las respuestas, desactiva los menús o el ejercicio, o los deja pendientes de que la persona confirme en Perfil que tiene autorización médica. Se guarda en el dispositivo el resultado del filtro (qué secciones quedan activas, pendientes o desactivadas) junto con los avisos que explican cada restricción; esos avisos nombran la condición que la motivó, por lo que son datos de salud aunque no salgan del dispositivo. No se guardan las respuestas una a una.
- **Clases.** Biblioteca de 12 clases; se libera una por semana. Reproduce el video con `expo-video` cuando la clase tiene `videoUrl`; mientras no lo tenga, la clase se lee (resumen y puntos principales) sin marcador de "video pendiente".
- **Ejercicio.** Tres programas de 12 semanas (Desde cero, Fuerza en casa, Bajo impacto), en cuatro bloques de 3 semanas con tres sesiones cada uno. Las sesiones de 10, 20 o 30 minutos cambian el número de vueltas. Si falta un material, el ejercicio se reemplaza por su alternativa. La pantalla de sesión mantiene el teléfono encendido (en web con la API Screen Wake Lock cuando el navegador la ofrece; en iOS y Android con `expo-keep-awake`), tiene cronómetro para los ejercicios por segundos, marca por ejercicio y por vuelta, y una meta de caminata semanal que progresa.
- **Menú por componentes (cocina por tandas).** Arma una sesión de cocina semanal que rinde 5 almuerzos o cenas y 5 desayunos, filtrando por tiempo (60, 90 o 120 min), equipamiento, patrón (omnívoro o vegetariano), exclusiones y número de personas. Reparte los días según cuánto dura cada preparación en el refrigerador, contados desde el día en que se cocina, e indica qué congelar. Permite cambiar una receta o pedir otra combinación.
- **Lista de compras** agregada, redondeada hacia arriba, por categoría y con casillas.
- **Pauta propia, además del menú.** Desde Menú (y desde Hoy cuando existe) la persona guarda su propia pauta: la que le entregó su nutricionista o una armada por ella. Se escribe por comidas (nombre y detalle), con indicaciones generales y un enlace opcional al documento original, y se ve en una pantalla aparte. El menú de Ruta 90 y la lista de compras siguen disponibles igual. La app muestra la pauta tal como se escribe, no la revisa ni la corrige, y lo dice en pantalla.
- **Rutina propia, además del programa.** En la pestaña Ejercicio se puede agregar una rutina propia (del gimnasio, del kinesiólogo o armada por la persona): hasta tres sesiones por semana con ejercicios escritos por ella (nombre, repeticiones o segundos, vueltas). Sus sesiones aparecen junto a las del programa, con ids `mi-A`, `mi-B` y `mi-C`, se marcan por semana igual que las del programa y usan la misma pantalla de sesión (cronómetro para los segundos, marcas por ejercicio y por vuelta, señales para detenerse), sin instrucciones ni alternativas por material porque la app no conoce esos ejercicios. La meta de caminata sigue siendo la del programa.
- **Código de respaldo.** Desde Perfil se genera un texto que contiene todo el estado (respuestas, preferencias y avance hasta ese día) y se puede pegar en otro navegador o teléfono, desde la pantalla de inicio o desde Perfil. El código no se actualiza solo: la app pide crear uno nuevo cada cierto tiempo (Hoy lo recuerda hasta el primer código y cuando el último tiene más de dos semanas) y, al restaurar encima de un avance existente, muestra cuánto avance tiene cada uno antes de confirmar. Sin cuentas, es la única forma de mover el avance.

La app no genera recetas con inteligencia artificial: solo combina contenido revisado. La pauta y la rutina propias están sujetas al mismo filtro de seguridad que los menús y los programas: si los menús o el ejercicio están desactivados o pendientes de confirmación, tampoco se puede cargar una pauta o una rutina. Es una decisión conservadora que la médica puede revisar (por ejemplo, permitir la pauta de un profesional durante el embarazo y mantener el bloqueo en conducta alimentaria): el resultado del filtro guarda ahora el motivo de cada bloqueo (`bloqueos` en `src/logic/tipos.ts`: edad, embarazo o conducta), así que una política por motivo se puede aplicar en `accesoMenu` sin volver a preguntar.

## Estructura

```
src/
  app/                 Pantallas (Expo Router)
    (tabs)/            Hoy, Clases, Ejercicio, Menú, Perfil
    bienvenida.tsx     Registro inicial y filtro de seguridad (y modo "revisar respuestas" desde Perfil)
    clase/[id].tsx     Detalle de clase y video
    sesion/[id].tsx    Sesión de ejercicio con cronómetro
    receta/[id].tsx    Receta escalada por personas
    compras.tsx        Lista de compras
    +not-found.tsx     Ruta desconocida
  constants/           Paleta y direcciones legales (URL_PRIVACIDAD, URL_CONDICIONES)
  content/             CONTENIDO EDITABLE: recetas, ejercicios y programas, clases
  logic/               Lógica pura y probada: seguridad, menú, compras, programa, pauta y rutina propias, estado guardado, código de respaldo
  state/               Estado guardado en el dispositivo (AsyncStorage) y acciones
  ui/                  Componentes visuales (kit, editores de preferencias, campos de texto, pauta y rutina propias, respaldo)
public/                Se copia tal cual a la exportación web: cáscara HTML, manifiesto, íconos y reglas de redirección
```

## Editar el contenido

Todo el contenido está en `src/content/` y está marcado como **contenido de ejemplo**: el equipo clínico debe revisarlo antes de publicar. Las cantidades, los días de refrigeración, las temperaturas de cocción y las afirmaciones de las clases fueron revisadas una vez en esta base, pero la aprobación final es de la médica.

- `componentes.ts`: cada receta tiene su función en el plato (`rol`), patrones, equipos, exclusiones (`contiene`, que es lo único que mira el filtro), minutos de trabajo y totales, días que dura refrigerada, si se puede congelar, porciones e ingredientes por persona.
- `ejercicios.ts`: ejercicios (con su alternativa si falta material), los tres programas, la progresión de caminata y los textos de seguridad de la sesión. Los avisos de la pauta y la rutina propias (`AVISO_PAUTA`, `AVISO_RUTINA`) están en `src/ui/propio.tsx` y también deben validarse clínicamente.
- `clases.ts`: guiones de las 12 clases. Para agregar un video, completa `videoUrl` con la dirección del archivo alojado (por ejemplo en Cloudflare Stream, Mux, Bunny o Vimeo). Al reproducir un video alojado, el dispositivo se conecta a ese proveedor, que recibe la dirección IP y qué video se pidió: hay que incluirlo en la política de privacidad y desactivar la analítica de espectadores si el proveedor la ofrece.

Después de editar, corre las pruebas: comprueban que todas las combinaciones de filtros sigan armando un menú válido, que ningún ingrediente use dos unidades distintas y que ninguna sesión repita un ejercicio con cualquier combinación de materiales.

## Comandos

```bash
npm install
npm test            # pruebas de la lógica y del contenido
npm run typecheck   # TypeScript
npx expo start      # desarrollo; abre en un simulador o en un teléfono (Expo Go, si todos los módulos nativos están incluidos en él)
npx expo export --platform web   # versión web para revisar en el navegador o publicar
```

Las dependencias directas son solo las que la app importa. `@expo/ui`, `expo-glass-effect` y `expo-symbols` siguen en `node_modules` porque `expo-router` las declara, y el enlace automático las compila en cada build nativo; si se quiere excluirlas hay que revisar la opción `exclude` de `expo.autolinking` en la documentación de Expo.

## Publicar en web

La vía elegida es la web: una sola dirección para iPhone, Android y computador, sin tiendas.

### Hoy: GitHub Pages del repositorio

El repositorio es público y GitHub Pages sirve la rama `main` en `https://drasaldias-stack.github.io/hipotiroidismo/`. La app se publica como subcarpeta de ese sitio:

- `npm run web:pages` (en `app-autonoma`) exporta la web con la base `/hipotiroidismo/ruta90` (variable `EXPO_BASE_URL`, leída por `app.config.js`), antepone esa base a lo que viene de `public/` (manifiesto, íconos, favicon), copia el resultado a `ruta90/` en la raíz del repositorio y deja en la raíz `404.html` (GitHub Pages lo sirve para cualquier ruta desconocida, así una ruta interna como `/ruta90/perfil` carga la app al recargar) y `.nojekyll` (sin él, Pages procesa el sitio con Jekyll y omite la carpeta `_expo` del código y las rutas con `node_modules` de la fuente de íconos: la página abre pero queda en blanco).
- La app queda en `https://drasaldias-stack.github.io/hipotiroidismo/ruta90/` cuando esos archivos están en `main`. El flujo `.github/workflows/web-pages.yml` los regenera y los sube a `main` cada vez que cambia `app-autonoma` en esa rama (no se pudo ejecutar desde este entorno: revisar su primera corrida en la pestaña Actions).
- Para pasar a un dominio propio basta exportar sin `EXPO_BASE_URL` (`npx expo export --platform web`) y seguir los pasos de abajo; `404.html` y `ruta90/` dejan de ser necesarios.

### Con dominio propio

1. `npx expo export --platform web` genera la carpeta `dist` con todo lo necesario. `public/index.html` es una plantilla: Expo reemplaza `%LANG_ISO_CODE%` y `%WEB_TITLE%`, e inserta el color (`theme-color`), la descripción, el favicon y el script del bundle; el idioma, el título, el color y la descripción salen de `app.json` (`web.lang`, `name`, `web.themeColor`, `web.description`). El resto de `public/` se copia tal cual: `manifest.webmanifest` (su `background_color` se mantiene a mano y debe coincidir con `web.themeColor`), `icons/` y `_redirects`.
2. Subir el contenido de `dist` a un servicio de archivos estáticos con HTTPS, en la raíz de un dominio o subdominio. Las rutas de los archivos son absolutas (`/_expo/...`, `/icons/...`), así que no funciona dentro de una subcarpeta: haría falta configurar la base en Expo (opción `experiments.baseUrl`, revisar en la documentación) y además editar a mano las rutas de `public/index.html`, `manifest.webmanifest` y `_redirects`.
3. El servicio debe devolver `index.html` para cualquier ruta (`/perfil`, `/receta/...`), porque la navegación ocurre en el navegador. El archivo `_redirects` lo configura en Netlify y en Cloudflare Pages; en otros servicios hay que crear la regla equivalente. Comprobarlo después de publicar abriendo directamente `https://tu-dominio/perfil` y recargando.
4. Los archivos de `_expo/static/` llevan un hash en el nombre y pueden guardarse en caché por mucho tiempo; `index.html` no debe guardarse en caché (o solo por minutos), para que cada publicación se vea al recargar.
5. Para actualizar: volver a exportar y subir `dist` completo. No hay base de datos ni migraciones; lo que cambia es el contenido y la validación del estado guardado (`src/logic/estado.ts`), que tolera estados de versiones anteriores.

Agregar a la pantalla de inicio. El manifiesto y las etiquetas de iOS están en su lugar (comprobado en `dist/index.html`), pero el comportamiento real no se pudo verificar aquí sin dispositivos y debe probarse en un iPhone y un Android reales antes de entregarla a pacientes: que en Android (Chrome) se ofrezca instalarla como aplicación; que en iPhone, desde Compartir y «Agregar a pantalla de inicio», tome el ícono y el nombre; que la aplicación instalada en iPhone se abra sin la barra del navegador (por eso el encabezado tiene su propio botón Volver); y, lo más importante, si su almacenamiento es independiente del de Safari, en cuyo caso el avance hecho en Safari no aparece en la aplicación instalada ni al revés y hay que moverlo con el código de respaldo.

Pantalla encendida. En web se usa la API Screen Wake Lock del navegador cuando existe (`src/ui/mantener-pantalla.tsx`); si no existe, la pantalla puede apagarse durante la sesión. No se pudo verificar aquí en qué versiones de Safari para iPhone está disponible.

Pérdida de datos. WebKit anunció en 2020 que Safari elimina el almacenamiento local de un sitio tras siete días sin interacción con él; no se pudo verificar aquí si aplica a las aplicaciones agregadas a la pantalla de inicio. Es la razón principal del código de respaldo y, más adelante, de las cuentas con sincronización en servidor si la app se vende.

Qué ve el servicio de alojamiento: solo las peticiones de archivos (dirección IP, navegador, hora), como en cualquier sitio. Ningún dato del paciente sale del navegador. Hay que decirlo en la política de privacidad, junto con el proveedor de video cuando exista.

Íconos. Los de `public/icons/` y `assets/images/icon.png` son provisionales (generados para esta versión con el nombre y el color de la app); al reemplazarlos por el diseño definitivo hay que mantener los tamaños 192, 512 y 180 píxeles y que el contenido quepa en el 80 % central (el de 512 se usa también como ícono enmascarable).

## Privacidad

- No hay cuentas ni servidor propio. El estado (perfil, preferencias, avances, menú de la semana) se guarda con AsyncStorage; en web, en localStorage.
- `android.allowBackup` está en `false` para que Android no copie ese estado al respaldo en la nube. En iOS, AsyncStorage excluye su carpeta del respaldo de iCloud por defecto (no agregar `RCTAsyncStorageExcludeFromBackup: false` al `infoPlist`). Por eso el avance no se recupera al cambiar de teléfono en ninguna de las dos plataformas, y la app lo dice en Perfil. Queda por confirmar en la documentación de Android si en Android 12 o superior hace falta además `dataExtractionRules` para bloquear la transferencia directa entre dispositivos.
- `android.blockedPermissions` quita del manifiesto los permisos de la plantilla que la app no usa (ventanas sobre otras apps y almacenamiento externo). El de vibración se mantiene porque el cronómetro vibra al terminar.
- El código de respaldo contiene el estado completo: el resultado del filtro de seguridad con los avisos que nombran condiciones y, si existen, la pauta y la rutina propias con todo el texto libre que la persona escribió (puede incluir dosis, pesos o diagnósticos) y el enlace a su documento. La app lo advierte junto al botón que lo crea y recomienda guardarlo en un lugar privado sin compartirlo. Si la persona lo guarda en un servicio (notas en la nube, correo), ese servicio lo tendrá. Un enlace «compartido con cualquiera» de la nube queda accesible para quien tenga el código. Al abrir ese enlace desde la app, el proveedor del documento recibe la petición como cualquier visita; la cáscara HTML declara `referrer: no-referrer` para no enviarle la dirección de la app.
- Al cargar, un estado guardado que no pasa la validación de `src/logic/estado.ts` se elimina del dispositivo. Un menú guardado con forma inválida se descarta solo y se vuelve a generar; una preferencia con un valor desconocido vuelve a su valor inicial sin perder el resto.
- Mientras `URL_PRIVACIDAD` y `URL_CONDICIONES` (en `src/constants/enlaces.ts`) sean `null`, la app no muestra los enlaces. Antes de publicar deben apuntar a páginas reales.

## Anexo: publicar en App Store y Google Play (opcional)

No es la vía elegida; queda documentado por si más adelante hace falta (notificaciones, uso sin conexión o porque los pacientes lo pidan). Los requisitos de las tiendas que siguen (tarifas, pagos dentro de la app, declaración de apps de salud, categorías y clasificación por edad) se escribieron sin acceso a las consolas ni a su documentación y deben confirmarse en developer.apple.com y en support.google.com/googleplay/android-developer antes de enviar.

1. **Cuentas de desarrollador:** Apple Developer Program (pago anual) y Google Play Console (pago único). Además una cuenta en expo.dev y `npx eas-cli@latest login`.
2. **Identidad:** cambiar `com.tumarca.ruta90` en `app.json` por el identificador definitivo (queda fijado tras el primer envío), y reemplazar el ícono, el splash y los íconos adaptativos de Android, que todavía son los de la plantilla de Expo (`assets/`). Para iOS, lo más simple es eliminar la clave `ios.icon` y dejar que Expo genere el ícono desde `assets/images/icon.png`.
3. **Contenido final:** recetas y guiones aprobados por la médica, videos de clases y de ejercicios grabados y alojados.
4. **Cobro:** para vender una suscripción o un pago único dentro de la app, las tiendas exigen su sistema de compras. La forma habitual es integrar RevenueCat (`react-native-purchases`) y crear los productos en ambas consolas. Si se vende solo por web, este paso no aplica, pero hay que revisar las reglas vigentes de cada tienda sobre cuentas pagadas fuera de la app.
5. **Textos legales:** política de privacidad y condiciones de uso publicadas en una URL, enlazadas dentro de la app (`src/constants/enlaces.ts`), formulario de privacidad de Apple y sección de seguridad de datos de Google Play. Google Play pide además una declaración específica para apps de salud. La política debe mencionar el proveedor de video y, si se agrega, el sistema de pagos.
6. **Compilar y enviar con EAS:** la compilación y el envío se hacen en la nube con `npx eas-cli@latest build` y `npx eas-cli@latest submit`, sin necesidad de un Mac. Lo que sigue se escribió sin poder consultar la documentación en línea y debe confirmarse en docs.expo.dev antes de la primera compilación: que el primer `build` cree `eas.json` (dejarlo versionado); que `app.json` ya declare `ITSAppUsesNonExemptEncryption: false` evite la pregunta de cifrado (la app solo usa el cifrado estándar del sistema); que con `appVersionSource: remote` y `autoIncrement` en el perfil de compilación no haga falta fijar `buildNumber` ni `versionCode`; y qué credenciales pide `submit` (habitualmente una clave de API de App Store Connect y el JSON de una cuenta de servicio de Google Play).
7. **Fichas de tienda:** capturas de pantalla, descripción sin mencionar videos que no existan, categoría Salud y forma física, cuestionario de clasificación por edad (la app exige 18 años o más), URL de soporte y correo de contacto. El idioma principal de la ficha se elige en App Store Connect y en Play Console, no en `app.json`; `CFBundleDevelopmentRegion: es` y la clave `locales` solo hacen que el binario de iOS declare el español. Tras `npx expo prebuild --platform ios` debe existir `ios/Ruta90/Supporting/es.lproj/InfoPlist.strings` y estar en la fase Resources del `project.pbxproj`; `knownRegions` sigue en `en` y `Base`, lo que solo afecta al editor de Xcode.
8. **Pruebas con personas reales:** TestFlight (iOS) y prueba interna o cerrada en Google Play antes de publicar. Probar al menos en un iPhone y un Android de gama media: registro, filtros de menú, cambiar receta, sesión con cronómetro, borrar datos.
