# Guía para agentes de codeo asistido

Este archivo aplica a cualquier tarea de codeo asistido (Claude Code u otro
agente) sobre este repositorio. Leelo antes de tocar código.

## Idioma

Todo el material escrito del proyecto va **en castellano**: nombres de
variables, funciones y tipos, comentarios, mensajes de commit, texto de la
interfaz, y documentación (README, este archivo, etc.). La única excepción
son identificadores técnicos que por convención van en inglés (nombres de
paquetes/crates de terceros, claves de configuración de herramientas como
`package.json` o `tauri.conf.json`, el identificador reverso del bundle).

La conversación con la persona usuaria puede ser en castellano o en inglés
indistintamente — esta regla es sobre el material del proyecto, no sobre el
chat.

## Flujo de git

Todo cambio se hace en una rama local nueva, nunca directamente sobre
`main`. Al terminar la tarea, se sube esa rama y se abre un PR contra
`main`; una vez mergeado, hay que volver a `main`, actualizar con
`git pull` y borrar la rama local (y la remota, si no se borró sola al
mergear).

## Arquitectura y convenciones técnicas

- **Backend**: Rust, en `src-tauri/`. La lógica de MIDI usa la librería
  [`midir`](https://docs.rs/midir). Las conexiones activas (entrada/salida)
  viven en `tauri::State`, protegidas con `Mutex` (la conexión de salida
  además está detrás de un `Arc` porque el callback de la conexión de
  entrada —que corre en su propio hilo— también necesita escribir en ella
  para reenviar el reloj MIDI y el Sensor Activo). El backend no procesa
  mensajes: manda cada uno al frontend (evento `mensaje-midi`, solo con los
  bytes y la marca temporal) y envía a la salida lo que el frontend le pida
  con el comando `enviar_mensaje`. La descripción legible de un mensaje la
  arma el frontend (`src/midi/describir.ts`), porque también describe lo que
  sale del flujo, que nunca vuelve del backend. El tipo, el canal y la nota de un
  mensaje no se calculan ahí: los lee `MensajeMidi` (`src/midi/mensaje.ts`), y
  cualquier otro módulo que los necesite usa esa misma lectura. Lo que es solo
  presentación, como el nombre de la nota ("C4", con el Do central 60 como C4),
  sí queda en `describir.ts`.
  `midir` no avisa cuando un puerto desaparece, así que cada conexión
  exitosa lanza un hilo vigilante que revisa una vez por segundo que sus dos
  puertos sigan en la lista del sistema. Si falta alguno, cierra todo y
  emite `conexion-perdida` con el mensaje a mostrar. Para que un vigilante
  viejo no cierre una conexión nueva, `EstadoMidi` lleva un
  `numero_de_conexion` que `cerrar_conexiones` incrementa. Su lock se toma
  durante todo el cierre y la apertura (en `conectar`, `desconectar` y el
  vigilante), y por eso `cerrar_conexiones` lo recibe ya tomado: cualquier
  camino nuevo que cierre o abra conexiones tiene que tomarlo igual.
  Los puertos se identifican siempre por el `id` que da el sistema
  (`Puerto { id, nombre }`, `find_port_by_id`), nunca por el nombre: dos
  puertos pueden llamarse igual. El nombre es solo para mostrar, y el
  " (2)" de los repetidos lo arma el frontend (`conNombresAMostrar`). En
  macOS el `id` no cambia al desenchufar y volver a enchufar; en Linux
  (ALSA) sí puede cambiar.
- **Frontend**: TypeScript con Vite y [Lit](https://lit.dev): la interfaz son
  componentes `LitElement` con Shadow DOM. Se comunica con el backend mediante
  comandos (`invoke`) y eventos (`listen`) de la API de Tauri. No agregar otro
  framework de componentes (React, Vue, Svelte, etc.) sin que la persona
  usuaria lo pida explícitamente. Todo se importa de `lit` (`lit/decorators.js`,
  `lit/directives/…`), nunca de `lit-html`. Los decoradores son los *legacy*
  (`experimentalDecorators` y `useDefineForClassFields: false` en
  `tsconfig.json`): Oxc, el transformador de Vite 8, todavía no transforma los
  estándar, y sin la segunda opción un campo con valor inicial pisaría la
  propiedad reactiva del decorador. Cuando Oxc los soporte, pasar a los
  estándar es agregar `accessor` a cada propiedad y sacar las dos opciones.
- **Organización del código**: por área. Cada carpeta de primer nivel de
  `src/` es un módulo: `ventana/`, `conexion/`, `log/` y `workflow/` (con la
  vista del editor en `workflow/editor/`), más `estado/`, `estilos/` y
  `midi/`. Cada componente es un archivo con el nombre de su etiqueta
  (`panel-conexion.ts` define `<panel-conexion>`) que exporta una sola clase;
  las etiquetas van en castellano y sin prefijo, y a una palabra suelta se le
  agrega contexto (`ventana-principal`, no `ventana`). La lógica que no dibuja
  (las acciones que llaman al backend, los `inicializar<X>()` con sus
  `listen`, el ejecutor, los tipos de nodo) queda en módulos sin componentes.
  Los `inicializar<X>()` los llama `main.ts` al arrancar, no el ciclo de vida
  de un componente: el flujo tiene que procesar mensajes aunque no haya una
  vista montada.
- **Estado de la interfaz**: en dos niveles. Lo que necesita más de un
  componente, o la lógica, vive en `src/estado/estado.ts` y se modifica solo
  con `actualizar()`; los componentes se enganchan con `ControladorDeEstado`
  (`estado/controlador.ts`), que los vuelve a dibujar con cada cambio. Lo que
  solo le importa a un componente y puede perderse si se desmonta (como el
  texto a medio escribir en un campo) es estado local, con `@state`. Ante la
  duda, va al store. Ningún componente lee el estado del DOM. El dibujado es
  asíncrono: después de `actualizar()`, el DOM todavía no cambió, y hay que
  esperar `elemento.updateComplete` para mirarlo.
- **Componentes**: los de área (`panel-conexion`, `panel-workflow`,
  `panel-de-configuracion`…) leen el store y llaman a las acciones. Los hoja
  (`selector-de-puerto`, los `parametro-…`) reciben lo que necesitan por
  propiedades y avisan con `CustomEvent` de nombre en castellano (`cambio`,
  `agregar-caja`), sin conocer el store; un evento que tiene que cruzar una
  raíz lleva `bubbles: true, composed: true`. Una plantilla sin estado,
  estilos ni ciclo de vida propios sigue siendo una función: por ejemplo, la
  barra de estado de `conexion/conexion.ts`, que exporta también sus estilos
  para el componente que la dibuja. Un módulo es dueño de un
  comportamiento, no de una región de la pantalla.
- **Estilos y Shadow DOM**: cada componente encapsula sus estilos en
  `static styles`. Lo único global es `estilos/global.css`: las variables (que
  sí atraviesan el Shadow DOM), la letra que heredan todos y el `body`. Los
  colores que cambian en modo oscuro son variables ahí, así los componentes no
  repiten el `@media`. Lo que comparten los controles (botones, listas, campos,
  foco, `box-sizing` y `[hidden]`) está en `estilos/compartidos.ts`, y cada
  componente que los dibuja lo suma: `static styles = [compartidos, css`…`]`.
  El CSS de afuera no entra: un componente que no suma `compartidos`, o que no
  declara `box-sizing: border-box`, se ve distinto sin dar ningún error. Los
  custom elements son `display: inline`, así que todo componente que participa
  del layout declara su `display` en `:host` (y, si crece,
  `flex: 1; min-height: 0`). Lo que se enlaza por `id` (`aria-controls`,
  `aria-labelledby`, `<label for>`) tiene que quedar dentro de una misma raíz.
- **`<ventana-principal>` es la raíz** (`src/ventana/`): `index.html` contiene
  solo esa etiqueta, y `main.ts` solo la registra y llama a los
  `inicializar<X>()`. Ningún módulo llama a `render` ni a
  `document.querySelector`.
- **Paneles y tabs**: la lista `PANELES` de `ventana-principal.ts` es la única
  fuente; de ahí salen la barra, las `<section>` de los paneles y los
  atributos ARIA que los enlazan (`id`, `aria-controls`, `aria-labelledby`,
  `aria-selected`). La barra de tabs es una función (`ventana/barra-de-tabs.ts`)
  y no un componente, para que quede en la misma raíz que los paneles a los
  que apunta. Agregar un panel es agregar una entrada a esa lista (con su nombre y su
  ícono) y el módulo con su componente. La barra de tabs va arriba y primera
  en la raíz, antes de los paneles, para que el recorrido por teclado siga el
  orden visual. No hay encabezado: el nombre de la aplicación lo muestra el
  sistema en la barra de la ventana, y lo único que aplica a todos los tabs,
  el estado de la conexión, va en la barra de estado, al pie. Ocultar un panel es `?hidden`,
  **nunca** renderizado condicional (`${activo ? panel() : nothing}`):
  desmontarlo le borraría al log los mensajes acumulados, que tiene que
  seguir juntando mientras su tab no está a la vista.
- **Layout de la ventana**: la ventana no se desplaza nunca.
  `<ventana-principal>` va atada a la ventana con `position: fixed; inset: 0`
  en su `:host` (no con `100dvh`: en WebKit, al entrar y salir de pantalla
  completa, esa medida queda vieja y deja un margen o un desplazamiento). Los
  tres tabs comparten la clase `.panel`, que ocupa todo el lugar entre la
  barra de tabs y la barra de estado; no hay reglas por panel. Los paneles no
  son tarjetas (sin borde, esquinas redondeadas ni fondo propio) y el
  contenedor no tiene margen: cada componente de tab pone el suyo, y el log va
  a ras del panel. Cada tab estiliza solo lo
  que dibuja adentro, y eso se confina al lugar que tiene: lo que crece va con
  `flex: 1; min-height: 0` y desplaza su propio contenido, en vez de agrandar
  el panel. No usar alturas fijas ni mínimas para que algo "entre".
- **Log**: tiene su propio registro (`log/log.ts`: las últimas 500 entradas,
  la más nueva primero, cada una con un `id` y sin cambios después de
  creada), separado del store: si estuviera ahí, cada mensaje MIDI haría
  volver a dibujar todos los componentes. `<panel-log>` lo dibuja con
  `repeat` por `id` y `guard`, así un mensaje nuevo crea solo su fila, y
  espera al próximo cuadro para dibujar (redefine `scheduleUpdate`), así una
  ráfaga se dibuja una sola vez. Con la ventana minimizada no se dibuja: los
  mensajes se acumulan en el registro y se dibujan al volver. Cada fila parte
  la descripción en sub-columnas de ancho fijo (`partesDeLaDescripcion` de
  `describir.ts`), medidas en `ch` porque la letra es monoespaciada: por eso
  la fila de encabezados conserva esa letra y cambia la de cada título, ya que
  los `ch` de la grilla se miden con la letra del contenedor. El log no
  escucha `mensaje-midi`: el único listener está en `ejecutar.ts`, que pasa
  el mensaje por el flujo, envía lo emitido y le da a `agregarAlLog` la
  entrada, lo que se emitió y el texto del error, si una caja falló.
- **Workflow**: el editor de flujos y su ejecución viven en `src/workflow/`.
  - El flujo se ejecuta en el frontend (`ejecutar.ts`): cada mensaje entra por
    el trigger y sale tal cual, salvo que llegue a al menos una caja sin
    salida (Emitir, Descartar): entonces sale solo lo que devuelvan esas
    cajas. Si una caja falla, no sale nada de ese mensaje. Ninguna caja
    declara nada para esto: lo decide el recorrido.
  - Las cajas no envían mensajes: lo que devuelve una caja sin salida (como
    Emitir) es lo que sale por el puerto. El recorrido (`procesarMensaje`) es
    puro y devuelve `{ salidas, error }`; el listener de `mensaje-midi` envía
    las salidas con `enviarMensaje` y le pasa todo al log. Ningún tipo de
    nodo importa `salida.ts`.
  - Un error en una caja se lanza como `Error` (con el nombre de la caja y
    `cause`), y corta todo el recorrido de ese mensaje. `procesarMensaje` es
    el único que lo atrapa: el recorrido no revisa marcas de error.
  - `MensajeMidi` guarda solo los bytes; `tipo`, `canal` y `nota` son getters
    que se calculan en cada lectura, para que no queden viejos si una caja
    cambia los bytes. No agregar campos derivados que haya que mantener sincronizados.
  - El grafo (qué cajas hay, cómo están configuradas y conectadas) vive en
    `estado.flujo`. La vista del lienzo (posiciones, zoom, arrastre) es de
    Rete, y no pasa por el store.
  - `editor/lienzo.ts` es el **único** módulo que importa Rete. Ni los tipos de
    nodo, ni el ejecutor, ni el panel de configuración dependen de la librería
    del lienzo, y así tiene que seguir: cambiar de librería es reescribir ese
    archivo y nada más. Define `<lienzo-workflow>` y `<caja-del-flujo>` (la
    caja conoce el protocolo de Rete, por eso va en el mismo archivo). El
    lienzo se monta la primera vez que tiene tamaño (con un `ResizeObserver`),
    porque Rete mide las cajas en pantalla y dentro de un panel oculto todo
    mide cero. La barra de herramientas y el panel de configuración piden
    agregar o borrar cajas con eventos, y `<panel-workflow>` llama a los
    métodos del lienzo.
  - Cada tipo de nodo es un archivo en `src/workflow/nodos/` que se registra
    en la lista de `catalogo.ts` (el orden de la lista es el de la barra). La
    guía para crear uno está en `nodos/LEEME.md`, y tiene que seguir
    alcanzando para alguien que recién empieza a programar.
  - Cada tipo de parámetro (lo que se configura en una caja) es un archivo en
    `src/workflow/parametros/` registrado en `parametros/catalogo.ts`: la unión
    `Parametro` y la lista `TIPOS_DE_PARAMETRO`, que el chequeo de tipos
    mantiene de acuerdo. Cada uno define su control sobre `CampoDeParametro`
    (que pone la etiqueta y los estilos de campo) y qué valores le sirven. El
    panel de configuración no nombra ningún tipo. La guía está en
    `parametros/LEEME.md`, para alguien con nociones básicas de programación.
  - Cada caja del lienzo es un componente Lit (`<caja-del-flujo>`): Rete le
    asigna `data` y `emit` al volver a dibujarla, y la selección se marca con
    la propiedad `selected` del nodo más `area.update`. Rete ubica las
    conexiones sumando `offsetLeft`/`offsetTop`, sin tener en cuenta
    `transform` de CSS: los conectores no se posicionan con `transform`.
  - Rete sí le pone `transform` al contenedor de cada caja, y eso encierra
    todo lo de la caja en su propio contexto de apilamiento: para que algo
    que sobresale (como el globo con el nombre) quede encima de otra caja,
    hay que subir el `z-index` de ese contenedor, no el de la caja. Como la
    caja tiene su propio shadow root, la regla va en el lienzo y apunta al
    host: `:has(> rete-root > caja-del-flujo:hover)`.
  - El lienzo lleva `contain: strict`: Rete ubica las cajas con
    `position: absolute` y dibuja cada conexión en un SVG de 9999 px, y sin
    la contención eso puede agrandar el panel en WebKit (por ejemplo, con
    una caja que queda fuera de la vista al achicar la ventana).
  - El color de una caja sale de su etapa en el flujo (`etapaDelTipo` en
    `catalogo.ts`: inicio, intermedia o fin), no de algo que declare el tipo
    de nodo. Sumar un color por tipo es una decisión a consultar con la
    persona usuaria, no un campo para agregar al pasar.
  - La ventana tiene `"dragDropEnabled": false` en `tauri.conf.json`: sin eso,
    Tauri captura los arrastres y el drag and drop de HTML5 (arrastrar cajas
    desde la barra) no funciona en la ventana real.
  - Los íconos son de [Lucide](https://lucide.dev), importados por nombre para
    que el tree-shaking deje solo los usados.
- **Comunicación Rust ↔ JS**: los argumentos de los comandos se escriben en
  `snake_case` del lado de Rust; Tauri los mapea automáticamente a
  `camelCase` del lado de JS/TS al invocarlos. Mantené esa convención en
  ambos lados en vez de forzar un nombre igual en los dos.
- **Reloj MIDI y Sensor Activo**: por diseño, los mensajes de *Timing Clock*
  (`0xF8`) y *Active Sensing* (`0xFE`) no pasan por el workflow: el backend
  los reenvía directo a la salida y no los manda al frontend, así que
  tampoco aparecen en el log (ver `se_reenvia_directo` en
  `src-tauri/src/lib.rs`). Al reloj, el ida y vuelta al frontend le sumaría
  jitter. El Sensor Activo tiene que llegar sí o sí: un receptor que deja de
  recibirlo apaga las notas. Si aparece otro mensaje de alta frecuencia,
  evaluar si corresponde el mismo tratamiento: no asumirlo, confirmarlo con
  la persona usuaria.

## Toolchain

- El proyecto requiere una versión de Rust razonablemente reciente (alguna
  dependencia transitiva necesita `edition2024`, estabilizado en Rust 1.85).
  Si `cargo check` falla mencionando `edition2024`, correr
  `rustup update stable` antes de asumir que hay un error de código.
- Package manager de JS: `npm` (no hay `pnpm`/`yarn` en este proyecto;
  mantener consistencia y no mezclar lockfiles).

## Verificación antes de dar por terminada una tarea

- `cargo check`, `cargo test`, `cargo fmt --check` y
  `cargo clippy --all-targets -- -D warnings` (desde `src-tauri/`) para el
  backend.
- `npx tsc --noEmit` y `npm test` (desde la raíz) para el frontend.
- `npm run tauri dev` para probar la app real. Tené en cuenta que abre una
  ventana nativa (no es un sitio web): para verlo, hay que ejecutarlo en la
  máquina de la persona usuaria, no alcanza con abrir la URL de Vite en un
  navegador común, ya que ese navegador no tiene el puente de IPC de Tauri
  (`invoke`/`listen` van a fallar ahí). Sirve igual para revisar con las
  herramientas de navegador disponibles el layout, la conmutación de tabs,
  los atributos ARIA y el orden de tabulación. Ojo: las herramientas que leen
  la página (`read_page`, `find`, `get_page_text`) no entran en los shadow
  roots y la ven vacía. Para leerla o revisarla se usa `javascript_tool`,
  bajando por `shadowRoot`
  (`document.querySelector('ventana-principal').shadowRoot.querySelector(…)`),
  además de capturas, clics y teclas. Lo que no se puede verificar
  ahí es la activación de controles con el teclado: la inyección de teclas no
  dispara la activación de un botón nativo, así que Enter y barra
  espaciadora hay que probarlos en la ventana real.
- Para revisar la interfaz sin la ventana real, `verificacion-para-agentes/`
  tiene herramientas para agentes (no para personas): corren pruebas en el
  WebKit del sistema (el mismo motor que la ventana de Tauri, sin abrirla) o
  en Chromium, y comparan la huella de la interfaz (posición y estilos de
  cada elemento) antes y después de un cambio. Cómo se usan, y qué hace falta
  instalar, está en su `LEEME.md`. Al terminar un cambio que no debería
  verse, la huella tiene que dar igual. No reemplazan a la ventana real para
  la activación con teclado ni para el flujo MIDI completo.
- El navegador de desarrollo es Chromium, pero la ventana real usa WebKit, y
  el layout puede comportarse distinto. Un problema de tamaños que no se
  reproduce en el navegador, sobre todo al entrar o salir de pantalla
  completa, hay que probarlo en la ventana real antes de darlo por resuelto.
- Como la interfaz se dibuja desde `src/estado/estado.ts`, en el navegador se
  puede manejar el estado a mano desde la consola
  (`const m = await import('/src/estado/estado.ts'); m.actualizar({ conectado: true })`)
  y revisar cómo responde la pantalla sin el puente de IPC ni hardware MIDI.
  Antes de mirar el DOM hay que esperar el dibujado:
  `await document.querySelector('ventana-principal').updateComplete` (y el del
  componente que interese, si está más adentro; el log, además, espera al
  próximo cuadro). Si el panel del navegador está oculto
  (`document.visibilityState` es `hidden`), no hay cuadros y `<panel-log>` no
  se dibuja nunca: en ese caso, usar las herramientas de
  `verificacion-para-agentes/`.
  Ojo: después de editar archivos con el servidor corriendo, Vite puede servir
  un módulo con un sufijo `?t=…`, y un `import` sin ese sufijo trae **otra
  copia** del estado, que la aplicación no ve. Antes de manejar el estado a
  mano, recargá la página, o importá la URL exacta que figura en
  `performance.getEntriesByType('resource')`. Si pasa en `tauri dev`,
  reiniciarlo.
  Sirve para los estados de los controles, que la elección de puerto sobreviva
  a un redibujado y que las filas del log no se pierdan. Lo que sigue
  necesitando la ventana real es la activación con teclado y el flujo MIDI
  completo.
- En el navegador, el arranque se corta en el primer `listen` (el de
  `inicializarWorkflow`), así que los `inicializar<X>()` que vienen después nunca
  corren. Para probar uno, o para simular respuestas del backend (por ejemplo
  un comando que falla, un caso que en la aplicación real no se puede
  provocar), se reemplaza el puente desde la consola y se llama a la función
  a mano:
  `window.__TAURI_INTERNALS__ = { transformCallback: () => 1, invoke: async (comando) => { if (comando.startsWith('plugin:event|')) return 1; throw 'fallo simulado'; } }`.
  Los botones que llaman a `invoke` usan ese reemplazo desde el siguiente
  clic.
- Para probar el flujo de MIDI sin hardware físico, en macOS se puede
  habilitar el **IAC Driver** (Audio MIDI Setup → MIDI Studio). Hacen falta
  **dos buses**: uno como entrada de la aplicación y otro como salida. Con uno
  solo para las dos cosas, todo lo que la aplicación emite le vuelve a entrar
  y se arma un bucle. Dos cosas que macOS hace por su cuenta, antes de que el
  mensaje llegue a la aplicación: un Nota On con velocidad 0 mandado al IAC
  llega como Nota Off con velocidad 64 (`90 3C 00` → `80 3C 40`), y los status
  de sistema indefinidos (`F4`, `F9`, `FD`) se descartan. Para probar esos
  casos hace falta un dispositivo físico, o leer el código.

## Tests

- Se testea solo la lógica pura. En Rust, las funciones de `lib.rs` que no
  usan `midir` ni el `AppHandle`, en un `mod tests` al final del mismo
  archivo. En TypeScript, con Vitest en entorno `node` (sin DOM simulado), y
  cada `.test.ts` va al lado del módulo que prueba.
- Cada tipo de nodo trae su `.test.ts`, con el estilo didáctico de
  `desplazar.test.ts` (un `test` por comportamiento, bytes literales, sin
  helpers): es también el ejemplo que copia quien crea un nodo, así que tiene
  que poder leerse sin saber nada más del proyecto. Además,
  `catalogo.test.ts` revisa lo que todo nodo tiene que cumplir.
- Cada tipo de parámetro que interpreta lo que se escribe (como `entero.ts`)
  trae el test de esa interpretación al lado. Lit carga sin problemas en el
  entorno `node`, así que se puede importar un archivo que define un
  componente para probar sus funciones puras.
- Queda afuera a propósito: la vista (componentes, lienzo de Rete, tabs),
  `conectar` y el vigilante (necesitan `midir` real) y la ventana real. Eso
  se sigue verificando como indica la sección anterior.
- El CI (`.github/workflows/ci.yml`) corre en Ubuntu, en cada PR contra
  `main` y en cada push a `main`, todo lo de la verificación más
  `npm run build`.

## Estilo de código

- No agregar comentarios que expliquen *qué* hace el código (los nombres ya
  lo dicen); solo comentar cuando haya una razón no obvia (una restricción
  oculta, un workaround puntual). Ver los comentarios existentes en
  `src-tauri/src/lib.rs` como referencia de tono y extensión.
- No introducir abstracciones, frameworks o configuración pensada para
  necesidades futuras que todavía no llegaron (por ejemplo, no sumar tipos de
  parámetro o de trigger al workflow hasta que un nodo concreto los necesite).
- Imports: dentro de un módulo, relativos (`./catalogo`, `../tipos`), para
  que la carpeta del módulo se pueda mover entera sin romper nada; entre
  módulos, con `@/`, que es `src/` (`@/workflow/ejecutar`). Un `../` nunca
  sale del módulo. Un módulo es una carpeta de primer nivel de `src/`; cada
  archivo suelto en `src/` cuenta como un módulo propio, y su `.test.ts` es
  parte de él. El alias se define una sola vez, en `paths` de
  `tsconfig.json`: Vite (y con él Vitest) lo lee de ahí por
  `resolve.tsconfigPaths`, así que no hay que repetirlo en `vite.config.ts`.

## OpenSpec

El proyecto tiene configurado [OpenSpec](https://github.com/Fission-AI/OpenSpec)
(`openspec/`) para features grandes que conviene planificar con proposal,
specs, diseño y tareas antes de implementar. Es una herramienta opcional: se
usa solo cuando la persona usuaria lo pide explícitamente (por ejemplo con
`/opsx:propose`), nunca por iniciativa propia del agente — el resto del trabajo
sigue las reglas de este archivo sin pasar por OpenSpec.

Es una excepción consciente a la regla de no agregar configuración para
necesidades que todavía no llegaron: se acepta porque el costo es chico (un
archivo de configuración y seis comandos de pocas líneas) y no toca el código
de la app.

El CLI es `@fission-ai/openspec`, declarado en `devDependencies` — ojo que el
paquete `openspec` a secas es otro, abandonado y sin ejecutable. Se usa con
`npx openspec`, no hace falta instalarlo aparte.

### Flujo

El CLI se conduce solo: cada comando indica cuál es el paso siguiente, y
`openspec instructions` devuelve, para cada artefacto, qué escribir y en qué
archivo. Por eso no hay instrucciones de OpenSpec copiadas al repositorio: la
fuente de verdad es el CLI, y esto es todo lo que hace falta para usarlo desde
cualquier herramienta, con o sin Claude Code.

```bash
npx openspec new change <nombre>           # crear el cambio
npx openspec status --change <nombre>      # qué falta y cuál es el próximo paso
npx openspec instructions <artefacto> --change <nombre>  # qué escribir y dónde
npx openspec instructions apply --change <nombre>        # cómo implementarlo
npx openspec validate <nombre>             # validar
npx openspec archive <nombre>              # archivar y actualizar las specs
```

El archivado va en la misma rama y el mismo PR que la implementación, como
último commit, una vez que la persona usuaria revisó el código. No se abre un
PR aparte solo para archivar. Si el archivado trae cambios a este archivo (ver
"Devolver el conocimiento a este archivo"), van en ese mismo commit.

En Claude Code, `.claude/commands/opsx/` son atajos escritos a mano para ese
mismo flujo (`/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `/opsx:explore`,
`/opsx:sync`, `/opsx:update`). No son output de la herramienta y `openspec
update` no los toca: si cambia el CLI, hay que actualizarlos a mano.

`openspec/config.yaml` es configuración propia del proyecto y va en castellano:
fija el idioma de los artefactos generados y agrega guía para el archivado.

### Devolver el conocimiento a este archivo

Cuando un cambio hecho con OpenSpec implica decisiones de arquitectura,
convenciones técnicas nuevas, cambios de toolchain o del flujo de verificación,
ese conocimiento tiene que volver a este archivo antes de archivar el cambio;
si no, queda enterrado en `openspec/changes/archive/`. La forma es proponerle
el diff a la persona usuaria y esperar aprobación explícita — nunca editar este
archivo por iniciativa propia.

`operations.archive.guidance` en `openspec/config.yaml` repite esa regla para
que aparezca al momento de archivar, pero el CLI la entrega marcada como
*advisory*: la regla que manda es esta, no la del archivo de configuración.

## Roadmap (contexto, no una tarea pendiente)

El objetivo es que usuarios semi-técnicos armen sus propios flujos de trabajo
manipulando mensajes MIDI (filtrar, transformar, remapear). Armar un flujo no requiere
escribir código, pero un mínimo de programación es aceptable cuando haga falta
(por ejemplo, para crear un tipo de nodo nuevo): aprender nociones básicas es
parte de la propuesta, no una barrera a evitar.
La base ya existe (el tab Workflow, ver Arquitectura): lo que sigue es sumar
tipos de nodo de a uno, a medida que se pidan, sin anticipar los que todavía
no hacen falta.
