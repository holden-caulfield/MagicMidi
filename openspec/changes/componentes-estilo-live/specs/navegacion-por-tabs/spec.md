# Spec Delta

## MODIFIED Requirements

### Requirement: Navegación arriba de los paneles

La ventana principal SHALL mostrar, arriba de los paneles, un selector
segmentado con un control por cada tab disponible, centrado a lo ancho. Cada
control SHALL mostrar un ícono y el nombre del tab. En esta versión los tabs
son exactamente tres: **Conexión**, **Workflow** y **Log**, en ese orden, así
el editor de flujos queda en el centro. La navegación SHALL quedar siempre
visible: no se desplaza con el contenido del panel activo.

#### Scenario: La navegación lista los tabs disponibles

- **WHEN** se abre la aplicación
- **THEN** arriba de la ventana se ve un selector con los controles
  "Conexión", "Workflow" y "Log", en ese orden, cada uno con su ícono

#### Scenario: El orden de tabulación sigue al de la barra

- **WHEN** la persona usuaria recorre la navegación con Tab
- **THEN** pasa por "Conexión", "Workflow" y "Log", en ese orden

#### Scenario: La navegación no se va con el scroll

- **WHEN** el contenido del panel activo es más alto que el lugar que tiene y
  la persona usuaria lo desplaza
- **THEN** la navegación sigue visible arriba
