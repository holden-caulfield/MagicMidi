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
de 0 a 127"). Los números del error SHALL expresarse en el modo del parámetro
(por ejemplo, "Tiene que ir de 00 a 7F" en hexadecimal, o "Tiene que ir de C-1
a G9" en nota). Un parámetro entero que no declara rango SHALL aceptar
cualquier entero, positivo, negativo o cero.

#### Scenario: Valor fuera del rango

- **GIVEN** una caja tiene un parámetro entero de 0 a 127 con valor 100
- **WHEN** la persona usuaria escribe 200 en su campo y sale del campo
- **THEN** la caja pasa a tener 200, y el panel muestra debajo del campo que
  tiene que ir de 0 a 127

#### Scenario: El error en el modo del parámetro

- **GIVEN** una caja "Fijar" con valor 200, en modo decimal, con el error
  "Tiene que ir de 0 a 127"
- **WHEN** la persona usuaria activa el botón de modo de "Valor" una vez, y
  después otra
- **THEN** primero el campo muestra "G#15" y el error pasa a ser "Tiene que ir
  de C-1 a G9"; después, el campo muestra "C8" y el error pasa a ser "Tiene
  que ir de 00 a 7F"

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
  <mínimo> a <máximo>" (por ejemplo, "Tiene que ir de 0 a 127"), con el
  mínimo y el máximo expresados en el modo del parámetro (por ejemplo, "Tiene
  que ir de C-1 a G9" en nota);
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

#### Scenario: Extremo fuera de rango en modo nota

- **WHEN** se revisa el valor de 0 a 200 de un rango de 0 a 127 en modo nota
- **THEN** tiene el error "Tiene que ir de C-1 a G9"

#### Scenario: Un solo valor

- **WHEN** se revisa el valor de 64 a 64 de un rango de 0 a 127
- **THEN** no tiene error

### Requirement: El control de rango

El control de un parámetro **rango** SHALL ser una barra horizontal con dos
perillas, una para "desde" y otra para "hasta", ubicadas en proporción a su
valor entre el mínimo y el máximo, con un campo numérico a cada lado: el de la
izquierda para "desde" y el de la derecha para "hasta". Los dos campos SHALL
mostrar su extremo en el modo del parámetro. El tramo de la barra entre las
dos perillas SHALL verse resaltado, con marcas tenues en forma de punta de
flecha que apuntan de "desde" hacia "hasta", así se lee el sentido del rango.
Las dos perillas SHALL distinguirse entre sí.

La persona usuaria SHALL poder cambiar cada extremo:

- arrastrando su perilla;
- haciendo clic en la barra, que mueve la perilla más cercana a ese punto;
- con el foco en una perilla, con las flechas (de a 1) o con Mayúsculas y las
  flechas (de a 10);
- con el foco en su campo numérico, con la flecha arriba y la flecha abajo
  (de a 1) o con Mayúsculas (de a 10), igual que con el foco en su perilla;
- escribiendo en su campo numérico, que lee lo escrito en los modos que
  ofrece el parámetro y puede cambiar el modo de los dos extremos (ver "Lo
  escrito en un parámetro numérico elige el modo"; lo que no se puede leer no
  cambia la caja, como en el parámetro entero).

Arrastrando o con las flechas, ninguna perilla SHALL pasar del mínimo ni del
máximo. Si el rango no se puede invertir, una perilla SHALL frenarse al llegar
a la otra; si se puede invertir, SHALL poder pasarla, y entonces las marcas
del tramo SHALL apuntar hacia el otro lado. Lo escrito en un campo que se
puede interpretar pero no sirve (fuera de rango, o al revés en un rango que
no se puede invertir) SHALL guardarse y mostrarse como error, como en
cualquier parámetro.

Cada perilla SHALL anunciarse a los lectores de pantalla como un deslizador,
con su nombre ("desde" o "hasta", junto con la etiqueta del parámetro), su
valor (expresado en el modo del parámetro), su mínimo y su máximo. La
etiqueta del parámetro SHALL nombrar al grupo. El control, con su botón de
modo, SHALL caber en el ancho del panel de configuración sin desplazarlo a lo
ancho.

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

#### Scenario: Con el teclado en el campo

- **GIVEN** una caja "Filtrar" con datos 1 de 60 a 72 y el foco en el campo
  de la izquierda de Datos 1
- **WHEN** la persona usuaria aprieta la flecha arriba
- **THEN** la caja queda con datos 1 de 61 a 72 y el foco sigue en el campo

#### Scenario: Escribir un extremo

- **GIVEN** una caja "Filtrar" con datos 2 de 0 a 127
- **WHEN** la persona usuaria escribe 100 en el campo de la izquierda de
  Datos 2 y sale del campo
- **THEN** la caja queda con datos 2 de 100 a 127 y la perilla "desde" se
  mueve a ese punto

#### Scenario: Escribir una nota en un extremo

- **GIVEN** una caja "Filtrar" con datos 1 de 0 a 127, en modo decimal
- **WHEN** la persona usuaria escribe "C4" en el campo de la izquierda y sale
  del campo
- **THEN** la caja queda con datos 1 de 60 a 127, el rango pasa a modo nota,
  y los campos muestran "C4" y "G9"

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

### Requirement: Un parámetro puede guardar cómo se muestra

Además de su valor, un parámetro SHALL poder guardar en la caja su
**presentación**: un dato que dice cómo se muestra el valor, sin cambiarlo.
Solo el tipo del parámetro SHALL saber qué contiene. El panel de
configuración, el lienzo, el ejecutor y los tipos de nodo la guardan y la
pasan sin leerla. Como el valor, la presentación SHALL ser de cada caja, se
conserva al seleccionar otra caja y volver, y SHALL poder faltar: entonces el
tipo usa la que corresponde por defecto.

Un tipo de parámetro SHALL recibir la presentación junto con el valor, para
dibujar su control y para armar el texto de sus errores, y SHALL poder
avisar una presentación nueva, como avisa un valor nuevo. Un tipo de
parámetro SHALL poder ofrecer también cómo **escribir un número** como lo
muestra, para que una regla de un tipo de nodo nombre ese número igual que el
parámetro. Un tipo que no lo ofrece SHALL escribirlo en decimal.

#### Scenario: Un tipo que no usa presentación

- **WHEN** se revisa un parámetro sí/no, lista, opciones o autocompletar
- **THEN** su tipo no guarda presentación, y su control y sus errores son los
  de siempre

#### Scenario: El resto no lee la presentación

- **WHEN** se revisa lo que hacen con la presentación el panel de
  configuración, el lienzo, el ejecutor y los tipos de nodo
- **THEN** ninguno la lee ni nombra lo que tiene adentro: solo la guardan y la
  pasan

### Requirement: Los parámetros numéricos se muestran en un modo

Un parámetro **entero** y un parámetro **rango** SHALL mostrar sus números en
uno de estos modos:

- **decimal**: el número tal cual ("60", "-12");
- **nota**: el nombre de la nota en notación científica, con el Do central 60
  como C4, igual que el log ("C4", "C#4", "C-1", "G9"). Las notas negras se
  escriben con sostenidos, salvo que la persona usuaria haya escrito la última
  nota del parámetro con bemol: entonces van con bemoles ("Db4"), hasta que
  escriba una con sostenido. Escribir una nota natural no cambia esa
  elección, y rotar de modo o usar las flechas tampoco. En un rango, los dos
  extremos la comparten. El log sigue nombrando las notas con sostenidos;
- **hexadecimal**: en base 16, en mayúsculas, con al menos dos cifras y sin
  prefijo ("3C", "0A", "7F").

El modo es la presentación del parámetro (ver "Un parámetro puede guardar cómo
se muestra"). Cambia solo cómo se muestra y cómo se lee el número: el valor de
la caja SHALL seguir siendo un número, y procesar un mensaje SHALL dar el
mismo resultado en cualquier modo. Un número que el modo no puede expresar (un
negativo, en nota o en hexadecimal) SHALL mostrarse en decimal.

La declaración del parámetro SHALL poder indicar qué modos ofrece y en qué
orden. Si no lo indica, ofrece decimal, nota y hexadecimal, en ese orden. El
primero de la lista SHALL ser el modo con que arranca una caja nueva, así que
el orden importa: "nota, decimal, hexadecimal" ofrece lo mismo que el orden
por defecto, pero arranca en nota. Un parámetro que ofrece el modo nota SHALL
tener mínimo y máximo dentro de 0 a 127, y uno que ofrece hexadecimal SHALL
tener un mínimo de 0 o más. Que todos los parámetros de todos los tipos de
nodo cumplan esto SHALL revisarlo un test. En un rango, los dos extremos
SHALL compartir el modo.

Si el parámetro ofrece más de un modo, en la fila de su etiqueta SHALL haber
un botón de modo que muestra el modo actual en forma abreviada ("DEC", "♪" o
"HEX"). Activarlo, con un clic o con el teclado, SHALL pasar al siguiente
modo, en el orden en que los ofrece el parámetro, y del último volver al
primero. El botón SHALL anunciarse a los lectores de pantalla con el nombre
del parámetro y el modo actual completo ("decimal", "nota" o "hexadecimal").
Si el parámetro ofrece un solo modo, no SHALL haber botón. El campo de texto
SHALL seguir comportándose como cualquier campo: un clic lo enfoca para
escribir.

Al cambiar de modo, el campo y el error del parámetro, si tiene, SHALL pasar
a mostrarse en el modo nuevo, y el valor de la caja no SHALL cambiar.

#### Scenario: Arranca en el primer modo

- **WHEN** la persona usuaria agrega una caja "Fijar" y la selecciona
- **THEN** el valor se ve en modo decimal ("100"), y el botón muestra "DEC"

#### Scenario: Recorrer los modos

- **GIVEN** una caja "Fijar" con valor 100, en modo decimal
- **WHEN** la persona usuaria activa el botón de modo de "Valor" tres veces
- **THEN** el campo muestra "E7" en modo nota, después "64" en hexadecimal, y
  al final vuelve a "100" en decimal, y la caja sigue con el valor 100

#### Scenario: El orden declarado manda

- **GIVEN** un tipo de nodo declara un parámetro entero de 0 a 127 que ofrece
  nota, decimal y hexadecimal, en ese orden, con valor inicial 60
- **WHEN** la persona usuaria agrega una caja de ese tipo y activa una vez el
  botón de modo
- **THEN** el campo arranca mostrando "C4" en modo nota y pasa a "60" en
  decimal

#### Scenario: Un solo botón para el rango

- **GIVEN** una caja "Filtrar" con datos 1 de 60 a 72, en modo decimal
- **WHEN** la persona usuaria activa el botón de modo de "Datos 1"
- **THEN** el campo de la izquierda muestra "C4" y el de la derecha "C5"

#### Scenario: El modo queda con la caja

- **GIVEN** una caja "Fijar" con "Valor" en modo nota, y otra caja "Fijar"
  en modo decimal
- **WHEN** la persona usuaria selecciona la segunda caja y después vuelve a
  la primera
- **THEN** la segunda se muestra en decimal y la primera, otra vez en nota

#### Scenario: Sin botón con un solo modo

- **WHEN** la persona usuaria selecciona una caja "Desplazar"
- **THEN** el campo "Desplazamiento" no tiene botón de modo

#### Scenario: El procesamiento no depende del modo

- **GIVEN** dos cajas "Fijar" con valor 100, una en modo decimal y otra en
  modo nota
- **WHEN** a cada una le llega el mismo Nota On
- **THEN** las dos devuelven el mismo mensaje, con 100 en el byte elegido

#### Scenario: Declaración que no cumple

- **GIVEN** un tipo de nodo declara un parámetro entero sin mínimo que ofrece
  el modo nota
- **WHEN** corren los tests del proyecto
- **THEN** el test de los tipos de nodo falla y señala ese parámetro

### Requirement: Lo escrito en un parámetro numérico elige el modo

Cada modo SHALL leer lo escrito en su formato:

- **decimal**: un entero ("60", "-12");
- **nota**: una letra de la A a la G, sin distinguir mayúsculas, quizás un
  sostenido (`#`) o un bemol (`b`), y la octava, de -1 en adelante ("C4",
  "c#4", "Db4", "C-1");
- **hexadecimal**: cifras de 0 a 9 y letras de la A a la F, sin distinguir
  mayúsculas, con o sin el prefijo `0x` ("3c", "0x3C").

Lo escrito en el campo de un parámetro numérico SHALL leerse probando los
modos que ofrece el parámetro en el orden en que rotan, empezando por el modo
actual: primero el actual, después el siguiente, y así hasta volver al
actual. Vale el primero que lo puede leer. Si ese no es el modo actual, el
parámetro SHALL pasar a ese modo, así el campo muestra el número en el mismo
formato en que se escribió. Un parámetro que ofrece un solo modo SHALL leer
solo ese formato.

Lo que no se puede leer en ninguno de los modos que se ofrecen SHALL tratarse
como cualquier valor que no se puede interpretar: la caja conserva su valor y
su modo, y el campo vuelve a mostrar el valor. Un número que se puede leer
pero no le sirve al parámetro SHALL guardarse, con el modo en que se leyó, y
mostrarse con su error, como siempre.

#### Scenario: Una nota en modo decimal

- **GIVEN** una caja "Fijar" con valor 100, en modo decimal
- **WHEN** la persona usuaria escribe "C4" en el valor y sale del campo
- **THEN** la caja pasa a tener 60, el parámetro pasa a modo nota, y el campo
  muestra "C4"

#### Scenario: Hexadecimal en modo decimal

- **GIVEN** una caja "Fijar" con valor 100, en modo decimal
- **WHEN** la persona usuaria escribe "3C" en el valor y sale del campo
- **THEN** la caja pasa a tener 60, el parámetro pasa a modo hexadecimal, y el
  campo muestra "3C"

#### Scenario: Cifras en modo nota

- **GIVEN** una caja "Fijar" con valor 100, en modo nota, con los modos en el
  orden por defecto
- **WHEN** la persona usuaria escribe "60" en el valor y sale del campo
- **THEN** "60" no es una nota y el modo que sigue a nota es hexadecimal, así
  que la caja pasa a tener 96, el parámetro pasa a modo hexadecimal, y el
  campo muestra "60"

#### Scenario: El modo actual gana

- **GIVEN** una caja "Fijar" en modo hexadecimal
- **WHEN** la persona usuaria escribe "C4" en el valor y sale del campo
- **THEN** la caja pasa a tener 196 (C4 en hexadecimal), sigue en modo
  hexadecimal, el campo muestra "C4" y el panel muestra el error del rango

#### Scenario: Una nota que no es hexadecimal, en modo hexadecimal

- **GIVEN** una caja "Fijar" en modo hexadecimal
- **WHEN** la persona usuaria escribe "C#4" en el valor y sale del campo
- **THEN** la caja pasa a tener 61, el parámetro pasa a modo nota, y el campo
  muestra "C#4"

#### Scenario: Una nota escrita con bemol se muestra con bemol

- **GIVEN** una caja "Fijar" en modo nota
- **WHEN** la persona usuaria escribe "Db4" en el valor y sale del campo
- **THEN** la caja pasa a tener 61, sigue en modo nota, y el campo muestra
  "Db4"

#### Scenario: Los bemoles siguen hasta que se escribe un sostenido

- **GIVEN** una caja "Fijar" en modo nota, con el valor escrito como "Db4"
- **WHEN** la persona usuaria hace clic dos veces en la flecha de subir,
  escribe "C4", activa el botón de modo tres veces, y después escribe "F#4"
- **THEN** el campo muestra "D4", después "Eb4", después "C4", vuelve a modo
  nota mostrando "C4", y al final muestra "F#4"; con la flecha de subir pasa
  a "G4" y después a "G#4"

#### Scenario: El log no cambia

- **GIVEN** una caja "Fijar" en modo nota con el valor escrito como "Db4"
- **WHEN** pasa por ella un Nota On
- **THEN** el log describe la salida con la nota "C#4"

#### Scenario: Nada se puede leer

- **GIVEN** una caja "Fijar" con valor 100, en modo nota
- **WHEN** la persona usuaria escribe "mucho" en el valor y sale del campo
- **THEN** la caja sigue con el valor 100, en modo nota, y el campo vuelve a
  mostrar "E7"

#### Scenario: Un solo modo

- **GIVEN** una caja "Desplazar" con desplazamiento 0
- **WHEN** la persona usuaria escribe "C4", o "0x0C", en el desplazamiento y
  sale del campo
- **THEN** la caja sigue con desplazamiento 0, y el campo vuelve a mostrar
  "0"

### Requirement: Las flechas del campo numérico

El campo de un parámetro entero SHALL tener dos flechas propias, una para
subir y otra para bajar, con la misma apariencia que el resto de los
controles. Cada clic en una flecha SHALL sumarle o restarle 1 al valor, y con
Mayúsculas, 10. El resultado no SHALL pasar del mínimo ni del máximo del
parámetro, si los tiene, y la flecha que no puede avanzar más SHALL verse
deshabilitada. Las flechas no SHALL recorrerse con Tab: con el teclado, se usa
el campo.

Con el foco en el campo, la flecha arriba y la flecha abajo del teclado SHALL
hacer lo mismo que las flechas del campo, también con Mayúsculas. Si hay algo
escrito sin confirmar, primero SHALL leerse como al salir del campo, y el paso
se aplica sobre ese valor.

En los campos de un rango, más chicos, no SHALL haber flechas propias, pero
las flechas del teclado SHALL mover su extremo como lo mueven con el foco en
la perilla (ver "El control de rango").

#### Scenario: Subir con la flecha

- **GIVEN** una caja "Fijar" con valor 100
- **WHEN** la persona usuaria hace clic en la flecha de subir del valor
- **THEN** la caja pasa a tener 101

#### Scenario: Con el teclado y de a diez

- **GIVEN** una caja "Fijar" con valor 100 y el foco en su campo
- **WHEN** la persona usuaria aprieta Mayúsculas y la flecha abajo
- **THEN** la caja pasa a tener 90 y el foco sigue en el campo

#### Scenario: Tope en el máximo

- **GIVEN** una caja "Fijar" con valor 120
- **WHEN** la persona usuaria hace clic con Mayúsculas en la flecha de subir
- **THEN** la caja pasa a tener 127, y la flecha de subir se ve deshabilitada

#### Scenario: Pasos en modo nota

- **GIVEN** una caja "Fijar" con valor 60, en modo nota
- **WHEN** la persona usuaria hace clic en la flecha de subir
- **THEN** el campo muestra "C#4"

#### Scenario: Sin límites

- **GIVEN** una caja "Desplazar" con desplazamiento 0
- **WHEN** la persona usuaria hace clic en la flecha de bajar
- **THEN** la caja pasa a tener desplazamiento -1
