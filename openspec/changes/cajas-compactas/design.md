# Design

## Context

Hoy la caja del lienzo es una fila flexible de 240 × 44 px con el conector de
entrada, el ícono, el nombre y el conector de salida, en ese orden. Los
conectores se corren hacia afuera con márgenes negativos. Los botones de la
barra muestran el ícono de 18 px y el nombre, con el padding general de los
botones (0.6em arriba y abajo, ~45 px de alto). Tres restricciones del proyecto
marcan el diseño:

- Rete no vuelve a ejecutar la plantilla de una caja después de crearla (ver
  AGENTS.md). Lo que dependa de la caja tiene que quedar resuelto en la
  plantilla o marcarse desde `lienzo.ts`.
- Rete ubica los conectores sumando `offsetLeft`/`offsetTop` hasta la caja
  (`getElementCenter` de `rete-render-utils`), sin tener en cuenta `transform`.
- Rete le pone `transform` al contenedor de cada caja para ubicarla, y eso
  arma un contexto de apilamiento por caja.

## Goals / Non-Goals

**Goals:**

- Que el papel de la caja (inicio, intermedia, fin) quede resuelto con lo que
  el catálogo ya sabe, sin campos nuevos en `TipoDeNodo`.
- Que el globo de ayuda funcione igual en la barra y en el lienzo, y que en la
  barra también aparezca con el teclado.

**Non-Goals:**

- Conectar desde cualquier borde de la caja (ver la última decisión).
- Cambiar el color de las cajas del lienzo en modo oscuro: hoy son blancas en
  los dos modos, y lo siguen siendo, con los colores de papel encima.
- Colores por familia de tipos (filtros, transformaciones, etc.).

## Decisions

### Globo de ayuda propio, no el atributo `title`

El globo es un `<span class="globo">` dentro de la caja o el botón, que se
muestra con CSS en `:hover` y, en la barra, en `:focus-visible`. Va debajo de
la caja, centrado.

Alternativa descartada: `title`. Es lo más barato, pero WebKit (la vista web de
Tauri en macOS y Linux) lo muestra recién después de alrededor de un segundo,
no aparece al llegar con el teclado, y no se le puede dar estilo. El pedido es
justamente poder reconocer las cajas rápido.

Nombre accesible:

- En la barra, el botón lleva `aria-label` con el nombre y el globo lleva
  `aria-hidden="true"`, para que el lector no lo lea dos veces.
- En el lienzo, las cajas no reciben foco: el globo se oculta con `opacity`
  (no con `display: none`), así su texto sigue en el árbol de accesibilidad.

Para que el globo de una caja no quede tapado por otra caja que viene después
en el DOM, el contenedor que Rete le da a la caja sube su `z-index` mientras
el puntero está encima (`:has(.caja:hover)`). No se toca `lienzo.ts` para eso.

### El papel sale del catálogo, no de un campo de color

`catalogo.ts` exporta, al lado de `tieneSalida`, una función que da el papel de
un tipo: `"fin"` si no tiene salida, `"intermedia"` si tiene. El trigger es
siempre `"inicio"`, y eso lo resuelve `crearCaja` como hoy resuelve su nombre y
su ícono. La plantilla de la caja y el botón de la barra ponen la clase
`caja-inicio` o `caja-fin` (las intermedias no llevan clase). Como el papel no
cambia mientras la caja existe, alcanza con ponerlo al crear la plantilla y no
choca con la restricción de Rete.

Se evaluó, como se pidió, **permitir que cada tipo declare su color** (un campo
`color` opcional en `TipoDeNodo`), y se descarta por ahora:

- Hoy no hay ningún caso que lo pida. Los dos colores del pedido dicen dónde
  empieza y dónde termina el flujo, y eso ya se deduce de `tieneSalida` y del
  trigger. AGENTS.md pide no sumar configuración para necesidades que todavía
  no llegaron.
- Si cada tipo elige su color, el color deja de significar algo: un tipo
  intermedio pintado de naranja se confundiría con un fin, y uno azul, con la
  selección. Con el color atado al papel, un tipo nuevo sin salida queda bien
  marcado sin que quien lo escribe tenga que pensarlo, que es lo que busca el
  contrato de `tipos-de-nodo` para alguien que recién empieza.
- Si más adelante aparece la necesidad (por ejemplo, agrupar filtros y
  transformaciones), sumar el campo es chico: las clases por papel ya dejan el
  CSS preparado para una variante más.

### Colores

Como variables CSS en `:root`, para que los usen la caja y el botón:

