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

### Requirement: Los tipos de parámetro disponibles incluyen el rango

Los tipos de parámetro disponibles SHALL ser número entero, sí/no, lista (una
sola opción de una lista cerrada), dos para elegir varias opciones de una
lista cerrada (opciones y autocompletar) y rango (dos extremos enteros). En
los de lista, cada opción tiene un valor y un texto visible. Cada uno SHALL
estar definido en su propio archivo, con la misma forma que cualquier tipo
nuevo, sin recibir un trato especial fuera de él.

#### Scenario: Los seis tipos en su carpeta

- **WHEN** se revisa la carpeta de tipos de parámetro
- **THEN** entero, sí/no, lista, opciones, autocompletar y rango están
  definidos cada uno en su propio archivo y registrados en el catálogo, y el
  panel de configuración no nombra a ninguno

### Requirement: El parámetro rango

Un parámetro **rango** SHALL declarar un mínimo y un máximo enteros, y si se
puede **invertir**. Su valor SHALL ser un par de enteros, "desde" y "hasta".

Un valor SHALL no servirle al parámetro, con estos errores, revisados en este
orden:

- si "desde" o "hasta" no es un entero: "Tiene que ser un número entero";
- si "desde" o "hasta" queda fuera del mínimo y el máximo: "Tiene que ir de
  <mínimo> a <máximo>" (por ejemplo, "Tiene que ir de 0 a 127");
- si el rango no se puede invertir y "desde" es mayor que "hasta": "Desde
  tiene que ser igual o menor que hasta".

"Desde" igual a "hasta" SHALL ser un valor válido para el tipo. En un rango
que se puede invertir, "desde" mayor que "hasta" SHALL ser un valor válido:
indica el sentido contrario.

#### Scenario: Rango invertido que se puede invertir

- **WHEN** se revisa el valor de 127 a 0 de un rango de 0 a 127 que se puede
  invertir
- **THEN** no tiene error

#### Scenario: Rango invertido que no se puede invertir

- **WHEN** se revisa el valor de 72 a 60 de un rango de 0 a 127 que no se
  puede invertir
- **THEN** tiene el error "Desde tiene que ser igual o menor que hasta"

#### Scenario: Extremo fuera de rango

- **WHEN** se revisa el valor de 0 a 200 de un rango de 0 a 127
- **THEN** tiene el error "Tiene que ir de 0 a 127"

#### Scenario: Un solo valor

- **WHEN** se revisa el valor de 64 a 64 de un rango de 0 a 127
- **THEN** no tiene error

### Requirement: El control de rango

El control de un parámetro **rango** SHALL ser una barra horizontal con dos
perillas, una para "desde" y otra para "hasta", ubicadas en proporción a su
valor entre el mínimo y el máximo, con un campo numérico a cada lado: el de la
izquierda para "desde" y el de la derecha para "hasta". El tramo de la barra
entre las dos perillas SHALL verse resaltado, con marcas tenues en forma de
punta de flecha que apuntan de "desde" hacia "hasta", así se lee el sentido
del rango. Las dos perillas SHALL distinguirse entre sí.

La persona usuaria SHALL poder cambiar cada extremo:

- arrastrando su perilla;
- haciendo clic en la barra, que mueve la perilla más cercana a ese punto;
- con el foco en una perilla, con las flechas (de a 1) o con Mayúsculas y las
  flechas (de a 10);
- escribiendo en su campo numérico, que interpreta lo escrito como un entero
  (lo que no se puede interpretar no cambia la caja, como en el parámetro
  entero).

Arrastrando o con las flechas, ninguna perilla SHALL pasar del mínimo ni del
máximo. Si el rango no se puede invertir, una perilla SHALL frenarse al llegar
a la otra; si se puede invertir, SHALL poder pasarla, y entonces las marcas
del tramo SHALL apuntar hacia el otro lado. Lo escrito en un campo que se
puede interpretar pero no sirve (fuera de rango, o al revés en un rango que
no se puede invertir) SHALL guardarse y mostrarse como error, como en
cualquier parámetro.

Cada perilla SHALL anunciarse a los lectores de pantalla como un deslizador,
con su nombre ("desde" o "hasta", junto con la etiqueta del parámetro), su
valor, su mínimo y su máximo. La etiqueta del parámetro SHALL nombrar al
grupo. El control SHALL caber en el ancho del panel de configuración sin
desplazarlo a lo ancho.

#### Scenario: Arrastrar una perilla

- **GIVEN** una caja "Filtrar" con datos 1 de 0 a 127
- **WHEN** la persona usuaria arrastra la perilla "desde" de Datos 1 hasta la
  mitad de la barra
- **THEN** la caja queda con datos 1 desde un valor cercano a 64 hasta 127, y
  el campo de la izquierda muestra ese valor

#### Scenario: Las perillas se frenan

- **GIVEN** una caja "Filtrar" con datos 1 de 60 a 72
- **WHEN** la persona usuaria arrastra la perilla "desde" más allá de la
  perilla "hasta"
- **THEN** la perilla "desde" se queda en 72 y la caja queda con datos 1 de
  72 a 72

#### Scenario: Las perillas se cruzan

- **GIVEN** una caja "Mapear" con salida de 0 a 127
- **WHEN** la persona usuaria arrastra la perilla "desde" de Salida hasta el
  extremo derecho y la perilla "hasta" hasta el extremo izquierdo
- **THEN** la caja queda con salida de 127 a 0, y las marcas del tramo
  apuntan hacia la izquierda

#### Scenario: Con el teclado

- **GIVEN** una caja "Mapear" con entrada de 0 a 127 y el foco en la perilla
  "hasta" de Entrada
- **WHEN** la persona usuaria aprieta la flecha izquierda y después
  Mayúsculas y la flecha izquierda
- **THEN** la caja queda con entrada de 0 a 116

#### Scenario: Escribir un extremo

- **GIVEN** una caja "Filtrar" con datos 2 de 0 a 127
- **WHEN** la persona usuaria escribe 100 en el campo de la izquierda de
  Datos 2 y sale del campo
- **THEN** la caja queda con datos 2 de 100 a 127 y la perilla "desde" se
  mueve a ese punto

#### Scenario: Escribir algo que no es un número

- **GIVEN** una caja "Filtrar" con datos 2 de 0 a 127
- **WHEN** la persona usuaria escribe "mucho" en el campo de la derecha y sale
  del campo
- **THEN** la caja sigue con datos 2 de 0 a 127 y el campo vuelve a mostrar
  127

#### Scenario: El lector de pantalla anuncia la perilla

- **GIVEN** una persona que usa lector de pantalla y una caja "Filtrar"
  seleccionada
- **WHEN** llega con Tab a la perilla "desde" de Datos 1
- **THEN** el lector la anuncia como un deslizador "desde" del grupo "Datos
  1", con su valor
