# Spec Delta

## REMOVED Requirements

### Requirement: Los tipos de parámetro disponibles incluyen el rango

**Reason**: La lista de tipos disponibles suma la secuencia, y el nombre del
requisito y su escenario ("Los seis tipos en su carpeta") nombraban la
versión anterior. Lo reemplaza "Los tipos de parámetro disponibles".

**Migration**: Ninguna: los seis tipos siguen igual, y el requisito nuevo los
lista junto con la secuencia.

## MODIFIED Requirements

### Requirement: Los parámetros numéricos se muestran en un modo

Un parámetro **entero**, un parámetro **rango** y un parámetro **secuencia**
SHALL mostrar sus números en uno de estos modos:

- **decimal**: el número tal cual ("60", "-12");
- **nota**: el nombre de la nota en notación científica, con el Do central 60
  como C4, igual que el log ("C4", "C#4", "C-1", "G9"). Las notas negras se
  escriben con sostenidos, salvo que la persona usuaria haya escrito la última
  nota del parámetro con bemol: entonces van con bemoles ("Db4"), hasta que
  escriba una con sostenido. Escribir una nota natural no cambia esa
  elección, y rotar de modo o usar las flechas tampoco. En un rango, los dos
  extremos la comparten, y en una secuencia, todos sus valores. El log sigue
  nombrando las notas con sostenidos;
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
SHALL compartir el modo, y en una secuencia, todos sus valores: el modo es del
campo, no de cada número.

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

#### Scenario: Un solo botón para la secuencia

- **GIVEN** una caja "Alternar" con byte "2.º (datos 1)" y valores 60, 64 y
  67, en modo decimal
- **WHEN** la persona usuaria activa el botón de modo de "Valores"
- **THEN** los tres campos muestran "C4", "E4" y "G4"

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

En los campos de una secuencia tampoco SHALL haber flechas propias, porque
cada valor ya tiene sus botones (ver "El control de secuencia"), pero las
flechas del teclado SHALL sumarle o restarle a ese valor como en el campo de
un entero, sin pasar del mínimo ni del máximo del parámetro.

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

#### Scenario: Con el teclado en una secuencia

- **GIVEN** una caja "Alternar" con valores 127 y 0, y el foco en el campo
  del segundo valor
- **WHEN** la persona usuaria aprieta Mayúsculas y la flecha arriba, y
  después pasa al campo del primer valor y aprieta la flecha arriba
- **THEN** la caja queda con valores 127 y 10, y el foco sigue en el campo
  del primer valor

## ADDED Requirements

### Requirement: Los tipos de parámetro disponibles

Los tipos de parámetro disponibles SHALL ser número entero, sí/no, lista (una
sola opción de una lista cerrada), dos para elegir varias opciones de una
lista cerrada (opciones y autocompletar), rango (dos extremos enteros) y
secuencia (una lista de enteros en orden). En los de lista, cada opción tiene
un valor y un texto visible. Cada uno SHALL estar definido en su propio
archivo, con la misma forma que cualquier tipo nuevo, sin recibir un trato
especial fuera de él.

#### Scenario: Los siete tipos en su carpeta

- **WHEN** se revisa la carpeta de tipos de parámetro
- **THEN** entero, sí/no, lista, opciones, autocompletar, rango y secuencia
  están definidos cada uno en su propio archivo, que exporta su función, y el
  panel de configuración no nombra a ninguno

### Requirement: El parámetro secuencia

Un parámetro **secuencia** SHALL declarar un mínimo y un máximo enteros, y
puede declarar los modos que ofrece, como un entero. Su valor SHALL ser una
lista de números enteros, en orden, que se pueden repetir.

Un valor SHALL no servirle al parámetro, con estos errores, revisados en este
orden:

- si no es una lista, o alguno de sus valores no es un entero: "Tiene que ser
  una lista de números enteros";
- si la lista está vacía: "Tiene que tener al menos un valor";
- si algún valor queda fuera del mínimo y el máximo: "Los valores tienen que
  ir de <mínimo> a <máximo>, y hay un <valor>", con el primero que queda
  afuera (por ejemplo, "Los valores tienen que ir de 0 a 127, y hay un 200").
  Los tres números van marcados como valores, así el panel los escribe en el
  modo del campo.

#### Scenario: Valores repetidos

- **WHEN** se revisa el valor 127, 80, 80, 80 de una secuencia de 0 a 127
- **THEN** no tiene error

#### Scenario: Lista vacía

- **WHEN** se revisa una lista vacía en una secuencia de 0 a 127
- **THEN** tiene el error "Tiene que tener al menos un valor"

#### Scenario: Un valor fuera de rango

- **WHEN** se revisa el valor 60, 200, 300 de una secuencia de 0 a 127
- **THEN** tiene el error "Los valores tienen que ir de 0 a 127, y hay un
  200"

#### Scenario: Fuera de rango en hexadecimal

- **GIVEN** una caja "Alternar" con valores 60 y 200, en modo hexadecimal
- **WHEN** la persona usuaria la selecciona
- **THEN** debajo de "Valores" se lee "Los valores tienen que ir de 00 a 7F,
  y hay un C8"

