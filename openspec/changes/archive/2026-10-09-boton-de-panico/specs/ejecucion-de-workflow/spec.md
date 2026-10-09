# Spec Delta

## MODIFIED Requirements

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
