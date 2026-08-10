# Decisiones de arquitectura — PixLite

Este documento resume el recorrido completo de decisiones que llevó a construir el sistema tal como quedó: qué se decidió, en qué orden, por qué, y qué alternativas se descartaron. La intención es que cualquiera (incluido el propio equipo, meses después) pueda entender el "por qué" sin tener que reconstruirlo desde el historial de commits.

## 1. Qué es este proyecto

Un compresor/optimizador de imágenes con interfaz web: el usuario sube una o varias imágenes, el sistema las comprime (calidad/formato configurables) y las devuelve para descargar. El repo nació con tres carpetas vacías (`front/`, `back/`, `styles/`) más tres mockups de diseño ya hechos en `styles/` y un `Readme.md` en blanco — no había código todavía, solo la intención y las referencias visuales.

## 2. Elección de stack

**Decisión:** Angular 21 en `front/`, Nest 11 en `back/`, Tailwind CSS v4 para estilos.

- Angular y Nest fueron pedidos explícitamente. Lo que sí quedaba abierto era *cómo* configurarlos.
- Se verificó contra el esquema oficial del propio `@schematics/angular` (no contra intuición) cuáles son los defaults que el equipo de Angular recomienda para un proyecto nuevo en la v21: **standalone**, **zoneless** (`true` por defecto), **sin SSR** (`false` por defecto), **routing** habilitado, **Vitest** como test runner (reemplazó a Karma/Jasmine como default). Todas las flags usadas en el scaffold (`ng new`) coinciden exactamente con esos defaults — no se inventó ninguna configuración "custom".
- Tailwind se instaló con `--style=tailwind` directamente en el `ng new`, que ya en Angular 21 lo deja como opción de primera clase (v4, integrado vía PostCSS, sin `tailwind.config.js`). No se instaló ningún plugin adicional (`@tailwindcss/forms`, container-queries) porque ninguna clase del proyecto los necesita — se revisó el markup antes de decidir, no se instaló "por si acaso".
- Nest se generó con el CLI oficial (`nest new`), TypeScript, `strict` activado. Sin ORM ni base de datos: en ese momento no hacía falta persistir nada.
- `sharp` se instaló en el back desde el principio (antes incluso de escribir el módulo que lo usa) porque ya se sabía, por la naturaleza del proyecto, que iba a ser la librería de compresión — es el estándar de facto en Node (bindings nativos sobre libvips, mucho más rápido que alternativas puras en JS).

**Alternativas descartadas:** Karma/Jasmine (reemplazado por Vitest como default de la CLI), NgModules clásicos (Angular 21 ya no los necesita), SSR (no aporta nada a una herramienta que es básicamente un formulario de subida + resultado).

## 3. ¿Dónde se comprime la imagen: cliente o servidor?

Esta fue la decisión de arquitectura más importante del proyecto, y no se resolvió por preferencia sino con evidencia: se leyeron los 3 mockups completos en `styles/*/code.html` y los tres dibujan el mismo flujo — **drag&drop → upload → procesar → download**. Un flujo de upload real implica, por definición, un viaje al servidor. Eso descartó la opción "todo en el navegador vía Canvas/WebAssembly" (que sí hubiera sido válida para una herramienta tipo Squoosh, pero no es lo que el propio diseño pedía).

**Decisión:** compresión real en el backend (Nest + `sharp`), sin estado — sin base de datos, sin cola de trabajos (Bull/BullMQ), sin guardar archivos en disco. Cada request sube uno o varios archivos a memoria (`multer` en modo `memoryStorage`), `sharp` los transforma en memoria, y la respuesta devuelve el resultado ya en la misma llamada (buffer → base64 → JSON). Cuando el servidor termina de responder, no queda ningún rastro del archivo en el servidor.

**Por qué no una cola:** el volumen esperado (imágenes sueltas, procesamiento en milisegundos-a-segundos con `sharp`) no justifica la complejidad operativa de una cola. Si algún día se necesita procesar lotes muy grandes o archivos muy pesados, ese es el punto natural para reconsiderar esta decisión — no antes.

