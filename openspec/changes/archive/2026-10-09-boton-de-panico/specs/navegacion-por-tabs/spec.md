# Spec Delta

## MODIFIED Requirements

### Requirement: Los tabs son accesibles por teclado y por lectores de pantalla

Los controles de la navegación SHALL ser enfocables y activables con el
teclado, SHALL distinguir visualmente cuál tiene el foco, y SHALL exponer su
rol de tab, su nombre y cuál está seleccionado a las tecnologías de
asistencia; el ícono no SHALL anunciarse. El botón de pánico, que comparte la
barra, no es un tab y no SHALL anunciarse como tal. El recorrido con el
teclado SHALL seguir el orden visual: primero los tabs, después el botón de
pánico y después el contenido del panel activo.

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

- **GIVEN** hay una conexión activa, así que el botón de pánico está
  habilitado
- **WHEN** la persona usuaria recorre la ventana con Tab desde el principio
- **THEN** pasa primero por los controles de la navegación, después por el
  botón "Pánico" y después por los del panel activo

#### Scenario: El botón de pánico no es un tab

- **WHEN** una tecnología de asistencia recorre la navegación
- **THEN** anuncia tres tabs, "Conexión", "Workflow" y "Log", y el botón
  "Pánico" como un botón aparte

### Requirement: Navegación arriba de los paneles

La ventana principal SHALL mostrar, arriba de los paneles, un selector
segmentado con un control por cada tab disponible, centrado a lo ancho. Cada
control SHALL mostrar un ícono y el nombre del tab. En esta versión los tabs
son exactamente tres: **Conexión**, **Workflow** y **Log**, en ese orden, así
el editor de flujos queda en el centro. En la misma barra, contra el borde
derecho, SHALL estar el botón de pánico (ver la spec `panico`), sin correr el
selector del centro. La navegación SHALL quedar siempre visible: no se
desplaza con el contenido del panel activo.

#### Scenario: La navegación lista los tabs disponibles

- **WHEN** se abre la aplicación
- **THEN** arriba de la ventana se ve un selector con los controles
  "Conexión", "Workflow" y "Log", en ese orden, cada uno con su ícono

#### Scenario: El botón de pánico no corre los tabs

- **WHEN** se abre la aplicación
- **THEN** el selector de tabs sigue centrado a lo ancho de la ventana, y el
  botón "Pánico" está contra el borde derecho de la misma barra

#### Scenario: El orden de tabulación sigue al de la barra

- **WHEN** la persona usuaria recorre la navegación con Tab
- **THEN** pasa por "Conexión", "Workflow" y "Log", en ese orden

#### Scenario: La navegación no se va con el scroll

- **WHEN** el contenido del panel activo es más alto que el lugar que tiene y
  la persona usuaria lo desplaza
- **THEN** la navegación y el botón de pánico siguen visibles arriba
