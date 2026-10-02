# nodo-fijar Specification

## Purpose
Define el nodo Fijar, que reemplaza una parte del mensaje MIDI (el canal o un
byte de datos) por un valor fijo. Es la base de arreglos como mandar todo por
un mismo canal o tocar todas las notas con la misma velocidad.

## Requirements

### Requirement: Parámetros del nodo Fijar

Una caja **Fijar** SHALL tener entrada y salida, y dos parámetros:

- **Byte**: qué parte del mensaje fija. Las opciones son "Canal", "2.º (datos
  1)" y "3.º (datos 2)".
- **Valor**: un número entero de 0 a 127, el valor que pasa a tener lo
  elegido. Con "Canal", SHALL ir de 1 a 16.

Un valor fuera de su rango SHALL ser un error de configuración de la caja,
asociado al parámetro "Valor" (ver la spec `editor-de-workflow`, "Los errores
de configuración se ven en el panel y en el lienzo").

Una caja nueva SHALL arrancar con byte "3.º (datos 2)" y valor 100, sin
errores.

#### Scenario: Configuración inicial

- **WHEN** la persona usuaria agrega una caja "Fijar" y la selecciona
- **THEN** el panel muestra byte "3.º (datos 2)" y valor 100, sin errores

#### Scenario: Valor fuera de rango

- **GIVEN** una caja "Fijar" con byte "3.º (datos 2)"
- **WHEN** la persona usuaria escribe 128 en el valor y sale del campo
- **THEN** el valor queda en 128, el panel muestra debajo del campo que tiene
  que ir de 0 a 127, y la caja se ve con borde rojo

#### Scenario: Canal fuera de rango

- **GIVEN** una caja "Fijar" con valor 100
- **WHEN** la persona usuaria elige el byte "Canal"
- **THEN** el panel muestra debajo del campo "Valor" que, con Canal, tiene que
  ir de 1 a 16, y la caja se ve con borde rojo

#### Scenario: Corregir el valor

- **GIVEN** una caja "Fijar" con byte "Canal", valor 100 y el error a la vista
- **WHEN** la persona usuaria escribe 10 en el valor y sale del campo
- **THEN** el error desaparece del panel y la caja deja de verse con borde
  rojo

### Requirement: Fija solo el byte de datos elegido

Con un byte de datos elegido, la caja SHALL producir un mensaje igual al
recibido, salvo por ese byte, que pasa a valer el valor configurado. Los demás
bytes, y la cantidad de bytes, SHALL quedar igual. Como el valor va de 0 a 127,
el leading bit del byte de datos SHALL seguir en 0.

#### Scenario: Velocidad fija

- **GIVEN** byte "3.º (datos 2)", valor 100
- **WHEN** recibe `90 3C 28` (Nota On, nota 60, velocidad 40)
- **THEN** emite `90 3C 64` (velocidad 100)

#### Scenario: Siempre la misma nota

- **GIVEN** byte "2.º (datos 1)", valor 36
- **WHEN** recibe `90 3C 64` (nota 60)
- **THEN** emite `90 24 64` (nota 36)

#### Scenario: Velocidad fija solo en las notas

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Fijar" (datos 2, valor 100)
  → "Emitir"
- **WHEN** llegan `90 3C 28`, `90 3C 00` y `B0 07 28`
- **THEN** sale `90 3C 64`, y `90 3C 00` (que es un Nota Off) y `B0 07 28`
  salen tal como llegaron

### Requirement: Fijar el canal cambia solo el canal

Con "Canal" elegido, el valor SHALL tomarse como un número de canal, de 1 a 16,
como lo muestra el log. En un mensaje de canal, la caja SHALL cambiar solo el
canal del status: el tipo de mensaje y los bytes de datos SHALL quedar igual.
Un mensaje sin canal (de sistema) SHALL pasar sin cambios.

#### Scenario: Todo por el canal 10

- **GIVEN** byte "Canal", valor 10
- **WHEN** recibe `90 3C 64` (Nota On, canal 1) y `B3 07 64` (Cambio de
  Control, canal 4)
- **THEN** emite `99 3C 64` (Nota On, canal 10) y `B9 07 64` (Cambio de
  Control, canal 10)

#### Scenario: Un mensaje de sistema no tiene canal

- **GIVEN** byte "Canal", valor 10
- **WHEN** recibe `FA` (Inicio)
- **THEN** emite `FA`

### Requirement: Un mensaje sin el byte elegido pasa sin cambios

Si el mensaje recibido no tiene el byte de datos elegido, la caja no SHALL
alterarlo: SHALL pasarlo tal cual a las cajas siguientes, sin descartarlo y sin
agregarle bytes.

#### Scenario: Cambio de Programa y tercer byte

- **GIVEN** byte "3.º (datos 2)", valor 100
- **WHEN** recibe `C0 05` (Cambio de Programa, que tiene dos bytes)
- **THEN** emite `C0 05`
