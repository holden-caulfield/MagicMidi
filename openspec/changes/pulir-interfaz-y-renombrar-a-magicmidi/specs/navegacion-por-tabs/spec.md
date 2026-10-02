# Spec Delta

## ADDED Requirements

### Requirement: Navegación arriba de los paneles

La ventana principal SHALL mostrar, arriba de los paneles, un selector
segmentado con un control por cada tab disponible, centrado a lo ancho. Cada
control SHALL mostrar un ícono y el nombre del tab. En esta versión los tabs
son exactamente tres: **Conexión**, **Log** y **Workflow**. La navegación
SHALL quedar siempre visible: no se desplaza con el contenido del panel
activo.

#### Scenario: La navegación lista los tabs disponibles

- **WHEN** se abre la aplicación
- **THEN** arriba de la ventana se ve un selector con los controles
  "Conexión", "Log" y "Workflow", en ese orden, cada uno con su ícono

#### Scenario: La navegación no se va con el scroll

- **WHEN** el contenido del panel activo es más alto que el lugar que tiene y
  la persona usuaria lo desplaza
- **THEN** la navegación sigue visible arriba

### Requirement: La ventana no repite el nombre de la aplicación

El título de la ventana, el que muestra el sistema en su barra, SHALL ser
"MagicMidi". Dentro de la ventana no SHALL repetirse el nombre de la
aplicación, ni SHALL haber un encabezado con un título.

#### Scenario: Título de la ventana

- **WHEN** se abre la aplicación
- **THEN** la barra de la ventana dice "MagicMidi", y lo primero que se ve
  dentro de la ventana es la navegación

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

Si el texto no entra a lo ancho, SHALL cortarse con puntos suspensivos y
mostrarse entero en un globo al pasar el puntero. Los cambios de estado SHALL
anunciarse a las tecnologías de asistencia sin mover el foco. La barra de
estado SHALL reflejar solo la conexión: no muestra errores de las cajas del
flujo, que siguen marcándose en el log.

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
- **THEN** la barra sigue teniendo una sola línea, el texto termina en puntos
  suspensivos y se lee entero al pasarle el puntero

### Requirement: El panel activo ocupa el espacio entre la navegación y la barra de estado

El panel del tab activo SHALL ocupar todo el ancho de la ventana, sin un tope
fijo, y todo el alto que hay entre la navegación y la barra de estado. Los
paneles SHALL verse integrados a la ventana, sin el aspecto de una tarjeta: sin
borde, sin esquinas redondeadas y sin un fondo distinto del de la ventana. Los
paneles de los tres tabs SHALL tener el mismo tamaño y la misma posición.

La ventana no SHALL desplazarse nunca: la navegación SHALL quedar pegada al
borde superior y la barra de estado al borde inferior de la ventana en
cualquier tamaño, también al entrar y salir de pantalla completa. Lo que no
entra en el panel SHALL desplazarse dentro del panel o dentro del área que lo
contiene.

En el tab Conexión, el texto de ayuda, los selectores y los botones SHALL
conservar un ancho máximo, para que no se estiren a lo ancho de una pantalla
grande, y SHALL quedar centrados dentro del panel.

#### Scenario: Los tres paneles son iguales

- **WHEN** la persona usuaria pasa por los tabs "Conexión", "Log" y
  "Workflow" sin cambiar el tamaño de la ventana
- **THEN** el panel de cada tab tiene el mismo tamaño y la misma posición

#### Scenario: Sin tarjeta

- **WHEN** se mira cualquier panel
- **THEN** no tiene borde, esquinas redondeadas ni un fondo que lo separe del
  resto de la ventana

#### Scenario: Pantalla completa

- **WHEN** la ventana está en pantalla completa, con cualquier tab activo
- **THEN** el panel ocupa todo el ancho de la ventana y llega hasta la barra
  de estado, que queda pegada al borde inferior de la pantalla, sin espacio
  libre debajo

#### Scenario: Salir de pantalla completa

- **GIVEN** la ventana está en pantalla completa
- **WHEN** la persona usuaria sale de pantalla completa
- **THEN** la navegación sigue pegada al borde superior y la barra de estado
  al borde inferior de la ventana, sin que haga falta desplazar nada para
  verlas

#### Scenario: Contenido de Conexión centrado

- **WHEN** la ventana está en pantalla completa y el tab activo es "Conexión"
- **THEN** el texto de ayuda, los selectores y los botones se ven con el mismo
  ancho que antes de este cambio, centrados en el panel

#### Scenario: Ventana muy baja

- **WHEN** la ventana es tan baja que el contenido del tab Conexión no entra
  en su panel
- **THEN** ese contenido se desplaza dentro del panel, y la navegación y la
  barra de estado siguen a la vista

## MODIFIED Requirements

### Requirement: Un solo panel visible a la vez

