## MODIFIED Requirements

### Requirement: La función de procesamiento

La función de procesamiento SHALL recibir el mensaje MIDI que llega a la caja,
como una lista de bytes, y los valores de los parámetros de esa caja. SHALL
devolver el mensaje que la caja pasa a las siguientes, o nada, si lo descarta.
En un tipo sin salida, lo que devuelva SHALL ser lo que sale por el puerto de
salida (por ejemplo, Emitir devuelve el mensaje que recibe), y devolver nada
SHALL significar que no sale nada. La función no SHALL enviar mensajes por su
cuenta: devuelve lo que corresponde y la aplicación se encarga del envío. La
función SHALL poder modificar la lista que recibe sin afectar al mensaje que
reciben otras ramas.

#### Scenario: Descartar un mensaje

- **GIVEN** un tipo de nodo cuya función no devuelve nada para los mensajes
  "Nota Off"
- **WHEN** una caja de ese tipo, conectada a un "Emitir", recibe un "Nota Off"
- **THEN** no sale nada por esa rama

#### Scenario: Modificar la lista recibida

- **GIVEN** la salida del trigger va a una caja cuya función cambia el segundo
  byte de la lista que recibe y la devuelve, y también directo a una caja
  "Emitir"
- **WHEN** llega un mensaje
- **THEN** la caja "Emitir" conectada directo al trigger envía el mensaje
  original, sin el cambio

#### Scenario: Un tipo sin salida devuelve lo que sale

- **GIVEN** un tipo de nodo sin salida
- **WHEN** su función se llama con `90 3C 64` y devuelve `90 3C 64`
- **THEN** la aplicación envía `90 3C 64` al puerto de salida, sin que el
  archivo del tipo importe nada para enviarlo

#### Scenario: Un tipo sin salida que no devuelve nada

- **GIVEN** un tipo de nodo sin salida cuya función no devuelve nada
- **WHEN** una caja de ese tipo recibe un mensaje
- **THEN** no sale nada por el puerto de salida

### Requirement: Los tipos de nodo no dependen del editor

Este requisito no es negociable: ninguna decisión de diseño SHALL
relajarlo. El archivo de un tipo de nodo no SHALL depender de la librería que
dibuja el lienzo, ni de los componentes de la interfaz, ni del estado de la pantalla.
Reemplazar la librería del lienzo no SHALL obligar a cambiar ningún archivo de
tipo de nodo.

#### Scenario: Archivo autocontenido

- **WHEN** se revisa lo que importa el archivo de un tipo de nodo
- **THEN** solo importa la definición del contrato de tipos de nodo, su ícono
  de la librería de íconos y, si hace falta, funciones auxiliares propias del
  procesamiento MIDI que no tengan efectos (por ejemplo, una que calcule el
  canal de un status), nunca la librería del lienzo, módulos de la interfaz
  ni el envío al puerto de salida