## 4. Comparar los 3 diseños de `styles/`

`styles/` contenía 3 mockups HTML/Tailwind (`pixlite_profesional_blue`, `pixlite_dark_emerald`, `pixlite_soft_rose`) más un `DESIGN.md` ("Precision Streamline") que los describe explícitamente como una **estrategia de multi-tema deliberada** (Clean Professional / Modern Dark / Soft Minimalist) del mismo producto — no como 3 propuestas competidoras entre las que había que elegir una sola.

Se leyeron los 3 `code.html` completos antes de tocar código y se confirmó que las diferencias son reales, no solo de color:

| Tema | Layout | Settings | Acción principal |
|---|---|---|---|
| Professional | Dropzone + lista simple | Ninguno (el mockup no tiene panel de settings) | Botón mega "Download Optimized Images", auto-comprime al soltar |
| Dark | Hero + dropzone + panel inline | Lossy/Lossless + slider de calidad | Botón mega "Download All", auto-comprime al soltar |
| Soft | Hero + grid bento (dropzone + sidebar) | Slider de calidad + formato (Original/WebP/JPEG) + 2 checkboxes | Botón "Optimize Now" dentro del sidebar — requiere click explícito |

**Decisión:** implementar los 3 como páginas Angular reales y compararlos **en rutas separadas** (`/professional`, `/dark`, `/soft`) en vez de un switcher de tema en una sola página. Esto se le preguntó directamente al usuario (dos opciones con sus tradeoffs) en vez de asumirlo, porque cambiaba la forma del entregable: rutas separadas dan URLs compartibles e independientes; un switcher da comparación instantánea lado a lado pero une todo en una sola página. Se eligió rutas separadas.

Cada página **conservó su propia interacción tal como está en su mockup** — no se unificaron los 3 flujos en uno solo. Esto importa: cuando más adelante se conectó el backend, Professional y Dark siguieron auto-comprimiendo al soltar archivos, y Soft siguió exigiendo el click en "Optimize Now", porque así lo definió cada diseño original.

## 5. Arquitectura de componentes y theming

**Componentes compartidos** (`front/src/app/shared/`): `Header` y `Footer` (contenido idéntico en los 3 mockups), `Dropzone`, `QueueItemCard`, `PrimaryButton`. Cada `*-page` (`professional-page`, `dark-page`, `soft-page`) compone estos átomos más su propio markup específico (hero, panel de settings) — **no** se forzó un componente `SettingsPanel` compartido entre Dark y Soft aunque ambos tienen un panel de configuración, porque sus campos son genuinamente distintos y solo hay 2 casos conocidos; forzar una abstracción común ahí habría sido más código que el que ahorraba.

**Theming:** Tailwind v4 define los tokens de diseño una sola vez en `front/src/styles.css` vía `@theme` (paleta "Professional", que es la base documentada en `DESIGN.md`), y los temas Dark/Soft solo **sobrescriben** las variables CSS que realmente cambian (`[data-theme='dark'] { --color-primary: ...; }`, etc.) — no redefinen el `@theme` completo. Cada página fija `document.documentElement.dataset.theme` en su constructor. Esto funciona porque las utilidades de Tailwind v4 (`bg-primary`, `rounded-xl`, etc.) solo consumen la variable CSS en tiempo de ejecución, así que cambiar la variable en el documento cambia el look sin duplicar ninguna clase.

## 6. Estrategia de testing

Antes de instalar nada se revisó qué ya venía de fábrica: **Vitest** en el front (default de `ng new` en Angular 21) y **Jest + Supertest + `@nestjs/testing`** en el back (default de `nest new`). Ninguno de los dos se cambió — cambiar el default de cada framework sin una razón concreta habría sido una instalación innecesaria.

Lo único que sí era una decisión real: cómo probar el flujo de navegador de punta a punta. Se eligió **Playwright** sobre Cypress por ser más liviano de arrancar y porque ya se había probado que funciona sin fricción en este entorno (se usó primero para verificar visualmente el diseño antes de escribirle tests formales).

