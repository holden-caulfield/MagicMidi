# ejecucion-de-workflow Specification

## Purpose
Define qué le pasa a cada mensaje MIDI que llega por el puerto de entrada
mientras hay una conexión activa. El mensaje recorre el flujo armado en el
editor, y al puerto de salida llega solo lo que el flujo manda emitir.

## Requirements

### Requirement: Cada caja recibe, procesa y pasa el mensaje

Cuando un mensaje llega a una caja, la caja SHALL procesarlo según su tipo y su
configuración, y SHALL pasar el resultado a cada caja conectada a su salida.
Una caja SHALL poder también descartar el mensaje, y entonces ese camino
termina ahí, sin cancelar el reenvío del original. Una caja SHALL poder
también producir varios mensajes a partir de uno: cada uno SHALL pasar por
separado, en orden, a las cajas conectadas a su salida, y todo lo que produce
el primero sale antes que lo que produce el segundo. Una caja **Emitir** SHALL
enviar al puerto de salida el mensaje que recibe. Una caja **Descartar** no
SHALL enviar nada. Una caja de fin que produce varios mensajes, como
**Pánico**, SHALL enviarlos todos al puerto de salida, en orden. Llegar a
cualquier caja de fin SHALL cancelar el reenvío del original (ver "Cada
mensaje se reenvía tal cual, salvo que el flujo lo cancele").

#### Scenario: Transposición

- **GIVEN** trigger → "Desplazar" (byte datos 1, desplazamiento +4, sin
  overflow) → "Emitir"
- **WHEN** llega "Nota On · canal 1 · nota 60 · velocidad 100" (`90 3C 64`)
- **THEN** sale "Nota On · canal 1 · nota 64 · velocidad 100" (`90 40 64`)

#### Scenario: Cajas encadenadas

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Desplazar" (datos 1, +3) →
  "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** sale `90 43 64`

#### Scenario: Emitir y Descartar en ramas distintas

- **GIVEN** la salida del trigger va a una caja "Emitir" y a una caja
  "Descartar"
- **WHEN** llega `90 3C 64`
- **THEN** sale `90 3C 64` una sola vez: la del Emitir

#### Scenario: Una caja de fin que produce varios mensajes

- **GIVEN** trigger → "Pánico"
- **WHEN** llega `90 3C 64`
- **THEN** salen los 64 mensajes del pánico (ver la spec `panico`), en orden,
  y no sale `90 3C 64`

#### Scenario: Varios mensajes siguen de largo por separado

- **GIVEN** trigger → una caja que, por cada mensaje, produce el mismo
  mensaje y una copia una octava más arriba → "Desplazar" (datos 1, +1) →
  "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** salen `90 3D 64` y después `90 49 64`

### Requirement: Las ramas son independientes

Cuando la salida de una caja está conectada a varias entradas, cada una SHALL
recibir su propia copia del mensaje. Lo que haga una rama no SHALL afectar lo
que recibe otra. Cuando una caja recibe mensajes por varias conexiones, SHALL
procesar cada uno por separado: si un mismo mensaje llega por dos caminos a un
Emitir, sale dos veces.

#### Scenario: Original y transpuesto

- **GIVEN** la salida del trigger está conectada a una caja "Emitir" y a una
  caja "Desplazar" (datos 1, +7) que termina en otra caja "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** salen dos mensajes: `90 3C 64` y `90 43 64`

#### Scenario: Dos caminos al mismo Emitir

- **GIVEN** el trigger está conectado a dos cajas "Desplazar" (datos 1, +4 y
  +7), y las dos salidas van a la misma caja "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** salen `90 40 64` y `90 43 64`

### Requirement: Los mensajes salen en el orden en que llegaron

Los mensajes enviados al puerto de salida SHALL respetar el orden de llegada de
los mensajes que los originaron. Todo lo que produce un mensaje sale antes que
lo que produce el siguiente.

#### Scenario: Nota On y Nota Off

- **GIVEN** trigger → "Desplazar" → "Emitir"
- **WHEN** llega un "Nota On" y enseguida su "Nota Off"
- **THEN** por la salida sale primero el "Nota On" desplazado y después el
  "Nota Off" desplazado

### Requirement: El reloj MIDI y el Sensor Activo no pasan por el flujo

Los mensajes de reloj MIDI (*Timing Clock*, `0xF8`) y de Sensor Activo
(*Active Sensing*, `0xFE`) SHALL reenviarse directo al puerto de salida, sin
cambios y sin pasar por el flujo, arme lo que arme la persona usuaria. Ninguno
de los dos se muestra en el log.

#### Scenario: Reloj sin ningún Emitir

- **GIVEN** hay una conexión activa y el lienzo tiene solo el trigger
- **WHEN** llegan mensajes de reloj MIDI
- **THEN** salen todos por el puerto de salida, en el mismo orden

#### Scenario: Sensor Activo sin ningún Emitir

- **GIVEN** hay una conexión activa y el lienzo tiene solo el trigger
- **WHEN** llegan mensajes de Sensor Activo
- **THEN** salen todos por el puerto de salida, en el mismo orden

#### Scenario: Sensor Activo con el lienzo inicial

- **GIVEN** hay una conexión activa y el lienzo está como al abrir la
  aplicación (trigger → Emitir)
- **WHEN** llega un mensaje de Sensor Activo
- **THEN** sale una sola vez por el puerto de salida

### Requirement: El log sigue mostrando lo que entra

El log SHALL mostrar cada mensaje que llega por el puerto de entrada tal como
llegó, sin importar cómo esté armado el flujo, y junto a él lo que el flujo
emitió a partir de ese mensaje, o que hubo un error al procesarlo (ver la spec
`log-de-mensajes`). Lo que se muestra como salida SHALL ser exactamente lo que
el flujo mandó al puerto de salida para ese mensaje, en el mismo orden.

#### Scenario: El flujo no altera el log

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** el log muestra `90 3C 64` como entrada, y `90 40 64` como lo que
  salió a partir de él

#### Scenario: Lo que falla no figura como salida

- **GIVEN** la salida del trigger va a una caja que falla y a una caja
  "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** el log muestra `90 3C 64` con la marca de error, y nada como
  salida

### Requirement: El flujo funciona desde cualquier tab

El procesamiento SHALL funcionar igual esté o no a la vista el tab Workflow.

#### Scenario: Flujo activo con otro tab a la vista

- **GIVEN** hay una conexión activa, trigger → "Emitir", y el tab activo es
  "Log"
- **WHEN** llegan mensajes
- **THEN** salen por el puerto de salida

### Requirement: Cada mensaje se reenvía tal cual, salvo que el flujo lo cancele

Mientras haya una conexión activa, cada mensaje que llega por el puerto de
entrada (salvo el reloj MIDI y el Sensor Activo, ver más abajo) SHALL entrar al
flujo por el trigger. Si al procesarlo no llega a ninguna **caja de fin** (una
caja sin salida, como Emitir o Descartar), el mensaje SHALL salir por el
puerto de salida tal como llegó, como único mensaje de salida.

Si llega a al menos una caja de fin, el mensaje original no SHALL salir por el
hecho de haber entrado: SHALL salir únicamente lo que devuelvan las cajas de
fin a las que llegó (que puede ser nada). Un camino que termina antes de
llegar a una caja de fin, porque una caja descartó el mensaje o porque la caja
no está conectada a nada, no SHALL cancelar el reenvío.

Si una caja falla, no sale nada, ni el reenvío ni lo que hayan devuelto las
cajas de fin (ver "Un error en una caja cancela todo lo que produce ese
mensaje").

#### Scenario: Lienzo inicial

- **GIVEN** hay una conexión activa y el lienzo está como al abrir la
  aplicación (trigger → Emitir)
- **WHEN** llega cualquier mensaje
- **THEN** sale por el puerto de salida el mismo mensaje, sin cambios, una
  sola vez

#### Scenario: Sin ninguna caja

- **GIVEN** hay una conexión activa y la persona usuaria borró el Emitir
  inicial, así que el lienzo tiene solo el trigger
- **WHEN** llega un mensaje "Nota On"
- **THEN** sale por el puerto de salida el mismo mensaje, sin cambios

#### Scenario: Camino que no termina en una caja de fin

- **GIVEN** el trigger está conectado a una caja "Desplazar" (datos 1, +4) que
  no está conectada a nada
- **WHEN** llega `90 3C 64`
- **THEN** sale `90 3C 64`, sin el desplazamiento

#### Scenario: Descartar todo

- **GIVEN** el trigger está conectado solo a una caja "Descartar"
- **WHEN** llega cualquier mensaje
- **THEN** no sale nada por el puerto de salida

#### Scenario: Una caja de fin cancela el original

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** sale solamente `90 40 64`, y no `90 3C 64`

#### Scenario: Filtrar sin tener que ocuparse del resto

- **GIVEN** trigger → "Filtrar" (Nota On y Nota Off), y la salida de "Filtrar"
  va a tres cajas "Desplazar" (datos 1, +0, +4 y +7), cada una con su "Emitir"
- **WHEN** llega `90 3C 64` y después `B0 07 64`
- **THEN** por el Nota On salen `90 3C 64`, `90 40 64` y `90 43 64`, y el
  Cambio de Control sale tal cual, `B0 07 64`

#### Scenario: Sacar los Nota Off

- **GIVEN** trigger → "Filtrar" (solo Nota Off) → "Descartar"
- **WHEN** llegan `90 3C 64` y después `80 3C 40`
- **THEN** sale `90 3C 64`, y `80 3C 40` no sale

### Requirement: Un error en una caja cancela todo lo que produce ese mensaje

Si una caja falla al procesar un mensaje, o produce algo que no es un mensaje
MIDI válido (algún byte que no sea un entero entre 0 y 255, o ningún byte), o
una lista en la que alguno no lo es, el procesamiento de ese mensaje SHALL
cortarse ahí: ninguna otra caja SHALL procesarlo después, y no SHALL salir
nada por el puerto de salida a partir de él, ni el reenvío del original ni lo
que ya hayan devuelto otras cajas de fin. El error SHALL quedar registrado en
la consola de desarrollo, con la caja que lo produjo, y el log SHALL mostrar
ese mensaje como error, con el texto del error (ver la spec
`log-de-mensajes`). Los mensajes que lleguen después SHALL procesarse con
normalidad.

#### Scenario: Una rama falla y no sale nada

- **GIVEN** la salida del trigger va a una caja que falla y a una caja
  "Emitir"
- **WHEN** llega un mensaje
- **THEN** no sale nada por el puerto de salida, tampoco por el "Emitir"

#### Scenario: El error descarta lo que ya se había emitido

- **GIVEN** la salida del trigger va primero a una caja "Emitir" y después a
  una caja que falla
- **WHEN** llega un mensaje
- **THEN** no sale nada por el puerto de salida, aunque el "Emitir" ya haya
  devuelto el mensaje

#### Scenario: Un error sin ninguna caja de fin

- **GIVEN** la salida del trigger va solo a una caja que falla, que no está
  conectada a nada
- **WHEN** llega un mensaje
- **THEN** no sale nada por el puerto de salida, ni siquiera el reenvío del
  original

#### Scenario: Un mensaje inválido cuenta como error

- **GIVEN** la salida del trigger va a una caja que produce un byte mayor que
  255 y a una caja "Emitir"
- **WHEN** llega un mensaje
- **THEN** no sale nada por el puerto de salida

#### Scenario: Un mensaje inválido dentro de una lista

- **GIVEN** la salida del trigger va a una caja que produce dos mensajes, el
  primero válido y el segundo sin ningún byte, y a una caja "Emitir"
- **WHEN** llega un mensaje
- **THEN** no sale nada por el puerto de salida, tampoco el primero de los
  dos

#### Scenario: El siguiente mensaje se procesa normalmente

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir", y "Desplazar"
  falla solo con el primer mensaje que recibe
- **WHEN** llegan dos mensajes `90 3C 64` seguidos
- **THEN** por el primero no sale nada, y por el segundo sale `90 40 64`

### Requirement: Una caja mal configurada falla con cada mensaje

Si un mensaje llega a una caja que tiene errores de configuración (ver la spec
`editor-de-workflow`, "Los errores de configuración se ven en el panel y en el
lienzo"), la caja no SHALL procesarlo: SHALL fallar, igual que una caja que
falla al procesar (ver "Un error en una caja cancela todo lo que produce ese
mensaje"). El texto del error SHALL decir qué caja está mal configurada, en
qué parámetro y por qué. Los valores que nombre ese texto SHALL escribirse
como texto común (un número, en decimal), sea cual sea el modo en que los
muestra el panel. Una caja mal configurada a la que no llega ningún mensaje
no SHALL afectar al flujo.

#### Scenario: Canal fuera de rango en Fijar

- **GIVEN** trigger → "Fijar" (byte "Canal", valor 17) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** no sale nada, y el log marca el mensaje con error, con un texto
  que nombra la caja "Fijar", el parámetro "Valor" y que tiene que ir de 1 a
  16

#### Scenario: Los valores del error van en decimal

- **GIVEN** trigger → "Fijar" (byte "Canal", valor 100, en modo hexadecimal)
  → "Emitir", y el panel muestra que, con Canal, tiene que ir de 01 a 10
- **WHEN** llega `90 3C 64`
- **THEN** el texto del error en el log dice que tiene que ir de 1 a 16

#### Scenario: Una caja mal configurada en una rama que no se recorre

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Mapear" (entrada de 64 a
  64) → "Emitir"
- **WHEN** llega `B0 07 64`
- **THEN** sale `B0 07 64` tal como llegó, sin error, porque el Filtrar no lo
  dejó llegar a la caja mal configurada

#### Scenario: Corregir la caja

- **GIVEN** la caja "Fijar" del primer escenario
- **WHEN** la persona usuaria cambia el valor a 10 y llega `90 3C 64`
- **THEN** sale `99 3C 64`, sin error
