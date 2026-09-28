## MODIFIED Requirements

### Requirement: El log muestra los mensajes que entran, salvo el reloj y el Sensor Activo

Mientras haya una conexión activa, el log SHALL agregar un grupo por cada
mensaje que llega por el puerto de entrada, con la única excepción del reloj
MIDI (`F8`) y del Sensor Activo (`FE`), que no SHALL mostrarse nunca como
entrada. Cada grupo SHALL mostrar el mensaje de entrada y lo que el flujo
emitió a partir de él, según los requisitos "Las salidas van en sub-filas",
"Un mensaje que pasa sin cambios se marca en la fila de entrada" y "Lo que no
sale se marca como descartado". Lo que la aplicación reenvía directo a la
salida sin pasar por el flujo (el reloj y el Sensor Activo) no SHALL aparecer
en el log.

#### Scenario: Nota tocada

- **GIVEN** hay una conexión activa
- **WHEN** llega `90 3C 64`
- **THEN** aparece un grupo nuevo en el log con ese mensaje como entrada

#### Scenario: Reloj con otros mensajes

- **GIVEN** hay una conexión activa
- **WHEN** llegan mensajes de reloj intercalados con un "Inicio" (`FA`)
- **THEN** el log muestra solo el grupo del "Inicio"

#### Scenario: Sensor Activo con otros mensajes

- **GIVEN** hay una conexión activa
- **WHEN** llegan mensajes de Sensor Activo intercalados con un "Detener"
  (`FC`)
- **THEN** el log muestra solo el grupo del "Detener"

### Requirement: Cada fila muestra hora, bytes y descripción

La fila de entrada de cada grupo SHALL tener cuatro columnas:

- la hora en que la aplicación recibió el mensaje, en formato de 24 horas con
  milisegundos (`HH:MM:SS.mmm`);
- los bytes del mensaje en hexadecimal, en mayúsculas, con dos dígitos por byte
  y separados por un espacio;
