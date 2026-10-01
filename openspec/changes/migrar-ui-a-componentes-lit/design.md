# Design

## Context

La motivación está en `proposal.md`. Lo que condiciona el enfoque:

- Hoy `main.ts` vuelve a ejecutar la plantilla de toda la ventana con cada
  `actualizar()`. `lit-html` ya solo toca en el DOM lo que cambió, así que el
  redibujado no es un problema de rendimiento. La migración se justifica por
  orden y legibilidad, no por velocidad, salvo en el log.
- `lit` ya está instalado (lo pide `@retejs/lit-plugin`), así que los
  componentes no suman dependencias.
- Rete dibuja sus propios elementos (`rete-root`, `rete-ref`) en light DOM.
  `rete-connection-plugin` tiene su propio `elementsFromPoint`, que atraviesa
  shadow roots a propósito para encontrar el conector al soltar una conexión.
- La ventana real usa WebKit (sin soporte nativo de decoradores), el
  navegador de desarrollo usa Chromium, y el build lo hace Vite 8.
- Los imports siguen la regla de `AGENTS.md`: relativos dentro de un módulo,
  `@/` entre módulos.
- Las specs de interfaz (`navegacion-por-tabs`, `estado-de-la-interfaz`,
  `log-de-mensajes`, `editor-de-workflow`) se tienen que seguir cumpliendo sin
  cambios.

## Goals / Non-Goals

**Goals:**

- Que cada parte de la interfaz se lea sola: plantilla, estilos y estado local
  en un mismo archivo.
- Sacar los rodeos que nombra la propuesta.
- Que sumar un tipo de parámetro sea tan chico como sumar un tipo de nodo
  (ver `specs/tipos-de-parametro/spec.md`).

**Non-Goals:**

- Cambios visuales o de comportamiento: la ventana se tiene que ver y
  comportar igual.
- Suscripciones finas al store (por porción del estado). Con el tamaño de la
  interfaz, que cada componente suscrito se vuelva a dibujar es despreciable.
- `@lit/context`, signals u otras librerías de estado.
- Testear la vista. Siguen afuera, como dice `AGENTS.md`.
- Cambiar el contrato de los tipos de nodo más allá de de dónde salen los
  tipos de parámetro.

## Decisions

### D1. `LitElement` con Shadow DOM

Cada componente encapsula sus estilos en `static styles`. Lo que tiene que
cruzar entre componentes lo hace por las vías que el Shadow DOM deja pasar:

- **Variables CSS** para colores y medidas, definidas en `:root`.
- **Estilos compartidos** (botones, `select`, `input`, foco, `.campo`) en
  `estilos/compartidos.ts`. Los componentes que los usan los importan:
  `static styles = [compartidos, css\`…\`]`.
- **Reglas fijas de `:host`.** Los custom elements son `display: inline` por
  defecto, y un `display` explícito anula `hidden`. Por eso, todo componente
  que participa del layout declara su `display` (y, si crece,
  `flex: 1; min-height: 0`), y todo componente que se oculta lleva
  `:host([hidden]) { display: none }`.
- **Lo que se enlaza por `id` va en la misma raíz.** Es el caso de
  `aria-controls` y `aria-labelledby` entre tabs y paneles, y de un
  `<label for>` con su control.

**Alternativas descartadas:**

- *Light DOM con un `.css` al lado de cada componente:* ordena pero no
  encapsula, y el CSS de un padre sigue afectando a los hijos.
- *Light DOM con `@scope`:* encapsula, pero depende de la versión de WebKit
  (Safari 17.4+ en macOS, y una versión variable de WebKitGTK en Linux).

### D2. Organización por área

```
src/
  main.ts                      importa los componentes y llama a los inicializar<X>()
  estado/      estado.ts, controlador.ts
  estilos/     global.css, compartidos.ts
  midi/        mensaje.ts, describir.ts                     (sin cambios)
  ventana/     ventana-principal.ts, barra-de-tabs.ts
  conexion/    conexion.ts, panel-conexion.ts, selector-de-puerto.ts
  log/         log.ts, panel-log.ts
  workflow/
    ejecutar.ts, catalogo.ts, tipos.ts, salida.ts, iconos.ts
    nodos/                                                  (sin cambios en el contrato)
    parametros/ LEEME.md, catalogo.ts, campo-de-parametro.ts,
                entero.ts, si-no.ts, opciones.ts (+ .test.ts de los que validan)
    editor/     panel-workflow.ts, barra-de-herramientas.ts,
                panel-de-configuracion.ts, lienzo.ts
```

Cada componente es un archivo con el nombre de su etiqueta, que exporta una
sola clase. Hay dos excepciones:

