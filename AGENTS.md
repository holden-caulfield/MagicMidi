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
Si un check del CI falla, se avisa y se espera: no se activan correcciones
automáticas del CI, porque la persona usuaria prefiere revisar los errores.

## Arquitectura y convenciones técnicas

### Backend

- **Rust y `midir`**: el backend está en `src-tauri/`, y la lógica de MIDI
  usa la librería [`midir`](https://docs.rs/midir). Las conexiones activas
  (entrada/salida) viven en `tauri::State`, protegidas con `Mutex` (la
  conexión de salida además está detrás de un `Arc` porque el callback de la
  conexión de entrada —que corre en su propio hilo— también necesita
  escribir en ella para reenviar el reloj MIDI y el Sensor Activo).
- **Límite con el frontend**: el backend no procesa ni describe mensajes.
  Manda cada uno al frontend (evento `mensaje-midi`, solo con los bytes y la
  marca temporal) y envía a la salida lo que el frontend le pida con el
  comando `enviar_mensaje`.
- **Conexión perdida**: `midir` no avisa cuando un puerto desaparece, así
  que cada conexión exitosa lanza un hilo vigilante que revisa una vez por
  segundo que sus dos puertos sigan en la lista del sistema. Si falta alguno,
  cierra todo y emite `conexion-perdida` con el mensaje a mostrar. Para que
  un vigilante viejo no cierre una conexión nueva, `EstadoMidi` lleva un
  `numero_de_conexion` que `cerrar_conexiones` incrementa. Su lock se toma
  durante todo el cierre y la apertura (en `conectar`, `desconectar` y el
  vigilante), y por eso `cerrar_conexiones` lo recibe ya tomado: cualquier
  camino nuevo que cierre o abra conexiones tiene que tomarlo igual.
- **Puertos**: se identifican siempre por el `id` que da el sistema
  (`Puerto { id, nombre }`, `find_port_by_id`), nunca por el nombre: dos
  puertos pueden llamarse igual. El nombre es solo para mostrar, y el
  " (2)" de los repetidos lo arma el frontend (`conNombresAMostrar`). En
  macOS el `id` no cambia al desenchufar y volver a enchufar; en Linux
  (ALSA) sí puede cambiar.
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

### Frontend

- **TypeScript, Vite y [Lit](https://lit.dev)**: la interfaz son
  componentes de Lit con Shadow DOM. Se comunica con el backend mediante
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
  vista del editor en `workflow/editor/`), más `estado/`, `estilos/`, `midi/`
  y `componentes/` (los controles que comparten todos, ver "Estilos y Shadow
  DOM"). Cada componente es un archivo con el nombre de su etiqueta
  (`panel-conexion.ts` define `<panel-conexion>`) que exporta una sola clase;
  las etiquetas van en castellano y sin prefijo, y a una palabra suelta se le
  agrega contexto (`ventana-principal`, no `ventana`). La lógica que no dibuja
  (las acciones que llaman al backend o responden a sus eventos, el
  ejecutor, los tipos de nodo) queda en módulos sin componentes.
- **Estado de la interfaz**: vive en el ancestro común más cercano de los
  componentes que lo usan, así cada dato tiene un solo dueño. Si lo usa un
  componente solo, es suyo (`@state`); si lo usan varios de una misma área,
  es del contenedor del área (`@state`), que lo baja por propiedades y lo
  recibe con eventos; si lo usa la lógica o componentes de áreas distintas,
  va al store (`src/estado/estado.ts`), que se modifica solo con
  `actualizar()` y al que los componentes se enganchan con
  `ControladorDeEstado` (`estado/controlador.ts`). Ante la duda, lo más cerca
  posible: se sube cuando aparece otro uso. Ningún componente lee el estado
  del DOM. El dibujado es asíncrono: después de `actualizar()`, el DOM
  todavía no cambió, y hay que esperar `elemento.updateComplete` para mirarlo.
- **Componentes**: los de área (`panel-conexion`, `panel-workflow`,
  `panel-de-configuracion`…) leen el store y llaman a las acciones, y pueden
  recibir por propiedades lo que vive en el contenedor de su área. Los hoja
  (los controles de `componentes/`) reciben lo que necesitan por
  propiedades y avisan con `CustomEvent` de nombre en castellano (`cambio`,
  `agregar-caja`), sin conocer el store; un evento que tiene que cruzar una
  raíz lleva `bubbles: true, composed: true`. Toda pieza de interfaz que se
  dibuja desde otro archivo es un componente, con sus estilos y, si lee el
  store, su propio `ControladorDeEstado`: así quien la dibuja no tiene que
  sumar sus estilos ni estar suscripto por ella. Una función que devuelve una
  plantilla es una ayuda interna de su archivo y no se exporta, salvo
  `dibujarIcono` (ver "Íconos"). Un módulo es dueño de un
  comportamiento, no de una región de la pantalla.
- **Estilos y Shadow DOM**: cada componente encapsula sus estilos en
  `static styles`. Lo único global es `estilos/global.css`: las variables (que
  sí atraviesan el Shadow DOM), la letra que heredan todos y el `body`. Los
  colores que cambian en modo oscuro son variables ahí, así los componentes no
  repiten el `@media`. El único color de acento es el ámbar (`--ambar`): lo
  encendido, el foco, la selección, los cables y los conectores. Las cajas del lienzo y los controles de la barra que las agregan
  tienen colores fijos, claros en los dos modos. Todos los componentes usan
  Shadow DOM y extienden `Componente` (`componentes/componente.ts`), nunca
  `LitElement`: es la que suma `compartidos` (`box-sizing` y `[hidden]`),
  porque el CSS de afuera no entra y un componente sin él se ve distinto sin
  dar ningún error.
- **Controles**: ningún componente estiliza un `<button>`, `<select>` o
  `<input>` por su cuenta. Los controles son componentes de
  `src/componentes/`, así un mismo control se ve igual en cualquier panel.
  Cada campo dibuja en su propia raíz la etiqueta, el control y el error (la
  base es `Campo`, en `componentes/campo.ts`), porque `<label for>` y
  `aria-describedby` no cruzan de un shadow root a otro; avisa con `cambio` y
  no guarda el valor: lo recibe de vuelta. Un campo recibe y avisa valores, no
  texto: leer lo escrito es suyo, y lo que no puede leer lo resuelve solo
  (vuelve a su valor, sin avisar nada), así sirve fuera del catálogo y ningún
  tipo de parámetro repite esa lógica. Los numéricos son dueños de su modo y
  de sus flechas (`ModoNumerico`): el modo es estado del campo, no del valor.
  Lo que un campo quiere conservar entre montajes lo avisa con
  `cambio-de-estado`, y quien lo usa lo guarda sin leerlo y se lo pasa en
  `estado` la próxima vez que lo crea: el campo lo lee una sola vez, para que
  su estado tenga un solo dueño. Ningún campo dibuja otro campo adentro: lo
  que varios campos comparten va en un controlador (como `ModoNumerico`),
  porque un campo compuesto obliga a sincronizar el estado de los dos. Los
  valores que nombra un error los escribe el campo, con su formato (ver
  "Workflow"). La apariencia común está en `componentes/estilos.ts`, sobre
  la clase `.control`: los estilos propios de un componente que la pisan
  (alto, padding) necesitan un selector más específico, como `button.control`,
  o pierden sin dar ningún error. `campo-lista` no usa `<select>`: la lista
  del sistema no se puede estilizar en WebKit, así que es un botón con
  `role="combobox"` y una lista propia, como el autocompletar (patrón de la
  APG, con `aria-activedescendant`). WebKit no enfoca un botón al hacerle
  clic: un control que depende del foco (para cerrarse al salir, o para el
  teclado) lo enfoca a mano. Los
  custom elements son `display: inline`, así que todo componente que participa
  del layout declara su `display` en `:host` (y, si crece,
  `flex: 1; min-height: 0`). Lo que se enlaza por `id` (`aria-controls`,
  `aria-labelledby`, `<label for>`) lo dibuja un mismo componente, porque el
  enlace no cruza de una raíz a otra.
- **Íconos**: son de [Lucide](https://lucide.dev), importados por nombre para
  que el tree-shaking deje solo los usados. Se dibujan con `dibujarIcono`
  (`componentes/icono.ts`), que es una función y no un componente: el
  `<svg>` queda en la raíz de quien lo dibuja, que lo estiliza directamente.
- **`main.ts` es el arranque**: monta `<ventana-principal>`, la raíz
  (`src/ventana/`), y engancha los eventos del backend, así ese archivo
  muestra todo lo que arranca y todo lo que entra del backend. Es el único
  que llama a `render` (una vez) y a `listen`: cada evento llama a una acción
  de su módulo, y ningún componente escucha al backend, porque el flujo tiene
  que procesar mensajes aunque no haya una vista montada. Ningún módulo llama
  a `document.querySelector`.
- **Paneles y tabs**: la lista `PANELES` de `ventana-principal.ts` es la única
  fuente; de ahí salen la barra, las `<section>` de los paneles y los
  atributos ARIA que los enlazan (`id`, `aria-controls`, `aria-labelledby`,
  `aria-selected`). La barra de tabs y las secciones de los paneles las
  dibuja `ventana-principal`, y no componentes aparte, porque se enlazan por
  `id`. Agregar un panel es agregar una entrada a esa lista (con su nombre y su
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
- **Mensajes MIDI** (`src/midi/`): `MensajeMidi` guarda solo los bytes; el
  tipo, el canal y la nota son getters que se calculan en cada lectura, así no
  quedan viejos si una caja cambia los bytes. Cualquier módulo que los
  necesite usa esos getters en vez de calcularlos por su cuenta, y no se le
  agregan campos derivados que haya que mantener sincronizados. Un mensaje de
  sistema es el que no es desconocido y no tiene canal: no hay un tipo
  `"sistema"`. La presentación (la descripción legible, en `describir.ts`, y
  el nombre de las notas, en `notas.ts`, con el Do central 60 como C4) vive
  en el frontend, porque también describe lo que sale del flujo, que nunca
  vuelve del backend.
- **Log**: tiene su propio registro (`log/log.ts`: las últimas 500 entradas,
  la más nueva primero, cada una con un `id` y sin cambios después de
  creada), separado del store: si estuviera ahí, cada mensaje MIDI haría
  volver a dibujar todos los componentes. `<panel-log>` lo dibuja con
  `repeat` por `id` y `guard`, así un mensaje nuevo crea solo su fila, y
  espera al próximo cuadro para dibujar (redefine `scheduleUpdate`), así una
  ráfaga se dibuja una sola vez. Con la ventana minimizada no se dibuja: los
  mensajes se acumulan en el registro y se dibujan al volver. El log no
  recibe `mensaje-midi`: lo recibe `recibirMensaje` (`ejecutar.ts`), que pasa
  el mensaje por el flujo, envía lo emitido y le da a `agregarAlLog` la
  entrada, lo que se emitió y el texto del error, si una caja falló.

### Workflow

El editor de flujos y su ejecución viven en `src/workflow/`.

- El flujo se ejecuta en el frontend (`ejecutar.ts`): cada mensaje entra por
  el trigger y sale tal cual, salvo que llegue a al menos una caja sin
  salida (Emitir, Descartar): entonces sale solo lo que devuelvan esas
  cajas. Si una caja falla, no sale nada de ese mensaje. Ninguna caja
  declara nada para esto: lo decide el recorrido.
- Las cajas no envían mensajes: lo que devuelve una caja sin salida (como
  Emitir) es lo que sale por el puerto. El recorrido (`procesarMensaje`) es
  puro y devuelve `{ salidas, error }`; `recibirMensaje` envía las salidas
  con `enviarMensaje` y le pasa todo al log. Ningún tipo de
  nodo importa `salida.ts`.
- Un error en una caja se lanza como `Error` (con el nombre de la caja y
  `cause`), y corta todo el recorrido de ese mensaje. `procesarMensaje` es
  el único que lo atrapa: el recorrido no revisa marcas de error.
- Los errores de configuración de una caja salen de un solo lugar,
  `erroresDeConfiguracion(nodo)` (`validacion.ts`): primero el
  `validar` de cada parámetro y, solo si ninguno tiene, el `validar` opcional
  del tipo de nodo, que revisa reglas entre parámetros. Cada error va
  asociado a la `clave` de un parámetro. No se guardan en `estado.flujo`: se
  calculan cada vez, solo de los valores. Un mensaje que nombra valores los
  marca con `formato` (`src/formato.ts`) en lugar de escribirlos: los escribe
  el campo donde se muestra, con su formato (el numérico, en su modo), y el
  log, como texto común. Así la validación no depende de cómo se muestra
  nada. `formato` es un módulo propio, y no de `componentes/`, porque los
  tipos de nodo lo importan y no incluyen nada de la interfaz. Un valor que
  se puede leer pero no sirve se guarda igual y se muestra con su error;
  solo lo que no se puede leer (un "2.5" en un entero) lo rechaza el campo.
  Si a una caja con errores le llega un mensaje, el ejecutor la hace fallar
  sin llamar a `procesar`, así que `procesar` puede suponer que la
  configuración está bien.
- Un nodo que toca bytes ofrece "Canal" y no el byte de status entero: el
  status mezcla tipo y canal, y operar sobre él como un número cambia el tipo
  (`9F` + 1 da `A0`). Tampoco mira el tipo de mensaje, ni siquiera para
  proteger el Nota On con velocidad 0, que al cambiarle la velocidad se
  vuelve un Nota On: eso se resuelve poniendo antes un Filtrar, no con casos
  especiales en cada nodo. Convertir es la excepción, porque su trabajo es
  cambiar el tipo (y es el único que cambia la cantidad de bytes de un
  mensaje), pero tampoco elige a qué mensajes aplicarse: eso sigue siendo
  trabajo de un Filtrar.
- El grafo (qué cajas hay, cómo están configuradas y conectadas) vive en
  `estado.flujo`. La vista del lienzo (posiciones, zoom, arrastre) es de
  Rete, y no pasa por el store.
- `editor/lienzo.ts` es el **único** módulo que importa Rete, y así tiene que
  seguir: cambiar de librería es reescribir ese archivo y nada más. Define
  `<lienzo-workflow>`, `<caja-del-flujo>` y `<cable-del-flujo>` (la caja y el
  cable conocen el protocolo de Rete, por eso van en el mismo archivo). Los
  conectores y los cables se dibujan con `customize.socket` y
  `customize.connection` del preset clásico: el conector se dibuja dentro de
  la caja (y toma sus estilos), pero el cable va dentro de un componente de
  Rete con su propio shadow root, por eso es un componente nuestro con sus
  estilos. Las trampas de Rete (cómo mide, ubica y apila las cajas) están
  comentadas en ese archivo. La barra de herramientas y el panel de
  configuración piden agregar o borrar cajas con eventos, y
  `<panel-workflow>` llama a los métodos del lienzo.
- Cada tipo de nodo es un archivo en `src/workflow/nodos/` que se registra
  en la lista de `nodos/catalogo.ts` (el orden de la lista es el de la
  barra). La guía para crear uno está en `nodos/LEEME.md`, y tiene que seguir
  alcanzando para alguien que recién empieza a programar.
- Cada tipo de parámetro (lo que se configura en una caja) es un archivo en
  `src/workflow/parametros/` que exporta, con el nombre del tipo, la función
  con que un tipo de nodo declara un parámetro (`entero({ … })`): devuelve la
  declaración con su `validar` (si un valor le sirve) y su `dibujar` (qué
  campo de `src/componentes/` lo muestra y con qué datos), sin componentes ni
  estilos propios. No hay catálogo: sumar un tipo es escribir su archivo, y el
  chequeo de tipos marca una declaración mal escrita. Esas funciones son lo
  único de la interfaz de lo que dependen los tipos de nodo, que no incluyen
  interfaz ni dependen del lienzo ni del estado. El panel de configuración no
  nombra ningún tipo, y dibuja los parámetros con `repeat` por caja y clave:
  los campos tienen estado propio, y reusarlos por posición pasaría el modo
  de una caja a otra. Lo que un campo conserva va en
  `NodoDelFlujo.estadoDeLosParametros`, y solo lo lee el campo: el panel lo
  guarda y se lo devuelve, y ni el lienzo, ni el ejecutor, ni la validación
  lo usan. La guía está en `parametros/LEEME.md`, para alguien con nociones
  básicas de programación.
  Para elegir de una lista hay tres: `lista` (una, con un desplegable),
  `opciones` (varias, como píldoras, para pocas y cortas) y `autocompletar`
  (varias, buscándolas, para listas largas). Son tipos distintos y no uno
  con variantes, porque un tipo es su control; tampoco comparten código. Para
  dos extremos está `rango` (valor `{ desde, hasta }`, con `invertible`),
  que se dibuja como una barra de dos perillas. Un
  valor que es una lista se avisa siempre como una lista nueva, en el orden
  de las opciones. Un control de varias partes pone `esGrupo = true`: la
  etiqueta nombra al grupo (`role="group"` + `aria-labelledby`), porque un
  `<label for>` apunta a un solo control.
- Lo que flota sobre los parámetros siguientes (la lista del autocompletar
  y la de `campo-lista`) va con `position: absolute` y un `z-index` en el
  `:host` del control: los parámetros son hermanos en la raíz del panel, y
  sin eso los de después se dibujan encima. `campo-lista` lo sube solo
  mientras está abierta (`:host([abierta])`), para quedar encima también de
  otro campo que flota.
- El color de una caja sale de su etapa en el flujo (`etapaDelTipo` en
  `nodos/catalogo.ts`: inicio, intermedia o fin), no de algo que declare el
  tipo de nodo. Sumar un color por tipo es una decisión a consultar con la
  persona usuaria, no un campo para agregar al pasar.
- La ventana tiene `"dragDropEnabled": false` en `tauri.conf.json`: sin eso,
  Tauri captura los arrastres y el drag and drop de HTML5 (arrastrar cajas
  desde la barra) no funciona en la ventana real.

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
  cada elemento) antes y después de un cambio. También mandan y escuchan MIDI
  por el IAC Driver (`midi.sh`), para probar el flujo completo mientras la
  persona usuaria tiene abierta la ventana real. Cómo se usan, y qué hace
  falta instalar, está en su `LEEME.md`. Al terminar un cambio que no debería
  verse, la huella tiene que dar igual. No reemplazan a la ventana real para
  la activación con teclado.
- El navegador de desarrollo es Chromium, pero la ventana real usa WebKit, y
  el layout puede comportarse distinto. Un problema de tamaños que no se
  reproduce en el navegador, sobre todo al entrar o salir de pantalla
  completa, hay que probarlo en la ventana real antes de darlo por resuelto.
- Lo que vive en el store se puede manejar a mano desde la consola
  (`const m = await import('/src/estado/estado.ts'); m.actualizar({ conectado: true })`)
  y revisar cómo responde la pantalla sin el puente de IPC ni hardware MIDI.
  Lo que vive en un componente se maneja con clics, como la persona usuaria,
  o asignándole la propiedad al componente.
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
- En el navegador, el arranque monta la ventana y se corta en el primer
  `listen`. Para probar un evento del backend se llama a su acción desde la
  consola, importando el módulo como el estado (por ejemplo,
  `recibirMensaje` de `ejecutar.ts`, con lo mismo que manda el backend). Para
  simular un comando que falla, un caso que en la aplicación real no se
  puede provocar, se reemplaza el puente desde la consola:
  `window.__TAURI_INTERNALS__ = { invoke: async () => { throw 'fallo simulado'; } }`.
  Los botones que llaman a `invoke` usan ese reemplazo desde el siguiente
  clic.
- Para probar el flujo de MIDI sin hardware físico, en macOS se puede
  habilitar el **IAC Driver** (Audio MIDI Setup → MIDI Studio). Hacen falta
  **dos buses**: uno como entrada de la aplicación y otro como salida. Con uno
  solo para las dos cosas, todo lo que la aplicación emite le vuelve a entrar
  y se arma un bucle. Un agente manda y escucha por esos buses con
  `verificacion-para-agentes/midi.sh`. Dos cosas que macOS hace por su
  cuenta, antes de que el mensaje llegue a la aplicación: un Nota On con
  velocidad 0 mandado al IAC llega como Nota Off con velocidad 64
  (`90 3C 00` → `80 3C 40`), y los status de sistema indefinidos (`F4`, `F9`,
  `FD`) se descartan. Para probar esos casos hace falta un dispositivo
  físico, o leer el código.

## Tests

- Se testea solo la lógica pura. En Rust, las funciones de `lib.rs` que no
  usan `midir` ni el `AppHandle`, en un `mod tests` al final del mismo
  archivo. En TypeScript, con Vitest en entorno `node` (sin DOM simulado), y
  cada `.test.ts` va al lado del módulo que prueba.
- Cada tipo de nodo trae su `.test.ts`, con el estilo didáctico de
  `desplazar.test.ts` (un `test` por comportamiento, bytes literales, sin
  helpers): es también el ejemplo que copia quien crea un nodo, así que tiene
  que poder leerse sin saber nada más del proyecto. Si el nodo tiene
  `validar`, sus casos van en el mismo archivo. Además,
  `nodos/catalogo.test.ts` revisa lo que todo nodo tiene que cumplir.
- Cada tipo de parámetro cuyo `validar` revisa algo más que el tipo del
  valor (como el rango del entero) trae su test al lado. Leer lo escrito es
  del campo, y se prueba al lado del campo (como los modos, en
  `componentes/modo-numerico.test.ts`). Lit carga sin problemas en el
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

Después de `/opsx:apply`, el cambio sigue estos pasos:

1. Cuando la persona usuaria avisa, se sube la rama y se abre el PR, con la
   propuesta, la implementación y las pruebas, pero sin archivar.
2. La persona usuaria revisa el código en el PR.
3. Cuando avisa, se archiva el cambio en la misma rama, como último commit.
   Si trae cambios a este archivo (ver "Devolver el conocimiento a este
   archivo"), van en ese mismo commit, una vez aprobados. No se abre un PR
   aparte solo para archivar.
4. Enseguida, sin esperar otro aviso, se mergea el PR con un commit de merge
   y se limpian las ramas (ver "Flujo de git"): pedir el archivado es dar el
   PR por aprobado. Solo con el CI del PR en verde; el commit de archivado no
   toca código, así que no hace falta esperar su corrida. Si un check falla o
   todavía corre, se avisa y se espera.

En Claude Code, `.claude/commands/opsx/` son atajos escritos a mano para ese
mismo flujo (`/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `/opsx:explore`,
`/opsx:sync`, `/opsx:update`). No son output de la herramienta y `openspec
update` no los toca: si cambia el CLI, hay que actualizarlos a mano.

`openspec/config.yaml` es configuración propia del proyecto y va en castellano:
fija el idioma de los artefactos generados y agrega guía para el archivado.

### Devolver el conocimiento a este archivo

Cuando un cambio hecho con OpenSpec implica decisiones de arquitectura,
convenciones técnicas nuevas, cambios de toolchain o del flujo de verificación,
ese conocimiento tiene que volver a este archivo antes de archivar el cambio,
con el criterio de "Cómo se escribe este archivo"; si no, queda enterrado en
`openspec/changes/archive/`. La forma es proponerle el diff a la persona
usuaria y esperar aprobación explícita — nunca editar este archivo por
iniciativa propia.

`operations.archive.guidance` en `openspec/config.yaml` repite esa regla y ese
criterio para que aparezcan al momento de archivar, pero el CLI los entrega
marcados como *advisory*: lo que manda es este archivo, no el de
configuración.

## Cómo se escribe este archivo

Este archivo junta las reglas que un agente tiene que respetar, no la
descripción de cómo funciona todo. Para que las reglas no pierdan jerarquía:

- Van reglas e invariantes, cada una con su porqué en una línea. Cómo
  funciona algo va al JSDoc o a las specs de `openspec/specs/`.
- Sin enumeraciones exhaustivas (de componentes, tipos, archivos, o de quién
  usa qué) ni ejemplos muy específicos: un detalle enumerado queda al mismo
  nivel que una regla de arquitectura y la diluye, y además se desactualiza
  con cada agregado. Si un ejemplo aclara la regla, alcanza con uno.
- Cada cosa va en su lugar:
  - acá, las reglas que cruzan módulos;
  - en un comentario, la trampa local. Este archivo la repite solo si un
    agente la pisaría trabajando en otro archivo, como `dragDropEnabled` en
    `tauri.conf.json`;
  - en las specs, el comportamiento completo;
  - en los LEEME, las guías, donde los ejemplos sí son el propósito.

## Roadmap (contexto, no una tarea pendiente)

El objetivo es que usuarios semi-técnicos armen sus propios flujos de trabajo
manipulando mensajes MIDI (filtrar, transformar, remapear). Armar un flujo no requiere
escribir código, pero un mínimo de programación es aceptable cuando haga falta
(por ejemplo, para crear un tipo de nodo nuevo): aprender nociones básicas es
parte de la propuesta, no una barrera a evitar.
La base ya existe (el tab Workflow, ver Arquitectura): lo que sigue es sumar
tipos de nodo de a uno, a medida que se pidan, sin anticipar los que todavía
no hacen falta.