La aplicación SHALL mostrar únicamente el panel del tab activo y ocultar los
demás. El tab activo SHALL estar señalado visualmente en la navegación. Al
abrir la aplicación, el tab activo SHALL ser **Conexión**.

#### Scenario: Estado inicial

- **WHEN** se abre la aplicación
- **THEN** el tab activo es "Conexión", se ve el panel de conexión y no se ve
  el panel de log

#### Scenario: Cambio de tab

- **WHEN** la persona usuaria activa el tab "Log"
- **THEN** se ve el panel de log, se oculta el panel de conexión y "Log" queda
  señalado como activo en la navegación

#### Scenario: Volver a un tab ya visitado

- **WHEN** la persona usuaria vuelve al tab "Conexión" después de haber estado
  en "Log"
- **THEN** el panel de conexión se ve tal como estaba, con los mismos puertos
  seleccionados

### Requirement: Contenido de cada tab

El tab **Conexión** SHALL contener el texto de ayuda sobre la elección de
puertos, los selectores de puerto de entrada y salida, los botones de
actualizar puertos, conectar y desconectar, y la línea de mensajes de la
conexión. El tab **Log** SHALL contener el listado de mensajes MIDI, con su
fila de encabezados y el botón de limpiar en ella. El tab **Workflow** SHALL
contener el editor de flujos: el lienzo, la barra de herramientas y el panel
de configuración. Ningún panel SHALL tener un título que repita el nombre de
su tab. El texto de ayuda sobre la elección de puertos SHALL verse solo en el
tab Conexión.

#### Scenario: Controles de conexión

- **WHEN** el tab activo es "Conexión"
- **THEN** se ven el texto de ayuda, los dos selectores de puerto y los
  botones "Actualizar puertos", "Conectar" y "Desconectar"

#### Scenario: Controles del log

- **WHEN** el tab activo es "Log"
- **THEN** se ven la fila de encabezados con el botón "Limpiar" y el listado
  de mensajes MIDI

#### Scenario: Editor de flujos

- **WHEN** el tab activo es "Workflow"
- **THEN** se ven el lienzo, la barra de herramientas y el panel de
  configuración

#### Scenario: El texto de ayuda acompaña a su panel

- **WHEN** el tab activo es "Log"
- **THEN** el texto que explica cómo elegir los puertos no se ve

### Requirement: Los tabs son accesibles por teclado y por lectores de pantalla

Los controles de la navegación SHALL ser enfocables y activables con el
teclado, SHALL distinguir visualmente cuál tiene el foco, y SHALL exponer su
rol de tab, su nombre y cuál está seleccionado a las tecnologías de
asistencia; el ícono no SHALL anunciarse. El recorrido con el teclado SHALL
seguir el orden visual: primero la navegación y después el contenido del
panel activo.

#### Scenario: Activación por teclado

- **WHEN** la persona usuaria enfoca un control de la navegación con el
  teclado y lo activa con Enter o barra espaciadora
- **THEN** ese tab pasa a ser el activo

#### Scenario: Foco visible

- **WHEN** el foco del teclado llega a un control de la navegación
- **THEN** ese control se distingue de los demás, incluso si no es el tab
  activo

#### Scenario: Estado expuesto

- **WHEN** hay un tab activo
- **THEN** su control se anuncia por su nombre y como seleccionado, y los
  demás como no seleccionados

#### Scenario: Orden de tabulación

- **WHEN** la persona usuaria recorre la ventana con Tab desde el principio
- **THEN** pasa primero por los controles de la navegación y después por los
  del panel activo

## REMOVED Requirements

### Requirement: Barra de tabs al pie de la ventana

**Reason**: La navegación pasa arriba de los paneles, como selector
segmentado, y el pie de la ventana lo ocupa la barra de estado.

**Migration**: Ver "Navegación arriba de los paneles".

### Requirement: El encabezado es común a todos los tabs

**Reason**: Desaparece el encabezado: el nombre de la aplicación ya lo muestra
el sistema en la barra de la ventana, y el estado de la conexión pasa a la
barra de estado. Que el texto de ayuda viva en el tab Conexión queda en
"Contenido de cada tab".

**Migration**: Ver "La ventana no repite el nombre de la aplicación" y "Barra
de estado al pie".

### Requirement: Estado de conexión siempre visible

**Reason**: El indicador del encabezado se reemplaza por la barra de estado,
que además muestra los puertos conectados y los errores de conexión.

**Migration**: Ver "Barra de estado al pie".

### Requirement: El panel activo ocupa el espacio de la ventana

**Reason**: Ya no hay encabezado con el que alinear los paneles, y los paneles
dejan de verse como tarjetas. El resto del requisito sigue vigente, ahora
entre la navegación y la barra de estado.

**Migration**: Ver "El panel activo ocupa el espacio entre la navegación y la
barra de estado".
