# tipos-de-parametro Specification

## Purpose
Fija el contrato para sumar tipos de parámetro nuevos, los que pueden declarar
los tipos de nodo para que la persona usuaria configure una caja. Como con los
tipos de nodo, tiene que ser una tarea chica y autocontenida, que pueda encarar
alguien con nociones básicas de programación: un archivo con el tipo y su
control, más una línea en el catálogo de tipos de parámetro.

## Requirements

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
  ejemplo, la lista de opciones, o el rango de un entero);
- el **control** con que la persona usuaria edita el valor en el panel de
  configuración;
- si lo que se escribe en el control puede no ser un valor de ese tipo, **cómo
  se interpreta**: qué valor resulta de lo escrito, o que no se puede
  interpretar;
- **qué valores le sirven**: para un valor que no le sirve a la declaración
  (por ejemplo, un entero fuera de su rango), el texto del error que se le
  muestra a la persona usuaria.

La etiqueta, su vínculo con el control (para que hacer clic en ella o leerla
con un lector de pantalla lleve al control), el texto del error debajo del
control y la apariencia común de los campos SHALL resolverse fuera del archivo
del tipo: el archivo define solo lo propio de su control. Cuando el control es
un grupo de controles (como en opciones), la etiqueta SHALL ser el
nombre del grupo, el que anuncia un lector de pantalla al entrar en él, y cada
control del grupo SHALL llevar su propio texto.

