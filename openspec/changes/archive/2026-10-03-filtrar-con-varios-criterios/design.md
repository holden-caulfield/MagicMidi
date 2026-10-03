# Design

## Context

Ver `proposal.md` (Why) para la motivación, y las specs del cambio para el
comportamiento. Lo que condiciona el diseño:

- **Filtrar declara una casilla sí/no por tipo** (`nodos/filtrar.ts`), con la
  clave igual al tipo, y busca `parametros[mensaje.tipo]`. Sin nada marcado,
  no pasa nada.
- **`MensajeMidi.tipo` devuelve `"sistema"` para todo `F0`–`FF`**
  (`midi/mensaje.ts`). La descripción del log ya distingue cada mensaje de
  sistema, pero por su cuenta, con la tabla `MENSAJES_DE_SISTEMA` de
  `describir.ts`, indexada por status.
- **El valor de un parámetro es un número, un texto o un sí/no**
  (`ValorDeParametro = Parametro["inicial"]`). No hay ningún parámetro cuyo
  valor sea una lista.
- **`CampoDeParametro` pone un `<label for="control">`**: sirve para un
  control único, no para un grupo de controles.
- **El panel de configuración mide 220 px de ancho** y desplaza su contenido
  a lo alto (`overflow-y: auto`).
- **Un mensaje que llega a una caja por dos caminos se procesa dos veces**: lo
  dice la spec `ejecucion-de-workflow` ("Dos caminos al mismo Emitir") y lo
  hace `entregar`, que no recuerda qué cajas ya visitó.
- **El flujo no se guarda**: no hay cajas viejas que migrar.

## Goals / Non-Goals

**Goals:**

- Una sola caja Filtrar que combine tipo, canal y rangos, porque el caso
  común los combina ("Nota On, en el canal 1, de C4 a C5").
- Elegir varias opciones con un control adecuado al largo de la lista: pocas
  y cortas (canales) o muchas y largas (tipos de mensaje), con el mismo valor
  y la misma validación.
- Que el tipo de cada mensaje de sistema salga de la misma lectura que el
  resto, no de una tabla aparte en Filtrar.

**Non-Goals:**

- Cambiar el ejecutor para que un mensaje que llega por dos caminos llegue una
  sola vez.
- Un parámetro de "reglas" o "fórmulas" (ver la decisión de abajo).
- Invertir un filtro ("todo menos el canal 10").
- Mostrar las notas por nombre ("C4") en los campos del rango.
- Parámetros opcionales, sin valor `inicial` (por ejemplo, una `lista` sin
  nada elegido, con un texto de ayuda en el lugar del valor). Ningún nodo lo
  necesita todavía; cuando haga falta, es un cambio del contrato de todos los
  tipos de parámetro, no solo de `lista`.
- Un tipo de parámetro "rango" que junte "desde" y "hasta" en un control.

## Decisions

### Un solo nodo, con criterios que se combinan con "y"

Filtrar suma todos los criterios en la misma caja, y un mensaje tiene que
cumplirlos todos. Dentro de un criterio de varias opciones, las opciones se
combinan con "o": no tiene sentido pedir que un mensaje sea Nota On *y* Nota
Off a la vez, así que "o" es la única lectura útil. Para un "o" entre
criterios distintos, se ponen dos Filtrar en paralelo que llegan a la misma
caja, como se propuso.

Un criterio sin configurar no restringe: sin tipos elegidos pasa cualquier
tipo, sin canales elegidos pasa cualquier canal, y un rango de 0 a 127 deja
pasar cualquier valor, incluso a los mensajes que no tienen ese byte. Es lo
que hace que sumar criterios sea natural: cada uno restringe solo si se lo
toca. La consecuencia es que una caja nueva deja pasar todo (hoy no deja pasar
nada), que es el **BREAKING** del cambio.

Alternativas descartadas:

- **Un nodo por criterio** (Filtrar por tipo, Filtrar por canal, Filtrar por
  rango): cada caja es más simple, pero el caso común pide tres cajas en
  serie, y la barra suma dos entradas. Con una sola caja, el panel crece,
  pero los criterios que no se usan no molestan.
