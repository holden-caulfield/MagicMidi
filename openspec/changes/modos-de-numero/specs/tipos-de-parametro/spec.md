# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
