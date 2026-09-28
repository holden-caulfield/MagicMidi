# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Los puertos se ofrecen por nombre`
- TO: `### Requirement: Los puertos se identifican por el sistema y se muestran por nombre`

## MODIFIED Requirements

### Requirement: Los puertos se identifican por el sistema y se muestran por nombre

La aplicación SHALL ofrecer por separado los puertos MIDI de entrada y los de
salida que informa el sistema. Cada puerto SHALL identificarse por el
identificador que le asigna el sistema, y mostrarse con el nombre que le da el
sistema. Si el sistema no informa el nombre de un puerto, SHALL mostrarse como
"Puerto desconocido". Si dos o más puertos del mismo lado tienen el mismo
nombre, el primero SHALL mostrarse con el nombre tal cual y los siguientes con
" (2)", " (3)", …, en el orden en que los informa el sistema, y cada uno SHALL
poder elegirse y conectarse por separado. La lista SHALL leerse al abrir la
aplicación y cada vez que la persona usuaria presiona "Actualizar puertos"; no
SHALL actualizarse sola cuando se conecta o desconecta un dispositivo.

#### Scenario: Entradas y salidas separadas

- **GIVEN** el sistema tiene un dispositivo con un puerto de entrada "Teclado"
  y un puerto de salida "Sintetizador"
- **WHEN** se abre la aplicación
- **THEN** el selector de entrada ofrece "Teclado" y el de salida ofrece
  "Sintetizador"

#### Scenario: Dispositivo enchufado con la aplicación abierta

- **GIVEN** la aplicación está abierta y desconectada
- **WHEN** la persona usuaria enchufa un dispositivo MIDI nuevo
- **THEN** sus puertos no aparecen en los selectores hasta que presiona
  "Actualizar puertos"

#### Scenario: Dos puertos con el mismo nombre

- **GIVEN** el sistema informa dos puertos de entrada llamados "Teclado"
- **WHEN** se abre la aplicación
- **THEN** el selector de entrada ofrece "Teclado" y "Teclado (2)", y al
  conectar "Teclado (2)" solo se reciben los mensajes de ese puerto

### Requirement: Una conexión es siempre un par entrada/salida

Conectar SHALL abrir a la vez un puerto de entrada y uno de salida, los que la
persona usuaria eligió. La aplicación SHALL tener como máximo una conexión
activa: no hay forma de conectar solo una entrada, solo una salida, ni más de
un par. El puerto elegido SHALL buscarse por su identificador en el momento de
conectar; si ya no existe un puerto con ese identificador, la conexión SHALL
fallar con un mensaje que lo nombra. Los mensajes que nombran un puerto, al
conectar o al perderlo, SHALL usar el nombre con el que se muestra en el
selector, incluido el " (2)" si lo tiene.

#### Scenario: Conexión exitosa

- **GIVEN** la persona usuaria eligió la entrada "Teclado" y la salida
  "Sintetizador"
- **WHEN** presiona "Conectar"
- **THEN** la aplicación queda conectada y los mensajes que llegan por
  "Teclado" empiezan a recibirse

#### Scenario: El puerto desapareció antes de conectar

- **GIVEN** la persona usuaria eligió la salida "Sintetizador" y después
  desenchufó ese dispositivo sin actualizar la lista
- **WHEN** presiona "Conectar"
- **THEN** la conexión falla con el mensaje "No se encontró el puerto de salida
  'Sintetizador'"

#### Scenario: Queda otro puerto con el mismo nombre

- **GIVEN** la persona usuaria eligió la entrada "Teclado (2)" y después ese
  puerto desapareció, pero sigue el otro "Teclado"
- **WHEN** presiona "Conectar" sin actualizar la lista
- **THEN** la conexión falla con "No se encontró el puerto de entrada 'Teclado
  (2)'" en lugar de conectarse al otro "Teclado"

### Requirement: Perder un puerto cierra la conexión

