# Spec Delta

## MODIFIED Requirements

### Requirement: Parámetros del nodo Desplazar

Una caja **Desplazar** SHALL tener tres parámetros:

- **Byte**: qué parte del mensaje altera. Las opciones son "Canal", "2.º
  (datos 1)" y "3.º (datos 2)". No se ofrece el byte de status entero: el
  status mezcla el tipo de mensaje con el canal, y desplazarlo como un todo
  puede cambiar el tipo.
- **Desplazamiento**: un número entero, positivo, negativo o cero, que se le
  suma a lo elegido. Ofrece solo el modo decimal, así que no tiene botón
  de modo ni acepta otros formatos: es un intervalo, que puede ser negativo,
  y no una nota ni un byte.
- **Overflow**: sí o no. Dice qué pasa cuando el resultado se sale del rango de
  lo elegido.

Una caja nueva SHALL arrancar con byte "2.º (datos 1)", desplazamiento 0 y
overflow desactivado. Con esos valores deja pasar los mensajes sin cambios.

#### Scenario: Configuración inicial

- **WHEN** la persona usuaria agrega una caja "Desplazar" y la selecciona
- **THEN** el panel muestra byte "2.º (datos 1)", desplazamiento 0 y overflow
  desactivado

#### Scenario: El desplazamiento es solo decimal

- **GIVEN** una caja "Desplazar" con desplazamiento 4
- **WHEN** la persona usuaria escribe "E4" en el desplazamiento y sale del
  campo
- **THEN** la caja sigue con desplazamiento 4, el campo vuelve a mostrar "4",
  y el campo no tiene botón de modo
