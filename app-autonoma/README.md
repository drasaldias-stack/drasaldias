# Ruta 90 · app autónoma

App para iOS y Android (Expo SDK 57, React Native, Expo Router) para personas que están empezando a moverse y a ordenar su alimentación. Funciona sin cuenta y sin servidor propio: todo se guarda en el dispositivo. El mismo código se exporta a web (`npx expo export --platform web`), así que puede publicarse primero como aplicación web y después en las tiendas.

## Qué hace

- **Filtro de seguridad al inicio.** Seis preguntas basadas en el modelo de evaluación previa al ejercicio del ACSM, más embarazo o lactancia, conducta alimentaria e insulina o sulfonilureas. Según las respuestas, desactiva los menús o el ejercicio, o los deja pendientes de que la persona confirme en Perfil que tiene autorización médica. Se guarda en el dispositivo el resultado del filtro (qué secciones quedan activas, pendientes o desactivadas) junto con los avisos que explican cada restricción; esos avisos nombran la condición que la motivó, por lo que son datos de salud aunque no salgan del dispositivo. No se guardan las respuestas una a una.
- **Clases.** Biblioteca de 12 clases; se libera una por semana. Reproduce el video con `expo-video` cuando la clase tiene `videoUrl`; mientras no lo tenga, la clase se lee (resumen y puntos principales) sin marcador de "video pendiente".
- **Ejercicio.** Tres programas de 12 semanas (Desde cero, Fuerza en casa, Bajo impacto), en cuatro bloques de 3 semanas con tres sesiones cada uno. Las sesiones de 10, 20 o 30 minutos cambian el número de vueltas. Si falta un material, el ejercicio se reemplaza por su alternativa. La pantalla de sesión mantiene el teléfono encendido, tiene cronómetro para los ejercicios por segundos, marca por ejercicio y por vuelta, y una meta de caminata semanal que progresa.
- **Menú por componentes (cocina por tandas).** Arma una sesión de cocina semanal que rinde 5 almuerzos o cenas y 5 desayunos, filtrando por tiempo (60, 90 o 120 min), equipamiento, patrón (omnívoro o vegetariano), exclusiones y número de personas. Reparte los días según cuánto dura cada preparación en el refrigerador, contados desde el día en que se cocina, e indica qué congelar. Permite cambiar una receta o pedir otra combinación.
- **Lista de compras** agregada, redondeada hacia arriba, por categoría y con casillas.

La app no genera recetas con inteligencia artificial: solo combina contenido revisado.

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
  constants/           Paleta y direcciones legales (URL_PRIVACIDAD, URL_CONDICIONES)
  content/             CONTENIDO EDITABLE: recetas, ejercicios y programas, clases
  logic/               Lógica pura y probada: seguridad, menú, compras, programa
  state/               Estado guardado en el dispositivo (AsyncStorage) con validación al cargar
  ui/                  Componentes visuales
```

## Editar el contenido

Todo el contenido está en `src/content/` y está marcado como **contenido de ejemplo**: el equipo clínico debe revisarlo antes de publicar. Las cantidades, los días de refrigeración, las temperaturas de cocción y las afirmaciones de las clases fueron revisadas una vez en esta base, pero la aprobación final es de la médica.

- `componentes.ts`: cada receta tiene su función en el plato (`rol`), patrones, equipos, exclusiones (`contiene`, que es lo único que mira el filtro), minutos de trabajo y totales, días que dura refrigerada, si se puede congelar, porciones e ingredientes por persona.
- `ejercicios.ts`: ejercicios (con su alternativa si falta material), los tres programas, la progresión de caminata y los textos de seguridad de la sesión.
- `clases.ts`: guiones de las 12 clases. Para agregar un video, completa `videoUrl` con la dirección del archivo alojado (por ejemplo en Cloudflare Stream, Mux, Bunny o Vimeo). Al reproducir un video alojado, el dispositivo se conecta a ese proveedor, que recibe la dirección IP y qué video se pidió: hay que incluirlo en la política de privacidad y desactivar la analítica de espectadores si el proveedor la ofrece.

Después de editar, corre las pruebas: comprueban que todas las combinaciones de filtros sigan armando un menú válido, que ningún ingrediente use dos unidades distintas y que ninguna sesión repita un ejercicio con cualquier combinación de materiales.

## Comandos

```bash
npm install
npm test            # pruebas de la lógica y del contenido
npm run typecheck   # TypeScript
npx expo start      # desarrollo; abre en Expo Go o en un simulador
npx expo export --platform web   # versión web para revisar en el navegador o publicar
```

## Privacidad

- No hay cuentas ni servidor propio. El estado (perfil, preferencias, avances, menú de la semana) se guarda con AsyncStorage; en web, en localStorage.
- `android.allowBackup` está en `false` para que Android no copie ese estado al respaldo en la nube; por eso el avance no se recupera al cambiar de teléfono, y la app lo dice en Perfil.
- Mientras `URL_PRIVACIDAD` y `URL_CONDICIONES` (en `src/constants/enlaces.ts`) sean `null`, la app no muestra los enlaces. Antes de publicar deben apuntar a páginas reales.

## Qué falta para publicar en App Store y Google Play

1. **Cuentas de desarrollador:** Apple Developer Program (pago anual) y Google Play Console (pago único). Además una cuenta en expo.dev y `npx eas-cli@latest login`.
2. **Identidad:** cambiar `com.tumarca.ruta90` en `app.json` por el identificador definitivo (queda fijado tras el primer envío), y reemplazar el ícono, el splash y los íconos adaptativos de Android, que todavía son los de la plantilla de Expo (`assets/`). Para iOS, lo más simple es eliminar la clave `ios.icon` y dejar que Expo genere el ícono desde `assets/images/icon.png`.
3. **Contenido final:** recetas y guiones aprobados por la médica, videos de clases y de ejercicios grabados y alojados.
4. **Cobro:** para vender una suscripción o un pago único dentro de la app, las tiendas exigen su sistema de compras. La forma habitual es integrar RevenueCat (`react-native-purchases`) y crear los productos en ambas consolas. Si se vende solo por web, este paso no aplica, pero hay que revisar las reglas vigentes de cada tienda sobre cuentas pagadas fuera de la app.
5. **Textos legales:** política de privacidad y condiciones de uso publicadas en una URL, enlazadas dentro de la app (`src/constants/enlaces.ts`), formulario de privacidad de Apple y sección de seguridad de datos de Google Play. Google Play pide además una declaración específica para apps de salud. La política debe mencionar el proveedor de video y, si se agrega, el sistema de pagos.
6. **Compilar y enviar con EAS:** el primer `npx eas-cli@latest build --platform all` crea `eas.json` (dejarlo versionado) y pregunta por el cifrado: la app solo usa el cifrado estándar del sistema, por eso `app.json` ya declara `ITSAppUsesNonExemptEncryption: false`. Con `appVersionSource: remote` no hace falta fijar `buildNumber` ni `versionCode`. `eas submit` pide una clave de API de App Store Connect y el JSON de una cuenta de servicio de Google Play. No requiere Mac.
7. **Fichas de tienda:** capturas de pantalla, descripción sin mencionar videos que no existan, categoría Salud y forma física, cuestionario de clasificación por edad (la app exige 18 años o más), URL de soporte y correo de contacto, español como idioma principal (`CFBundleDevelopmentRegion` ya está en `es`).
8. **Pruebas con personas reales:** TestFlight (iOS) y prueba interna o cerrada en Google Play antes de publicar. Probar al menos en un iPhone y un Android de gama media: registro, filtros de menú, cambiar receta, sesión con cronómetro, borrar datos.
