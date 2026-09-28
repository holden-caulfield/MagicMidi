# Design

## Context

Antes de este cambio, la ventana ya era una columna flexible de alto completo:
`body` medía `100dvh`, el encabezado y la barra de tabs tomaban su alto
natural y `.contenedor` (`flex: 1; min-height: 0; overflow-y: auto`) se
quedaba con el resto y se desplazaba si el panel activo no entraba. Lo que
impedía aprovechar la pantalla estaba en `src/styles.css`:

- `.contenedor` y `.encabezado` tenían `max-width: 900px`, centrados.
- Cada panel tenía su propia regla (`.panel-conexion`, `.panel-log`,
  `.panel-workflow`) y tomaba su alto natural: nada lo estiraba hasta la
  barra de tabs.
- `.lista-mensajes` tenía `height: 360px` fijo, y `.area-workflow`,
  `min-height: 420px`. Con la ventana por defecto (800 × 600), el panel del
  workflow medía 120 px más que el lugar disponible.

El lienzo lo dibuja Rete dentro de `#lienzo-workflow`: ubica cada caja con
`position: absolute` y dibuja cada conexión en un SVG absoluto de
9999 × 9999 px, todo trasladado y escalado desde la esquina superior izquierda
del contenedor. `centroVisible()` en `lienzo.ts` mide el contenedor con
`getBoundingClientRect()` cada vez que se agrega una caja con clic, así que ya
usa el tamaño del momento.

La ventana real usa WebKit, no Chromium como el navegador de desarrollo. Una
primera versión de este cambio (paneles estirados con `flex: 1 0 auto` y
alturas mínimas) andaba en Chromium, pero en WebKit fallaba solo al entrar y
salir de pantalla completa, nunca al cambiar el tamaño de la ventana a mano:
en pantalla completa quedaba un margen de unos 10 px debajo de la barra de
tabs, y al volver, si el lienzo tenía cajas que ya no entraban en la parte
visible, el panel quedaba más alto que la ventana y la barra solo aparecía
desplazando.

## Goals / Non-Goals

**Goals:**

- Resolverlo solo con CSS y el marcado mínimo, sin tocar el estado ni
  `lienzo.ts`.
- Una sola regla para el contenedor de los tres paneles; cada tab estiliza
  solo lo que dibuja adentro.
- Que ningún contenido pueda agrandar su contenedor: cada área se ajusta al
  lugar que le toca y, si no le alcanza, se desplaza ella.

**Non-Goals:**

- Cambiar el tamaño inicial de la ventana o fijarle un mínimo en
  `tauri.conf.json`.
- Ajustar el zoom del lienzo al tamaño disponible (el "encuadrar el flujo" de
  otros editores).
- Cambiar el tope de 500 mensajes del log: con más alto se ven más filas a la
  vez, pero el tope sigue siendo el mismo.

## Decisions

### La raíz atada a la ventana, que nunca se desplaza

`#app` pasa a `position: fixed; inset: 0` y `body` a `overflow: hidden`, en
lugar de `height: 100dvh`. Así el tamaño de la raíz sale directamente del de
la ventana, sin pasar por una unidad de viewport que WebKit puede no
actualizar a tiempo durante la transición a pantalla completa (el origen más
probable del margen de 10 px y del desplazamiento al volver, dado que al
cambiar el tamaño a mano no pasaba). Y como el documento ya no se desplaza,
nada de lo que haya adentro puede empujar la barra de tabs fuera de la vista.

- *Alternativa descartada*: `html, body { height: 100% }`. También evita
  `dvh`, pero deja al documento como posible contenedor de desplazamiento si
  algún contenido desborda; con `fixed` y `overflow: hidden` eso queda
  descartado por construcción.

### Un solo contenedor para los tres paneles

`.contenedor` pasa a ser una fila flex sin desplazamiento propio, con un solo
hijo visible. `.panel` es la única regla de los paneles: `flex: 1` para ocupar
todo el lugar, `min-width: 0`, columna flex con el mismo `gap` para los tres,
y `overflow: auto` como último recurso para una ventana tan baja que ni
siquiera el contenido fijo del panel entra. Se van `.panel-conexion`,
`.panel-log` y `.panel-workflow`, y las `<section>` de `main.ts` quedan solo
con la clase `panel`.