Cuando se conectó el backend, la suite de tests se reorganizó así:
- `front/src/app/core/image-queue.spec.ts`: prueba el estado y la lógica de subida/error/descarga con `HttpTestingController` (mock de HTTP), de forma exhaustiva — es la pieza de lógica nueva más importante.
- Los specs de cada página (`professional-page.spec.ts`, etc.) no repiten ese mismo mock de HTTP tres veces; en cambio verifican, con un spy sobre `ImageQueue.addFiles`, que cada página manda los parámetros correctos (calidad fija en Professional, calidad del slider en Dark, calidad+formato+espera-a-"Optimize Now" en Soft) — es decir, prueban el *cableado* de cada página, no la lógica compartida otra vez.
- `front/e2e/routes.spec.ts` corre contra el **backend real** (no mockeado): Playwright levanta `front` y `back` a la vez (`playwright.config.ts` tiene dos `webServer`), sube una imagen fixture real (`e2e/fixtures/sample.png`), espera a que el `POST /images/compress` responda 201, confirma que la tarjeta pasa a "Done" con tamaños reales, y verifica que el botón de descarga dispara una descarga real del navegador.

## 7. Conectar front con back

Contrato final, sin ninguna dependencia nueva en ningún lado (todo lo necesario ya estaba instalado):

- `POST http://localhost:3000/images/compress` — multipart (`files`, `quality`, `format`), valida tamaño (50MB) y tipo (jpg/png/webp) con los validators nativos de Nest (`ParseFilePipe`, sin `class-validator`: son solo 2 campos string, no justificaba la librería). Responde `{ results: [{ filename, mimeType, originalSize, compressedSize, dataUrl }] }` — `dataUrl` en base64, sin almacenamiento ni segundo endpoint de descarga, consistente con la decisión "stateless" de la sección 3.
- CORS habilitado en el back (`app.enableCors({ origin: 'http://localhost:4200' })`) en vez de un proxy de `ng serve`: front y back son dos aplicaciones con orígenes distintos, no un monorepo — CORS es la solución honesta para cómo esto se va a desplegar eventualmente, no solo una conveniencia de desarrollo.
- `front/src/app/core/image-queue.ts`: servicio con estado reactivo (signals) que orquesta la subida, el progreso real (`HttpClient` con `reportProgress: true`, no simulado), y las transiciones de estado de cada archivo. Se provee **por página** (`providers: [ImageQueue]` en cada `*-page`), no como singleton global — así cambiar de tema no mezcla la cola de archivos de un tema con la de otro.
- `Dropzone` y `QueueItemCard` pasaron de ser puramente presentacionales a emitir eventos reales (`filesSelected`, `cancel`, `download`) — sin eso no había forma de conectar nada.

**Qué quedó sin conectar, a propósito, y por qué:**
- El toggle **Lossy/Lossless** (tema Dark) y el checkbox **"Resize Large Images"** (tema Soft) siguen siendo visuales pero inertes — conectarlos de verdad requiere parámetros nuevos en el backend (modo de compresión, dimensiones máximas) que no se construyeron en esta pasada. Es la extensión natural siguiente, no una omisión accidental.
- El checkbox **"Strip Metadata (EXIF)"** (tema Soft) no necesitó ningún código: `sharp` ya omite los metadatos EXIF por defecto a menos que se llame explícitamente `.withMetadata()`, así que el comportamiento real ya coincide con el checkbox marcado por defecto.
- **"Download All"** descarga los archivos uno por uno (varios `<a download>` disparados en secuencia), no como un `.zip`. Empaquetar en zip real necesitaría una librería nueva (`archiver` en el back o `jszip` en el front) que hoy no está instalada ni se pidió.

## 8. Estructura final

*(Snapshot original de las 3 rutas. Después de la sección 12, `pages/` quedó solo con `soft-page` y `shared/` ganó 3 componentes más — ver el árbol actualizado al final de la sección 12.)*

