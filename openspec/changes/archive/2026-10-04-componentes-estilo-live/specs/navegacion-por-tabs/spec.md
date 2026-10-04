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

## ADDED Requirements

### Requirement: Los botones de Conexión van debajo de los selectores

En el tab Conexión, los botones "Actualizar puertos", "Conectar" y
"Desconectar" SHALL ir siempre juntos en su propia línea, debajo de los dos
selectores de puerto, en cualquier ancho de la ventana. Cada uno SHALL tener
un ícono y su nombre, y los tres SHALL tener el mismo ancho.

#### Scenario: Ventana ancha

- **WHEN** la ventana está en pantalla completa y el tab activo es "Conexión"
- **THEN** los tres botones están en una línea debajo de los selectores, no al
  lado

#### Scenario: Botones parejos

- **WHEN** el tab activo es "Conexión"
- **THEN** "Actualizar puertos", "Conectar" y "Desconectar" tienen cada uno
  su ícono y los tres miden lo mismo de ancho
