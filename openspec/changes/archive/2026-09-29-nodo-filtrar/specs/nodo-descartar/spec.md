## Purpose

Define el nodo Descartar, una caja de fin que no emite nada: es la forma de
decir que los mensajes que llegan hasta ella no salgan por el puerto de salida.

## ADDED Requirements

### Requirement: Descartar es una caja de fin que no emite nada

Una caja **Descartar** SHALL tener entrada y no tener salida, y SHALL verse con
el color de las cajas de fin, como Emitir. No SHALL tener parámetros. Cada
mensaje que llega a ella SHALL cancelar el reenvío del original (ver la spec
`ejecucion-de-workflow`) sin agregar nada a lo que sale por el puerto.

#### Scenario: El mensaje no sale

- **GIVEN** trigger → "Descartar"
- **WHEN** llega `90 3C 64`
- **THEN** no sale nada por el puerto de salida

#### Scenario: Lo emitido por otras ramas sale igual

- **GIVEN** la salida del trigger va a una caja "Descartar" y a una caja
  "Desplazar" (datos 1, +12) que termina en un "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** sale solamente `90 48 64`

#### Scenario: Sin configuración

- **WHEN** la persona usuaria selecciona una caja "Descartar"
- **THEN** el panel de configuración muestra su nombre y ningún parámetro
