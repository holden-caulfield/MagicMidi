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
  texto de error asociado a uno de los parámetros. Las reglas del tipo SHALL
  revisarse solo cuando cada parámetro, por separado, tiene un valor que le
  sirve, así no tienen que repetir lo que ya revisan los parámetros;
- una única **función de procesamiento**.

Los errores de configuración de una caja SHALL ser los de sus parámetros más
los de las reglas de su tipo, y SHALL poder calcularse sin la interfaz, a
partir del tipo y de los valores de la caja. Los valores iniciales de todo tipo
de nodo SHALL estar libres de errores, y eso SHALL revisarlo un test que
recorre todos los tipos.

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

### Requirement: Un tipo de nodo es un archivo registrado en el catálogo

Cada tipo de nodo que ofrece la barra de herramientas SHALL estar definido
entero en un único archivo, dentro de una carpeta del código dedicada a los
tipos de nodo. Además SHALL existir un único catálogo de tipos, escrito a mano,
que lista los tipos disponibles: cada entrada asocia un identificador único a
un archivo de tipo. Crear el archivo y agregar su entrada al catálogo SHALL
alcanzar para que el tipo aparezca en la barra, se pueda usar en el lienzo y se
configure desde el panel, sin tocar ningún otro archivo. Sacar la entrada del
catálogo SHALL sacarlo de la aplicación.

La barra SHALL listar los tipos en el orden en que figuran en el catálogo, para
poder agruparlos con un criterio propio y no alfabético.

Un identificador repetido en el catálogo, o una entrada que no cumpla la forma
de este contrato, SHALL detectarse al compilar, antes de que la aplicación
arranque.

#### Scenario: Agregar un tipo de nodo

- **GIVEN** una persona desarrolladora copia el archivo de un tipo existente en
  la misma carpeta, con otro nombre de archivo, le cambia el nombre visible, el
  ícono, los parámetros y la función, y lo agrega al catálogo después de
  "Desplazar"
- **WHEN** vuelve a abrir la aplicación
- **THEN** la barra ofrece el tipo nuevo justo después de "Desplazar", y se
  puede agregar, conectar y configurar como cualquier otro, sin haber
  modificado otros archivos que ese y el catálogo

#### Scenario: Olvidar el catálogo

- **GIVEN** una persona desarrolladora crea el archivo de un tipo pero no lo
  agrega al catálogo
- **WHEN** abre la aplicación
- **THEN** el tipo no aparece en la barra, y la aplicación funciona igual que
  antes

#### Scenario: Error detectado al compilar

- **GIVEN** una persona desarrolladora registra en el catálogo un tipo sin
  función de procesamiento, o con el mismo identificador que otro
- **WHEN** corre el chequeo de tipos del proyecto
- **THEN** el chequeo falla y señala la entrada del catálogo o el archivo con
  el problema

#### Scenario: Los tipos de esta versión siguen el contrato

- **WHEN** se revisa la carpeta de tipos de nodo
- **THEN** "Filtrar", "Desplazar", "Fijar", "Mapear", "Emitir" y "Descartar"
  están definidos cada uno en su propio archivo con la misma forma, y ninguno
  recibe un trato especial fuera de él

### Requirement: La carpeta de tipos de nodo explica cómo crear uno

La carpeta de tipos de nodo SHALL incluir una guía breve, en castellano,
pensada para quien recién empieza a programar. SHALL explicar qué archivo
crear, cómo registrarlo en el catálogo, qué declarar, cómo elegir un ícono, qué
recibe y qué devuelve la función de procesamiento (incluyendo cómo leer los
bytes, el tipo y el canal del mensaje), cómo declarar reglas de validación
y probarlas, y que un mensaje sale tal cual salvo que llegue a una caja sin
salida o que una caja falle. SHALL incluir un
ejemplo completo de una caja que transforma mensajes, con su test, que no sea
algo que ya se resuelve combinando las cajas existentes.

#### Scenario: Guía disponible

- **WHEN** una persona desarrolladora abre la carpeta de tipos de nodo
- **THEN** encuentra la guía junto a los archivos de los tipos, y siguiéndola
  puede crear un tipo nuevo sin leer el código del editor

#### Scenario: El ejemplo no repite lo que ya hay

- **WHEN** una persona desarrolladora lee el ejemplo completo de la guía
- **THEN** es una caja "Nota Off real", que convierte cada Nota On con
  velocidad 0 en un Nota Off del mismo canal y la misma nota con velocidad 64,
  y deja pasar sin cambios los demás mensajes; no es una caja "Velocidad
  fija", que ya se arma con "Filtrar" y "Fijar", ni una que descarta mensajes,
  que ya se arma con "Filtrar" y "Descartar"
