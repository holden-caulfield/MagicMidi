# Spec Delta

## REMOVED Requirements

### Requirement: Los tipos de parámetro disponibles

**Reason**: La lista de tipos disponibles suma el mapa, y el escenario del
requisito ("Los siete tipos en su carpeta") nombraba la versión anterior. Lo
reemplaza "Los tipos de parámetro disponibles incluyen el mapa".

**Migration**: Ninguna: los siete tipos siguen igual, y el requisito nuevo los
lista junto con el mapa.

## MODIFIED Requirements

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
  flechas (con el paso del modo, ver "Las flechas del campo numérico");
- con el foco en su campo numérico, con la flecha arriba y la flecha abajo
  (de a 1) o con Mayúsculas (con el paso del modo), igual que con el foco en
  su perilla;
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

- **GIVEN** una caja "Interpolar" con salida de 0 a 127
- **WHEN** la persona usuaria arrastra la perilla "desde" de Salida hasta el
  extremo derecho y la perilla "hasta" hasta el extremo izquierdo
- **THEN** la caja queda con salida de 127 a 0, y las marcas del tramo
  apuntan hacia la izquierda

#### Scenario: Con el teclado

- **GIVEN** una caja "Interpolar" con entrada de 0 a 127 y el foco en la perilla
  "hasta" de Entrada
- **WHEN** la persona usuaria aprieta la flecha izquierda y después
  Mayúsculas y la flecha izquierda
- **THEN** la caja queda con entrada de 0 a 116

#### Scenario: Con el teclado en el campo

- **GIVEN** una caja "Filtrar" con datos 1 de 60 a 72 y el foco en el campo
  de la izquierda de Datos 1
- **WHEN** la persona usuaria aprieta la flecha arriba
- **THEN** la caja queda con datos 1 de 61 a 72 y el foco sigue en el campo

#### Scenario: Una octava con el teclado en el campo

- **GIVEN** una caja "Filtrar" con datos 1 de 48 a 72, en modo nota, y el
  foco en el campo de la izquierda de Datos 1
- **WHEN** la persona usuaria aprieta Mayúsculas y la flecha arriba
- **THEN** la caja queda con datos 1 de 60 a 72, y los campos muestran "C4" y
  "C5"

#### Scenario: La perilla en hexadecimal

- **GIVEN** una caja "Interpolar" con salida de 0 a 127, en modo hexadecimal, y el
  foco en la perilla "hasta" de Salida
- **WHEN** la persona usuaria aprieta Mayúsculas y la flecha izquierda
- **THEN** la caja queda con salida de 0 a 111, y los campos muestran "00" y
  "6F"

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

### Requirement: Los parámetros numéricos se muestran en un modo

Un parámetro **entero**, un parámetro **rango**, un parámetro **secuencia** y
un parámetro **mapa** SHALL mostrar sus números en uno de estos modos:

- **decimal**: el número tal cual ("60", "-12");
- **nota**: el nombre de la nota en notación científica, con el Do central 60
  como C4, igual que el log ("C4", "C#4", "C-1", "G9"). Las notas negras se
  escriben con sostenidos, salvo que la persona usuaria haya escrito la última
  nota del parámetro con bemol: entonces van con bemoles ("Db4"), hasta que
  escriba una con sostenido. Escribir una nota natural no cambia esa
  elección, y rotar de modo o usar las flechas tampoco. En un rango, los dos
  extremos la comparten; en una secuencia, todos sus valores, y en un mapa,
  todas sus entradas y salidas. El log sigue nombrando las notas con sostenidos;
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
SHALL compartir el modo; en una secuencia, todos sus valores, y en un mapa,
todas sus entradas y salidas: el modo es del campo, no de cada número.

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

#### Scenario: Un solo botón para el mapa

- **GIVEN** una caja "Mapear" con el mapa 48 → 36, en modo hexadecimal (los
  campos muestran "30" y "24")
- **WHEN** la persona usuaria activa el botón de modo de "Mapa"
- **THEN** el mapa pasa a modo nota, y los campos muestran "C2" y "C1"

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
controles. Cada clic en una flecha SHALL sumarle o restarle 1 al valor, en
cualquier modo. Con Mayúsculas, SHALL sumarle o restarle el paso del modo en
que está el campo:

