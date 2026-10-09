# Spec Delta

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
