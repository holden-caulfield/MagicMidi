# Spec Delta

## Purpose

Fija el contrato para sumar tipos de parámetro nuevos, los que pueden declarar
los tipos de nodo para que la persona usuaria configure una caja. Como con los
tipos de nodo, tiene que ser una tarea chica y autocontenida, que pueda encarar
alguien con nociones básicas de programación: un archivo con el tipo y su
control, más una línea en el catálogo de tipos de parámetro.

## ADDED Requirements

### Requirement: Un tipo de parámetro es un archivo registrado en su catálogo

Cada tipo de parámetro SHALL estar definido entero en un único archivo, dentro
de una carpeta del código dedicada a los tipos de parámetro, que vive junto a
la de los tipos de nodo. Además SHALL existir un único catálogo de tipos de
parámetro, escrito a mano, que asocia cada identificador de tipo a su archivo.
Crear el archivo y agregar su entrada al catálogo SHALL alcanzar para que un
tipo de nodo pueda declarar parámetros de ese tipo y el panel de configuración
los muestre con su control, sin tocar el panel, los otros tipos de parámetro
ni ningún otro archivo.

Un tipo de nodo que declare un parámetro de un tipo que no está en el catálogo,
o con un valor inicial que no corresponde a ese tipo, SHALL detectarse al
compilar, antes de que la aplicación arranque.

#### Scenario: Agregar un tipo de parámetro

- **GIVEN** una persona desarrolladora copia el archivo de un tipo de parámetro
  existente en la misma carpeta, con otro nombre, le cambia el identificador y
  el control, y lo agrega al catálogo
- **WHEN** un tipo de nodo declara un parámetro con ese identificador y la
  persona usuaria selecciona una caja de ese tipo
- **THEN** el panel de configuración muestra el control nuevo con la etiqueta
  del parámetro, y cambiarlo cambia la configuración de esa caja, sin haber
  modificado otros archivos que ese, el catálogo y el del tipo de nodo

#### Scenario: Tipo de parámetro no registrado

- **GIVEN** un tipo de nodo declara un parámetro de un tipo que no figura en el
  catálogo de tipos de parámetro
- **WHEN** corre el chequeo de tipos del proyecto
- **THEN** el chequeo falla y señala el parámetro con el problema

#### Scenario: Valor inicial del tipo equivocado

- **GIVEN** un tipo de nodo declara un parámetro de tipo entero con valor
  inicial "sí"
- **WHEN** corre el chequeo de tipos del proyecto
- **THEN** el chequeo falla y señala el parámetro con el problema

### Requirement: Qué define un tipo de parámetro

El archivo de un tipo de parámetro SHALL definir:

- su **identificador**, el que escribe un tipo de nodo para declarar un
  parámetro de ese tipo;
- la **forma de la declaración**: además de la clave, la etiqueta y el valor
  inicial, que tienen todos los parámetros, los datos propios de ese tipo (por
  ejemplo, la lista de opciones);
- el **control** con que la persona usuaria edita el valor en el panel de
  configuración;
- si lo que se escribe en el control puede no ser un valor válido, **cómo se
  interpreta**: qué valor resulta de lo escrito, o que no es válido.

La etiqueta, su vínculo con el control (para que hacer clic en ella o leerla
con un lector de pantalla lleve al control) y la apariencia común de los campos
SHALL resolverse fuera del archivo del tipo: el archivo define solo lo propio
de su control.

Un valor no válido no SHALL cambiar la configuración de la caja: la caja
conserva su valor anterior y el control vuelve a mostrarlo.

La interpretación de lo escrito SHALL poder probarse sin la interfaz, con un
test al lado del archivo del tipo.

#### Scenario: Valor no válido

- **GIVEN** una caja tiene un parámetro entero con valor 4
- **WHEN** la persona usuaria escribe "2.5" en su campo, o lo deja vacío, y
  sale del campo
- **THEN** la caja sigue con el valor 4 y el campo vuelve a mostrar 4

#### Scenario: La etiqueta lleva al control

- **WHEN** la persona usuaria hace clic en la etiqueta de un parámetro
- **THEN** el foco va al control de ese parámetro (o, en un sí/no, el control
  cambia de estado)

### Requirement: Los tipos de parámetro de esta versión siguen el contrato

Los tipos de parámetro disponibles SHALL ser número entero, sí/no, y una opción
de una lista cerrada, cuyas opciones tienen cada una un valor y un texto
visible. Cada uno SHALL estar definido en su propio archivo, con la misma forma
que cualquier tipo nuevo, sin recibir un trato especial fuera de él.

#### Scenario: Los tres tipos en su carpeta

- **WHEN** se revisa la carpeta de tipos de parámetro
- **THEN** entero, sí/no y opciones están definidos cada uno en su propio
  archivo y registrados en el catálogo, y el panel de configuración no nombra
  a ninguno

### Requirement: Los tipos de parámetro no modifican la caja por su cuenta

El control de un tipo de parámetro SHALL recibir el parámetro declarado y el
valor actual, y SHALL avisar el valor nuevo cuando la persona usuaria lo
cambia. No SHALL modificar por su cuenta la configuración de la caja ni el
estado de la pantalla, ni depender de la librería que dibuja el lienzo.

#### Scenario: Archivo autocontenido

- **WHEN** se revisa lo que importa el archivo de un tipo de parámetro
- **THEN** no importa la librería del lienzo, ni el estado de la pantalla, ni
  los tipos de nodo

### Requirement: La carpeta de tipos de parámetro explica cómo crear uno

La carpeta de tipos de parámetro SHALL incluir una guía breve, en castellano,
pensada para quien tiene nociones básicas de programación. SHALL explicar qué
archivo crear, cómo registrarlo en el catálogo, qué definir, cómo avisar el
valor nuevo, cómo rechazar un valor no válido y cómo probar esa
interpretación. SHALL incluir un ejemplo completo de un tipo que no exista en
la aplicación, con su test.

#### Scenario: Guía disponible

- **WHEN** una persona desarrolladora abre la carpeta de tipos de parámetro
- **THEN** encuentra la guía junto a los archivos de los tipos, y siguiéndola
  puede crear un tipo nuevo sin leer el código del panel de configuración

#### Scenario: El ejemplo es un tipo nuevo

- **WHEN** una persona desarrolladora lee el ejemplo completo de la guía
- **THEN** es un tipo "nota", donde se escribe el nombre de una nota (como
  "C4") y el valor que guarda la caja es su número MIDI (60), que rechaza lo
  que no sea un nombre de nota válido