- una descripción legible del mensaje;
- la marca de lo que pasó con el mensaje sin cambios, cuando corresponde (ver
  "Lo que sale igual se marca en la fila de entrada" y "Lo que no sale se
  marca como descartado").

Las sub-filas de salida SHALL mostrar los bytes y la descripción con el mismo
formato y alineados con las columnas de bytes y descripción de la fila de
entrada, y no SHALL mostrar hora.

#### Scenario: Formato de una fila

- **WHEN** llega `90 3C 64` a las 14:05:09 con 7 milisegundos
- **THEN** la fila de entrada muestra `14:05:09.007`, `90 3C 64` y "Nota On ·
  canal 1 · nota 60 · velocidad 100"

#### Scenario: Formato de una sub-fila

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** la sub-fila muestra `90 40 64` debajo de `90 3C 64` y "Nota On ·
  canal 1 · nota 64 · velocidad 100" debajo de la descripción de la entrada,
  sin hora

### Requirement: Descripción de los mensajes de sistema

Los mensajes de sistema SHALL describirse con su nombre en castellano y, entre
paréntesis, el nombre en inglés con el que figuran en la documentación de MIDI:

| Status | Descripción |
|---|---|
| `F0` | Mensaje de Sistema Exclusivo (SysEx) |
| `F1` | Cuadro de Tiempo MIDI (MTC Quarter Frame) |
| `F2` | Puntero de Posición de Canción (Song Position Pointer) |
| `F3` | Selección de Canción (Song Select) |
| `F6` | Solicitud de Afinación (Tune Request) |
| `F8` | Reloj MIDI (Timing Clock) |
| `FA` | Inicio (Start) |
| `FB` | Continuar (Continue) |
| `FC` | Detener (Stop) |
| `FE` | Sensor Activo (Active Sensing) |
| `FF` | Reset del Sistema |

Cualquier otro mensaje de sistema SHALL describirse como "Mensaje de sistema
sin reconocer" seguido de su status en hexadecimal. El reloj (`F8`) y el Sensor
Activo (`FE`) nunca llegan al log como entrada: solo pueden aparecer en una
sub-fila, si una caja del flujo los produce.

#### Scenario: Mensaje de sistema conocido

- **WHEN** llega `FC`
- **THEN** la descripción es "Detener (Stop)"

#### Scenario: Mensaje de sistema no reconocido

- **WHEN** llega `F9`
- **THEN** la descripción es "Mensaje de sistema sin reconocer (0xF9)"

### Requirement: Los mensajes más nuevos van arriba

Cada grupo nuevo SHALL agregarse al principio de la lista, de modo que el
mensaje de entrada más reciente quede siempre arriba y el orden de los grupos,
de arriba hacia abajo, sea el inverso del orden de llegada. Dentro de un grupo,
la fila de entrada SHALL ir primero y las sub-filas debajo, en el orden en que
el flujo emitió los mensajes.

#### Scenario: Dos mensajes seguidos

- **WHEN** llega `90 3C 64` y después `80 3C 00`
- **THEN** el grupo de `80 3C 00` queda arriba del de `90 3C 64`

#### Scenario: Sub-filas debajo de su entrada

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir"
- **WHEN** llega `90 3C 64` y después `80 3C 00`
- **THEN** de arriba hacia abajo se ven `80 3C 00`, su sub-fila `80 40 00`,
  `90 3C 64` y su sub-fila `90 40 64`

### Requirement: El log conserva los últimos 500 mensajes

El log SHALL mostrar como máximo 500 grupos, es decir, 500 mensajes de entrada,
sin importar cuántas sub-filas tenga cada uno. Cuando llega un mensaje y ya hay
500, SHALL descartarse el grupo más viejo entero, con sus sub-filas. Los grupos
descartados no SHALL poder recuperarse.

#### Scenario: Se supera el máximo

- **GIVEN** el log tiene 500 grupos
- **WHEN** llega un mensaje nuevo
- **THEN** el log sigue teniendo 500 grupos: el nuevo arriba de todo y sin el
  que estaba último, ni sus sub-filas

#### Scenario: Las sub-filas no cuentan

- **GIVEN** un flujo que emite tres mensajes distintos por cada uno que entra
- **WHEN** llegan 500 mensajes
- **THEN** el log muestra los 500 grupos, cada uno con sus tres sub-filas

### Requirement: La lista de mensajes ocupa el espacio disponible

La lista de mensajes del tab Log SHALL ocupar todo el alto que queda en el
panel debajo del encabezado del log, y todo el ancho del panel hasta un
máximo: el que hace falta para que la fila más ancha que puede producir un
mensaje de canal ("Cambio de Control · canal 16 · controlador 127 · valor
127") entre en una sola línea, con su marca. Con más ancho disponible, la
lista y el encabezado del log (el título y el botón "Limpiar") SHALL quedar
centrados en el panel, con el mismo ancho. La lista SHALL acompañar los
cambios de tamaño de la ventana. Cuando las filas no entran, la que se
desplaza SHALL ser la lista: ni el panel ni la ventana.

#### Scenario: Ventana grande

- **GIVEN** la ventana está en pantalla completa y el tab activo es "Log"
- **WHEN** la persona usuaria mira el log
- **THEN** la lista de mensajes llega hasta el pie del panel, tiene el ancho
  máximo y queda centrada en el panel, con el encabezado del log alineado con
  ella, y las marcas de "salió sin cambios" y "descartado" quedan cerca de la
  descripción de su fila

#### Scenario: Ventana angosta

- **GIVEN** el panel es más angosto que el ancho máximo de la lista
- **WHEN** la persona usuaria mira el log
- **THEN** la lista ocupa todo el ancho del panel

#### Scenario: Más mensajes a la vista

- **GIVEN** el log tiene más filas de las que entran en la lista
- **WHEN** la persona usuaria agranda la ventana
- **THEN** se ven más filas a la vez que antes de agrandarla

#### Scenario: Muchas filas

- **GIVEN** el log tiene más filas de las que entran en la lista
- **WHEN** la persona usuaria las recorre
- **THEN** se desplaza la lista, y el encabezado del log y la barra de tabs
  quedan quietos

## ADDED Requirements

### Requirement: Las salidas van en sub-filas

Salvo en el caso de "Un mensaje que pasa sin cambios se marca en la fila de
entrada", por cada mensaje que el flujo emitió a partir de un mensaje de
entrada el grupo SHALL tener una sub-fila, marcada como salida para
distinguirla de una entrada. Esto vale también para las salidas con los mismos
bytes que la entrada cuando no son la única salida: un mensaje que se
convirtió en varios se muestra siempre con todas sus salidas como sub-filas.
Si un mismo mensaje se emitió varias veces, SHALL tener una sub-fila por cada
vez.

#### Scenario: Transposición

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** el grupo muestra la entrada `90 3C 64` y una sub-fila `90 40 64`, y
  la fila de entrada no tiene marca

#### Scenario: Varios mensajes distintos

- **GIVEN** el trigger está conectado a dos cajas "Desplazar" (datos 1, +4 y
  +7), cada una con su "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** el grupo muestra la entrada `90 3C 64` y dos sub-filas, `90 40 64`
  y `90 43 64`, en el orden en que se emitieron

#### Scenario: Acorde que incluye la nota original

- **GIVEN** la salida del trigger está conectada a una caja "Emitir" y a dos
  cajas "Desplazar" (datos 1, +4 y +7), cada una con su "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada `90 3C 64` no tiene marca, y el grupo tiene tres
  sub-filas, `90 3C 64`, `90 40 64` y `90 43 64`, en el orden en que se
  emitieron

#### Scenario: El mismo mensaje distinto dos veces

- **GIVEN** el trigger está conectado a dos cajas "Desplazar" (datos 1, +4),
  cada una con su "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** el grupo muestra dos sub-filas `90 40 64`

#### Scenario: Sale igual dos veces

- **GIVEN** la salida del trigger está conectada a dos cajas "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada no tiene marca, y el grupo tiene dos sub-filas
  `90 3C 64`

### Requirement: Un mensaje que pasa sin cambios se marca en la fila de entrada

Cuando el flujo emitió a partir de un mensaje de entrada un único mensaje, con
exactamente los mismos bytes que la entrada, ese mensaje no SHALL tener
sub-fila: la fila de entrada SHALL llevar una marca de "salió sin cambios". La
marca SHALL tener un texto que la explique, visible al pasar el puntero y
disponible para lectores de pantalla.

#### Scenario: Flujo por defecto

- **GIVEN** el lienzo está como al abrir la aplicación (trigger → Emitir)
- **WHEN** llega `90 3C 64`
- **THEN** el grupo es una sola fila, `90 3C 64`, con la marca de "salió sin
  cambios" y sin sub-filas

#### Scenario: Un cambio que da los mismos bytes

- **GIVEN** trigger → "Desplazar" (datos 1, +0) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada lleva la marca de "salió sin cambios" y el grupo
  no tiene sub-filas

### Requirement: Lo que no sale se marca como descartado

Cuando el flujo no emitió nada a partir de un mensaje de entrada, la fila de
entrada SHALL llevar una marca de "descartado", y el grupo no SHALL tener
sub-filas. La marca SHALL tener un texto que la explique, visible al pasar el
puntero y disponible para lectores de pantalla, y SHALL distinguirse a simple
vista de la de "salió sin cambios".

#### Scenario: Sin ningún Emitir

- **GIVEN** la persona usuaria borró el Emitir inicial, así que el lienzo tiene
  solo el trigger
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada `90 3C 64` lleva la marca de "descartado"

#### Scenario: Camino que no termina en Emitir

- **GIVEN** el trigger está conectado a una caja "Desplazar" que no está
  conectada a nada
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada lleva la marca de "descartado"

### Requirement: Los colores separan lo que salió de lo que solo entró

Los colores del log SHALL seguir dos reglas:

- **Letra del color de salida**: toda fila que representa un mensaje que salió
  por el puerto de salida SHALL tener la letra del color de salida. Las
  sub-filas SHALL tener además un fondo suave del mismo color. La fila de
  entrada marcada como "salió sin cambios" SHALL tener la letra del color de
  salida, pero conservar el fondo normal de la lista, para no llamar la
  atención en el caso más común.
- **Fondo gris**: la fila de entrada de un mensaje que no salió tal cual,
  porque se transformó o porque se descartó, SHALL tener un fondo gris y la
  letra que no es del color de salida. La de un mensaje descartado SHALL
  tener además la letra atenuada, y no SHALL usar un color que se lea como
  error.

Así, recorrer las filas con la letra del color de salida SHALL ser leer todo
lo que salió, en orden. Las filas no SHALL alternar colores de fondo que se
puedan confundir con el gris de una entrada. Los colores SHALL poder leerse en
modo claro y en modo oscuro, y el estado de cada grupo SHALL poder
distinguirse también sin ver colores, por sus marcas y sus sub-filas.

#### Scenario: Leer todo lo que salió

- **GIVEN** el log tiene, de abajo hacia arriba, un grupo `90 3C 64` que salió
  sin cambios, un grupo `90 3C 64` transformado en `90 3C 64` y `90 40 64`, y
  un grupo `B0 07 64` descartado
- **WHEN** la persona usuaria recorre las filas con la letra del color de
  salida
- **THEN** son exactamente la fila de entrada del primer grupo y las dos
  sub-filas del segundo, que son los tres mensajes que salieron por el puerto;
  ni la fila de entrada del segundo grupo ni la del tercero tienen esa letra

#### Scenario: Pasa sin cambios

- **GIVEN** el lienzo está como al abrir la aplicación (trigger → Emitir)
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada tiene la letra del color de salida, el fondo
  normal de la lista y la marca de "salió sin cambios"

#### Scenario: Transformado

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada tiene fondo gris y la letra normal, y la
  sub-fila `90 40 64` tiene la letra del color de salida sobre su fondo suave

#### Scenario: Descartado

- **GIVEN** el lienzo tiene solo el trigger
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada tiene fondo gris, la letra atenuada y la marca de
  "descartado"
