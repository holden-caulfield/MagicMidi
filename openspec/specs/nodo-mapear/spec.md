# nodo-mapear Specification

## Purpose
Define el nodo Mapear, que cambia el canal o un byte de datos según un mapa de
pares entrada → salida, y deja como están los valores que no figuran en él. Es
la base de arreglos como llevar los pads de un controlador al mapa de batería
GM, cambiar un controlador por otro o pasar un canal a otro.

## Requirements

### Requirement: Los parámetros de Mapear son el byte y el mapa

Una caja **Mapear** SHALL tener entrada y salida, y dos parámetros:

- **Byte**: qué byte cambia. Las opciones son "Canal", "2.º (datos 1)" y
  "3.º (datos 2)". El status entero no se ofrece: de él, solo el canal.
- **Mapa**: los pares entrada → salida, de 0 a 127 (ver la spec
  `tipos-de-parametro`, "El parámetro mapa"). Ofrece los modos nota, decimal y
  hexadecimal, en ese orden: arranca en nota, porque el caso principal es
  cambiar unas notas por otras. Vacío, muestra el texto de ayuda "Sin pares:
  todo pasa sin cambios."

Con "Canal", cada entrada y cada salida del mapa SHALL ir de 1 a 16, como el
canal que se ve en el log. Un valor fuera de ese rango SHALL ser un error de
configuración asociado a "Mapa", con el texto "Con Canal, los valores tienen
que ir de 1 a 16, y hay un <valor>", con el primero que queda afuera. Los tres
números van marcados como valores, así el panel los escribe en el modo del
campo.

Una caja nueva SHALL arrancar con byte "2.º (datos 1)" y el mapa vacío, sin
errores. Con esos valores deja pasar los mensajes sin cambios.

#### Scenario: Configuración inicial

- **WHEN** la persona usuaria agrega una caja "Mapear" y la selecciona
- **THEN** el panel muestra byte "2.º (datos 1)" y el mapa vacío, con el
  texto "Sin pares: todo pasa sin cambios." y el botón de modo en "♪", sin
  errores

#### Scenario: Con Canal, un valor fuera de 1 a 16

- **GIVEN** una caja "Mapear" con byte "Canal" y el mapa 1 → 10, en modo
  decimal
- **WHEN** la persona usuaria escribe 17 en la salida del primer par y sale
  del campo
- **THEN** el panel muestra debajo de "Mapa" que, con Canal, los valores
  tienen que ir de 1 a 16, y hay un 17, y la caja se ve con borde rojo

#### Scenario: El error depende del byte

- **GIVEN** una caja "Mapear" con byte "2.º (datos 1)" y el mapa 0 → 100,
  sin errores
- **WHEN** la persona usuaria elige el byte "Canal"
- **THEN** aparece el error debajo de "Mapa", que no se tocó, y nombra el 0

### Requirement: Cambia el valor del byte elegido por su salida en el mapa

Si el valor del byte elegido es la entrada de un par del mapa, la caja SHALL
producir un mensaje igual al recibido, salvo por ese byte, que pasa a valer
la salida del par. Con "Canal", el valor es el canal, de 1 a 16, y cambiarlo
no SHALL cambiar el tipo de mensaje. Los demás bytes, y la cantidad de bytes,
SHALL quedar igual.

Cada mensaje SHALL cambiarse una sola vez: la salida de un par no se vuelve a
buscar como entrada de otro. Así se pueden intercambiar dos valores.

#### Scenario: Pads al mapa de batería GM

- **GIVEN** byte "2.º (datos 1)" y el mapa C3 → C2, C#3 → D2, D3 → F#2 y
  D#3 → A#2
- **WHEN** recibe `99 30 64`, `99 31 50` y `99 32 7F` (Nota On en el canal
  10, en C3, C#3 y D3)
- **THEN** emite `99 24 64`, `99 26 50` y `99 2A 7F` (C2, D2 y F#2, con la
  misma velocidad)

#### Scenario: Cambiar de canal

- **GIVEN** byte "Canal" y el mapa 1 → 10
- **WHEN** recibe `90 3C 64` (canal 1) y `91 3C 64` (canal 2)
- **THEN** emite `99 3C 64` y `91 3C 64`

#### Scenario: Intercambiar dos notas

- **GIVEN** byte "2.º (datos 1)" y el mapa C2 → D2 y D2 → C2
- **WHEN** recibe `99 24 64` y `99 26 64` (C2 y D2)
- **THEN** emite `99 26 64` y `99 24 64` (D2 y C2)

#### Scenario: Un controlador por otro, solo en los Cambios de Control

- **GIVEN** trigger → "Filtrar" (solo "Cambio de Control") → "Mapear" (byte
  "2.º (datos 1)", mapa 1 → 11) → "Emitir"
- **WHEN** llegan `B0 01 40` (modulación) y `90 01 64` (un Nota On en la nota
  1)
- **THEN** sale `B0 0B 40` (expresión), y `90 01 64` sale tal como llegó

### Requirement: Un valor que no está en el mapa pasa sin cambios

Si el valor del byte elegido no es la entrada de ningún par del mapa, la caja
SHALL pasar el mensaje tal cual, sin descartarlo. Con el mapa vacío, ningún
mensaje cambia.

#### Scenario: Una nota que no está en el mapa

- **GIVEN** byte "2.º (datos 1)" y el mapa C3 → C2
- **WHEN** recibe `90 3C 64` (C4)
- **THEN** emite `90 3C 64`

#### Scenario: Mapa vacío

- **GIVEN** una caja "Mapear" recién agregada
- **WHEN** recibe `90 3C 64`
- **THEN** emite `90 3C 64`

### Requirement: Un mensaje sin el byte elegido pasa sin cambios

Si el mensaje recibido no tiene el byte elegido (un mensaje de dos bytes no
tiene datos 2, y uno de sistema no tiene canal), la caja no SHALL alterarlo:
SHALL pasarlo tal cual a las cajas siguientes, sin descartarlo y sin
agregarle bytes.

#### Scenario: Presión de Canal y tercer byte

- **GIVEN** byte "3.º (datos 2)" y el mapa 64 → 0
- **WHEN** recibe `D0 40` (Presión de Canal, que tiene dos bytes)
- **THEN** emite `D0 40`

#### Scenario: Un mensaje de sistema y el canal

- **GIVEN** byte "Canal" y el mapa 1 → 10
- **WHEN** recibe `F2 00 10` (Posición de Canción, que no tiene canal)
- **THEN** emite `F2 00 10`

### Requirement: El Nota Off apaga la nota que prendió el Nota On

Como el resultado depende solo del valor que llega, el Nota Off de una tecla
SHALL cambiarse igual que su Nota On, y apagar la nota que este prendió. Si
el Nota Off no llega a la caja porque un Filtrar deja pasar solo los Nota On,
SHALL apagarla el apareo (ver la spec `apareo-de-nota-off`).

#### Scenario: El Nota Off pasa por el mapa

- **GIVEN** trigger → "Mapear" (byte "2.º (datos 1)", mapa C3 → C2) →
  "Emitir"
- **WHEN** llegan `99 30 64` y después `89 30 40`
- **THEN** salen `99 24 64` y después `89 24 40`

#### Scenario: Solo los Nota On, con el apareo

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Mapear" (byte "2.º
  (datos 1)", mapa C3 → C2) → "Emitir"
- **WHEN** llegan `99 30 64` y después `89 30 40`
- **THEN** salen `99 24 64` y después `89 24 40`
