# Spec Delta

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
  tipo y un valor inicial, más los datos propios de su tipo. Los tipos de
  parámetro disponibles SHALL ser los registrados en el catálogo de tipos de
  parámetro (ver "Un tipo de parámetro es un archivo registrado en su
  catálogo");
- **reglas de validación** propias, que miran los valores de varios
  parámetros juntos. Son opcionales: un tipo que no las declara se valida solo
  con lo que revisa cada parámetro. Cada regla que no se cumple SHALL dar un
  texto de error asociado a uno de los parámetros. Si ese texto nombra
  valores, la regla SHALL marcarlos como valores, y los escribe el campo
  debajo del cual se muestra el error (ver la spec `tipos-de-parametro`, "Los
  mensajes de error nombran valores que escribe el campo"), sin que la regla
  sepa cómo se muestran. Las reglas del tipo SHALL revisarse solo cuando cada
  parámetro, por separado, tiene un valor que le sirve, así no tienen que
  repetir lo que ya revisan los parámetros;
- una única **función de procesamiento**.

Los errores de configuración de una caja SHALL ser los de sus parámetros más
los de las reglas de su tipo, y SHALL poder calcularse sin la interfaz, solo a
partir del tipo y de los valores de la caja: no dependen de cómo se muestra
cada parámetro. El texto de un error SHALL ser el mismo en el panel y en el
log, salvo por cómo se escriben los valores que nombra: en el panel, con el
formato del campo; en el log, como texto común. El lienzo SHALL mostrar solo
si la caja tiene errores. Los valores iniciales de todo tipo de nodo SHALL
estar libres de errores, y eso SHALL revisarlo un test que recorre todos los
tipos.

Un tipo de nodo no SHALL declarar su color: el color sale de la etapa de la caja
en el flujo.

El panel de configuración SHALL armarse solo a partir de la lista de parámetros
declarada: un campo por parámetro, con su etiqueta y el control que define su
tipo de parámetro.

#### Scenario: Campos generados desde la declaración

- **GIVEN** un tipo de nodo declara un parámetro sí/no con etiqueta "Invertir" y
  valor inicial "no"
- **WHEN** la persona usuaria selecciona una caja nueva de ese tipo
- **THEN** el panel muestra un control sí/no con la etiqueta "Invertir",
  desactivado, sin que el archivo del tipo incluya nada de la interfaz

#### Scenario: Un tipo de parámetro nuevo sin tocar el tipo de nodo

- **GIVEN** se registra un tipo de parámetro nuevo en su catálogo
- **WHEN** un tipo de nodo declara un parámetro de ese tipo
- **THEN** el panel muestra el control del tipo nuevo, y el archivo del tipo de
  nodo solo agregó la declaración del parámetro

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

#### Scenario: Regla de validación del tipo

- **GIVEN** un tipo de nodo declara una regla que dice que el parámetro
  "Hasta" tiene que ser mayor que "Desde"
- **WHEN** una caja de ese tipo tiene "Desde" 10 y "Hasta" 5
- **THEN** la caja tiene un error de configuración asociado a "Hasta", con el
  texto que dio la regla, sin que el archivo del tipo incluya nada de la
  interfaz

#### Scenario: Las reglas del tipo no repiten las de los parámetros

- **GIVEN** un parámetro entero de 0 a 127 de una caja tiene el valor 200
- **WHEN** se calculan los errores de configuración de la caja
- **THEN** el error es el del rango del parámetro, y las reglas del tipo no se
  revisan

#### Scenario: La regla del tipo nombra un número como lo muestra el parámetro

- **GIVEN** un tipo de nodo declara una regla que dice que el parámetro
  "Hasta" tiene que ser mayor que 64, con el 64 marcado como valor
- **WHEN** una caja de ese tipo tiene "Hasta" 10, mostrado en hexadecimal
- **THEN** debajo de "Hasta" el error nombra el 64 como "40", y el archivo del
  tipo de nodo no nombra ningún modo

#### Scenario: Los errores no dependen de cómo se muestra la caja

- **GIVEN** dos cajas "Fijar" con byte "Canal" y valor 100, una en modo
  decimal y otra en modo hexadecimal
- **WHEN** se calculan sus errores de configuración
- **THEN** las dos tienen el mismo error, asociado a "Valor", que escrito como
  texto común dice que con Canal tiene que ir de 1 a 16

### Requirement: Los tipos de nodo no dependen del editor

Este requisito no es negociable: ninguna decisión de diseño SHALL
relajarlo. El archivo de un tipo de nodo no SHALL depender de la librería que
dibuja el lienzo, ni de los componentes de la interfaz, ni del estado de la pantalla.
Reemplazar la librería del lienzo no SHALL obligar a cambiar ningún archivo de
tipo de nodo.

#### Scenario: Archivo autocontenido

- **WHEN** se revisa lo que importa el archivo de un tipo de nodo
- **THEN** solo importa la definición del contrato de tipos de nodo, su ícono
  de la librería de íconos, la forma de marcar valores en un mensaje de
  error (que no es parte de la interfaz) y, si hace falta, funciones
  auxiliares propias del procesamiento MIDI que no tengan efectos (por
  ejemplo, una que calcule el canal de un status), nunca la librería del
  lienzo, módulos de la interfaz ni el envío al puerto de salida
