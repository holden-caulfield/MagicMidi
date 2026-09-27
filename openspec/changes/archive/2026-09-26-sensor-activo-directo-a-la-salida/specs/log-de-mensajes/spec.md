# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: El log muestra los mensajes que entran, salvo el reloj`
- TO: `### Requirement: El log muestra los mensajes que entran, salvo el reloj y el Sensor Activo`

## MODIFIED Requirements

### Requirement: El log muestra los mensajes que entran, salvo el reloj y el Sensor Activo

Mientras haya una conexión activa, el log SHALL agregar una fila por cada
mensaje que llega por el puerto de entrada, con la única excepción del reloj
MIDI (`F8`) y del Sensor Activo (`FE`), que no SHALL mostrarse nunca. Los
mensajes que la aplicación envía a la salida no SHALL aparecer en el log.

#### Scenario: Nota tocada

- **GIVEN** hay una conexión activa
- **WHEN** llega `90 3C 64`
- **THEN** aparece una fila nueva en el log con ese mensaje

#### Scenario: Reloj con otros mensajes

- **GIVEN** hay una conexión activa
- **WHEN** llegan mensajes de reloj intercalados con un "Inicio" (`FA`)
- **THEN** el log muestra solo la fila del "Inicio"

#### Scenario: Sensor Activo con otros mensajes

- **GIVEN** hay una conexión activa
- **WHEN** llegan mensajes de Sensor Activo intercalados con un "Detener"
  (`FC`)
- **THEN** el log muestra solo la fila del "Detener"

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
| `FA` | Inicio (Start) |
| `FB` | Continuar (Continue) |
| `FC` | Detener (Stop) |
| `FF` | Reset del Sistema |

Cualquier otro mensaje de sistema SHALL describirse como "Mensaje de sistema
sin reconocer" seguido de su status en hexadecimal. El reloj (`F8`) y el Sensor
Activo (`FE`) no figuran porque nunca llegan al log.

#### Scenario: Mensaje de sistema conocido

- **WHEN** llega `FC`
- **THEN** la descripción es "Detener (Stop)"

#### Scenario: Mensaje de sistema no reconocido

- **WHEN** llega `F9`
- **THEN** la descripción es "Mensaje de sistema sin reconocer (0xF9)"