- **Elegir "y" u "o" dentro de la caja** (un parámetro "Cumplir: todos / alguno"):
  resuelve el "o" sin duplicados, pero obliga a explicar qué pasa con los
  criterios sin configurar en el modo "alguno" (¿un rango 0–127 vale como
  cumplido?), y el caso es menos común que el "y".
- **Sin tipos elegidos, no pasa nada** (lo de hoy): obliga a elegir los
  dieciséis tipos para filtrar solo por canal.

### El "o" con dos cajas duplica lo que cumple las dos

Si el mismo mensaje pasa los dos Filtrar, llega dos veces a la caja siguiente.
No se cambia el ejecutor: "llega por dos caminos, sale dos veces" es lo que
permite armar, por ejemplo, una nota y su quinta con dos Desplazar hacia el
mismo Emitir, y deduplicar por bytes rompería ese caso cuando las dos ramas
producen lo mismo a propósito.

La guía y el README lo explican con el ejemplo de la spec y muestran cómo
evitarlo haciendo los filtros disjuntos: para "Nota On, o cualquier cosa del
canal 10", el segundo filtro elige el canal 10 y todos los tipos menos Nota
On. Si en el uso resulta engorroso, la salida natural es un "Invertir" en
Filtrar (fuera de este cambio), que también resuelve "todo menos el canal
10".

### Canal: un conjunto; datos: un rango

Los canales son categorías, no una escala: lo que se pide es "el 1 y el 10",
no "del 3 al 7". Por eso se eligen como los tipos, de una lista, con el mismo
valor y la misma regla de validación (con `opciones` en lugar de
`autocompletar`).

Los bytes de datos sí son una escala (nota, velocidad, valor de un
controlador), y lo que se pide es una zona: "de 60 a 72", "más de 100", "el
CC 7". Un rango con los dos extremos incluidos cubre igual (desde = hasta),
mayor o igual (hasta = 127), menor o igual (desde = 0) y entre. Se ofrecen los
dos bytes a la vez, con cuatro enteros, para cubrir una capa de velocidad
dentro de una zona del teclado en una sola caja. No se elige "qué byte" con
un selector, como en Mapear: con los dos siempre a la vista no hay que
explicar qué pasa con el que no se eligió.

El rango mira el byte, no la nota: así sirve igual para notas, velocidades,
números de controlador y valores, que es la generalización que se propuso, y
no hace falta un criterio por cada tipo de dato.

"Desde" mayor que "hasta" es un error de `validar`, asociado a "hasta". Se
consideró leerlo como "fuera del rango" (Mapear sí le da sentido a un rango
invertido), pero en un filtro es un significado escondido que nadie va a
adivinar.

### Se descarta, por ahora, un parámetro de "reglas" estilo planilla

Una lista de reglas ("valor es igual a / es mayor que / está entre …") es más
expresiva, pero:

- los rangos ya cubren igual, mayor, menor y entre; "contiene" no se aplica a
  un número; lo que queda afuera ("distinto de", "fuera de") se arma con dos
  Filtrar en paralelo (0–59 y 73–127);
- es un control con filas que se agregan y se borran, cada una con un
  operador y uno o dos valores, que no entra cómodo en 220 px;
- su valor es una estructura (una lista de objetos), y validar, explicar y
  probar una regla en la guía de parámetros es bastante más que un entero;
- ningún otro nodo lo necesita todavía, y AGENTS.md pide no sumar tipos de
  parámetro hasta que haga falta.