Los paneles ocultos siguen con `[hidden] { display: none }`, que gana sobre el
`display: flex` de `.panel` porque tiene la misma especificidad y va después
en la hoja.

- *Alternativa descartada*: estirar los paneles con `flex: 1 0 auto` dentro
  de un contenedor que se desplaza, con alturas mínimas en la lista y el
  lienzo. Fue la primera versión: un tamaño que depende del contenido es
  justamente lo que WebKit calculaba mal al volver de pantalla completa, y
  además cada panel necesitaba su propia regla.

### Las áreas que crecen se confinan al lugar que tienen

Dentro de cada panel, lo que crece es la última área, con `flex: 1` y
`min-height: 0`:

- `.lista-mensajes` pierde su `height: 360px`; con `min-height: 0` no crece
  con sus filas y se desplaza ella (ya tenía `overflow-y: auto`).
- `.area-workflow` pierde su `min-height: 420px`. El lienzo ya tenía `flex: 1`
  a lo ancho y el panel de configuración `flex: 0 0 220px`; los dos toman el
  alto del área porque `.area-workflow` es una fila flex con `align-items`
  por defecto (`stretch`). El panel de configuración suma `overflow-y: auto`
  por si sus campos no entran.
- `.lienzo` suma `contain: strict`: su tamaño sale solo de su lugar en el
  layout, y ni las cajas que quedan afuera de la parte visible ni el SVG de
  9999 px pueden agrandar nada de afuera. El lienzo nunca dependió del tamaño
  de su contenido, así que la contención no le quita nada, y el recorte que
  agrega es el mismo que ya hacía `overflow: hidden`.

Sin alturas mínimas, con la ventana por defecto el panel del workflow entra
entero, y en una ventana muy baja la lista y el lienzo se achican en vez de
empujar la barra.

- *Alternativa descartada*: conservar alturas mínimas bajándolas hasta que
  entren en 800 × 600 (se probó con 280 px para el lienzo). Obliga a elegir un
  número que dependa de cómo cada motor dibuja el texto de ayuda y los
  botones, y vuelve a hacer que el contenido pueda agrandar el panel.

### El contenido de Conexión centrado dentro de su panel

El panel de Conexión es igual a los otros dos, así que el ancho acotado pasa a
un contenedor propio adentro: `panelConexion()` envuelve su contenido en un
`div.formulario-conexion`, que se lleva el layout que tenía `.panel-conexion`
(`flex-wrap`, `align-items: end`) más `max-width: 804px` (el ancho de
contenido que tenía el panel: los 900 px del contenedor de antes, menos los
márgenes del contenedor y del panel) y `margin-inline: auto` para centrarse.

- *Alternativa descartada*: que el panel de Conexión conserve su ancho máximo
  y se centre él. Obliga a una regla propia para ese panel, que es lo que este
  cambio saca.

### No avisarle a Rete del cambio de tamaño

Rete no guarda el tamaño de su contenedor: traslada y escala el contenido
desde la esquina superior izquierda, así que un contenedor más grande solo
muestra más superficie, con las cajas y el zoom intactos. Por eso no se agrega
un `ResizeObserver` ni se toca `lienzo.ts`, que sigue siendo el único módulo
que conoce a Rete.

## Risks / Trade-offs

- [En pantalla completa, el marco del panel de Conexión ocupa toda la ventana
  aunque su contenido sea chico y quede arriba] → Es el costo de que los tres
  paneles sean iguales; se ve consistente al cambiar de tab.
- [En una ventana muy baja, la lista del log y el lienzo pueden quedar de
  pocos píxeles] → Es preferible a que la barra de tabs se salga de la vista;
  fijar un tamaño mínimo de ventana queda para otro cambio si hiciera falta.
- [La explicación de la falla en WebKit (la medida de `dvh` durante la
  transición a pantalla completa) no se pudo reproducir fuera de la ventana
  real] → La solución no depende de esa explicación: con la raíz atada a la
  ventana, el documento sin desplazamiento y el lienzo aislado, ningún
  contenido puede mover la barra. Se confirma en la ventana real (tarea 4.3).
- [Nada de esto se puede cubrir con tests: los tests son de lógica pura, sin
  DOM] → Se verifica a mano en el navegador de desarrollo y en `tauri dev`.
