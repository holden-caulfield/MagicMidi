# Spec Delta

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

#### Scenario: Una octava con el teclado en el campo

- **GIVEN** una caja "Filtrar" con datos 1 de 48 a 72, en modo nota, y el
  foco en el campo de la izquierda de Datos 1
- **WHEN** la persona usuaria aprieta Mayúsculas y la flecha arriba
- **THEN** la caja queda con datos 1 de 60 a 72, y los campos muestran "C4" y
  "C5"

#### Scenario: La perilla en hexadecimal

- **GIVEN** una caja "Mapear" con salida de 0 a 127, en modo hexadecimal, y el
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

