# tipos-de-nodo Specification

## Purpose
Fija el contrato para sumar tipos de nodo nuevos al editor de flujos. Tiene que
ser una tarea chica y autocontenida, que pueda encarar alguien que recién
empieza a programar: un archivo con una declaración y una función, más una
línea en el catálogo de tipos.

## Requirements

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
- **THEN** "Filtrar", "Convertir", "Fijar", "Desplazar", "Mapear", "Emitir",
  "Descartar" y "Pánico" están definidos cada uno en su propio archivo con la
  misma forma, y ninguno recibe un trato especial fuera de él

### Requirement: Qué declara un tipo de nodo

El archivo de un tipo de nodo SHALL declarar:

- el **nombre**, que se ve en el globo de ayuda de la caja (en la barra y en
  el lienzo) y como título en el panel de configuración;
- el **ícono**, tomado de la librería de íconos de la aplicación. Es lo único
  que se ve dentro de la caja;
- si la caja **no tiene salida**. Es opcional: si no se declara, la caja tiene
  salida. Todas tienen entrada; las que no tienen salida cierran el flujo, y
  por eso se ven con el color de las cajas de fin, sin declarar nada más;
- la lista de **parámetros**, cada uno declarado con la función de su tipo
  de parámetro, con una clave, una etiqueta visible y un valor inicial, más
  los datos propios de su tipo (ver la spec `tipos-de-parametro`, "Un tipo de
  parámetro es un archivo que arma sus parámetros");
- **reglas de validación** propias, que miran los valores de varios
  parámetros juntos. Son opcionales: un tipo que no las declara se valida solo
  con lo que revisa cada parámetro. Cada regla que no se cumple SHALL dar un
  texto de error asociado a uno de los parámetros. Si ese texto nombra
  valores, la regla SHALL marcarlos como valores, y los escribe el campo
  debajo del cual se muestra el error (ver la spec `tipos-de-parametro`, "Los
  mensajes de error nombran valores que escribe el campo"), sin que la regla
  sepa cómo se muestran. Las reglas del tipo SHALL revisarse solo cuando cada
  parámetro, por separado, tiene un valor que le sirve, así no tienen que
  repetir lo que ya revisan los parámetros;
- una única **función de procesamiento**.

Los errores de configuración de una caja SHALL ser los de sus parámetros más
los de las reglas de su tipo, y SHALL poder calcularse sin la interfaz, solo a
partir del tipo y de los valores de la caja: no dependen de cómo se muestra
cada parámetro. El texto de un error SHALL ser el mismo en el panel y en el
log, salvo por cómo se escriben los valores que nombra: en el panel, con el
formato del campo; en el log, como texto común. El lienzo SHALL mostrar solo
si la caja tiene errores. Los valores iniciales de todo tipo de nodo SHALL
estar libres de errores, y eso SHALL revisarlo un test que recorre todos los
tipos.

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

- **GIVEN** se crea un tipo de parámetro nuevo
- **WHEN** un tipo de nodo declara un parámetro con su función
- **THEN** el panel muestra el campo del tipo nuevo, y el archivo del tipo de
  nodo solo agregó la declaración del parámetro y la importación de su
  función

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

#### Scenario: La regla del tipo nombra un número como lo muestra el parámetro

- **GIVEN** un tipo de nodo declara una regla que dice que el parámetro
  "Hasta" tiene que ser mayor que 64, con el 64 marcado como valor
- **WHEN** una caja de ese tipo tiene "Hasta" 10, mostrado en hexadecimal
- **THEN** debajo de "Hasta" el error nombra el 64 como "40", y el archivo del
  tipo de nodo no nombra ningún modo

#### Scenario: Los errores no dependen de cómo se muestra la caja

- **GIVEN** dos cajas "Fijar" con byte "Canal" y valor 100, una en modo
  decimal y otra en modo hexadecimal
- **WHEN** se calculan sus errores de configuración
- **THEN** las dos tienen el mismo error, asociado a "Valor", que escrito como
  texto común dice que con Canal tiene que ir de 1 a 16

### Requirement: La función de procesamiento

La función de procesamiento SHALL recibir el mensaje MIDI que llega a la caja
(ver "El mensaje dice su tipo y su canal") y los valores de los parámetros de
esa caja. SHALL devolver el mensaje que la caja pasa a las siguientes, una
lista de mensajes, o nada, si lo descarta. Si devuelve una lista, cada mensaje
de la lista SHALL pasar a las cajas siguientes por separado, en el orden de la
lista, como pasaría un mensaje solo. Una lista vacía SHALL valer lo mismo que
no devolver nada. Que una caja con salida descarte un mensaje corta solo ese
camino: no cancela el reenvío del original.

En un tipo sin salida, lo que devuelva SHALL ser lo que sale por el puerto de
salida (por ejemplo, Emitir devuelve el mensaje que recibe), y si devuelve una
lista, salen todos sus mensajes, en orden. Devolver nada, o una lista vacía,
SHALL significar que esa caja no agrega nada a la salida. En todos los casos,
que el mensaje haya llegado a una caja sin salida SHALL cancelar el reenvío
del original: una caja sin salida que no devuelve nada, como Descartar, es la
forma de que un mensaje no salga.

La función no SHALL enviar mensajes por su cuenta: devuelve lo que corresponde
y la aplicación se encarga del envío. La función SHALL poder modificar el
mensaje que recibe sin afectar al mensaje que reciben otras ramas.

#### Scenario: Descartar un mensaje

- **GIVEN** un tipo de nodo con salida cuya función no devuelve nada para los
  mensajes "Nota Off", y el trigger conectado solo a una caja de ese tipo, que
  va a un "Emitir"
- **WHEN** la caja recibe un "Nota Off"
- **THEN** el "Emitir" no recibe nada, y el "Nota Off" sale tal como llegó,
  porque ningún camino llegó a una caja sin salida

#### Scenario: Modificar la lista recibida

- **GIVEN** la salida del trigger va a una caja cuya función cambia el segundo
  byte del mensaje que recibe y lo devuelve, y también directo a una caja
  "Emitir"
- **WHEN** llega un mensaje
- **THEN** la caja "Emitir" conectada directo al trigger envía el mensaje
  original, sin el cambio

#### Scenario: Un tipo sin salida devuelve lo que sale

- **GIVEN** un tipo de nodo sin salida
- **WHEN** su función se llama con `90 3C 64` y devuelve `90 3C 64`
- **THEN** la aplicación envía `90 3C 64` al puerto de salida, una sola vez,
  sin que el archivo del tipo importe nada para enviarlo

#### Scenario: Un tipo sin salida que no devuelve nada

- **GIVEN** un tipo de nodo sin salida cuya función no devuelve nada, y el
  trigger conectado solo a una caja de ese tipo
- **WHEN** la caja recibe un mensaje
- **THEN** no sale nada por el puerto de salida

#### Scenario: Un tipo sin salida devuelve varios mensajes

- **GIVEN** un tipo de nodo sin salida cuya función devuelve la lista
  `B0 7B 00`, `B1 7B 00`, y el trigger conectado solo a una caja de ese tipo
- **WHEN** la caja recibe `90 3C 64`
- **THEN** salen `B0 7B 00` y `B1 7B 00`, en ese orden, y no sale `90 3C 64`

#### Scenario: Un tipo con salida devuelve varios mensajes

- **GIVEN** un tipo de nodo con salida cuya función devuelve, por cada
  mensaje, la lista con el mensaje y una copia una octava más arriba, y
  trigger → esa caja → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** el "Emitir" recibe `90 3C 64` y después `90 48 64`, y salen los
  dos, en ese orden

#### Scenario: Una lista vacía descarta

- **GIVEN** un tipo de nodo con salida cuya función devuelve una lista vacía,
  y el trigger conectado solo a una caja de ese tipo, que va a un "Emitir"
- **WHEN** la caja recibe `90 3C 64`
- **THEN** el "Emitir" no recibe nada, y `90 3C 64` sale tal como llegó

### Requirement: Los tipos de nodo no dependen del editor

Este requisito no es negociable: ninguna decisión de diseño SHALL
relajarlo. El archivo de un tipo de nodo no SHALL depender de la librería que
dibuja el lienzo ni del estado de la pantalla, ni SHALL incluir nada de la
interfaz: declara sus parámetros con las funciones de los tipos de parámetro,
que son las que saben qué campo los dibuja. Reemplazar la librería del lienzo
no SHALL obligar a cambiar ningún archivo de tipo de nodo.

#### Scenario: Archivo autocontenido

- **WHEN** se revisa lo que importa el archivo de un tipo de nodo
- **THEN** solo importa la definición del contrato de tipos de nodo, su ícono
  de la librería de íconos, las funciones de los tipos de parámetro que
  declara, la forma de marcar valores en un mensaje de error y, si hace
  falta, funciones auxiliares propias del procesamiento MIDI que no tengan
  efectos (por ejemplo, una que calcule el canal de un status), nunca la
  librería del lienzo, el estado de la pantalla, componentes de la interfaz
  ni el envío al puerto de salida

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

### Requirement: El mensaje dice su tipo y su canal

El mensaje que recibe la función de procesamiento SHALL dar acceso a su lista
de bytes y SHALL permitir leer, sin hacer cuentas con los bits del status:

- su **tipo**, que es uno de:
  - de canal: Nota On, Nota Off, Presión Polifónica, Cambio de Control,
    Cambio de Programa, Presión de Canal o Pitch Bend;
  - de sistema, uno por cada status definido: SysEx (`F0`), Cuadro de Tiempo
    (`F1`), Posición de Canción (`F2`), Selección de Canción (`F3`),
    Solicitud de Afinación (`F6`), Reloj MIDI (`F8`), Inicio (`FA`),
    Continuar (`FB`), Detener (`FC`), Sensor Activo (`FE`) y Reset del
    Sistema (`FF`);
  - sistema no definido, para los demás status de `F0` a `FF` (`F4`, `F5`,
    `F7`, `F9` y `FD`);
  - desconocido: sin bytes, o con un primer byte que no es un status, es
    decir menor que `80`.

  Un Nota On (`9n`) con velocidad 0 SHALL leerse como Nota Off, igual que en
  la descripción del log; un `9n` sin tercer byte cuenta como velocidad 0;
- su **canal**, de 1 a 16, en los mensajes de canal (status `80` a `EF`). Los
  demás mensajes no SHALL tener canal.

El tipo y el canal SHALL salir siempre de los bytes que el mensaje tiene en
ese momento: si una caja cambia el status o la velocidad, lo que se lee
después SHALL reflejar el cambio. La descripción del log y cualquier caja que
necesite el tipo o el canal SHALL usar esta misma lectura, para que no haya
dos interpretaciones del status.

#### Scenario: Tipo y canal de un Nota On

- **WHEN** se lee el mensaje `91 3C 64`
- **THEN** su tipo es Nota On y su canal es 2

#### Scenario: Nota On con velocidad cero

- **WHEN** se lee el mensaje `90 3C 00`
- **THEN** su tipo es Nota Off y su canal es 1

#### Scenario: Mensaje de sistema

- **WHEN** se lee el mensaje `FA`
- **THEN** su tipo es Inicio y no tiene canal

#### Scenario: SysEx

- **WHEN** se lee el mensaje `F0 7E 7F 06 01 F7`
- **THEN** su tipo es SysEx y no tiene canal

#### Scenario: Status de sistema no definido

- **WHEN** se lee el mensaje `F9`
- **THEN** su tipo es sistema no definido y no tiene canal

#### Scenario: Mensaje sin status

- **WHEN** se lee el mensaje `3C 40`
- **THEN** su tipo es desconocido y no tiene canal

#### Scenario: La lectura sigue a los bytes

- **GIVEN** una caja recibe `90 3C 64` y cambia su primer byte a `B0`
- **WHEN** la caja siguiente lee el mensaje
- **THEN** su tipo es Cambio de Control
