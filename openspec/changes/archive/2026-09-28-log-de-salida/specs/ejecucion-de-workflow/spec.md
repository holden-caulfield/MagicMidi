## MODIFIED Requirements

### Requirement: El log sigue mostrando lo que entra

El log SHALL mostrar cada mensaje que llega por el puerto de entrada tal como
llegó, sin importar cómo esté armado el flujo, y junto a él lo que el flujo
emitió a partir de ese mensaje (ver la spec `log-de-mensajes`). Lo que se
muestra como salida SHALL ser exactamente lo que el flujo mandó al puerto de
salida para ese mensaje, en el mismo orden.

#### Scenario: El flujo no altera el log

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** el log muestra `90 3C 64` como entrada, y `90 40 64` como lo que
  salió a partir de él

#### Scenario: Lo que falla no figura como salida

- **GIVEN** la salida del trigger va a una caja que falla y a una caja
  "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** el log muestra `90 3C 64` con la marca de "salió sin cambios", y
  nada más como salida