### Requirement: El control de secuencia

El control de un parámetro **secuencia** SHALL mostrar un valor por fila, en
el orden de la lista, cada uno en un campo de texto que lo muestra en el modo
del parámetro. Cada fila SHALL tener además un botón para subir el valor
(pasarlo antes del anterior), uno para bajarlo (pasarlo después del
siguiente) y uno para quitarlo. El de subir SHALL verse deshabilitado en el
primer valor, y el de bajar, en el último. Después de la última fila SHALL
haber un botón para agregar un valor al final: agrega una copia del último
valor, o el mínimo del parámetro si la lista está vacía.

Cada valor SHALL poder cambiarse escribiendo en su campo: lo escrito se lee
como en el parámetro entero, al salir del campo, en los modos que ofrece el
parámetro, y si se lee en otro modo, toda la secuencia pasa a ese modo (ver
"Lo escrito en un parámetro numérico elige el modo"). Lo que no se puede leer
no SHALL cambiar la caja, y el campo vuelve a mostrar su valor. Las flechas
del teclado también cambian el valor (ver "Las flechas del campo numérico").

Todo SHALL poder hacerse con el teclado: los campos y los botones se recorren
con Tab, fila por fila, y después el botón de agregar. Después de subir o
bajar un valor, el foco SHALL seguir al valor movido: queda en el mismo
botón, en su fila nueva, o, si ese botón quedó deshabilitado, en el otro
botón de mover de esa fila. Así, apretando varias veces, el mismo valor sigue
moviéndose. Después de quitar un valor, el foco SHALL ir al botón de quitar
del valor que quedó en su lugar, o al del anterior si era el último, o al
botón de agregar si no queda ninguno. Después de agregar, el foco SHALL ir al
campo del valor nuevo.

La etiqueta del parámetro SHALL nombrar al grupo. Cada campo SHALL anunciarse
a los lectores de pantalla con su posición ("Valor 2"), y cada botón, con su
acción y la posición del valor ("Subir el valor 2", "Bajar el valor 2",
"Quitar el valor 2" y "Agregar un valor"). El control, con su botón de modo,
SHALL caber en el ancho del panel de configuración sin desplazarlo a lo
ancho; con muchos valores crece hacia abajo, y se recorre desplazando el
panel.

#### Scenario: Escribir un valor

- **GIVEN** una caja "Alternar" con valores 127 y 0
- **WHEN** la persona usuaria escribe 64 en el campo del segundo valor y sale
  del campo
- **THEN** la caja queda con valores 127 y 64

#### Scenario: Escribir una nota

- **GIVEN** una caja "Alternar" con valores 127 y 0, en modo decimal
- **WHEN** la persona usuaria escribe "C4" en el campo del primer valor y sale
  del campo
- **THEN** la caja queda con valores 60 y 0, la secuencia pasa a modo nota, y
  los campos muestran "C4" y "C-1"

#### Scenario: Escribir algo que no es un número

- **GIVEN** una caja "Alternar" con valores 127 y 0
- **WHEN** la persona usuaria escribe "mucho" en el campo del primer valor y
  sale del campo
- **THEN** la caja sigue con valores 127 y 0, y el campo vuelve a mostrar 127

#### Scenario: Agregar un valor

- **GIVEN** una caja "Alternar" con valores 127 y 80
- **WHEN** la persona usuaria activa "Agregar un valor"
- **THEN** la caja queda con valores 127, 80 y 80, y el foco está en el campo
  del tercer valor

#### Scenario: Quitar un valor

- **GIVEN** una caja "Alternar" con valores 127, 80 y 64
- **WHEN** la persona usuaria activa "Quitar el valor 2"
- **THEN** la caja queda con valores 127 y 64, y el foco está en "Quitar el
  valor 2", que ahora es el del 64

#### Scenario: Subir un valor con el teclado

- **GIVEN** una caja "Alternar" con byte "Canal", valores 1, 2 y 3, y el foco
  en "Subir el valor 3"
- **WHEN** la persona usuaria lo activa dos veces con el teclado
- **THEN** la caja queda con valores 1, 3 y 2, con el foco en "Subir el valor
  2", y después con valores 3, 1 y 2, con el foco en "Bajar el valor 1",
  porque el de subir del primero está deshabilitado

#### Scenario: Quitar todos los valores

- **GIVEN** una caja "Alternar" con el valor 127 solo
- **WHEN** la persona usuaria activa "Quitar el valor 1", y después "Agregar
  un valor"
- **THEN** primero la caja queda sin valores, el panel muestra "Tiene que
  tener al menos un valor", la caja se ve con borde rojo y el foco está en
  "Agregar un valor"; después la caja queda con el valor 0, sin error

#### Scenario: El lector de pantalla anuncia el valor

- **GIVEN** una persona que usa lector de pantalla y una caja "Alternar"
  seleccionada, con valores 127 y 0
- **WHEN** llega con Tab al campo del segundo valor
- **THEN** el lector lo anuncia como "Valor 2" del grupo "Valores", con su
  valor, 0
