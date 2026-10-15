# Spec Delta

## MODIFIED Requirements

### Requirement: Cada mensaje se reenvía tal cual, salvo que el flujo lo cancele

Mientras haya una conexión activa, cada mensaje que llega por el puerto de
entrada (salvo el reloj MIDI y el Sensor Activo, ver más abajo) SHALL entrar al
flujo por el trigger. Si al procesarlo no llega a ninguna **caja de fin** (una
caja sin salida, como Emitir o Descartar), el mensaje SHALL salir por el
puerto de salida tal como llegó, como único mensaje de salida.

La excepción es el Nota Off (también un Nota On con velocidad 0): si no llega
a ninguna caja de fin, en lugar de salir tal cual SHALL apagar lo que prendió
su Nota On, según la spec `apareo-de-nota-off`.

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

#### Scenario: Un Nota Off sin caja de fin apaga lo que prendió su Nota On

- **GIVEN** trigger → "Filtrar" (solo Nota On) → "Desplazar" (datos 1, +12) →
  "Emitir"
- **WHEN** llegan `90 3C 64` y después `80 3C 40`
- **THEN** sale `90 48 64` y después `80 48 40`, y no `80 3C 40`