- `lienzo.ts`, que define `<lienzo-workflow>` y `<caja-del-flujo>` (ver D6).
- Los tipos de parámetro, cuyos archivos se nombran por el tipo y definen
  `<parametro-…>` (ver D7).

Las etiquetas van en castellano y sin prefijo. El guion que exige el estándar
sale solo del nombre (`panel-conexion`); a una palabra suelta se le agrega
contexto (`ventana-principal`, no `ventana`).

`index.html` contiene `<ventana-principal>` directamente, y `main.ts` solo la
registra. Con eso desaparecen el `render` y el `suscribir` de la raíz.

**Alternativa descartada:** una carpeta `componentes/` única, separada de la
lógica. Deja lejos lo que se lee junto (como `lienzo.ts` y el panel que lo
contiene) y obliga a saltar entre carpetas para entender un área.

### D3. Estado en dos niveles

**Store global** (`estado/estado.ts`). Es el de hoy, con un cambio:
`suscribir` devuelve la función para desuscribirse. Guarda lo que necesita
más de un componente o la lógica: conexión, puertos, `flujo`, `panelActivo` y
`nodoSeleccionado`.

**Estado local** (`@state`). Guarda lo que solo le importa al componente y
puede perderse si se desmonta, como el texto a medio escribir en un campo.

**El criterio va escrito en `AGENTS.md`:** si otro componente o la lógica lo
necesita, va al store; si no, es local. Ante la duda, store.

**`ControladorDeEstado`** (`estado/controlador.ts`) es un `ReactiveController`
de pocas líneas:

- se suscribe en `hostConnected`;
- se desuscribe en `hostDisconnected`;
- llama a `host.requestUpdate()` en cada cambio.

`actualizar()` sigue siendo sincrónico sobre el store, pero el redibujado pasa
a ser asíncrono y agrupado: Lit junta los cambios de un mismo tick.

**Alternativas descartadas:**

- *`@lit/context`:* resuelve inyección de dependencias por el árbol, que acá
  no hace falta.
- *Signals (`@lit-labs/signals`):* están en labs y suman otro modelo mental.

### D4. Componentes de área y componentes hoja

**Componentes de área** (`panel-conexion`, `panel-workflow`,
`panel-de-configuracion`…): leen el store con `ControladorDeEstado` y llaman
a las acciones.

**Componentes hoja** (`selector-de-puerto`, los `parametro-…`): reciben datos
por propiedades y avisan con `CustomEvent` de nombre en castellano (por
ejemplo `cambio`, con el valor en `detail`). No conocen el store.

Un evento que tiene que cruzar una raíz lleva `bubbles: true, composed: true`.

Una plantilla sin estado, estilos ni ciclo de vida propios sigue siendo una
función dentro del archivo que la usa. Por ejemplo, el indicador de estado de
la conexión, que dibuja la ventana.

### D5. La lógica queda fuera de los componentes

Quedan como funciones de módulo, sin componentes:

- las acciones que llaman al backend (`conectar`, `desconectar`,
  `actualizarListaDePuertos`);
- los `inicializar<X>()` con sus `listen`;
- `ejecutar.ts`, el catálogo y los tipos de nodo.

`main.ts` sigue llamando a los `inicializar<X>()` al arrancar. Atarlos al
ciclo de vida de un componente haría que el flujo dependa de que haya una
vista montada, y el `mensaje-midi` se tiene que procesar igual.

`inicializarLog()` desaparece, porque ya no hay un nodo del DOM que buscar.

### D6. El lienzo es un componente, y la caja también

`workflow/editor/lienzo.ts` define dos componentes y sigue siendo el único
archivo que importa Rete:

**`<lienzo-workflow>`**

- **Montaje:** monta Rete la primera vez que su contenedor tiene tamaño
  distinto de cero, con un `ResizeObserver`. Así reemplaza
  `asegurarLienzo()` y no depende de saber qué tab está activo.
- **Arrastre desde la barra:** maneja él mismo `dragover` y `drop`, así que
  `posicionDesdeEvento` deja de exportarse.
- **Métodos públicos:** `agregarCaja(tipo)` y `eliminarCaja(id)`.
  `<panel-workflow>` tiene una referencia al lienzo y llama a esos métodos
  cuando recibe los eventos `agregar-caja` (de la barra) y `eliminar-caja`
  (del panel de configuración).
- **Fin del estado global de módulo:** desaparecen el `editor` y el `area`
  globales.

**`<caja-del-flujo>`**

- Es un componente Lit con propiedades `nombre`, `icono`, `etapa`,
  `seleccionada` y los datos de sus conectores. Rete sí sabe volver a dibujar
  componentes Lit, y con eso la selección se marca cambiando una propiedad, no
  con `classList`.