```
pixlite/
├── front/                      Angular 21 (standalone, zoneless, Vitest, Tailwind v4)
│   ├── src/app/
│   │   ├── core/                image-queue.ts, images-api.ts, api-config.ts
│   │   ├── shared/               header, footer, dropzone, queue-item-card, primary-button, entry-detail.pipe
│   │   └── pages/                theme-index, professional-page, dark-page, soft-page
│   └── e2e/                     Playwright (routes.spec.ts + fixtures/sample.png)
├── back/                       Nest 11
│   └── src/
│       ├── images/               images.module.ts, images.controller.ts, images.service.ts
│       └── app.*                 boilerplate de `nest new`, sin tocar
└── styles/                     Los 3 mockups originales + DESIGN.md — quedan como referencia histórica
```

## 9. Cómo correr todo

```bash
# Backend (puerto 3000)
cd back && npm run start:dev

# Frontend (puerto 4200), en otra terminal
cd front && npm start

# Tests
cd back && npm test && npm run test:e2e     # Jest unit + Supertest e2e
cd front && npm test                         # Vitest (componentes + ImageQueue)
cd front && npm run e2e                      # Playwright — levanta front y back solo, sube una imagen real
```

## 10. Limitaciones conocidas / próximos pasos

- La respuesta del endpoint de compresión viaja como base64 dentro del JSON; para lotes grandes o imágenes muy pesadas convendría un endpoint de descarga por streaming en vez de inflar la respuesta ~33% con base64.
- Lossy/Lossless, Resize y el empaquetado en `.zip` de "Download All" son las extensiones más obvias y quedaron explícitamente fuera de esta pasada (ver sección 7).
- No hay autenticación ni límite de uso — no hacía falta para el alcance actual (herramienta sin cuentas de usuario).

## 11. Revisión de bugs sobre lo construido

Después de conectar front y back se corrió una revisión de código dedicada (8 ángulos de búsqueda + verificación independiente) sobre todo lo escrito en esta sesión. Encontró 10 hallazgos reales; 7 se arreglaron de inmediato porque eran bugs de comportamiento genuinos, y 2 se dejaron sin tocar a propósito.

**Arreglado:**
- `provideHttpClient(withFetch())` usa el backend Fetch de Angular, que **no emite eventos de progreso de subida** — toda la barra de progreso de `ImageQueue` dependía de eso y se quedaba pegada en 0%. Se volvió al backend XHR por defecto (se quitó `withFetch()`).
- El botón "Cancel" no abortaba la petición HTTP real, solo quitaba la tarjeta de la lista — el archivo seguía subiéndose/procesándose en el servidor de fondo. Ahora `ImageQueue` guarda la `Subscription` por archivo y la cancela de verdad; como varios archivos soltados juntos comparten una sola petición, cancelar uno cancela la petición completa, así que los demás archivos de ese mismo lote pasan a estado de error explicando por qué (en vez de quedar congelados en "compressing" para siempre).
- Un archivo corrupto o de tipo/tamaño inválido dentro de un lote hacía fallar **todo el lote** (`ParseFilePipe` validaba de forma atómica, y una excepción de `sharp` tumbaba el `Promise.all` completo). Ahora cada archivo se valida y se comprime de forma aislada en `ImagesService`; un archivo malo devuelve su propio error sin afectar a los demás.
- `quality=0` se interpretaba como "no se envió calidad" (`Number(quality) || 80`, y el mismo bug duplicado en el service) y se sustituía silenciosamente por 80. Se corrigió a comprobar `Number.isFinite` en vez de veracidad, y la normalización quedó en un solo lugar (el service) en vez de duplicada.
- Un `format` inválido llegaba sin validar hasta `sharp.toFormat()` y tiraba un 500 crudo. Ahora el controller lo valida una vez por request contra la lista de formatos soportados y responde 400.
- `QueueItemCard` soporta mostrar la miniatura real de la imagen comprimida (`thumbnailUrl`), pero ninguna de las 3 páginas la conectaba a `entry.dataUrl` — nunca se veía. Ya está conectada en las 3.
- `QueueEntryStatus` (en `image-queue.ts`) y `QueueItemStatus` (en `queue-item-card.ts`) eran dos uniones de string idénticas declaradas por separado, sin ninguna relación — podían divergir sin que el compilador avisara. Se extrajeron a un único `QueueStatus` en `shared/queue-status.ts`.
- El backend limita a 20 archivos por lote pero el front no avisaba nada: si se soltaban más, el límite de multer fallaba de forma genérica y opaca. Ahora `ImageQueue.addFiles` recorta a 20 y agrega una tarjeta de error visible indicando cuántos archivos se omitieron — sin límites silenciosos.

