# Spec Delta

## MODIFIED Requirements

### Requirement: El lienzo ocupa el espacio disponible

El lienzo del tab Workflow SHALL ocupar todo el alto que queda en el panel
debajo de la barra de herramientas y del texto de ayuda, y todo el ancho que
deja libre el panel de configuración. El panel de configuración SHALL
conservar su ancho, tener el mismo alto que el lienzo y, si sus campos no
entran, desplazarse él. Lo que haya en el lienzo, incluidas las cajas que
quedan fuera de la parte visible, no SHALL cambiar el tamaño del panel.

Cambiar el tamaño de la ventana, a mano o entrando y saliendo de pantalla
completa, SHALL cambiar solo cuánto del lienzo se ve: las cajas SHALL quedar
en el mismo lugar respecto de la esquina superior izquierda del lienzo, con el
mismo zoom, y las conexiones SHALL seguir unidas a sus conectores.

#### Scenario: Ventana grande

- **GIVEN** la ventana está en pantalla completa y el tab activo es "Workflow"
- **WHEN** la persona usuaria mira el editor
- **THEN** el lienzo llega hasta el pie del panel y se extiende a lo ancho
  hasta el panel de configuración, que mantiene el mismo ancho que con la
  ventana chica

#### Scenario: Ventana por defecto

- **WHEN** se abre la aplicación con la ventana en su tamaño por defecto y se
  activa el tab "Workflow"
- **THEN** el panel entra entero entre la navegación y la barra de estado,
  sin barra de desplazamiento

#### Scenario: Agrandar la ventana con el flujo a la vista

- **GIVEN** el tab activo es "Workflow" y hay un flujo armado
- **WHEN** la persona usuaria agranda la ventana o la pasa a pantalla
  completa
- **THEN** las cajas siguen en el mismo lugar y con el mismo tamaño, se ve
  más superficie libre del lienzo, y las conexiones siguen dibujadas entre
  sus conectores

#### Scenario: Volver de pantalla completa con una caja lejos

- **GIVEN** la ventana está en pantalla completa, el tab activo es "Workflow"
  y la persona usuaria movió una caja cerca del borde derecho del lienzo
- **WHEN** sale de pantalla completa y la ventana vuelve a su tamaño anterior
- **THEN** el lienzo se achica, la caja queda fuera de la parte visible, y la
  barra de estado sigue pegada al pie de la ventana, sin barra de
  desplazamiento

#### Scenario: Agregar una caja con clic en un lienzo grande

- **GIVEN** la ventana está en pantalla completa y el tab activo es "Workflow"
- **WHEN** la persona usuaria hace clic en una caja de la barra de
  herramientas
- **THEN** la caja nueva aparece cerca del centro de la parte visible del
  lienzo