- **Regla que sigue valiendo:** para que el globo de la caja quede encima de
  otra caja, hay que subir el `z-index` del contenedor que pone Rete. Se hace
  desde los estilos del lienzo, apuntando al host
  (`:has(> rete-root > caja-del-flujo:hover)`), porque la caja no puede
  estilizar fuera de su raíz.
- **Caja y lienzo juntos:** la caja conoce el protocolo de Rete (`rete-ref`
  con `side`, `key`, `nodeId` y la función `emit`), así que va en `lienzo.ts`
  para que Rete siga teniendo un único archivo.

**Alternativa descartada:** que el lienzo reconcilie Rete con `estado.flujo`
en cada `updated()`, y que la barra y el panel solo toquen el store. Sería más
declarativo, pero la posición de una caja nueva (el centro visible o el punto
de soltado) es estado de la vista de Rete, y habría que pasarla por el store.

### D7. Tipos de parámetro

`workflow/parametros/` sigue el patrón de `nodos/`.

**Cada archivo de tipo** (`entero.ts`, `si-no.ts`, `opciones.ts`) exporta:

- el tipo TypeScript de su declaración (`ParametroEntero`, etc.);
- si valida, una función pura `interpretar(texto)`, que devuelve el valor o
  `null`, con su test al lado;
- su componente `<parametro-…>`;
- la entrada para el catálogo, con su identificador y una función que dibuja
  su componente con el parámetro y el valor.

**`CampoDeParametro`** (`campo-de-parametro.ts`) es la clase base de los
componentes `<parametro-…>`. Resuelve en un solo lugar:

- la `<label>` y su `id`, en la misma raíz que el control;
- los estilos de campo;
- `avisarCambio(valor)`, que despacha `cambio`.

Cada tipo escribe solo la plantilla de su control y, si valida, qué hacer con
un valor rechazado: volver a mostrar el valor que conserva la caja. Ese
`live()` y el `actualizar({})` de hoy pasan a ser asunto del componente.

**`parametros/catalogo.ts`** reúne todo:

- la unión `Parametro` de las declaraciones;
- `ValorDeParametro = Parametro["inicial"]`;
- el mapa de identificador a entrada, con
  `satisfies Record<Parametro["tipo"], …>`. Así, un tipo que esté en la
  unión pero no en el mapa (o al revés) falla al compilar.

**Qué hay que tocar al sumar un tipo:** el archivo nuevo, más el `import`, la
entrada del mapa y el miembro de la unión. Las tres cosas van en el catálogo,
y el compilador avisa si falta alguna.

`workflow/tipos.ts` toma `Parametro` y `ValorDeParametro` del catálogo de
parámetros, y los nodos siguen importando de `../tipos` como hoy.

`panel-de-configuracion` busca la entrada por `parametro.tipo` y la dibuja:
no nombra ningún tipo.

**Por qué una clase base:** `AGENTS.md` pide no abstraer por adelantado, pero
esta base tiene tres usuarios reales desde el primer día. Sin ella, cada tipo
repetiría la etiqueta, el vínculo por `id` y el envío del evento, y eso es
justamente lo que alguien que recién empieza puede hacer mal.

**Alternativa descartada:** que cada tipo sea una función que devuelve una
plantilla, sin componente. Es más simple de escribir, pero no tiene dónde
guardar el texto a medio escribir ni encapsula sus estilos.

### D8. Log declarativo, con un registro propio

`log/log.ts` pasa a tener el **registro**:

- la lista de entradas (hasta 500, la más nueva primero);
- su propia suscripción, separada del store global.

Cada entrada guarda un `id` incremental, la hora, el mensaje y el
`Resultado` ya clasificado, así que dibujarla es puro. `agregarAlLog` (que
sigue llamando `ejecutar.ts`) agrega una entrada y avisa; `limpiar` vacía la
lista.

`<panel-log>` se suscribe al registro (un `ControladorDeEstado` genérico
sobre cualquier fuente con `suscribir`) y dibuja con `repeat(entradas, e =>
e.id, …)`. Como las claves son estables, una entrada nueva crea solo sus
filas, y una ráfaga en un mismo tick produce un solo redibujado.

**Por qué no en el store global:** cada mensaje MIDI haría volver a dibujar
todos los componentes suscritos. **Por qué no como `@state` del panel:**
`ejecutar.ts` no tiene cómo llegar a la instancia del componente sin buscarla
en el DOM.

**Condición:** antes de quitar el código imperativo, se mide en WebKit
(Safari con la URL de desarrollo, o la ventana real) alimentando
`agregarAlLog` desde la consola:

