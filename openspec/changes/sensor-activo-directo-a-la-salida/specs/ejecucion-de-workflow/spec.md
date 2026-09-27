# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: El reloj MIDI no pasa por el flujo`
- TO: `### Requirement: El reloj MIDI y el Sensor Activo no pasan por el flujo`

## MODIFIED Requirements

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

### Requirement: El flujo reemplaza al pass-through

Mientras haya una conexión activa, cada mensaje que llega por el puerto de
entrada (salvo el reloj MIDI y el Sensor Activo, ver más abajo) SHALL entrar al
flujo por el trigger. Al puerto de salida SHALL llegar únicamente lo que
alcanza una caja **Emitir**. Si ningún camino desde el trigger llega a un
Emitir, no SHALL enviarse nada. La aplicación ya no reenvía los mensajes por
fuera del flujo; el pass-through de antes es el flujo por defecto (trigger →
Emitir).

#### Scenario: Lienzo inicial

- **GIVEN** hay una conexión activa y el lienzo está como al abrir la
  aplicación
- **WHEN** llega cualquier mensaje
- **THEN** sale por el puerto de salida el mismo mensaje, sin cambios

#### Scenario: Sin ningún Emitir

- **GIVEN** hay una conexión activa y la persona usuaria borró el Emitir
  inicial, así que el lienzo tiene solo el trigger
- **WHEN** llega un mensaje "Nota On"
- **THEN** no sale nada por el puerto de salida

#### Scenario: Trigger conectado a Emitir

- **GIVEN** hay una conexión activa y el trigger está conectado directo a una
  caja "Emitir"
- **WHEN** llega cualquier mensaje
- **THEN** sale por el puerto de salida el mismo mensaje, sin cambios

#### Scenario: Camino que no termina en Emitir

- **GIVEN** el trigger está conectado a una caja "Desplazar" que no está
  conectada a nada
- **WHEN** llega un mensaje
- **THEN** no sale nada por el puerto de salida