Lo escrito que no se puede interpretar no SHALL cambiar la configuración de la
caja: la caja conserva su valor anterior y el control vuelve a mostrarlo. Un
valor que se puede interpretar pero no le sirve a la declaración, en cambio,
SHALL guardarse en la caja, y SHALL mostrarse como un error de configuración
(ver la spec `editor-de-workflow`, "Los errores de configuración se ven en el
panel y en el lienzo").

La interpretación de lo escrito y la revisión de qué valores sirven SHALL
poder probarse sin la interfaz, con un test al lado del archivo del tipo.

#### Scenario: Valor no válido

- **GIVEN** una caja tiene un parámetro entero con valor 4
- **WHEN** la persona usuaria escribe "2.5" en su campo, o lo deja vacío, y
  sale del campo
- **THEN** la caja sigue con el valor 4 y el campo vuelve a mostrar 4

#### Scenario: La etiqueta lleva al control

- **WHEN** la persona usuaria hace clic en la etiqueta de un parámetro
- **THEN** el foco va al control de ese parámetro (o, en un sí/no, el control
  cambia de estado)

#### Scenario: La etiqueta nombra al grupo

- **GIVEN** una caja "Filtrar" seleccionada
- **WHEN** una persona que usa lector de pantalla llega con el teclado a la
  primera opción de los canales
- **THEN** el lector anuncia el grupo "Canales" y la opción "1", con su estado
  (elegida o no)

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
- **THEN** es un tipo "real", para números con decimales (como "2,5"), que
  acepta tanto la coma como el punto para separar los decimales y rechaza lo
  que no sea un número

### Requirement: El parámetro entero puede limitar los valores que le sirven

Al declarar un parámetro entero, un tipo de nodo SHALL poder indicar un mínimo,
un máximo, o los dos. Un entero fuera de ese rango SHALL ser un valor que no le
sirve al parámetro, con un error que diga el rango (por ejemplo, "Tiene que ir
de 0 a 127"). Un parámetro entero que no declara rango SHALL aceptar cualquier
entero, positivo, negativo o cero.

#### Scenario: Valor fuera del rango

- **GIVEN** una caja tiene un parámetro entero de 0 a 127 con valor 100
- **WHEN** la persona usuaria escribe 200 en su campo y sale del campo
- **THEN** la caja pasa a tener 200, y el panel muestra debajo del campo que
  tiene que ir de 0 a 127

#### Scenario: Los extremos sirven

- **GIVEN** una caja tiene un parámetro entero de 0 a 127
- **WHEN** la persona usuaria escribe 0, o 127, y sale del campo
- **THEN** la caja pasa a tener ese valor, sin error

#### Scenario: Sin rango, cualquier entero

- **GIVEN** una caja "Desplazar"
- **WHEN** la persona usuaria escribe 300, o -300, en el desplazamiento y sale
  del campo
- **THEN** la caja pasa a tener ese valor, sin error

### Requirement: Los tipos de parámetro disponibles siguen el contrato

Los tipos de parámetro disponibles SHALL ser número entero, sí/no, lista (una
sola opción de una lista cerrada), y dos para elegir varias opciones de una
lista cerrada: opciones y autocompletar. En los de lista, cada opción tiene un valor y un
texto visible. Cada uno SHALL estar definido en su propio archivo, con la misma
forma que cualquier tipo nuevo, sin recibir un trato especial fuera de él.

#### Scenario: Los cinco tipos en su carpeta

- **WHEN** se revisa la carpeta de tipos de parámetro
- **THEN** entero, sí/no, lista, opciones y autocompletar están definidos
  cada uno en su propio archivo y registrados en el catálogo, y el panel de
  configuración no nombra a ninguno

### Requirement: Los parámetros de varias opciones

Un parámetro **opciones** y uno **autocompletar** SHALL declarar los dos una
lista cerrada de opciones, cada una con un valor y un texto visible, y su valor
SHALL ser la lista de los valores elegidos, en el orden de las opciones, sin
importar en qué orden se eligieron. Elegir ninguna SHALL ser un valor válido.

Un valor que tenga algo que no es una de las opciones, o una opción repetida,
SHALL ser un valor que no le sirve al parámetro, con el error "Tiene que tener
solo opciones de la lista, sin repetir".

Los dos tipos se diferencian solo en el control: opciones es para pocas
opciones de texto corto, y autocompletar, para listas largas.

#### Scenario: El orden es el de las opciones

- **GIVEN** una caja "Filtrar" sin canales elegidos
- **WHEN** la persona usuaria elige el 10 y después el 1
- **THEN** la caja queda con los canales 1 y 10, en ese orden

#### Scenario: Ninguna elegida

- **GIVEN** una caja "Filtrar" con solo el canal 1 elegido
- **WHEN** la persona usuaria deja de elegirlo
- **THEN** la caja queda sin canales, sin error, y las dieciséis píldoras
  se ven apagadas

#### Scenario: Un valor que no es de la lista

- **WHEN** se revisa un valor de opciones o de autocompletar que tiene un
  valor que no está entre las opciones, o el mismo valor dos veces
- **THEN** tiene el error "Tiene que tener solo opciones de la lista, sin
  repetir"

### Requirement: El control de opciones

El control de un parámetro **opciones** SHALL mostrar todas las opciones a la
vista, cada una como una píldora con su texto, que se ve encendida si está
elegida. Cada píldora SHALL encenderse o apagarse con un clic, o con el
teclado, sin que cambien las demás. Las píldoras SHALL acomodarse en filas
según el ancho del panel, sin desplazarlo a lo ancho.

#### Scenario: Encender y apagar

- **GIVEN** una caja "Filtrar" con los canales 1 y 10 elegidos
- **WHEN** la persona usuaria enciende el 2 y apaga el 10
- **THEN** la caja queda con los canales 1 y 2

#### Scenario: Las píldoras comparten fila

- **GIVEN** el panel de configuración con su ancho de siempre
- **WHEN** la persona usuaria selecciona una caja "Filtrar"
- **THEN** los dieciséis canales se ven en varias filas de varios canales
  cada una, y el panel no se desplaza a lo ancho

### Requirement: El control de autocompletar

El control de un parámetro **autocompletar** SHALL tener un campo de texto y,
debajo, las opciones elegidas, cada una con un botón para quitarla. Al entrar
al campo, con un clic o con el teclado, SHALL desplegarse la lista de las
opciones que todavía no están elegidas, así se ven sin tener que saber qué
escribir. Mientras se escribe, la lista SHALL mostrar solo las opciones cuyo
texto contiene lo escrito, sin distinguir mayúsculas de minúsculas ni letras
con o sin tilde.

La declaración SHALL poder indicar un **texto de ayuda**, que se muestra debajo
del campo, en lugar de las elegidas, cuando no hay ninguna elegida.

Elegir una opción de la lista, con un clic o con las flechas y Enter, SHALL
sumarla a las elegidas, vaciar el campo y dejar el foco en él. Escape SHALL
cerrar la lista sin elegir nada. Lo escrito que no coincide con ninguna opción
no SHALL cambiar la configuración de la caja: la lista lo dice ("Ninguna
coincide"), y Enter no hace nada.

La lista SHALL desplegarse flotando debajo del campo, por encima de los
parámetros que siguen y sin moverlos de lugar.

#### Scenario: Texto de ayuda

- **GIVEN** una caja "Filtrar" con solo "Nota On" elegido
- **WHEN** la persona usuaria quita "Nota On"
- **THEN** debajo del campo de los tipos de mensaje se ve "Cualquier tipo"

#### Scenario: La lista flota

- **GIVEN** una caja "Filtrar" seleccionada
- **WHEN** la persona usuaria despliega la lista de los tipos de mensaje
- **THEN** la lista se ve por encima de los canales, y los canales no se
  mueven de lugar

#### Scenario: Ver todas las opciones

- **GIVEN** una caja "Filtrar" con "Nota On" elegido
- **WHEN** la persona usuaria hace clic en el campo de los tipos de mensaje
- **THEN** se despliegan las otras quince opciones, en el orden de la lista

#### Scenario: Filtrar mientras se escribe

- **GIVEN** la lista de los tipos de mensaje desplegada
- **WHEN** la persona usuaria escribe "presion"
- **THEN** la lista muestra solo "Presión Polifónica" y "Presión de Canal"

#### Scenario: Elegir con el teclado

- **GIVEN** el foco en el campo de los tipos de mensaje, sin nada escrito
- **WHEN** la persona usuaria escribe "nota", baja con la flecha hasta "Nota
  Off" y aprieta Enter
- **THEN** la caja suma "Nota Off" a sus tipos, el campo queda vacío y con el
  foco, y "Nota Off" aparece entre las elegidas

#### Scenario: Quitar una elegida

- **GIVEN** una caja "Filtrar" con "Nota On" y "Nota Off" elegidos
- **WHEN** la persona usuaria aprieta el botón de quitar de "Nota On"
- **THEN** la caja queda solo con "Nota Off"

#### Scenario: Nada coincide

- **GIVEN** el foco en el campo de los tipos de mensaje
- **WHEN** la persona usuaria escribe "xyz" y aprieta Enter
- **THEN** la lista dice "Ninguna coincide" y los tipos de la caja no
  cambian

#### Scenario: El lector de pantalla sigue la lista

- **GIVEN** una persona que usa lector de pantalla, con el foco en el campo
  de los tipos de mensaje
- **WHEN** baja con la flecha por la lista
- **THEN** el lector anuncia cada opción a la que llega, sin que el foco deje
  el campo
