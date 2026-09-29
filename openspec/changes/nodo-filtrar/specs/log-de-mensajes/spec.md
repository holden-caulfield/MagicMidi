## ADDED Requirements

### Requirement: Un mensaje cuyo procesamiento falló se marca como error

Cuando una caja falló al procesar un mensaje de entrada (ver "Un error en una
caja cancela todo lo que produce ese mensaje" en la spec
`ejecucion-de-workflow`), la fila de entrada SHALL llevar una marca de error
con un ícono de advertencia, y el grupo no SHALL tener sub-filas. La marca
SHALL tener un texto que la explique, visible al pasar el puntero y disponible
para lectores de pantalla, y SHALL distinguirse a simple vista de las de
"salió sin cambios" y "descartado". Ese texto SHALL incluir el mensaje del
error, con el nombre de la caja que falló y por qué, para que se pueda
entender qué pasó sin abrir la consola de desarrollo.

#### Scenario: Una caja que falla

- **GIVEN** la salida del trigger va a una caja que falla y a una caja
  "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada `90 3C 64` lleva la marca de error, y el grupo
  no tiene sub-filas

#### Scenario: El texto del error llega al log

- **GIVEN** trigger → "Desplazar" → "Emitir", y "Desplazar" falla con el
  mensaje "algo salió mal"
- **WHEN** llega `90 3C 64` y la persona usuaria pasa el puntero por la marca
  de error
- **THEN** el texto de la marca nombra la caja "Desplazar" e incluye "algo
  salió mal"

#### Scenario: Un mensaje inválido

- **GIVEN** trigger → una caja que produce un byte mayor que 255 → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada lleva la marca de error, y su texto dice que la
  caja produjo un mensaje MIDI inválido

#### Scenario: El error no se confunde con un descarte

- **GIVEN** el log tiene un grupo `90 3C 64` descartado por una caja
  "Descartar" y un grupo `90 3C 64` que falló
- **WHEN** la persona usuaria los mira
- **THEN** los dos grupos no tienen sub-filas, pero se distinguen por la marca
  y por los colores

## MODIFIED Requirements

### Requirement: El log muestra los mensajes que entran, salvo el reloj y el Sensor Activo

Mientras haya una conexión activa, el log SHALL agregar un grupo por cada
mensaje que llega por el puerto de entrada, con la única excepción del reloj
MIDI (`F8`) y del Sensor Activo (`FE`), que no SHALL mostrarse nunca como
entrada. Cada grupo SHALL mostrar el mensaje de entrada y lo que el flujo
emitió a partir de él, según los requisitos "Las salidas van en sub-filas",
"Un mensaje que pasa sin cambios se marca en la fila de entrada", "Lo que no
sale se marca como descartado" y "Un mensaje cuyo procesamiento falló se
marca como error". Lo que la aplicación reenvía directo a la salida sin pasar
por el flujo (el reloj y el Sensor Activo) no SHALL aparecer en el log.

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
- la marca de lo que pasó con el mensaje, cuando corresponde (ver "Un mensaje
  que pasa sin cambios se marca en la fila de entrada", "Lo que no sale se
  marca como descartado" y "Un mensaje cuyo procesamiento falló se marca como
  error").

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

### Requirement: Lo que no sale se marca como descartado

Cuando el flujo procesó un mensaje de entrada sin errores y no emitió nada a
partir de él, la fila de entrada SHALL llevar una marca de "descartado", y el
grupo no SHALL tener sub-filas. La marca SHALL tener un texto que la explique,
visible al pasar el puntero y disponible para lectores de pantalla, y SHALL
distinguirse a simple vista de la de "salió sin cambios". Un mensaje que salió
porque se reenvió por defecto (ver la spec `ejecucion-de-workflow`) no está
descartado: se muestra como cualquier mensaje que salió sin cambios. Uno que
no salió porque una caja falló tampoco: lleva la marca de error.

#### Scenario: Descartar todo

- **GIVEN** el trigger está conectado solo a una caja "Descartar"
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada `90 3C 64` lleva la marca de "descartado"

#### Scenario: Sin ningún Emitir

- **GIVEN** la persona usuaria borró el Emitir inicial, así que el lienzo
  tiene solo el trigger
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada lleva la marca de "salió sin cambios", no la de
  "descartado"

#### Scenario: Camino que no termina en Emitir

- **GIVEN** el trigger está conectado a una caja "Desplazar" que no está
  conectada a nada
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada lleva la marca de "salió sin cambios", no la de
  "descartado"

### Requirement: Los colores separan lo que salió de lo que solo entró

Los colores del log SHALL seguir tres reglas:

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
- **Rojo**: la fila de entrada de un mensaje cuyo procesamiento falló SHALL
  tener fondo rojo suave y letra roja, para que se note aunque pasen muchos
  mensajes. Ninguna otra fila SHALL usar rojo.

Así, recorrer las filas con la letra del color de salida SHALL ser leer todo
lo que salió, en orden, y recorrer las rojas SHALL ser leer todo lo que falló.
Las filas no SHALL alternar colores de fondo que se puedan confundir con el
gris de una entrada. Los colores SHALL poder leerse en modo claro y en modo
oscuro, y el estado de cada grupo SHALL poder distinguirse también sin ver
colores, por sus marcas y sus sub-filas.

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

- **GIVEN** el trigger está conectado solo a una caja "Descartar"
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada tiene fondo gris, la letra atenuada y la marca de
  "descartado"

#### Scenario: Error

- **GIVEN** la salida del trigger va a una caja que falla y a una caja
  "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** la fila de entrada tiene fondo rojo suave, letra roja y la marca de
  error, y ninguna fila del grupo tiene la letra del color de salida
