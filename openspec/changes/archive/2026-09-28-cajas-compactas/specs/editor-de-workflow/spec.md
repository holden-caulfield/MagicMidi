## MODIFIED Requirements

### Requirement: El tab Workflow tiene lienzo, barra de herramientas y panel de configuración

El panel del tab Workflow SHALL mostrar a la vez tres cosas: un lienzo donde
están las cajas del flujo y sus conexiones, una barra de herramientas con las
cajas que se pueden agregar y un panel con la configuración de la caja
seleccionada.

Cada caja, tanto en el lienzo como en la barra, SHALL mostrar solo el ícono
propio de su tipo, sin su nombre escrito. El nombre SHALL aparecer en un globo
de ayuda al pasar el puntero por encima de la caja, y también al llegar con el
teclado a un control de la barra. El nombre SHALL seguir siendo el nombre
accesible de cada control de la barra y estar disponible para lectores de
pantalla en las cajas del lienzo.

Las cajas del lienzo SHALL ser cuadradas, más altas que los controles de la
barra y con un ícono más grande que el de la barra. Los controles de la barra
SHALL mantener la altura que tenían cuando mostraban el nombre.

#### Scenario: Partes del tab

- **WHEN** la persona usuaria activa el tab "Workflow"
- **THEN** ve el lienzo, la barra de herramientas y el panel de configuración

#### Scenario: Cajas con ícono

- **WHEN** hay una caja en el lienzo o en la barra
- **THEN** se ve el ícono de su tipo, sin su nombre escrito, y dos cajas de
  tipos distintos tienen íconos distintos

#### Scenario: Nombre al pasar el puntero

- **WHEN** la persona usuaria pasa el puntero por encima de una caja
  "Desplazar", en el lienzo o en la barra
- **THEN** aparece un globo de ayuda que dice "Desplazar", y desaparece al
  sacar el puntero

#### Scenario: Nombre al llegar con el teclado

- **WHEN** la persona usuaria llega con Tab al control "Emitir" de la barra
- **THEN** aparece un globo de ayuda que dice "Emitir", y un lector de
  pantalla anuncia el control como "Emitir"

#### Scenario: Cajas cuadradas en el lienzo

- **WHEN** hay una caja en el lienzo
- **THEN** es igual de ancha que de alta, y más grande que el control de su
  tipo en la barra

#### Scenario: El panel sigue nombrando la caja

- **WHEN** la persona usuaria selecciona una caja del lienzo
- **THEN** el panel de configuración muestra su nombre como título, como
  antes

## ADDED Requirements

### Requirement: Las cajas de inicio y de fin del flujo se distinguen por color

Cada caja del lienzo SHALL mostrarse con el color que corresponde a su etapa
en el flujo:

- **inicio**: el trigger, con fondo verde claro y borde verde;
- **fin**: toda caja cuyo tipo no tiene salida, con fondo naranja claro y borde
  naranja;
- **intermedia**: el resto, con el fondo y el borde neutros de siempre.

La etapa SHALL deducirse de los conectores de la caja, sin que el tipo de nodo
declare un color. Los controles de la barra SHALL usar el mismo color que
tendrá la caja en el lienzo. Ninguno de los dos colores SHALL confundirse con
el que señala la caja seleccionada: una caja de inicio o de fin seleccionada
SHALL conservar su fondo y verse seleccionada igual que las demás. Los colores
SHALL mantener legible el ícono en el modo claro y en el oscuro.

#### Scenario: Lienzo inicial con colores

- **WHEN** se abre la aplicación y se activa el tab "Workflow"
- **THEN** la caja "Mensaje MIDI recibido" se ve verde y la caja "Emitir" se ve
  naranja

#### Scenario: Caja intermedia

- **WHEN** la persona usuaria agrega una caja "Desplazar"
- **THEN** se ve con el fondo neutro, distinta del trigger y del Emitir

#### Scenario: La barra anticipa el color

- **WHEN** la persona usuaria mira la barra de herramientas
- **THEN** el control "Emitir" se ve naranja y el control "Desplazar" neutro

#### Scenario: Seleccionar una caja de color

- **WHEN** la persona usuaria selecciona la caja "Emitir"
- **THEN** la caja sigue naranja y además se ve seleccionada, con la misma
  señal que cualquier otra caja seleccionada