- **Ráfaga:** 2000 mensajes seguidos, sin que ningún cuadro tarde más de
  100 ms.
- **Flujo sostenido:** 500 mensajes por segundo durante 10 segundos, con la
  interfaz respondiendo a los clics.

Si no se cumple, `<panel-log>` conserva el DOM a mano (con `@query` en vez de
`document.querySelector`), y la excepción queda encapsulada en el componente.

### D9. Decoradores estándar con `accessor`

Se escribe, por ejemplo, `@state() accessor abierto = false` y
`@customElement("panel-log")`, sin `experimentalDecorators`. Con
`useDefineForClassFields: true` (el valor actual) los campos de clase comunes
pisarían las propiedades reactivas; `accessor` lo evita.

**Condición:** antes de migrar el primer componente, se prueba que `npm run
build` y `npm run dev` transformen los decoradores y que el resultado ande en
WebKit, porque WebKit no los soporta de forma nativa. Si falla, se usa
`static properties` con campos `declare`, sin decoradores.

### D10. Dependencias e imports de Lit

Todo se importa de `lit` y de `lit/directives/…`, y se quita `lit-html` de
`package.json`. Tener dos puntos de entrada a la misma librería invita a
mezclar.

## Risks / Trade-offs

- **[Rete dentro de shadow roots anidados]** (ventana → panel → lienzo →
  caja) → Primera tarea: una prueba que verifique arrastrar cajas, conectar y
  desconectar, seleccionar, el arrastre desde la barra, `contain: strict` y el
  posicionamiento en WebKit. Si algo falla, `<lienzo-workflow>` y
  `<caja-del-flujo>` usan light DOM (`createRenderRoot() { return this; }`),
  con sus estilos en el `static styles` del componente de afuera.
- **[El build no transforma los decoradores]** → Alternativa de D9.
- **[El log declarativo no aguanta en WebKit]** → Alternativa de D8.
- **[Dibujado asíncrono]** Después de `actualizar()`, el DOM todavía no
  cambió. → La receta de depuración por consola de `AGENTS.md` pasa a esperar
  `await document.querySelector("ventana-principal").updateComplete`, y a
  explicar cómo bajar por `shadowRoot`. El código propio que dependía de
  mirar el DOM justo después de dibujar (`asegurarLienzo`,
  `inicializarLog`) desaparece.
- **[Layout distinto en WebKit]** Cada componente agrega un nivel a la cadena
  de `flex` que mantiene la ventana sin scroll. → Las reglas de `:host` de D1
  y una verificación en la ventana real, entrando y saliendo de pantalla
  completa.
- **[Olvidar los estilos compartidos o las reglas de `:host`]** Un botón sin
  estilo, o un panel que no se oculta. → Queda escrito en `AGENTS.md`, y los
  paneles que se ocultan se revisan uno por uno en la verificación.
- **[Más conceptos para quien llega al código]** Custom elements, ciclo de
  vida, propiedades reactivas. → Quien crea un tipo de nodo no los ve. Quien
  crea un tipo de parámetro escribe solo una plantilla sobre la clase base,
  guiado por `parametros/LEEME.md`.
- **[Dos lugares para el estado]** → El criterio de D3, escrito en
  `AGENTS.md`.
- **[Lo que no se puede probar en el navegador de desarrollo]** La
  activación con teclado y el flujo MIDI completo. → Se prueban en la ventana
  real, como hasta ahora.

## Migration Plan

Las plantillas de `lit-html` y los `LitElement` conviven, así que la
migración va de las hojas hacia la raíz, con la aplicación andando después de
cada paso:

1. **Pruebas:** decoradores en el build y en WebKit, y Rete en shadow roots
   anidados. Sus resultados fijan las alternativas de D6, D8 y D9 antes de
   escribir componentes.
2. **Base:** `estado/` (con el controlador), `estilos/` y dependencias.
3. **Conexión:** `selector-de-puerto` y `panel-conexion`.
4. **Parámetros:** carpeta, catálogo, clase base, los tres tipos con sus
   tests, y `panel-de-configuracion` sin `switch`.
5. **Editor:** `lienzo.ts` como componente con `caja-del-flujo`, la barra y
   `panel-workflow`.
6. **Log:** la medición, y después el registro y `panel-log`.
7. **Raíz:** `ventana-principal` y `barra-de-tabs`; `index.html` y `main.ts`
   reducidos.
8. **Limpieza y documentación:** se borran `styles.css` y los restos, se
   escriben `parametros/LEEME.md` y la guía del tipo "nota", y se propone el
   diff de `AGENTS.md`.

**Rollback:** todo va en un único PR. Si algo sale mal antes de mergear, se
descarta la rama; después, se revierte el merge.