Mientras haya una conexión activa, la aplicación SHALL comprobar al menos una
vez por segundo que el puerto de entrada y el de salida siguen existiendo,
buscándolos por su identificador igual que al conectar. Si alguno de los dos ya
no está, SHALL cerrar los dos puertos y quedar desconectada, y el panel de
conexión SHALL mostrar un mensaje que nombra cada puerto perdido y dice si era
el de entrada o el de salida. La aplicación no SHALL volver a conectarse sola:
los puertos elegidos se conservan, y para seguir la persona usuaria vuelve a
presionar "Conectar". La comprobación SHALL terminar al desconectar o al abrir
una conexión nueva, de modo que nunca afecte a una conexión distinta de la que
estaba vigilando.

#### Scenario: Se desenchufa la entrada

- **GIVEN** hay una conexión activa con la entrada "Teclado" y la salida "IAC
  Driver Bus 2"
- **WHEN** se desenchufa el dispositivo "Teclado"
- **THEN** en menos de dos segundos el encabezado dice "Desconectado", el panel
  de conexión muestra "Se perdió la conexión con el puerto de entrada
  'Teclado'", y un envío a la salida falla con "No hay una conexión de salida
  activa"

#### Scenario: Se desenchufa la salida

- **GIVEN** hay una conexión activa con la entrada "IAC Driver Bus 1" y la
  salida "Sintetizador"
- **WHEN** se desenchufa el dispositivo "Sintetizador"
- **THEN** en menos de dos segundos la aplicación queda desconectada, el panel
  de conexión nombra el puerto de salida "Sintetizador", y los mensajes que
  llegan por "IAC Driver Bus 1" dejan de aparecer en el log

#### Scenario: Se desenchufa un dispositivo que era entrada y salida

- **GIVEN** la entrada y la salida de la conexión activa son puertos del mismo
  dispositivo
- **WHEN** se desenchufa ese dispositivo
- **THEN** la aplicación queda desconectada y el mensaje nombra los dos
  puertos, el de entrada y el de salida

#### Scenario: Se pierde un puerto que tiene otro con el mismo nombre

- **GIVEN** hay una conexión activa con la entrada "Teclado (2)" y el sistema
  tiene además otro puerto de entrada "Teclado"
- **WHEN** desaparece el puerto conectado y el otro "Teclado" sigue
- **THEN** en menos de dos segundos la aplicación queda desconectada y muestra
  "Se perdió la conexión con el puerto de entrada 'Teclado (2)'"

#### Scenario: Con otro tab a la vista

- **GIVEN** hay una conexión activa y el tab activo es "Log"
- **WHEN** se desenchufa uno de los dispositivos de la conexión
- **THEN** el encabezado pasa a "Desconectado" sin cambiar de tab, y al ir al
  tab "Conexión" está el mensaje que nombra el puerto perdido

#### Scenario: Volver a conectar cuando el dispositivo vuelve

- **GIVEN** la aplicación se desconectó porque se perdió el puerto de entrada
  "Teclado"
- **WHEN** se vuelve a enchufar el dispositivo y la persona usuaria presiona
  "Conectar" sin tocar los selectores
- **THEN** la conexión se abre con los mismos puertos y el mensaje anterior
  desaparece

#### Scenario: Desenchufar después de desconectar

- **GIVEN** la persona usuaria desconectó a mano una conexión con la entrada
  "Teclado"
- **WHEN** después se desenchufa "Teclado"
- **THEN** no aparece ningún mensaje y la interfaz no cambia

#### Scenario: La vigilancia no afecta a una conexión nueva

- **GIVEN** hubo una conexión con la entrada "Teclado", la persona usuaria la
  desconectó y abrió otra con "IAC Driver Bus 1" y "IAC Driver Bus 2"
- **WHEN** se desenchufa "Teclado"
- **THEN** la conexión nueva sigue activa y no aparece ningún mensaje
