# Spec Delta

## MODIFIED Requirements

### Requirement: Barra de estado al pie

La ventana SHALL mostrar, pegada a su borde inferior y visible desde
cualquier tab, una barra de estado de una sola línea, más baja que un botón.
La barra SHALL distinguir tres estados, cada uno con su ícono, su texto y su
color de fondo, legibles en modo claro y en modo oscuro:

- **Desconectado**, sin mensajes en el panel de conexión: fondo neutro y el
  texto "Desconectado".
- **Conectado**: fondo de éxito, el texto "Conectado" y los nombres del puerto
  de entrada y del de salida, tal como se muestran en los selectores.
- **Error**: cuando la aplicación está desconectada y el panel de conexión
  tiene un mensaje a la vista (un error al conectar, un aviso de que faltan
  puertos, una falla al pedir la lista de puertos o un puerto perdido). Fondo
  de error, el texto "Desconectado" y el mismo mensaje que muestra el panel.

A la derecha, en los tres estados, la barra SHALL mostrar el identificador
del build (ver la capability `identificador-del-build`), con el color de
texto del estado. El identificador SHALL verse siempre entero y poder
seleccionarse para copiarlo, y no SHALL anunciarse con los cambios de estado.

Si el texto de la conexión no entra a lo ancho, SHALL cortarse con puntos
suspensivos y mostrarse entero en un globo al pasar el puntero. Los cambios
de estado SHALL anunciarse a las tecnologías de asistencia sin mover el foco.
Fuera del identificador, la barra de estado SHALL reflejar solo la conexión:
no muestra errores de las cajas del flujo, que siguen marcándose en el log.

#### Scenario: Estado inicial

- **WHEN** se abre la aplicación y la lista de puertos se obtiene bien
- **THEN** la barra de estado dice "Desconectado", con fondo neutro

#### Scenario: Conectado

- **WHEN** la persona usuaria conecta la entrada "IAC Driver Bus 1" y la salida
  "IAC Driver Bus 2"
- **THEN** la barra de estado dice "Conectado" y muestra "IAC Driver Bus 1" y
  "IAC Driver Bus 2", indicando cuál es la entrada y cuál la salida, con fondo
  de éxito

#### Scenario: Puertos con el mismo nombre

- **GIVEN** hay dos puertos de entrada llamados "Teclado"
- **WHEN** la persona usuaria conecta el segundo
- **THEN** la barra de estado lo nombra "Teclado (2)", como el selector

#### Scenario: Cambio de estado visible desde cualquier tab

- **GIVEN** el tab activo es "Log"
- **WHEN** la conexión se establece o se corta
- **THEN** la barra de estado pasa a "Conectado" o "Desconectado" según
  corresponda, sin que haga falta volver al tab "Conexión"

#### Scenario: Error al conectar

- **WHEN** falla el intento de conexión
- **THEN** el mensaje de error se ve en el panel de conexión, y la barra de
  estado dice "Desconectado", con fondo de error y el mismo mensaje

#### Scenario: Falta elegir puertos

- **WHEN** la persona usuaria presiona "Conectar" sin haber elegido puerto de
  entrada y de salida
- **THEN** el aviso se ve en el panel de conexión y en la barra de estado, que
  sigue diciendo "Desconectado" y se marca como error

#### Scenario: El error se va al volver a intentar

- **GIVEN** la barra de estado muestra un error
- **WHEN** la persona usuaria conecta con éxito
- **THEN** la barra de estado dice "Conectado", con fondo de éxito y sin el
  mensaje anterior

#### Scenario: Texto largo

- **GIVEN** la ventana es angosta y los nombres de los puertos conectados son
  largos
- **WHEN** la persona usuaria mira la barra de estado
- **THEN** la barra sigue teniendo una sola línea, el texto de la conexión
  termina en puntos suspensivos y se lee entero al pasarle el puntero, y el
  identificador del build se ve entero a la derecha

#### Scenario: Identificador del build

- **GIVEN** la aplicación se compiló del commit `b83b9c7`, el quinto merge
  desde `v0.1.0`, con la versión 0.1.1
- **WHEN** la persona usuaria mira la barra de estado, conectada o no
- **THEN** a la derecha dice `0.1.1-dev.5+b83b9c7`, y puede seleccionarlo y
  copiarlo

#### Scenario: El identificador no se anuncia

- **GIVEN** una tecnología de asistencia está leyendo la aplicación
- **WHEN** la conexión se establece
- **THEN** se anuncia el nuevo estado de la conexión, sin el identificador
  del build
