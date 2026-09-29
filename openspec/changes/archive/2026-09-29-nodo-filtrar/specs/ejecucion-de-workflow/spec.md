## ADDED Requirements

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
MIDI válido (algún byte que no sea un entero entre 0 y 255, o ningún byte), el
procesamiento de ese mensaje SHALL cortarse ahí: ninguna otra caja SHALL
procesarlo después, y no SHALL salir nada por el puerto de salida a partir de
él, ni el reenvío del original ni lo que ya hayan devuelto otras cajas de fin.
El error SHALL quedar registrado en la consola de desarrollo, con la caja que
lo produjo, y el log SHALL mostrar ese mensaje como error, con el texto del
error (ver la spec `log-de-mensajes`). Los mensajes que lleguen después SHALL procesarse con
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

#### Scenario: El siguiente mensaje se procesa normalmente

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir", y "Desplazar"
  falla solo con el primer mensaje que recibe
- **WHEN** llegan dos mensajes `90 3C 64` seguidos
- **THEN** por el primero no sale nada, y por el segundo sale `90 40 64`

## MODIFIED Requirements

### Requirement: Cada caja recibe, procesa y pasa el mensaje

Cuando un mensaje llega a una caja, la caja SHALL procesarlo según su tipo y su
configuración, y SHALL pasar el resultado a cada caja conectada a su salida.
Una caja SHALL poder también descartar el mensaje, y entonces ese camino
termina ahí, sin cancelar el reenvío del original. Una caja **Emitir** SHALL
enviar al puerto de salida el mensaje que recibe. Una caja **Descartar** no
SHALL enviar nada. Llegar a cualquiera de las dos SHALL cancelar el reenvío del
original (ver "Cada mensaje se reenvía tal cual, salvo que el flujo lo
cancele").

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

## REMOVED Requirements

### Requirement: El flujo reemplaza al pass-through

**Reason**: Con el nodo Filtrar, que solo saliera lo que llega a un Emitir
obligaba a volver a conectar a mano todo lo que el filtro no selecciona. El
reenvío por defecto vuelve, pero ahora el flujo puede cancelarlo.

**Migration**: Ver "Cada mensaje se reenvía tal cual, salvo que el flujo lo
cancele". Un flujo que dependía de que un camino sin Emitir no enviara nada
tiene que terminar ese camino en una caja "Descartar".

### Requirement: Un error en una caja no frena el flujo

**Reason**: Que las otras ramas siguieran emitiendo hacía que un flujo roto
saliera a medias (por ejemplo, un acorde con una nota de menos) sin que se
notara. Ahora un error cancela todo lo de ese mensaje y el log lo marca.

**Migration**: Ver "Un error en una caja cancela todo lo que produce ese
mensaje". Los mensajes siguientes se siguen procesando, como antes.