- **decimal**: 10 (de 25 a 35);
- **nota**: 12, una octava (de C3 a C4), así que la nota no cambia, y sigue
  escrita con bemol o con sostenido como antes;
- **hexadecimal**: 16, que cambia la segunda cifra desde la derecha y deja la
  última como está (de 3C a 4C).

El resultado no SHALL pasar del mínimo ni del máximo del parámetro, si los
tiene, y la flecha que no puede avanzar más SHALL verse deshabilitada. Las
flechas no SHALL recorrerse con Tab: con el teclado, se usa el campo.

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

En los campos de un mapa tampoco SHALL haber flechas propias, para que cada
par entre en una fila, pero las flechas del teclado SHALL sumarle o restarle a
ese valor como en el campo de un entero, sin pasar del mínimo ni del máximo
del parámetro.

#### Scenario: Subir con la flecha

- **GIVEN** una caja "Fijar" con valor 100
- **WHEN** la persona usuaria hace clic en la flecha de subir del valor
- **THEN** la caja pasa a tener 101

#### Scenario: Con el teclado y de a diez

- **GIVEN** una caja "Fijar" con valor 100, en modo decimal, y el foco en su
  campo
- **WHEN** la persona usuaria aprieta Mayúsculas y la flecha abajo
- **THEN** la caja pasa a tener 90 y el foco sigue en el campo

#### Scenario: De a una octava en modo nota

- **GIVEN** una caja "Fijar" con valor 48, en modo nota (el campo muestra
  "C3")
- **WHEN** la persona usuaria aprieta Mayúsculas y la flecha arriba en el
  campo
- **THEN** la caja pasa a tener 60, y el campo muestra "C4"

#### Scenario: La octava conserva el bemol

- **GIVEN** una caja "Fijar" en modo nota, con el valor escrito como "Db4"
- **WHEN** la persona usuaria hace clic con Mayúsculas en la flecha de bajar
- **THEN** la caja pasa a tener 49, y el campo muestra "Db3"

#### Scenario: De a dieciséis en hexadecimal

- **GIVEN** una caja "Fijar" con valor 60, en modo hexadecimal (el campo
  muestra "3C")
- **WHEN** la persona usuaria hace clic con Mayúsculas en la flecha de subir
- **THEN** la caja pasa a tener 76, y el campo muestra "4C"

#### Scenario: Tope en el máximo en hexadecimal

- **GIVEN** una caja "Fijar" con valor 112, en modo hexadecimal (el campo
  muestra "70")
- **WHEN** la persona usuaria hace clic con Mayúsculas en la flecha de subir
- **THEN** la caja pasa a tener 127, el campo muestra "7F", y la flecha de
  subir se ve deshabilitada

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

#### Scenario: Con el teclado en un mapa

- **GIVEN** una caja "Mapear" con el mapa C2 → C1, en modo nota, y el foco en
  el campo de la salida
- **WHEN** la persona usuaria aprieta la flecha arriba, y después Mayúsculas
  y la flecha arriba
- **THEN** la caja queda con el mapa C2 → C#2, el campo muestra "C#2" y el
  foco sigue en él

## ADDED Requirements

### Requirement: Los tipos de parámetro disponibles incluyen el mapa

Los tipos de parámetro disponibles SHALL ser número entero, sí/no, lista (una
sola opción de una lista cerrada), dos para elegir varias opciones de una
lista cerrada (opciones y autocompletar), rango (dos extremos enteros),
secuencia (una lista de enteros en orden) y mapa (una lista de pares entrada →
salida). En los de lista, cada opción tiene un valor y un texto visible. Cada
uno SHALL estar definido en su propio archivo, con la misma forma que
cualquier tipo nuevo, sin recibir un trato especial fuera de él.

#### Scenario: Los ocho tipos en su carpeta

- **WHEN** se revisa la carpeta de tipos de parámetro
- **THEN** entero, sí/no, lista, opciones, autocompletar, rango, secuencia y
  mapa están definidos cada uno en su propio archivo, que exporta su función,
  y el panel de configuración no nombra a ninguno

### Requirement: El parámetro mapa

Un parámetro **mapa** SHALL declarar un mínimo y un máximo enteros, y puede
declarar los modos que ofrece, como un entero, y un texto de ayuda para cuando
está vacío. Su valor SHALL ser una lista de
pares, cada uno con una entrada y una salida enteras, en el orden en que se
agregaron. Un mapa vacío SHALL ser un valor válido.

