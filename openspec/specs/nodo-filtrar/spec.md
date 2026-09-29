# nodo-filtrar Specification

## Purpose
Define el nodo Filtrar, que deja seguir por el flujo solo los mensajes que
cumplen un criterio. Por ahora el único criterio es el tipo de mensaje.

## Requirements

### Requirement: Parámetros del nodo Filtrar

Una caja **Filtrar** SHALL tener entrada y salida, y un parámetro sí/no por
cada tipo de mensaje que puede elegir, en este orden: "Nota On", "Nota Off",
"Presión Polifónica", "Cambio de Control", "Cambio de Programa", "Presión de
Canal", "Pitch Bend" y "Mensajes de sistema". Una caja nueva SHALL arrancar
con todos desmarcados.

#### Scenario: Configuración inicial

- **WHEN** la persona usuaria agrega una caja "Filtrar" y la selecciona
- **THEN** el panel muestra las ocho casillas, en ese orden, todas
  desmarcadas

### Requirement: Deja pasar solo los tipos elegidos

La caja SHALL pasar a las cajas siguientes, sin cambios, cada mensaje cuyo
tipo (según la lectura del tipo de la spec `tipos-de-nodo`) esté marcado, y
SHALL descartar los demás. Descartar en Filtrar corta solo ese camino: no
cancela el reenvío del original. Un mensaje de tipo desconocido no SHALL pasar
nunca, porque no hay casilla para elegirlo.

#### Scenario: Solo notas

- **GIVEN** una caja "Filtrar" con "Nota On" y "Nota Off" marcados, conectada
  a un "Emitir"
- **WHEN** recibe `90 3C 64`, `80 3C 40` y `B0 07 64`
- **THEN** pasan al "Emitir" `90 3C 64` y `80 3C 40`, y `B0 07 64` no

#### Scenario: Nota On con velocidad cero

- **GIVEN** una caja "Filtrar" con solo "Nota On" marcado
- **WHEN** recibe `90 3C 00`
- **THEN** no lo deja pasar, porque es un Nota Off

#### Scenario: Cualquier canal

- **GIVEN** una caja "Filtrar" con solo "Cambio de Control" marcado
- **WHEN** recibe `B0 07 64` y `BF 07 64`
- **THEN** deja pasar los dos

#### Scenario: Mensajes de sistema

- **GIVEN** una caja "Filtrar" con solo "Mensajes de sistema" marcado
- **WHEN** recibe `FA`, `FC` y `90 3C 64`
- **THEN** deja pasar `FA` y `FC`, y `90 3C 64` no

#### Scenario: Nada marcado

- **GIVEN** una caja "Filtrar" nueva, sin ninguna casilla marcada, conectada a
  un "Emitir"
- **WHEN** recibe cualquier mensaje
- **THEN** no pasa nada al "Emitir"

#### Scenario: Lo que no pasa se reenvía por defecto

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Desplazar" (datos 1, +12)
  → "Emitir"
- **WHEN** llega `B0 07 64`
- **THEN** sale `B0 07 64` tal como llegó
