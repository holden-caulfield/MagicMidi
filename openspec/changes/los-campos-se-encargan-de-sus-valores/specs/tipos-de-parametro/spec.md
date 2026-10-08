# Spec Delta

## ADDED Requirements

### Requirement: Un tipo de parámetro es un archivo que arma sus parámetros

Cada tipo de parámetro SHALL estar definido entero en un único archivo, dentro
de una carpeta del código dedicada a los tipos de parámetro, que vive junto a
la de los tipos de nodo. El archivo SHALL exportar, con el nombre del tipo, la
función con que un tipo de nodo declara un parámetro de ese tipo: recibe la
declaración (la clave, la etiqueta, el valor inicial y los datos propios del
tipo) y devuelve el parámetro, que sabe qué valores le sirven y qué campo lo
dibuja. Crear el archivo SHALL alcanzar para que un tipo de nodo pueda declarar
parámetros de ese tipo y el panel de configuración los muestre con su campo,
sin registrar el tipo en ningún lado y sin tocar el panel, los otros tipos de
parámetro ni ningún otro archivo.

Un tipo de nodo que declare un parámetro de un tipo que no existe, o con una
declaración que no corresponde a su tipo (un dato que falta, o un valor
inicial de otra clase), SHALL detectarse al compilar, antes de que la
aplicación arranque.

#### Scenario: Agregar un tipo de parámetro

- **GIVEN** una persona desarrolladora copia el archivo de un tipo de parámetro
  existente en la misma carpeta, con otro nombre, le cambia el nombre de la
  función y el campo que dibuja
- **WHEN** un tipo de nodo declara un parámetro con esa función y la persona
  usuaria selecciona una caja de ese tipo
- **THEN** el panel de configuración muestra el campo nuevo con la etiqueta
  del parámetro, y cambiarlo cambia la configuración de esa caja, sin haber
  modificado otros archivos que ese y el del tipo de nodo

#### Scenario: Tipo de parámetro que no existe

- **GIVEN** un tipo de nodo declara un parámetro con una función de tipo que
  no existe
- **WHEN** corre el chequeo de tipos del proyecto
- **THEN** el chequeo falla y señala el parámetro con el problema

#### Scenario: Valor inicial del tipo equivocado

- **GIVEN** un tipo de nodo declara un parámetro entero con valor inicial "sí"
- **WHEN** corre el chequeo de tipos del proyecto
- **THEN** el chequeo falla y señala el parámetro con el problema

#### Scenario: Falta un dato del tipo

- **GIVEN** un tipo de nodo declara un parámetro lista sin opciones
- **WHEN** corre el chequeo de tipos del proyecto
- **THEN** el chequeo falla y señala el parámetro con el problema

### Requirement: Los mensajes de error nombran valores que escribe el campo

Un texto de error que nombra valores, sea de un tipo de parámetro o de una
regla de un tipo de nodo, SHALL marcarlos como valores en lugar de
escribirlos. Al mostrarse debajo de un campo, el campo SHALL escribir cada
valor con su propio formato: un campo numérico, en su modo actual; lo que el
campo no sabe escribir, como texto común. Todos los valores de un mismo texto
SHALL escribirse con el formato del campo donde se muestra.

