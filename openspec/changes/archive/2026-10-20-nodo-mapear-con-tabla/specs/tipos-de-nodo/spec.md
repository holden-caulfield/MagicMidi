# Spec Delta

## MODIFIED Requirements

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
- **THEN** "Filtrar", "Convertir", "Fijar", "Alternar", "Desplazar",
  "Interpolar", "Mapear", "Emitir", "Descartar" y "Pánico" están definidos
  cada uno en su propio archivo con la misma forma, y ninguno recibe un trato
  especial fuera de él

#### Scenario: Alternar va después de Fijar

- **WHEN** la persona usuaria mira la barra de herramientas
- **THEN** "Alternar" está justo después de "Fijar" y antes de "Desplazar"

#### Scenario: Mapear va después de Interpolar

- **WHEN** la persona usuaria mira la barra de herramientas
- **THEN** "Interpolar" está justo después de "Desplazar", y "Mapear" está
  justo después de "Interpolar" y antes de "Emitir"

### Requirement: La función de procesamiento

La función de procesamiento SHALL recibir el mensaje MIDI que llega a la caja
(ver "El mensaje dice su tipo y su canal"), los valores de los parámetros de
esa caja y la memoria de esa caja (ver la spec `ejecucion-de-workflow`, "Cada
caja tiene su memoria"). SHALL devolver el mensaje que la caja pasa a las
siguientes, una lista de mensajes, o nada, si lo descarta. Si devuelve una
lista, cada mensaje de la lista SHALL pasar a las cajas siguientes por
separado, en el orden de la lista, como pasaría un mensaje solo. Una lista
vacía SHALL valer lo mismo que no devolver nada. Que una caja con salida
descarte un mensaje corta solo ese camino: no cancela el reenvío del original.

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

En la memoria de su caja, la función SHALL poder guardar valores, cada uno con
un nombre que elige el tipo, y leer los que guardó al procesar mensajes
anteriores. Es la única forma de que un tipo recuerde algo entre un mensaje y
el siguiente: el archivo del tipo no SHALL guardar nada por su cuenta fuera de
la función, porque sería compartido por todas las cajas de ese tipo y no se
olvidaría al desconectar. Un tipo que no necesita recordar nada SHALL poder
ignorar la memoria, sin declarar nada.

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

#### Scenario: Un tipo que recuerda

- **GIVEN** un tipo de nodo con salida cuya función guarda en la memoria de su
  caja cuántos mensajes recibió y pone esa cuenta en el tercer byte, y
  trigger → esa caja → "Emitir"
- **WHEN** llega tres veces `B0 07 00`
- **THEN** salen `B0 07 01`, `B0 07 02` y `B0 07 03`, sin que el archivo del
  tipo guarde nada fuera de su función

#### Scenario: Los tipos que no recuerdan nada no cambian

- **WHEN** se revisan los archivos de "Filtrar", "Convertir", "Fijar",
  "Desplazar", "Interpolar", "Mapear", "Emitir", "Descartar" y "Pánico"
- **THEN** su función no usa la memoria de su caja, ni declara nada sobre
  ella
