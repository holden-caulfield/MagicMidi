# Spec Delta

## MODIFIED Requirements

### Requirement: Parámetros del nodo Fijar

Una caja **Fijar** SHALL tener entrada y salida, y dos parámetros:

- **Byte**: qué parte del mensaje fija. Las opciones son "Canal", "2.º (datos
  1)" y "3.º (datos 2)".
- **Valor**: un número entero de 0 a 127, el valor que pasa a tener lo
  elegido. Con "Canal", SHALL ir de 1 a 16. Ofrece los tres modos, en el orden por
  defecto (decimal, nota y hexadecimal), y los dos errores escriben sus
  números como los muestra el valor.

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

#### Scenario: Canal fuera de rango en hexadecimal

- **GIVEN** una caja "Fijar" con valor 100, en modo hexadecimal
- **WHEN** la persona usuaria elige el byte "Canal"
- **THEN** el panel muestra debajo del campo "Valor" que, con Canal, tiene que
  ir de 01 a 10
