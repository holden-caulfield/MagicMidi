# Spec Delta

## MODIFIED Requirements

### Requirement: Se reciben todos los tipos de mensaje

Mientras haya una conexión activa, la aplicación SHALL recibir todos los
mensajes que lleguen por el puerto de entrada, sin filtrar ninguno por tipo:
mensajes de canal, Sistema Exclusivo (SysEx), código de tiempo, reloj y Sensor
Activo incluidos. Qué se hace con cada uno está en `ejecucion-de-workflow` y
`log-de-mensajes`.

#### Scenario: SysEx y Sensor Activo

- **GIVEN** hay una conexión activa
- **WHEN** el dispositivo de entrada manda un mensaje SysEx y mensajes de Sensor
  Activo (`FE`)
- **THEN** la aplicación recibe los dos: el SysEx aparece en el log y pasa por
  el flujo, y el Sensor Activo sale directo por el puerto de salida
