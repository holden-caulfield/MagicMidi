# Proposal

## Why

Muchos dispositivos mandan Sensor Activo (`FE`) unas tres veces por segundo
para indicar que siguen conectados. Hoy cada uno pasa por el workflow y ocupa
una fila del log: con el máximo de 500 filas, en menos de tres minutos el log
queda lleno de Sensor Activo y los mensajes que interesan se pierden. Es el
Hallazgo 4 de `documentar-conexion-y-log`. El reloj MIDI (`F8`) ya tiene un
tratamiento pensado para este tipo de mensaje, y AGENTS.md pide decidir con la
persona usuaria si aplicarlo a otros; la decisión fue que sí.

## What Changes

- El backend reenvía el Sensor Activo directo al puerto de salida, sin
  cambios, igual que el reloj: no pasa por el workflow y no se manda al
  frontend, así que tampoco aparece en el log.
- No se agrega ninguna lógica que use el Sensor Activo para detectar una
  conexión perdida; queda para más adelante.

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `ejecucion-de-workflow`: el requirement del reloj pasa a cubrir también el
  Sensor Activo (cambia de nombre), y "El flujo reemplaza al pass-through"
  nombra las dos excepciones.
- `log-de-mensajes`: el log excluye también el Sensor Activo (el requirement
  cambia de nombre), y `FE` sale de la tabla de descripciones porque ya no
  llega nunca al log.
- `conexion-midi`: el escenario "SysEx y Sensor Activo" deja de decir que el
  Sensor Activo se procesa como cualquier otro mensaje.

## Impact

- **Código afectado**: `es_mensaje_de_reloj` y el callback de la conexión de
  entrada en `src-tauri/src/lib.rs`. El frontend no cambia.
- **AGENTS.md**: la sección "Mensajes de reloj MIDI" tiene que pasar a cubrir
  también el Sensor Activo y dejar de presentarlo como una decisión pendiente.
  El diff se propone al archivar.
