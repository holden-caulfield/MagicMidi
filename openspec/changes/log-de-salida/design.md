# Design

## Context

Ver `proposal.md` — Why para la motivación, y las specs del cambio para el
comportamiento esperado. Lo que condiciona el diseño:

- **Dos listeners independientes.** Hoy `inicializarLog` (`src/log.ts`) e
  `inicializarWorkflow` (`src/workflow/ejecutar.ts`) escuchan cada uno por su
  cuenta el evento `mensaje-midi`. Nada relaciona lo que dibuja uno con lo que
  procesa el otro, y el orden entre los dos listeners no está garantizado.
- **Emitir envía por su cuenta.** La caja Emitir llama a `enviarMensaje`
  (`src/workflow/salida.ts`) desde su `procesar`. El ejecutor no se entera de
  qué salió: solo recorre el grafo. El procesamiento es sincrónico; lo único
  asincrónico es el `invoke` de cada envío, que `salida.ts` encola.
- **La descripción la arma el backend.** `describir_mensaje` en
  `src-tauri/src/lib.rs` viaja en el evento como `descripcion`. Lo que produce
  el flujo nunca vuelve del backend, así que hoy no hay forma de describirlo.
- **El log agrega filas a mano** (excepción de AGENTS.md): un `prepend` por
  mensaje y se borra la última fila al pasar de 500.
- **Tests**: solo lógica pura, Vitest en entorno `node`, sin DOM.

## Goals / Non-Goals

**Goals:**

- Que el log dibuje entrada y salidas de un mensaje juntas y de una sola vez,
  con lo que efectivamente se mandó a la salida, sin tener que correlacionar
  eventos después.
- Que quien crea un nodo no tenga que saber nada del log, y que el contrato de
  los tipos de nodo diga explícitamente qué sale por el puerto.
- Una sola implementación de la descripción de mensajes.
- Mantener el costo por mensaje del log: un `prepend` y, como mucho, un borrado.

**Non-Goals:**

- Mostrar qué camino del flujo produjo cada salida, o qué caja descartó un
  mensaje.
- Distinguir "descartado por el flujo" de "falló una caja": las dos cosas se
  ven como que no salió (ver Risks).
- Reflejar en el log si el `invoke` de un envío falló.

## Decisions

### La descripción pasa al frontend (`src/describir.ts`)

`describir_mensaje` se porta tal cual a TypeScript, con los mismos textos, y
sus tests de Rust pasan a `src/describir.test.ts`. El backend lo borra, y el
evento `mensaje-midi` queda con `puerto`, `marca_temporal_ms` y `datos`. El
log describe con esa función tanto la entrada como cada salida.

Alternativas descartadas:

- **Tenerla en los dos lados**: dos implementaciones del mismo texto que se
  pueden desalinear, y dos juegos de tests.
- **Un comando de Tauri para describir las salidas**: un ida y vuelta
  asincrónico por cada salida, solo para armar un texto; complica dibujar el
  grupo de una vez.
- **Que `enviar_mensaje` devuelva la descripción**: mezcla el envío con la
  presentación, y el log tendría que esperar a los envíos.

### Las cajas describen lo que sale y el envío pasa en un solo lugar

El recorrido del flujo pasa a ser una función pura que devuelve lo que hay que
emitir, y el efecto (el envío) queda en el borde, en el listener. Es la idea de
una mónada *Writer*, pero sin la maquinaria: una lista que se pasa como
parámetro.

- **Emitir es pura**: `procesar(mensaje) { return mensaje; }`, sin importar
  `salida.ts`. El contrato queda escrito en `TipoDeNodo`: lo que devuelve una
  caja sin salida es lo que sale por el puerto (spec `tipos-de-nodo`).
- **El ejecutor acumula en un parámetro**: `entregar` y `procesarEn` reciben la
  lista `salidas`. El resultado de una caja con salida sigue hacia las
  siguientes; el de una caja sin salida, validado con `esMensajeValido` como
  cualquier otro, se agrega a `salidas`. `procesarMensaje(mensaje)` crea la
  lista, recorre el flujo y la devuelve.
- **El listener hace el efecto**: `procesarMensaje`, después `enviarMensaje`
  por cada salida, en orden, y después `agregarAlLog`. `salida.ts` queda como
  estaba antes de este cambio: solo la cola de `invoke`.

El orden de salida no cambia: antes el `invoke` de cada Emitir también quedaba
encolado hasta que terminaba el listener. El ejecutor y Emitir se testean sin
mocks: se llaman y se mira qué devuelven. Y el log deja de depender de que el
recorrido sea sincrónico: lo que se muestra es lo que devolvió el ejecutor.

