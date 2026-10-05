# Ruta 90 · app autónoma

App para iOS y Android (Expo SDK 57, React Native, Expo Router) para personas que están empezando a moverse y a ordenar su alimentación. Funciona sin cuenta y sin servidor: todo se guarda en el teléfono.

## Qué hace

- **Filtro de seguridad al inicio.** Seis preguntas basadas en el modelo de evaluación previa al ejercicio del ACSM, más embarazo, conducta alimentaria e insulina o sulfonilureas. Según las respuestas, desactiva los menús o el ejercicio, o los deja pendientes de que la persona confirme que tiene autorización médica. Solo se guarda el resultado, no las respuestas.
- **Clases.** Biblioteca de 12 clases; se libera una por semana. Reproduce el video con `expo-video` cuando la clase tiene `videoUrl`; mientras no lo tenga, muestra el resumen.
- **Ejercicio.** Tres programas de 12 semanas (Desde cero, Fuerza en casa, Bajo impacto), en cuatro bloques de 3 semanas con tres sesiones cada uno. Las sesiones de 10, 20 o 30 minutos cambian el número de vueltas. Si falta un material, el ejercicio se reemplaza por su alternativa. Incluye una meta de caminata semanal que progresa.
- **Menú por componentes (cocina por tandas).** Arma una sesión de cocina semanal que rinde 5 almuerzos o cenas y 5 desayunos, filtrando por tiempo (60, 90 o 120 min), equipamiento, patrón (omnívoro o vegetariano), exclusiones y número de personas. Reparte los días según cuánto dura cada preparación en el refrigerador e indica qué congelar. Permite cambiar un componente o pedir otra combinación.
- **Lista de compras** agregada, redondeada hacia arriba, por categoría y con casillas.

La app no genera recetas con inteligencia artificial: solo combina contenido revisado.

## Estructura

```
src/
  app/                 Pantallas (Expo Router)
    (tabs)/            Hoy, Clases, Ejercicio, Menú, Perfil
    bienvenida.tsx     Registro inicial y filtro de seguridad
    clase/[id].tsx     Detalle de clase y video
    sesion/[id].tsx    Sesión de ejercicio
    receta/[id].tsx    Receta escalada por personas
    compras.tsx        Lista de compras
  content/             CONTENIDO EDITABLE: recetas, ejercicios y programas, clases
  logic/               Lógica pura y probada: seguridad, menú, compras, programa
  state/               Estado guardado en el teléfono (AsyncStorage)
  ui/                  Componentes visuales
```

## Editar el contenido

Todo el contenido está en `src/content/` y está marcado como **contenido de ejemplo**: el equipo clínico debe revisarlo antes de publicar.

- `componentes.ts`: cada receta tiene su función en el plato (`rol`), patrones, equipos, exclusiones, minutos de trabajo y totales, días que dura refrigerada, si se puede congelar, porciones e ingredientes por persona.
- `ejercicios.ts`: ejercicios (con su alternativa si falta material), los tres programas y la progresión de caminata.
- `clases.ts`: guiones de las 12 clases. Para agregar un video, completa `videoUrl` con la dirección del archivo alojado (por ejemplo en Mux, Vimeo o Cloudflare Stream).

Después de editar, corre las pruebas: comprueban que todas las combinaciones de filtros sigan armando un menú válido.

## Comandos

```bash
npm install
npm test            # pruebas de la lógica (288 combinaciones de menú)
npm run typecheck   # TypeScript
npx expo start      # desarrollo; abre en Expo Go o en un simulador
npx expo export --platform web   # versión web para revisar en el navegador
```

## Qué falta para publicar en App Store y Google Play

1. **Cuentas de desarrollador:** Apple Developer Program (pago anual) y Google Play Console (pago único).
2. **Identidad:** cambiar `com.tumarca.ruta90` en `app.json` por el identificador definitivo, y reemplazar el ícono y la pantalla de inicio de la plantilla.
3. **Contenido final:** recetas y guiones revisados, videos de clases y de ejercicios grabados y alojados.
4. **Cobro:** para vender una suscripción dentro de la app, las tiendas exigen su sistema de compras. La forma habitual es integrar RevenueCat (`react-native-purchases`) y crear los productos en ambas tiendas.
5. **Textos legales:** política de privacidad publicada en una URL, condiciones de uso, formulario de privacidad de Apple y sección de seguridad de datos de Google Play. Si la app incluye contenido de salud, Google Play pide además una declaración específica.
6. **Compilar y enviar con EAS:** `npx eas-cli@latest build --platform all` y `npx eas-cli@latest submit`. No requiere Mac.
7. **Pruebas con personas reales:** TestFlight (iOS) y prueba interna o cerrada en Google Play antes de publicar.