Donde no hay campo, como en el log, los valores SHALL escribirse como texto
común: un número, en decimal (ver la spec `ejecucion-de-workflow`, "Una caja
mal configurada falla con cada mensaje"). Un texto sin valores SHALL
mostrarse tal cual en todos lados.

Que el error nombre sus valores así SHALL poder probarse sin la interfaz: el
texto que resulta de escribir sus valores como texto común.

#### Scenario: Los valores en el modo del campo

- **GIVEN** una caja "Fijar" con valor 200, en modo hexadecimal
- **WHEN** la persona usuaria la selecciona
- **THEN** debajo del campo "Valor" se lee "Tiene que ir de 00 a 7F"

#### Scenario: Un texto sin valores

- **GIVEN** una caja "Filtrar" con datos 1 de 72 a 60, en modo nota
- **WHEN** la persona usuaria la selecciona
- **THEN** debajo de "Datos 1" se lee "Desde tiene que ser igual o menor que
  hasta", igual que en modo decimal

#### Scenario: Sin campo, en decimal

- **WHEN** se escribe como texto común el error de un entero de 0 a 127 con
  valor 200
- **THEN** el texto es "Tiene que ir de 0 a 127"

### Requirement: Un campo conserva en la caja lo que necesita para volver a mostrarse

Un campo SHALL poder conservar en la caja, por parámetro, lo que necesita para
volver a mostrarse igual, sin que cambie el valor: por ejemplo, el modo de un
campo numérico. La caja SHALL guardarlo cuando el campo avisa que cambió, y
devolvérselo al campo cada vez que se vuelve a mostrar. Como el valor, SHALL
ser de cada caja y de cada parámetro: se conserva al seleccionar otra caja y
volver, y no pasa de una caja a otra ni de un parámetro a otro. SHALL poder
faltar, y entonces el campo arranca como en una caja nueva; lo conservado que
ya no le sirve al campo (por ejemplo, un modo que el parámetro no ofrece)
SHALL tratarse como si faltara.

Solo el campo SHALL leer lo que conserva. El tipo de parámetro se lo pasa al
campo sin leerlo, el panel de configuración lo guarda y lo devuelve sin
leerlo, y el lienzo, el ejecutor, las reglas de validación y los tipos de nodo
no lo usan: los errores de configuración y el procesamiento de un mensaje no
dependen de él.

#### Scenario: Un campo que no conserva nada

- **WHEN** se revisa un parámetro sí/no, lista, opciones o autocompletar
- **THEN** su campo no conserva nada en la caja, y su control y sus errores son
  los de siempre

#### Scenario: El resto no lo lee

- **WHEN** se revisa lo que hacen con lo que conserva un campo el panel de
  configuración, el lienzo, el ejecutor, la validación y los tipos de nodo
- **THEN** el panel lo guarda y se lo devuelve al campo sin leerlo, y los demás
  no lo usan

#### Scenario: Lo conservado ya no sirve

- **GIVEN** una caja "Desplazar" que conserva para el desplazamiento el modo
  nota, que ese parámetro no ofrece
- **WHEN** la persona usuaria la selecciona
- **THEN** el desplazamiento se muestra en decimal, sin botón de modo

## MODIFIED Requirements

### Requirement: Qué define un tipo de parámetro

El archivo de un tipo de parámetro SHALL definir:

- la **función** con que un tipo de nodo declara un parámetro de ese tipo,
  con el nombre del tipo;
- la **forma de la declaración**: además de la clave, la etiqueta y el valor
  inicial, que tienen todos los parámetros, los datos propios de ese tipo (por
  ejemplo, la lista de opciones, o el rango de un entero);
- **qué campo lo dibuja** en el panel de configuración, y con qué datos de la
  declaración (por ejemplo, las opciones de una lista, o los límites y los
  modos de un entero);
- **qué valores le sirven**: para un valor que no le sirve a la declaración
  (por ejemplo, un entero fuera de su rango), el texto del error que se le
  muestra a la persona usuaria. Si ese texto nombra valores, los marca como
  valores (ver "Los mensajes de error nombran valores que escribe el campo").

Los campos son piezas de la interfaz que no dependen de los tipos de
parámetro: un mismo campo SHALL poder dibujar parámetros de distintos tipos, y
usarse fuera del panel de configuración. Si lo que se escribe en un campo
puede no ser un valor, **cómo se interpreta** lo escrito SHALL ser del campo, y
no del tipo de parámetro: qué valor resulta, o que no se puede interpretar.

La etiqueta, su vínculo con el control (para que hacer clic en ella o leerla
con un lector de pantalla lleve al control), el texto del error debajo del
control y la apariencia común de los campos SHALL resolverse fuera del archivo
del tipo, en el campo. Cuando el control es un grupo de controles (como en
opciones), la etiqueta SHALL ser el nombre del grupo, el que anuncia un lector
de pantalla al entrar en él, y cada control del grupo SHALL llevar su propio
texto.

Lo escrito que no se puede interpretar no SHALL cambiar la configuración de la
caja: la caja conserva su valor anterior y el control vuelve a mostrarlo. Un
valor que se puede interpretar pero no le sirve a la declaración, en cambio,
SHALL guardarse en la caja, y SHALL mostrarse como un error de configuración
(ver la spec `editor-de-workflow`, "Los errores de configuración se ven en el
panel y en el lienzo").

La revisión de qué valores le sirven a un tipo SHALL poder probarse sin la
interfaz, con un test al lado del archivo del tipo. La interpretación de lo
escrito en un campo SHALL poder probarse igual, con un test al lado del campo.

#### Scenario: Valor no válido

- **GIVEN** una caja tiene un parámetro entero con valor 4
- **WHEN** la persona usuaria escribe "2.5" en su campo, o lo deja vacío, y
  sale del campo
- **THEN** la caja sigue con el valor 4 y el campo vuelve a mostrar 4

#### Scenario: El tipo no interpreta lo escrito

- **WHEN** se revisa el archivo del tipo de parámetro entero
- **THEN** declara su forma, dice qué valores le sirven y qué campo lo dibuja
  con qué datos, y no lee texto escrito: lo que recibe del campo ya es un
  número

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

El campo que dibuja un tipo de parámetro SHALL recibir el valor actual y los
datos de la declaración que necesita, y SHALL avisar el valor nuevo cuando la
persona usuaria lo cambia. Ni el tipo ni su campo SHALL modificar por su
cuenta la configuración de la caja ni el estado compartido de la pantalla, ni
depender de la librería que dibuja el lienzo.

#### Scenario: Archivo autocontenido

- **WHEN** se revisa lo que importa el archivo de un tipo de parámetro, o el
  de un campo
- **THEN** no importa la librería del lienzo, ni el estado de la pantalla, ni
  los tipos de nodo

### Requirement: La carpeta de tipos de parámetro explica cómo crear uno

La carpeta de tipos de parámetro SHALL incluir una guía breve, en castellano,
pensada para quien tiene nociones básicas de programación. SHALL explicar qué
archivo crear y qué función exportar, qué definir, cómo elegir el campo que lo
dibuja y qué datos pasarle, cómo declararlo desde un tipo de nodo, cómo decir qué valores no le sirven
(nombrando valores en el error, para que el campo los escriba) y cómo
probarlo. SHALL decir que, si ningún campo sirve, hace falta uno nuevo entre
los componentes de la interfaz, y que ahí va también interpretar lo que se
escribe. SHALL incluir un ejemplo completo de un tipo que no exista en la
aplicación, con su test.

#### Scenario: Guía disponible

- **WHEN** una persona desarrolladora abre la carpeta de tipos de parámetro
- **THEN** encuentra la guía junto a los archivos de los tipos, y siguiéndola
  puede crear un tipo nuevo sin leer el código del panel de configuración

#### Scenario: El ejemplo es un tipo nuevo

- **WHEN** una persona desarrolladora lee el ejemplo completo de la guía
- **THEN** es un tipo "nota", para una nota MIDI de C-1 (0) a G9 (127), que se
  escribe y se muestra solo como nota, sin botón de modo, y cuyo error nombra
  sus extremos como valores, así el panel los muestra como notas

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
  definidos cada uno en su propio archivo, que exporta su función, y el panel
  de configuración no nombra a ninguno

### Requirement: El parámetro entero puede limitar los valores que le sirven

Al declarar un parámetro entero, un tipo de nodo SHALL poder indicar un mínimo,
un máximo, o los dos. Un entero fuera de ese rango SHALL ser un valor que no le
sirve al parámetro, con un error que diga el rango (por ejemplo, "Tiene que ir
de 0 a 127"). En el panel, los números del error SHALL expresarse en el modo
del campo (por ejemplo, "Tiene que ir de 00 a 7F" en hexadecimal, o "Tiene que
ir de C-1 a G9" en nota). Un parámetro entero que no declara rango SHALL
aceptar cualquier entero, positivo, negativo o cero.

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

### Requirement: El parámetro rango

Un parámetro **rango** SHALL declarar un mínimo y un máximo enteros, y si se
puede **invertir**. Su valor SHALL ser un par de enteros, "desde" y "hasta".

Un valor SHALL no servirle al parámetro, con estos errores, revisados en este
orden:

- si "desde" o "hasta" no es un entero: "Tiene que ser un número entero";
- si "desde" o "hasta" queda fuera del mínimo y el máximo: "Tiene que ir de
  <mínimo> a <máximo>" (por ejemplo, "Tiene que ir de 0 a 127"), con el
  mínimo y el máximo expresados, en el panel, en el modo del campo (por
  ejemplo, "Tiene que ir de C-1 a G9" en nota);
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

- **GIVEN** una caja "Filtrar" con datos 1 de 0 a 200, en modo nota
- **WHEN** la persona usuaria la selecciona
- **THEN** debajo de "Datos 1" se lee "Tiene que ir de C-1 a G9"

#### Scenario: Un solo valor

- **WHEN** se revisa el valor de 64 a 64 de un rango de 0 a 127
- **THEN** no tiene error

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

El modo, y si las notas van con bemoles, SHALL ser del campo: lo cambia el
propio campo, y la caja lo conserva (ver "Un campo conserva en la caja lo que
necesita para volver a mostrarse"). Cambia solo cómo se muestra y cómo se lee
el número: el valor de la caja SHALL seguir siendo un número, y procesar un
mensaje SHALL dar el mismo resultado en cualquier modo. Un número que el modo
no puede expresar (un negativo, en nota o en hexadecimal) SHALL mostrarse en
decimal.

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

#### Scenario: Una caja no hereda el modo de otra

- **GIVEN** una caja "Fijar" con "Valor" en modo hexadecimal, y otra caja
  "Fijar" a la que nunca se le cambió el modo
- **WHEN** la persona usuaria selecciona la primera y después la segunda
- **THEN** la segunda muestra "Valor" en modo decimal, con el botón en "DEC"

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

## REMOVED Requirements

### Requirement: Un parámetro puede guardar cómo se muestra

**Reason**: La presentación pasaba por el panel, el catálogo, la validación,
el lienzo y el ejecutor, aunque solo la usaban dos campos, y servía también
para que los tipos de parámetro escribieran números como los mostraban. El
modo pasa a ser del campo, y los valores de los errores los escribe el campo.

**Migration**: Lo que un campo necesita para volver a mostrarse igual lo
conserva la caja, y solo lo lee el campo (ver "Un campo conserva en la caja lo
que necesita para volver a mostrarse"). Para nombrar un número en un error,
se lo marca como valor y lo escribe el campo (ver "Los mensajes de error
nombran valores que escribe el campo"). El flujo vive solo mientras la
aplicación está abierta, así que no hay cajas guardadas que migrar.

### Requirement: Un tipo de parámetro es un archivo registrado en su catálogo

**Reason**: El catálogo existía para unir una declaración escrita como datos
(con un campo `tipo`) con la validación y el dibujo de ese tipo, y pedía
registrar cada tipo nuevo en una unión y una lista. Ahora la declaración la
arma la función de su tipo, y el parámetro trae su `validar` y su `dibujar`.

**Migration**: Un tipo de parámetro exporta su función (ver "Un tipo de
parámetro es un archivo que arma sus parámetros"), y un tipo de nodo declara
sus parámetros con ella, en lugar de escribir un objeto con `tipo`. No hay que
registrarlo en ningún lado.