Si aparece un caso que los rangos no cubren bien (por ejemplo, "notas
pares", o una lista de valores sueltos para un byte), se puede sumar más
adelante sin cambiar lo de este cambio: los rangos siguen sirviendo.

### `opciones` pasa a llamarse `lista`

El tipo `opciones` de hoy (una sola opción, con un `<select>`) se renombra a
`lista` (`lista.ts`, `ParametroLista<T>`, `<parametro-lista>`), sin cambiar
nada de lo que hace, y Desplazar, Fijar y Mapear pasan a declarar
`tipo: "lista"`. Así el nombre `opciones` queda libre para las píldoras.

Se consideró que `autocompletar` cubriera también la elección de una sola
opción, con un `tipoSeleccion: "simple" | "multiple"`, y descartar el
`<select>`. No se hace porque:

- el valor cambiaría de forma según el modo (un valor o una lista), y la
  declaración, `error`, el control y su test tendrían dos casos cada uno: dos
  controles en un archivo;
- el modo simple suma estados propios (lo escrito que no coincide al salir del
  campo, el campo vacío en un valor que no puede faltar);
- las listas de una sola opción que hay hoy tienen dos o tres opciones, y ahí
  un `<select>` es un clic, sin nada que escribir.

Si aparece una lista larga de una sola opción (por ejemplo, un controlador
por su nombre), el modo simple se puede sumar a `autocompletar` entonces.

### Dos tipos de parámetro nuevos: `opciones` y `autocompletar`

Los dos eligen varias opciones de una lista cerrada, con el mismo valor y la
misma regla de validación, y se diferencian en el control: píldoras a la vista para
pocas opciones cortas (los canales), y un campo con lista desplegable para
listas largas (los tipos de mensaje, dieciséis con nombres de hasta tres
palabras, que como píldoras ocuparían unas trece filas del panel).

Son dos tipos y no uno con una opción de "cómo dibujarse", porque en este
proyecto un tipo de parámetro *es* su control (spec `tipos-de-parametro`): así
cada archivo sigue teniendo un solo control, y el que copia uno para crear el
suyo no tiene que entender los dos.

```ts
// opciones.ts
export interface ParametroDeOpciones<T extends number | string> extends ParametroBase<T[]> {
  tipo: "opciones";
  opciones: { valor: T; texto: string }[];
}

// autocompletar.ts
export interface ParametroAutocompletar<T extends number | string> extends ParametroBase<T[]> {
  tipo: "autocompletar";
  opciones: { valor: T; texto: string }[];
  /** Se muestra debajo del campo cuando no hay ninguna elegida, por ejemplo "Cualquier tipo". */
  textoDeAyuda?: string;
}
```

Solo `autocompletar` lleva texto de ayuda. En `opciones` todas las opciones
están siempre a la vista, y "ninguna elegida" se ve como todas apagadas: un
texto debajo repetiría lo que ya se ve. En `autocompletar`, en cambio, sin
ninguna elegida no queda nada debajo del campo, y el texto dice qué quiere
decir eso para ese parámetro.

Los dos van Los dos van
registrados en `parametros/catalogo.ts` con `<number>` y `<string>`, como
`lista`. Con eso, `ValorDeParametro` pasa a incluir `number[]` y
`string[]`.

Lo común:

- **El valor es una lista nueva en cada cambio**, nunca la misma modificada:
  el store compara por referencia para saber que algo cambió, y la caja
  conserva el valor que tenía antes del cambio. El control arma la lista
  filtrando `opciones` por los valores elegidos, y así queda siempre en el
  orden de las opciones, sin importar el orden en que se eligieron.
- **`error`** revisa que sea una lista, que cada valor esté entre las
  opciones y que no haya repetidos. Cada archivo tiene la suya, con su test:
  son pocas líneas, y así cada tipo se lee y se copia solo, sin depender de
  otro.

#### El control de `opciones`

Un grupo de `<input type="checkbox">`, uno por opción, cada uno dentro de su
`<label>` con el texto. La píldora la dibuja el `label` (el `input` queda
accesible, pero no se ve) y se enciende con `:has(:checked)`; el foco se
marca sobre la píldora con `:has(:focus-visible)`. Se acomodan con
`flex-wrap`: los dieciséis canales entran en tres o cuatro filas. Son
finitas (letra un poco más chica que la del panel y poco relleno), con el
borde redondeado entero. Cuando no
hay ninguna encendida, se ven todas apagadas, sin texto extra. Con casillas
nativas, el teclado (Tab y barra espaciadora) y el lector de pantalla
funcionan sin código propio.

Para la etiqueta, `CampoDeParametro` suma `protected esGrupo = false`, como
`enLinea`. Con `true`, la etiqueta se dibuja como un elemento con
`id="etiqueta"` (no un `<label for>`, que solo apunta a un control), y el
contenedor, con `id="control"` y `role="group"`, lleva
`aria-labelledby="etiqueta"`. El error sigue yendo por `aria-describedby`
sobre `#control`, como en los demás tipos.

#### El control de `autocompletar`

Sigue el patrón *combobox* con lista de la guía de ARIA (APG):

- un `<input id="control" role="combobox">` con `aria-expanded`,
  `aria-controls` (la lista) y `aria-autocomplete="list"`; la etiqueta es el
  `<label for="control">` de siempre, así que no usa `esGrupo`;
- la lista es un `role="listbox"` con un `role="option"` por opción no
  elegida. El foco nunca sale del campo: la opción activa se marca con
  `aria-activedescendant`, que es lo que hace que el lector la anuncie;
- se abre al hacer clic o al entrar al campo, y con flecha abajo; se cierra
  con Escape, al elegir (y se vuelve a abrir al escribir) y al salir del
  campo. Flechas arriba y abajo mueven la opción activa, Enter la elige. Un
  clic en una opción la elige (con `mousedown` + `preventDefault`, para que el
  campo no pierda el foco antes del clic);
- debajo del campo, las elegidas como píldoras finitas, como las de
  `opciones`, cada una con un botón "×" sin borde ni fondo propio, que solo se
  marca al pasar el puntero o con el foco, con `aria-label` "Quitar Nota
  On"; sin ninguna, el `textoDeAyuda`.

**La lista flota debajo del campo**, con `position: absolute`, un alto
máximo y su propio desplazamiento, por encima de los parámetros que siguen y
sin moverlos. Para quedar encima de ellos, el `:host` del control lleva
`position: relative` y un `z-index`: los parámetros siguientes son hermanos
en la raíz del panel, y sin eso los de después se dibujarían arriba. Como el
panel se desplaza a lo alto, la lista queda dentro de ese desplazamiento: si
el campo estuviera cerca del borde de abajo, habría que desplazar el panel
para ver el final de la lista. En Filtrar no pasa, porque los tipos son el
primer parámetro. No se usa la API de `popover` ni el posicionamiento por
ancla de CSS para sacarla del panel: el ancla no está en el WebKit de
versiones de macOS que todavía se usan, y no hace falta.

**Qué opciones coinciden** lo decide una función pura,
`opcionesQueCoinciden(opciones, elegidas, texto)`, que deja afuera las
elegidas y compara el texto sin mayúsculas ni tildes (`normalize("NFD")` y
sacar las marcas). Va con su test al lado, como `interpretar` en `entero.ts`:
es la parte del control que se puede probar sin la interfaz.

Es el control más largo de la carpeta. Por eso la guía de parámetros no lo
usa de ejemplo, y el archivo explica en comentarios lo que no es obvio (el
`mousedown`, `aria-activedescendant`).

Alternativas descartadas para los tipos de mensaje:

- **Píldoras, como los canales** (`opciones`): con nombres completos, unas trece filas,
  que empujan los canales y los rangos fuera de la vista. Abreviarlos ("CC",
  "PB") los vuelve crípticos para quien no conoce la jerga.
- **Un `<select multiple>`**: ocupa un alto fijo, y elegir varias pide
  Ctrl/Cmd + clic, que no es evidente para quien no lo conoce; un clic suelto
  borra lo que estaba elegido.
- **Casillas agrupadas** ("De canal" a la vista, "De sistema" plegado): ahorra
  lugar, pero agrega grupos a la declaración, y sigue ocupando unas seis
  filas con los de canal solos.

### Los tipos de sistema, en `MensajeMidi`

`TipoDeMensaje` reemplaza `"sistema"` por un tipo por cada status definido:
`"sysex"`, `"cuadro-de-tiempo"`, `"posicion-de-cancion"`,
`"seleccion-de-cancion"`, `"solicitud-de-afinacion"`, `"reloj"`, `"inicio"`,
`"continuar"`, `"detener"`, `"sensor-activo"` y `"reset"`, más
`"sistema-no-definido"` para `F4`, `F5`, `F7`, `F9` y `FD`. La lectura es una
tabla por status, como la de los de canal.

`TIPOS_ELEGIBLES` (lo que ofrece Filtrar, en su orden) deja afuera
`"reloj"`, `"sensor-activo"`, `"sistema-no-definido"` y `"desconocido"`, y
`NOMBRES_DE_TIPO` suma los nombres cortos de la spec de Filtrar ("Inicio",
"SysEx", …). `reloj` y `sensor-activo` existen igual como tipo porque la
lectura tiene que ser completa (`mensaje.test.ts` los prueba), aunque nunca
lleguen a un nodo.

`describir.ts` deja de preguntar por `tipo === "sistema"`: un mensaje de
sistema es el que no es desconocido y no tiene canal. Sigue usando su propia
tabla `MENSAJES_DE_SISTEMA`, con los nombres largos ("Inicio (Start)"), porque
son presentación; los textos del log no cambian, y `describir.test.ts` sirve
de red.

Alternativa descartada: **dejar `"sistema"` y que Filtrar mire el status**
para distinguir cada uno. Es menos código, pero son dos lecturas del status,
que es justo lo que pide evitar la spec `tipos-de-nodo`.

### Filtrar

Seis parámetros: `tipos` (autocompletar) y `canales` (opciones), con
inicial `[]`, y
`datos1Desde`, `datos1Hasta`, `datos2Desde`, `datos2Hasta` (enteros de 0 a
127). `validar` revisa los dos rangos. `procesar` revisa cada criterio y
devuelve el mensaje solo si pasa todos; cada criterio es un `if` corto, en el
orden de los parámetros, para que se lea como la spec.

Como `parametros` es `Record<string, ValorDeParametro>`, leer una lista pide
decirle a TypeScript qué hay (`parametros.canales as number[]`), igual que hoy
se usa `Number(...)` para los enteros. La guía de nodos lo explica.

## Risks / Trade-offs

- [El "o" con dos cajas duplica lo que cumple las dos, y no se nota hasta que
  suena doble] → La guía y el README lo explican con un ejemplo, y cómo armar
  los filtros para que no se pisen. Si resulta común, "Invertir" lo hace más
  fácil (fuera de este cambio).
- [El autocompletar es un control con bastante comportamiento propio
  (teclado, foco, ARIA) en una carpeta pensada para quien recién empieza] →
  La lógica que se puede probar va en una función pura con test; lo demás
  sigue un patrón conocido (APG), con comentarios donde no es obvio, y la guía
  sigue usando un ejemplo simple.
- [La inyección de teclas de las herramientas de navegador no alcanza para
  confirmar que el combobox anda con el teclado ni que el lector lo anuncia]
  → Se prueba en la ventana real (tarea de verificación), y con VoiceOver.
- [Una caja Filtrar nueva deja pasar todo, al revés que hoy] → Como el
  mensaje se reenvía igual cuando no llega a una caja de fin, una caja que
  deja pasar todo y una que no deja pasar nada se notan solo con algo
  conectado después; el texto de ayuda "Cualquier tipo" dice qué hace la caja
  sin tipos elegidos.
- [Sin texto de ayuda en `opciones`, nada en el panel dice que los dieciséis
  canales apagados quieren decir "cualquier canal" y no "ninguno"] → La
  guía y el README lo explican junto con el resto de Filtrar. Si en el uso
  confunde, se le puede sumar un texto de ayuda a `opciones` sin cambiar nada
  más.
- [Combinaciones que no dejan pasar nada, como "Cambio de Programa" con un
  rango de datos 2] → No es un error de configuración: es una combinación
  válida que nunca se cumple. No se valida, para no sumar reglas por tipo de
  mensaje.
- [`ValorDeParametro` con listas: un nodo que hace `Number(parametros.x)`
  sobre una lista da `NaN` sin aviso] → Solo pasa si un nodo lee un parámetro
  de otro tipo que el que declaró; los tests de cada nodo lo cubren.

## Migration Plan

No hay datos que migrar (el flujo no se guarda). Sale entero en un PR:
lectura del tipo, parámetro nuevo, Filtrar, guías y README. Volver atrás es
revertir el PR.