La contra: "sin salida" pasa a querer decir "lo que devuelve sale por el
puerto". Si aparece una caja final con otro efecto (mandar a otro puerto,
mostrar algo), el valor de retorno tendría que crecer a algo como
`{ destino, mensaje }`. Hoy hay una sola caja final, así que no se anticipa.

Alternativas descartadas:

- **Anotar los envíos desde `salida.ts`** (`recolectarEnvios`, la primera
  versión de este cambio): funcionaba sin tocar los nodos, pero con una
  colección mutable a nivel de módulo, abierta mientras dura el recorrido, y un
  contrato que no figura en ningún lado: Emitir importa `enviarMensaje` por su
  cuenta y `salida.ts` lo espía. Además dependía de que el recorrido fuera
  sincrónico.
- **Pasarle una función `enviar` a `procesar`**: hace explícita la dependencia,
  pero sigue siendo un efecto en medio del recorrido. Todos los nodos cargan un
  parámetro que solo usa Emitir, su test sigue necesitando un espía, y el
  ejecutor tiene que envolver `enviar` para anotar lo que sale.
- **Que el ejecutor trate a Emitir aparte** (`if (nodo.tipo === "emitir")`):
  rompe que todos los tipos de nodo se ejecuten igual.

### Un solo listener de `mensaje-midi`, en el ejecutor

`inicializarWorkflow` es el único que escucha `mensaje-midi`: procesa el
mensaje, envía cada salida con `enviarMensaje` y después llama a
`agregarAlLog(evento, salidas)` de `log.ts`.
`inicializarLog` deja de escuchar y solo busca su contenedor de filas después
del primer dibujado. Primero se procesa y después se dibuja, así el envío a la
salida no espera al DOM.

Alternativas descartadas:

- **Que el log escuche y llame al ejecutor**: el log pasaría a ser el que hace
  andar el flujo, y un problema al dibujar podría frenar la salida.
- **Dos listeners y un identificador por mensaje**: hay que guardar
  entradas a la espera de sus salidas, y el orden entre listeners no está
  garantizado.

En `main.ts` se sigue llamando a `inicializarLog` antes que a
`inicializarWorkflow`. El primer `listen` del arranque pasa a ser el de
`inicializarWorkflow`: es lo que hay que actualizar en la nota de AGENTS.md
sobre dónde se corta el arranque en el navegador.

### Clasificar las salidas es lógica pura y testeada

`log.ts` exporta una función pura que, dados la entrada y sus salidas,
devuelve qué mostrar: "descartado" si no hubo salidas; "sin cambios" si hubo
una sola y tiene exactamente los mismos bytes que la entrada (mismo largo);
y si no, "transformado" con la lista de salidas en su orden, que van todas
como sub-filas aunque alguna sea igual a la entrada. Se testea en
`log.test.ts` con los cinco casos del pedido, sin DOM.

Se compara por bytes y no por significado: `90 3C 00` y `80 3C 40` son
distintos aunque los dos sean un Nota Off. El log muestra bytes, y una caja que
convierte uno en otro sí cambió el mensaje.

### Estructura de un grupo en el DOM

Cada mensaje de entrada es un `div.grupo-mensaje` que contiene la fila de
entrada y sus sub-filas, y es lo que se agrega con `prepend`. El tope de 500
cuenta los hijos de la lista, que pasan a ser grupos: borrar el último grupo
se lleva sus sub-filas sin contarlas. Se va el rayado alternado de las filas
(se confundiría con el fondo gris de las entradas, ver "Colores"): los grupos
se separan con una línea fina.

Todas las filas comparten la grilla de columnas (`7.5em 11em 1fr 1.5em`, la
última de ancho fijo para que la marca no corra las demás) para que bytes y
descripción de las sub-filas queden alineados con los de la
entrada. En la columna de la hora, la sub-fila lleva un ícono de flecha
(Lucide `CornerDownRight`) con un texto oculto "Salida" para lectores de
pantalla. La cuarta columna lleva la marca: Lucide `Equal` para "salió sin
cambios" y `Ban` para "descartado", con `title` y texto oculto. Los íconos se crean con `createElement` de
Lucide, como `dibujarIcono`, porque las filas no son plantillas.

Alternativas descartadas (elegidas con la persona usuaria): dos columnas
entrada | salida en la misma fila, que deja la mitad del ancho a cada
descripción, y salidas como filas propias alineadas a la derecha e
intercaladas, donde la relación con la entrada se deduce solo por la
posición.

### Ancho máximo del log: 816 px, con el encabezado adentro