| Papel  | Fondo     | Borde     | Por qué                                         |
|--------|-----------|-----------|-------------------------------------------------|
| inicio | `#dcf5e4` | `#2e9d5a` | Verde: "arranca acá", como un semáforo.         |
| fin    | `#fde6d6` | `#dd6b20` | Naranja: cierre, bien lejos del verde y del azul.|

El azul (`#396cd8`) queda reservado para la selección. Seleccionar una caja de
color cambia el borde al azul y suma el halo, como hoy, pero conserva el fondo
del papel. El ícono sigue en `#0f0f0f`, con contraste de sobra sobre los dos
fondos claros.

En modo oscuro, los botones de la barra son oscuros. Ahí el botón de fin usa un
fondo naranja oscuro (`#5a2e12`) con el borde `#f08a3c`, y el ícono en blanco.
El botón de inicio no existe en la barra, pero la variable se define igual para
que las dos queden parejas.

### Tamaños

- Caja del lienzo: 72 × 72 px con ícono de 36 px. `ANCHO_CAJA` y `ALTO_CAJA`
  pasan a ser una sola constante, `LADO_CAJA`.
- Botón de la barra: cuadrado de la misma altura que hoy (~45 px), con el
  ícono de 18 px. Se logra con `aspect-ratio: 1` y el mismo padding de los
  cuatro lados, sin fijar pixeles.
- `dibujarIcono` recibe el tamaño como parámetro, con 18 por defecto.
- `SEPARACION_INICIAL` baja de 320 a 180 px, para que el trigger y el Emitir
  del lienzo inicial queden cerca pero sin superponerse, con lugar para ver la
  conexión.

### Conectores con posición absoluta

Con el nombre fuera, la caja deja de ser una fila con contenido de ancho
variable. El ícono se centra con flexbox, y los conectores pasan a
`position: absolute`, a mitad de altura (`top: 50%` con un margen negativo de
medio conector) y corridos hacia afuera con `left`/`right` negativos. La
restricción de AGENTS.md es no usar `transform`, y `top`/`left` sí se reflejan
en `offsetTop`/`offsetLeft`, que es lo que suma Rete. El comentario de
`styles.css` que dice que se centran "con flexbox" se actualiza para explicar la
restricción real.

### Conexiones desde cualquier borde: propuesta aparte

Se evaluó sumarlas acá y se deja para un cambio siguiente. Lo que hace falta:

- **Dibujo propio de las conexiones.** `classicConnectionPath` arma una curva
  que sale siempre hacia la derecha y llega siempre desde la izquierda. Con
  conectores arriba o abajo la curva se vería mal, así que hay que reemplazar
  el dibujo de la conexión del preset por uno que sepa hacia dónde mira cada
  conector.
- **Dirección visible.** Si la entrada puede estar en cualquier lado, la
  conexión necesita una flecha, y los conectores tienen que distinguirse por
  forma, no solo por posición.
- **Modelo.** Hay que decidir si una caja tiene un conector por lado (ocho en
  total, contando entradas y salidas) o uno que se reubica, y si el lado forma
  parte de la conexión en `estado.flujo` o se calcula con las posiciones. Eso
  toca la frontera con Rete, que hoy tiene una sola entrada y una sola salida
  por caja.

Es un cambio con decisiones propias y más riesgo en `lienzo.ts` que todo este.
Mezclarlo haría más difícil revisar el cambio visual, que es chico y se puede
usar ya. Con las cajas cuadradas de este cambio, además, los cuatro bordes
quedan del mismo largo, que es la base que la propuesta siguiente necesita.

## Risks / Trade-offs

- [El globo depende del puntero en el lienzo, y las cajas del lienzo no reciben
  foco] → Con teclado, el nombre se ve en el panel al seleccionar. Hacer
  navegables las cajas del lienzo es otro trabajo.
- [El globo escala con el zoom del lienzo, y con mucho zoom afuera se lee
  chico] → Aceptable: con ese zoom tampoco se distinguen bien los íconos. Si
  molesta, se ajusta después sin cambiar las specs.
- [El globo de una caja pegada al borde de abajo del lienzo queda cortado,
  porque el lienzo recorta lo que se sale] → Aceptable. Se puede mover la caja
  o el lienzo.
- [`:has()` necesita un WebKit reciente: en macOS, el de Safari 15.4 en
  adelante; en Linux depende del WebKitGTK de la distribución] → Si no está,
  lo único que falla es el `z-index`: el globo puede quedar tapado por otra
  caja, pero se sigue viendo encima de la suya.
- [Solo con el ícono, al principio cuesta reconocer las cajas] → El globo y el
  panel dan el nombre. Además, la barra tiene pocos tipos y cada uno tiene un
  ícono distinto, como ya pide la spec.