Un valor SHALL no servirle al parámetro, con estos errores, revisados en este
orden:

- si no es una lista, o alguno de sus elementos no es un par con una entrada
  y una salida enteras: "Tiene que ser una lista de pares de números
  enteros";
- si alguna entrada o salida queda fuera del mínimo y el máximo: "Los valores
  tienen que ir de <mínimo> a <máximo>, y hay un <valor>", con el primero que
  queda afuera, recorriendo los pares en orden y, en cada par, primero la
  entrada (por ejemplo, "Los valores tienen que ir de 0 a 127, y hay un
  200"). Los tres números van marcados como valores, así el panel los escribe
  en el modo del campo;
- si una entrada está en más de un par: "La entrada <valor> está más de una
  vez", con la primera que se repite, marcada como valor. En un mapa, una
  entrada lleva a una sola salida.

Una salida repetida SHALL ser válida: varias entradas pueden llevar a la
misma salida.

#### Scenario: Varias entradas a la misma salida

- **WHEN** se revisa el mapa 48 → 36, 49 → 36 de un mapa de 0 a 127
- **THEN** no tiene error

#### Scenario: Mapa vacío

- **WHEN** se revisa un mapa vacío de 0 a 127
- **THEN** no tiene error

#### Scenario: Un valor fuera de rango

- **WHEN** se revisa el mapa 48 → 200, 300 → 36 de un mapa de 0 a 127
- **THEN** tiene el error "Los valores tienen que ir de 0 a 127, y hay un
  200"

#### Scenario: Una entrada repetida

- **WHEN** se revisa el mapa 48 → 36, 49 → 38, 48 → 42 de un mapa de 0 a 127
- **THEN** tiene el error "La entrada 48 está más de una vez"

#### Scenario: La entrada repetida en modo nota

- **GIVEN** una caja "Mapear" con el mapa C2 → C1 y C2 → D1, en modo nota
- **WHEN** la persona usuaria la selecciona
- **THEN** debajo de "Mapa" se lee "La entrada C2 está más de una vez", y la
  caja se ve con borde rojo

### Requirement: El control de mapa

El control de un parámetro **mapa** SHALL mostrar un par por fila, en el
orden de la lista: un campo de texto para la entrada, una flecha que va de la
entrada a la salida, un campo de texto para la salida y un botón para quitar
el par. Los dos campos SHALL mostrar su valor en el modo del parámetro. No
SHALL haber títulos de columna: la flecha dice cuál es la entrada y cuál la
salida. Tampoco SHALL haber botones para subir ni bajar un par, porque el
orden no cambia el resultado.

Con el mapa vacío, en lugar de los pares SHALL verse el texto de ayuda de la
declaración, si lo tiene. Es de quien declara el parámetro, porque lo que
significa un mapa vacío depende de la caja.

Después de la última fila SHALL haber un botón para agregar un par al final.
Como entrada, agrega el primer valor que no está como entrada en ningún par,
buscando desde el que sigue a la entrada del último par hasta el máximo, y
después desde el mínimo; como salida, ese mismo valor. Así el par nuevo no
repite una entrada ni cambia ningún mensaje hasta que se lo edita. Con el
mapa vacío, agrega el mínimo como entrada y como salida. Si todos los valores
del mínimo al máximo ya son entradas, el botón SHALL verse deshabilitado.

Cada valor SHALL poder cambiarse escribiendo en su campo: lo escrito se lee
como en el parámetro entero, al salir del campo, en los modos que ofrece el
parámetro, y si se lee en otro modo, todo el mapa pasa a ese modo (ver "Lo
escrito en un parámetro numérico elige el modo"). Lo que no se puede leer no
SHALL cambiar la caja, y el campo vuelve a mostrar su valor. Las flechas del
teclado también cambian el valor (ver "Las flechas del campo numérico").

Todo SHALL poder hacerse con el teclado: los campos y los botones se recorren
con Tab, par por par, y después el botón de agregar. Después de quitar un
par, el foco SHALL ir al botón de quitar del par que quedó en su lugar, o al
del anterior si era el último, o al botón de agregar si no queda ninguno.
Después de agregar, el foco SHALL ir al campo de la entrada del par nuevo.

La etiqueta del parámetro SHALL nombrar al grupo. Cada campo SHALL anunciarse
a los lectores de pantalla con su lado y la posición del par ("Entrada 2",
"Salida 2"), y cada botón, con su acción ("Quitar el par 2" y "Agregar un
par"). La flecha es decorativa y no SHALL anunciarse. Un error del parámetro
SHALL mostrarse debajo del control, como en cualquier parámetro, y nombra el
valor que falla. El control, con su botón de modo, SHALL caber en el ancho
del panel de configuración sin desplazarlo a lo ancho; con muchos pares crece
hacia abajo, y se recorre desplazando el panel.

#### Scenario: Escribir una salida

- **GIVEN** una caja "Mapear" con el mapa C2 → C2, en modo nota
- **WHEN** la persona usuaria escribe "C1" en la salida del primer par y sale
  del campo
- **THEN** la caja queda con el mapa C2 → C1

#### Scenario: Escribir en otro modo

- **GIVEN** una caja "Mapear" con el mapa C2 → C1, en modo nota
- **WHEN** la persona usuaria escribe 50 en la entrada del primer par y sale
  del campo
- **THEN** la caja queda con el mapa 50 → 36, el mapa pasa a modo decimal, y
  los campos muestran 50 y 36

#### Scenario: Escribir algo que no es un número

- **GIVEN** una caja "Mapear" con el mapa C2 → C1
- **WHEN** la persona usuaria escribe "mucho" en la salida del primer par y
  sale del campo
- **THEN** la caja sigue con el mapa C2 → C1, y el campo vuelve a mostrar
  "C1"

#### Scenario: Agregar un par

- **GIVEN** una caja "Mapear" con el mapa C2 → C1 y C#2 → D1
- **WHEN** la persona usuaria activa "Agregar un par"
- **THEN** la caja queda con el mapa C2 → C1, C#2 → D1 y D2 → D2, y el foco
  está en el campo "Entrada 3"

#### Scenario: Agregar saltea las entradas que ya están

- **GIVEN** una caja "Mapear" con el mapa D2 → F#1, C2 → C1 y C#2 → D1
- **WHEN** la persona usuaria activa "Agregar un par"
- **THEN** el par nuevo es D#2 → D#2, porque D2 ya es una entrada

#### Scenario: Agregar después del máximo

- **GIVEN** una caja "Mapear" con el mapa 0 → 10 y 127 → 20, en modo decimal
- **WHEN** la persona usuaria activa "Agregar un par"
- **THEN** el par nuevo es 1 → 1, porque después de 127 la búsqueda sigue
  desde el mínimo, y el 0 ya es una entrada

#### Scenario: Agregar al mapa vacío

- **GIVEN** una caja "Mapear" recién agregada
- **WHEN** la persona usuaria activa "Agregar un par"
- **THEN** la caja queda con el mapa C-1 → C-1, sin error, y deja de verse el
  texto "Sin pares: todo pasa sin cambios."

#### Scenario: Quitar un par

- **GIVEN** una caja "Mapear" con el mapa C2 → C1, C#2 → D1 y D2 → F#1
- **WHEN** la persona usuaria activa "Quitar el par 2"
- **THEN** la caja queda con el mapa C2 → C1 y D2 → F#1, y el foco está en
  "Quitar el par 2", que ahora es el de D2

#### Scenario: Quitar el último par

- **GIVEN** una caja "Mapear" con el mapa C2 → C1
- **WHEN** la persona usuaria activa "Quitar el par 1"
- **THEN** la caja queda con el mapa vacío, sin error, se ve el texto "Sin
  pares: todo pasa sin cambios." y el foco está en "Agregar un par"

#### Scenario: El par entra en el panel

- **GIVEN** el panel de configuración con su ancho de siempre
- **WHEN** la persona usuaria selecciona una caja "Mapear" con el mapa D#-1 →
  F#9, en modo nota
- **THEN** los dos campos, la flecha y el botón de quitar se ven en una sola
  fila, y el panel no se desplaza a lo ancho

#### Scenario: El lector de pantalla anuncia el campo

- **GIVEN** una persona que usa lector de pantalla y una caja "Mapear"
  seleccionada, con el mapa C2 → C1 y C#2 → D1
- **WHEN** llega con Tab al campo de la salida del segundo par
- **THEN** el lector lo anuncia como "Salida 2" del grupo "Mapa", con su
  valor, D1
