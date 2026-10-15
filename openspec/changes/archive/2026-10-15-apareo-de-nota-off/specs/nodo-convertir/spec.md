# Spec Delta

## MODIFIED Requirements

### Requirement: Convertir solo algunos tipos con un Filtrar

Convertir no SHALL tener un parámetro para elegir el tipo de origen: para
convertir solo algunos tipos, o solo algunos mensajes, se pone antes un
Filtrar. Lo que el Filtrar no deja pasar no llega a ninguna caja de fin y sale
tal cual (ver la spec `ejecucion-de-workflow`), salvo un Nota Off, que apaga
lo que prendió su Nota On (ver la spec `apareo-de-nota-off`): si su Nota On se
convirtió en otra cosa, no prendió ninguna nota y el Nota Off no sale.

#### Scenario: Aftertouch a CC sin tocar las notas

- **GIVEN** trigger → "Filtrar" (solo "Presión de Canal") → "Convertir" (a
  "Cambio de Control") → "Emitir"
- **WHEN** llegan `90 3C 64` y `D0 50`
- **THEN** sale `90 3C 64` tal como llegó, y `D0 50` sale como `B0 01 50`

#### Scenario: Cambiar de programa con un pad

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Convertir" (a "Cambio de
  Programa") → "Emitir"
- **WHEN** el pad manda `99 24 64` al apretarlo y `89 24 40` al soltarlo
- **THEN** sale `C9 24` una sola vez, y `89 24 40` no sale, porque su Nota On
  no prendió ninguna nota

#### Scenario: Siempre el mismo programa

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Convertir" (a "Cambio de
  Programa") → "Fijar" (datos 1, valor 5) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** sale `C0 05`

#### Scenario: Una fila de botones elige programas

- **GIVEN** trigger → "Filtrar" (solo "Cambio de Control", datos 2 desde 64)
  → "Convertir" (a "Cambio de Programa") → "Emitir"
- **WHEN** un botón manda `B0 14 7F` al apretarlo y `B0 14 00` al soltarlo
- **THEN** sale `C0 14` una sola vez, y `B0 14 00` sale tal como llegó

#### Scenario: Arrancar un secuenciador con un pedal

- **GIVEN** trigger → "Filtrar" (solo "Cambio de Control", datos 2 desde 64)
  → "Convertir" (a "Inicio") → "Emitir"
- **WHEN** el pedal manda `B0 50 7F` al apretarlo y `B0 50 00` al soltarlo
- **THEN** sale `FA` una sola vez, y `B0 50 00` sale tal como llegó
