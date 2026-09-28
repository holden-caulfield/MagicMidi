## MODIFIED Requirements

### Requirement: Qué declara un tipo de nodo

El archivo de un tipo de nodo SHALL declarar:

- el **nombre**, que se ve en el globo de ayuda de la caja (en la barra y en
  el lienzo) y como título en el panel de configuración;
- el **ícono**, tomado de la librería de íconos de la aplicación. Es lo único
  que se ve dentro de la caja;
- si la caja **no tiene salida**. Es opcional: si no se declara, la caja tiene
  salida. Todas tienen entrada; las que no tienen salida cierran el flujo, y
  por eso se ven con el color de las cajas de fin, sin declarar nada más;
- la lista de **parámetros**, cada uno con una clave, una etiqueta visible, un
  tipo y un valor inicial. Los tipos de parámetro disponibles SHALL ser: número
  entero, sí/no, y una opción de una lista cerrada, cuyas opciones tienen cada
  una un valor y un texto visible;
- una única **función de procesamiento**.

Un tipo de nodo no SHALL declarar su color: el color sale del papel de la caja
en el flujo.

El panel de configuración SHALL armarse solo a partir de la lista de parámetros
declarada: un campo por parámetro, con su etiqueta y el control que corresponde
a su tipo.

#### Scenario: Campos generados desde la declaración

- **GIVEN** un tipo de nodo declara un parámetro sí/no con etiqueta "Invertir" y
  valor inicial "no"
- **WHEN** la persona usuaria selecciona una caja nueva de ese tipo
- **THEN** el panel muestra un control sí/no con la etiqueta "Invertir",
  desactivado, sin que el archivo del tipo incluya nada de la interfaz

#### Scenario: Tipo sin salida

- **GIVEN** un tipo de nodo declara que no tiene salida
- **WHEN** se agrega una caja de ese tipo al lienzo
- **THEN** la caja tiene conector de entrada, ningún conector de salida, y se
  ve con el color de las cajas de fin

#### Scenario: Salida por defecto

- **GIVEN** un tipo de nodo no dice nada sobre su salida
- **WHEN** se agrega una caja de ese tipo al lienzo
- **THEN** la caja tiene conector de entrada y conector de salida, y se ve con
  el color neutro de las cajas intermedias
