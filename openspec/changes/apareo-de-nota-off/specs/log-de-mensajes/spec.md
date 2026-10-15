# Spec Delta

## MODIFIED Requirements

### Requirement: El log muestra los mensajes que entran, salvo el reloj y el Sensor Activo

Mientras haya una conexión activa, el log SHALL agregar un grupo por cada
mensaje que llega por el puerto de entrada, con la única excepción del reloj
MIDI (`F8`) y del Sensor Activo (`FE`), que no SHALL mostrarse nunca como
entrada. Cada grupo SHALL mostrar el mensaje de entrada y lo que el flujo
emitió a partir de él, según los requisitos "Las salidas van en sub-filas",
"Un mensaje que pasa sin cambios se marca en la fila de entrada", "Lo que no
sale se marca como descartado", "Un mensaje cuyo procesamiento falló se
marca como error" y "Un Nota Off apareado se marca como tal". Lo que la aplicación reenvía directo a la salida sin pasar
por el flujo (el reloj y el Sensor Activo) no SHALL aparecer en el log.
Tampoco SHALL aparecer lo que manda el pánico desde el botón o el atajo de
teclado (ver la spec `panico`), porque no sale de ningún mensaje que entró. Lo
que sale por una caja Pánico sí aparece, como lo que el flujo emitió a partir
del mensaje que llegó a ella.

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

#### Scenario: El pánico desde el botón no aparece

- **GIVEN** hay una conexión activa y el log muestra un grupo
- **WHEN** la persona usuaria aprieta el botón "Pánico", o usa su atajo de
  teclado
- **THEN** el log sigue mostrando solo ese grupo, sin filas nuevas

### Requirement: Un mensaje que pasa sin cambios se marca en la fila de entrada

Cuando el flujo emitió a partir de un mensaje de entrada un único mensaje, con
exactamente los mismos bytes que la entrada, ese mensaje no SHALL tener
sub-fila: la fila de entrada SHALL llevar una marca de "salió sin cambios". La
marca SHALL tener un texto que la explique, visible al pasar el puntero y
disponible para lectores de pantalla. Vale también para un Nota Off
apareado: si lo único que salió por el apareo tiene los mismos bytes que la
entrada, el grupo lleva esta marca y no la de apareado (ver "Un Nota Off
apareado se marca como tal").

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

Cuando el flujo procesó un mensaje de entrada sin errores y no emitió nada a
partir de él, la fila de entrada SHALL llevar una marca de "descartado", y el
grupo no SHALL tener sub-filas. La marca SHALL tener un texto que la explique,
visible al pasar el puntero y disponible para lectores de pantalla, y SHALL
distinguirse a simple vista de la de "salió sin cambios". Un mensaje que salió
porque se reenvió por defecto (ver la spec `ejecucion-de-workflow`) no está
descartado: se muestra como cualquier mensaje que salió sin cambios. Uno que
no salió porque una caja falló tampoco: lleva la marca de error. Y tampoco un
Nota Off que no salió porque su Nota On no prendió ninguna nota: lleva la
marca de apareado (ver la spec `apareo-de-nota-off`).

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
  sub-filas SHALL tener además un fondo suave del mismo color; las de un Nota
  Off apareado, un fondo de un tono apenas distinto, que las diferencia de
  las del flujo sin dejar de leerse como salida. La fila de entrada marcada
  como "salió sin cambios" SHALL tener la letra del color de salida, pero
  conservar el fondo normal de la lista, para no llamar la atención en el
  caso más común.
- **Fondo gris**: la fila de entrada de un mensaje que no salió tal cual,
  porque se transformó, porque se apareó o porque se descartó, SHALL tener
  un fondo gris y la letra que no es del color de salida. La de un mensaje
  descartado SHALL tener además la letra atenuada, y no SHALL usar un color
  que se lea como error.
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

#### Scenario: Apareado

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Desplazar" (datos 1,
  +12) → "Emitir", y ya llegó `90 3C 64`
- **WHEN** llega `80 3C 40`
- **THEN** la fila de entrada tiene fondo gris, la letra normal y la marca de
  apareado, y la sub-fila `80 48 40` tiene la letra del color de salida sobre
  un fondo que se distingue del de la sub-fila del escenario "Transformado"

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

## ADDED Requirements

### Requirement: Un Nota Off apareado se marca como tal

Cuando un Nota Off se apareó con su Nota On (ver la spec
`apareo-de-nota-off`) y el apareo cambió lo que sale, la fila de entrada
SHALL llevar una marca de "apareado", con un ícono propio, y cada Nota Off que
salió por el apareo SHALL tener su sub-fila, en el orden en que salieron, con
el mismo formato que las sub-filas del flujo y los colores de "Los colores
separan lo que salió de lo que solo entró". Si lo único que salió por el
apareo tiene los mismos bytes que la entrada, el apareo no cambió nada, y el
grupo SHALL mostrarse como "salió sin cambios", sin la marca de apareado ni
sub-filas. Si no salió nada, porque su Nota On no prendió ninguna nota, el
grupo no SHALL tener sub-filas, y la marca de apareado lo distingue de un
descarte.

La marca SHALL tener un texto que diga que el Nota Off se apareó con su Nota
On, visible al pasar el puntero y disponible para lectores de pantalla, y
SHALL distinguirse a simple vista de las de "salió sin cambios", "descartado"
y error. Un Nota Off que no se apareó, porque llegó a una caja de fin o porque
no había nada anotado, SHALL mostrarse como cualquier otro mensaje: así el log
muestra cuándo el apareo cambió lo que salió de un Nota Off.

#### Scenario: Un Nota Off apareado

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Desplazar" (datos 1,
  +12) → "Emitir"
- **WHEN** llega `90 3C 64` y después `80 3C 40`
- **THEN** el grupo de `80 3C 40` lleva la marca de apareado y tiene una
  sub-fila, `80 48 40`

#### Scenario: Los mismos bytes que la entrada

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Emitir"
- **WHEN** llega `90 3C 64` y después `80 3C 40`
- **THEN** los grupos de `90 3C 64` y de `80 3C 40` llevan la marca de "salió
  sin cambios", sin la de apareado y sin sub-filas

#### Scenario: Sin notas que apagar

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Convertir" (a "Cambio de
  Control") → "Emitir"
- **WHEN** llega `90 24 7F` y después `80 24 40`
- **THEN** el grupo de `80 24 40` lleva la marca de apareado, no la de
  "descartado", y no tiene sub-filas

#### Scenario: Un Nota Off que sale por el flujo

- **GIVEN** el lienzo está como al abrir la aplicación (trigger → Emitir)
- **WHEN** llega `90 3C 64` y después `80 3C 40`
- **THEN** el grupo de `80 3C 40` lleva la marca de "salió sin cambios", sin
  la de apareado

#### Scenario: Un Nota Off sin nada anotado

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Desplazar" (datos 1,
  +12) → "Emitir"
- **WHEN** llega `80 3C 40`, sin que haya llegado antes `90 3C 64`
- **THEN** el grupo de `80 3C 40` lleva la marca de "salió sin cambios", sin
  la de apareado