Se agregaron tests de regresión para todos estos casos: `back/src/images/images.service.spec.ts` (incluye el caso específico de `quality=0` y el aislamiento de errores por archivo) y nuevos casos en `front/src/app/core/image-queue.spec.ts` (cancelación real, error compartido entre archivos del mismo lote, tope de 20 archivos, error parcial dentro de un mismo batch).

Una segunda pasada de revisión sobre esos mismos fixes encontró 4 problemas más, todos arreglados:
- `entry-detail.pipe.ts` mostraba un doble negativo (`(--5%)`) cuando la imagen comprimida terminaba **más pesada** que la original (pasa con imágenes muy pequeñas al convertir de formato) — ahora muestra `+X%` en ese caso, y se le agregó su primer spec (no tenía ninguno).
- El controller validaba `format` con un chequeo de verdad (`if (format && ...)`), así que un `format=''` se saltaba la validación en vez de fallar — el mismo patrón de bug que el de `quality=0`, esta vez con un string. Se corrigió a comparar contra `undefined` explícitamente.
- `FilesInterceptor` no tenía `limits.fileSize` configurado a nivel de multer — un archivo de varios cientos de MB se bufferizaba **completo en memoria** antes de que el chequeo de tamaño del service lo rechazara. Ahora el límite de 50MB se aplica en multer mismo, así que un archivo demasiado grande se corta a mitad de la subida, no después.
- El test de `quality=0` comparaba tamaños de bytes reales producidos por `sharp` sobre una imagen de 1x1 px — la diferencia real era de 1 byte, un margen tan chico que el test podía pasar aunque el clamping estuviera roto. Se exportó `normalizeQuality` y se testea directamente (0→1, -5→1, 150→100, `undefined`/`NaN`/texto→80) en vez de inferirlo indirectamente por el tamaño del archivo comprimido.

**Dejado sin arreglar, a propósito:**
- **CORS y `API_BASE_URL` hardcodeados a `localhost`** (back y front respectivamente): es un hallazgo real — cualquier despliegue fuera de exactamente `localhost:4200`↔`localhost:3000` rompe. No se resolvió con variables de entorno porque hoy no existe ningún despliegue real que lo necesite; agregar esa configuración ahora sería resolver un problema que todavía no existe. Es el primer cambio a hacer el día que haya un dominio real. *(Resuelto más adelante — ver sección 12: `CORS_ORIGIN` y `environment.prod.ts` ya se usan en el despliegue real de `pixlite.jose-hernandez.dev`, ver `DEPLOY.md`.)*
- **Los tipos del contrato HTTP (`CompressedImageResult`, `OutputFormat`, `CompressOptions`) están duplicados a mano entre `back/src/images/images.service.ts` y `front/src/app/core/images-api.ts`**, sin ningún paquete compartido — pueden divergir sin error de compilación. No se introdujo un paquete de tipos compartido porque `front/` y `back/` son dos aplicaciones desplegables por separado sin ninguna herramienta de monorepo (Nx, Turborepo, workspaces) configurada; montar eso solo para 3 interfaces pequeñas sería más infraestructura que la que resuelve. Si el contrato crece o empieza a divergir de verdad, ese es el momento de reconsiderarlo.

## 12. Consolidación a un solo diseño (Soft Minimalist) + favicon

Se cerró la limitación que dejaba abierta la sección 10 original: de los 3 mockups implementados como rutas independientes, **se eligió `soft` (Soft Minimalist) como la experiencia única** del producto y quedó montado en la ruta raíz (`/`). Se eliminaron `professional-page`, `dark-page` y `theme-index` (componentes, specs y sus rutas); `app.routes.ts` quedó con una sola ruta (`''` → `SoftPage`) más un wildcard que redirige de vuelta a `/`.