El encabezado y la lista van dentro de un `div.contenido-log`, igual que el
contenido de Conexión va en `.formulario-conexion`: `max-width` y
`margin-inline: auto` para centrarlo, y el resto del layout de columna (con
`flex: 1; min-height: 0`) para que la lista siga llenando el alto. El panel
sigue siendo el mismo que el de los otros tabs.

El tope sale de medir la fila más ancha de un mensaje de canal en la fuente
del log (13,6 px): la descripción "Cambio de Control · canal 16 · controlador
127 · valor 127" mide 475 px, las otras tres columnas 272 px, los tres huecos
36 px y el relleno 24 px, en total 807 px. Se redondea a `51rem` (816 px). Las
descripciones más largas que esa (un mensaje sin reconocer con muchos bytes)
bajan de línea, como hasta ahora.

Alternativa descartada: los mismos 804 px de Conexión, para que el contenido
de los dos tabs tenga exactamente el mismo ancho. Esa fila de Cambio de
Control no entraría por 3 px y bajaría de línea; con 12 px de diferencia no
se nota el cambio de ancho al pasar de un tab al otro.

### Colores: letra violeta para lo que salió, fondo gris para lo que no salió tal cual

Dos reglas, que se combinan:

- **Letra violeta** = salió por el puerto. Las sub-filas llevan además un
  fondo violeta suave. La entrada que salió sin cambios lleva la letra violeta
  sobre el fondo normal: es entrada y salida a la vez, y como es el caso más
  común (el flujo por defecto) no tiene que llamar la atención.
- **Fondo gris** = una entrada que no salió tal cual. La transformada tiene
  letra normal; la descartada, letra atenuada.

Recorrer la letra violeta es leer la salida completa, en orden, y lo que
resalta a la vista son justo los mensajes que el flujo cambió o descartó. El
transformado y el descartado comparten el fondo pero no se confunden: el
descartado tiene la letra atenuada, el ícono `Ban` y ninguna sub-fila.

| Qué | Claro | Oscuro |
|---|---|---|
| Letra de una fila de salida | `#3C3489` (sub-fila), `#534AB7` (sin cambios) | `#CECBF6` (sub-fila), `#AFA9EC` (sin cambios) |
| Fondo de una sub-fila | `#EEEDFE` | `#26215C` |
| Fondo de una entrada transformada o descartada | `rgba(127, 127, 127, 0.13)` | `rgba(127, 127, 127, 0.13)` |
| Letra de una entrada descartada | `#888780` | `#8F8F8F` |

Van como variables de CSS en `:root` (con sus valores de modo oscuro), igual
que las de las etapas del lienzo. Se quita el rayado alternado de las filas,
que se confundiría con el fondo gris.

Se eligió violeta porque es el único color que la aplicación no usa ya con
otro significado: verde es "conectado" y la caja de inicio, naranja la caja de
fin, azul el foco y la selección, rojo los errores. El descartado va en gris y
no en rojo porque descartar suele ser lo que la persona quiso (un filtro), y
así el rojo queda libre por si más adelante se señalan en el log las cajas que
fallan.

Alternativas descartadas con la persona usuaria:

- **Colorear solo las sub-filas** (la entrada sin cambios, neutra con `=`):
  para leer todo lo que salió hay que juntar el violeta con las filas neutras
  que llevan `=`, mezcladas con las entradas transformadas.
- **Fondo violeta también en la entrada sin cambios, y una línea violeta en
  el borde de cada grupo con salida**: resuelve lo anterior, pero hace que el
  caso más común, el que no cambió nada, sea el que más llama la atención.

## Risks / Trade-offs

- [Un flujo con mucha fan-out genera grupos muy altos, y el tope de 500 grupos
  deja de acotar la cantidad de filas] → Aceptable con los flujos de hoy
  (pocas cajas). Si aparece un caso real, se puede sumar un tope de sub-filas
  por grupo en un cambio aparte.
- [Una caja que falla y un flujo que descarta se ven igual en el log] → Los
  errores siguen en la consola. Señalar errores en el log queda fuera (ver
  proposal).
- [El log muestra lo que el flujo mandó, no lo que llegó al puerto: si el
  `invoke` falla, igual figura como salida] → El caso más común es una
  desconexión, que ya se avisa con `conexion-perdida`.
- [Dibujar sub-filas suma trabajo por mensaje] → Sigue siendo un solo
  `prepend` por mensaje de entrada, con unos pocos nodos más; el reloj y el
  Sensor Activo siguen sin llegar al frontend.

## Migration Plan

Frontend y backend van juntos en la misma aplicación: no hay versiones
mezcladas que soportar. El log no se guarda en disco, así que no hay datos que
migrar.
