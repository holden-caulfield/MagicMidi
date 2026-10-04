# Spec Delta

## MODIFIED Requirements

### Requirement: Parámetros del nodo Mapear

Una caja **Mapear** SHALL tener entrada y salida, y tres parámetros:

- **Byte**: qué byte de datos mapea. Las opciones son "2.º (datos 1)" y "3.º
  (datos 2)". El status no se ofrece.
- **Entrada**: el rango de entrada, de 0 a 127, que se puede invertir.
- **Salida**: el rango de salida, de 0 a 127, que se puede invertir.

Un extremo fuera de 0 a 127 SHALL ser un error de configuración de la caja,
asociado al rango de ese extremo (el error del tipo de parámetro rango, ver la
spec `tipos-de-parametro`). Una entrada con "desde" igual a "hasta" SHALL ser
un error de configuración asociado a "Entrada", con el texto "Desde tiene que
ser distinto de hasta": con un solo valor de entrada no hay forma de repartir
los valores (ver la spec `editor-de-workflow`, "Los errores de configuración
se ven en el panel y en el lienzo"). En la salida, un solo valor sí sirve:
lleva todo a ese valor.

Una caja nueva SHALL arrancar con byte "3.º (datos 2)", entrada de 0 a 127 y
salida de 0 a 127, sin errores. Con esos valores deja pasar los mensajes sin
cambios.

#### Scenario: Configuración inicial

- **WHEN** la persona usuaria agrega una caja "Mapear" y la selecciona
- **THEN** el panel muestra byte "3.º (datos 2)", y los rangos "Entrada" y
  "Salida", los dos de 0 a 127, sin errores

#### Scenario: Rango de entrada de un solo valor

- **GIVEN** una caja "Mapear" con entrada de 0 a 127
- **WHEN** la persona usuaria escribe 0 en el campo de la derecha de
  "Entrada" y sale del campo
- **THEN** el panel muestra debajo de "Entrada" que desde tiene que ser
  distinto de hasta, y la caja se ve con borde rojo

#### Scenario: Extremo fuera de rango

- **WHEN** la persona usuaria escribe 200 en el campo de la derecha de
  "Salida" y sale del campo
- **THEN** el panel muestra debajo de "Salida" que tiene que ir de 0 a 127, y
  la caja se ve con borde rojo

#### Scenario: Invertir con las perillas

- **GIVEN** una caja "Mapear" con salida de 0 a 127
- **WHEN** la persona usuaria cruza las perillas de "Salida" hasta dejarla de
  127 a 0
- **THEN** la caja no tiene errores y las marcas del tramo de "Salida" apuntan
  hacia la izquierda

### Requirement: Mapea linealmente el byte elegido

La caja SHALL producir un mensaje igual al recibido, salvo por el byte elegido,
que pasa a valer el punto del rango de salida que corresponde, en la misma
proporción, al valor original dentro del rango de entrada: el "desde" de la
entrada va al "desde" de la salida, el "hasta" de la entrada al "hasta" de la
salida, y los valores intermedios se reparten parejo entre los dos,
redondeados al entero más cercano. Los demás bytes, y la cantidad de bytes,
SHALL quedar igual. Como los extremos de salida van de 0 a 127, el leading bit
del byte de datos SHALL seguir en 0.

El "desde" de un rango SHALL poder ser mayor que su "hasta": un rango de salida
de 127 a 0 invierte el sentido.

#### Scenario: Comprimir la velocidad

- **GIVEN** byte "3.º (datos 2)", entrada de 0 a 127, salida de 40 a 110
- **WHEN** recibe `90 3C 7F`, `90 3C 64` y `90 3C 01` (velocidades 127, 100 y 1)
- **THEN** emite `90 3C 6E`, `90 3C 5F` y `90 3C 29` (velocidades 110, 95 y 41)

#### Scenario: Invertir un pedal de expresión

- **GIVEN** byte "3.º (datos 2)", entrada de 0 a 127, salida de 127 a 0
- **WHEN** recibe `B0 0B 00`, `B0 0B 7F` y `B0 0B 64` (expresión en 0, 127 y
  100)
- **THEN** emite `B0 0B 7F`, `B0 0B 00` y `B0 0B 1B` (127, 0 y 27)

#### Scenario: Limitar la rueda de modulación

- **GIVEN** byte "3.º (datos 2)", entrada de 0 a 127, salida de 0 a 64
- **WHEN** recibe `B0 01 7F` y `B0 01 40` (modulación en 127 y 64)
- **THEN** emite `B0 01 40` y `B0 01 20` (64 y 32)

#### Scenario: Comprimir la velocidad solo en las notas

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Mapear" (datos 2, entrada
  de 0 a 127, salida de 40 a 110) → "Emitir"
- **WHEN** llega `90 3C 00` (un Nota Off)
- **THEN** sale `90 3C 00` tal como llegó, y no un Nota On con velocidad 40
