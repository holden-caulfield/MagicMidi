# Spec Delta

## Purpose

Define el nodo Pánico, una caja de fin que manda el pánico por cada mensaje
que le llega, para poder dispararlo desde un controlador MIDI (por ejemplo,
con un botón que manda una nota o un Cambio de Control) aunque la ventana de
la aplicación no esté al frente.

## ADDED Requirements

### Requirement: Pánico es una caja de fin que devuelve el pánico

Una caja **Pánico** SHALL tener entrada y no tener salida, y SHALL verse con
el color de las cajas de fin, como Emitir. No SHALL tener parámetros. Su ícono
SHALL ser el mismo que el del botón de pánico.

Por cada mensaje que le llega, sea del tipo que sea, SHALL devolver los 64
mensajes del pánico (ver la spec `panico`), que salen por el puerto de salida
en ese orden. Como toda caja de fin, SHALL cancelar el reenvío del mensaje que
llegó a ella (ver la spec `ejecucion-de-workflow`). La caja no SHALL mirar el
tipo ni los valores del mensaje: elegir qué mensajes la disparan es trabajo de
un Filtrar puesto antes.

Lo que sale por la caja SHALL verse en el log como lo que salió a partir del
mensaje que llegó a ella, con una sub-fila por cada mensaje del pánico (ver la
spec `log-de-mensajes`).

#### Scenario: Cualquier mensaje la dispara

- **GIVEN** trigger → "Pánico"
- **WHEN** llega `90 3C 64`
- **THEN** salen los 64 mensajes del pánico, en orden, y `90 3C 64` no sale

#### Scenario: Lo emitido por otras ramas sale igual

- **GIVEN** la salida del trigger va a una caja "Emitir" y a una caja
  "Pánico"
- **WHEN** llega `B0 14 7F`
- **THEN** sale `B0 14 7F`, por el "Emitir", y los 64 mensajes del pánico

#### Scenario: Sin configuración

- **WHEN** la persona usuaria selecciona una caja "Pánico"
- **THEN** el panel de configuración muestra su nombre y ningún parámetro

#### Scenario: En el log

- **GIVEN** hay una conexión activa y trigger → "Pánico"
- **WHEN** llega `B0 14 7F`
- **THEN** el log muestra `B0 14 7F` como entrada y 64 sub-filas debajo, una
  por cada mensaje del pánico, en el orden en que salieron

### Requirement: El pánico se dispara desde un controlador con un Filtrar

Para disparar el pánico con un botón del controlador SHALL alcanzar con las
cajas existentes: un Filtrar que deja pasar solo ese botón, y la caja Pánico.
Un botón momentáneo manda un mensaje al apretarlo y otro al soltarlo; si los
dos llegan a la caja, el pánico sale dos veces. Para que salga una sola vez
SHALL alcanzar con filtrar también por el valor.

#### Scenario: Un botón que dispara dos veces

- **GIVEN** trigger → "Filtrar" (Cambio de Control, datos 1 de 20 a 20) →
  "Pánico"
- **WHEN** llega `B0 14 7F` (apretar) y después `B0 14 00` (soltar)
- **THEN** por cada uno de los dos salen los 64 mensajes del pánico

#### Scenario: Un botón que dispara una vez y no llega al sinte

- **GIVEN** el trigger va a un "Filtrar" (Cambio de Control, datos 1 de 20 a
  20) cuya salida va a una caja "Descartar" y a otro "Filtrar" (datos 2 de 64
  a 127) que termina en una caja "Pánico"
- **WHEN** llega `B0 14 7F` y después `B0 14 00`
- **THEN** por el primero salen solo los 64 mensajes del pánico, y por el
  segundo no sale nada

#### Scenario: El resto de los mensajes sigue de largo

- **GIVEN** el flujo del escenario anterior
- **WHEN** llega `90 3C 64`
- **THEN** sale `90 3C 64` tal como llegó