En `styles.css`, el bloque `@theme` (que representaba la paleta "profesional" con Soft como override vía `[data-theme='soft']`) pasó a contener directamente los valores de Soft (radios grandes, tipografía Outfit, sombra suave). El atributo `data-theme` y el bloque `[data-theme='dark']` quedaron sin ningún consumidor una vez retiradas las otras dos rutas, así que se eliminaron junto con la línea `document.documentElement.dataset['theme'] = 'soft'` en el constructor de `SoftPage`.

De paso, se extrajeron 3 átomos nuevos en `shared/` a partir de markup que vivía inline en `soft-page.html`: `QualitySlider`, `SegmentedControl` (genérico, tipado por `T`, reutilizable para cualquier grupo de opciones tipo toggle) y `Checkbox`. Reemplazan el slider de calidad, el toggle de formato y los dos checkboxes que antes estaban escritos a mano y duplicados. `Checkbox` quedó como componente controlado (`checked` + `checkedChange`) en vez de HTML estático sin binding — un checkbox con `[checked]` ligado a un signal pero sin escuchar su propio evento `change` se queda "pegado" al valor original en el próximo change detection, así que expone el evento nativo hacia afuera para que el signal del padre (`stripMetadata`/`resizeLargeImages`) siga al click en vez de pisarlo.

Se agregó un favicon propio: `front/public/favicon.svg` (vector, el que usan los navegadores modernos) y `front/public/favicon.ico` multi-resolución (16/32/48, generado con `sharp` — la misma librería que ya usa el back) como *fallback*. Es una insignia redondeada en el morado primario (`#4f378a`) con una "P" en blanco, coherente con la paleta de marca ya definida en `DESIGN.md`.

Se revisó el back en busca de bugs reales: `images.service.spec.ts` tenía una propiedad `buffer` duplicada dentro de un mismo objeto literal (error de TypeScript que `tsc --noEmit` sí marca pero que `ts-jest` dejaba pasar sin que fallara ningún test) y `main.ts` dejaba la promesa de `bootstrap()` sin manejar (`@typescript-eslint/no-floating-promises`). Ambos se corrigieron. No se encontraron bugs de comportamiento nuevos: la validación de `quality`/`format`, el límite de archivos, el aislamiento de errores por archivo y los límites de tamaño (secciones 7 y 11) siguen intactos, con toda la suite en verde — back 13/13 (Jest) + `tsc --noEmit` limpio, front 33/33 (Vitest) + build de producción limpio, y 3/3 e2e de Playwright contra el front y el back reales.

**Pendiente, identificado pero fuera de esta pasada:** el back acumula ~34 violaciones de Prettier que `npm run lint` reporta en cuanto se corre sin `--fix` — el código nunca se formateó con la config actual de `.prettierrc`. No se corrigieron aquí porque `--fix` reescribe casi todo el módulo `images/` solo por ancho de línea, un diff grande y sin relación funcional con esta tarea; es un cambio aparte que vale la pena hacer de forma aislada.

Estructura final actualizada:

```
pixlite/
├── front/                      Angular 21 (standalone, zoneless, Vitest, Tailwind v4)
│   ├── public/                  favicon.svg, favicon.ico
│   ├── src/app/
│   │   ├── core/                image-queue.ts, images-api.ts, api-config.ts
│   │   ├── shared/               header, footer, dropzone, queue-item-card, primary-button,
│   │   │                         quality-slider, segmented-control, checkbox, entry-detail.pipe
│   │   └── pages/                soft-page (única ruta, montada en '/')
│   └── e2e/                     Playwright (routes.spec.ts + fixtures/sample.png)
├── back/                       Nest 11
│   └── src/
│       ├── images/               images.module.ts, images.controller.ts, images.service.ts
│       └── app.*                 boilerplate de `nest new`, sin tocar
└── styles/                     Los 3 mockups originales + DESIGN.md — quedan como referencia histórica
```
