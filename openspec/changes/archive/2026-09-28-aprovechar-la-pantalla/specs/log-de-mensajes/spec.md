## ADDED Requirements

### Requirement: La lista de mensajes ocupa el espacio disponible

La lista de mensajes del tab Log SHALL ocupar todo el ancho del panel y todo
el alto que queda en él debajo del encabezado del log, y SHALL acompañar los
cambios de tamaño de la ventana. Cuando las filas no entran, la que se
desplaza SHALL ser la lista: ni el panel ni la ventana.

#### Scenario: Ventana grande

- **GIVEN** la ventana está en pantalla completa y el tab activo es "Log"
- **WHEN** la persona usuaria mira el log
- **THEN** la lista de mensajes llega hasta el pie del panel y ocupa todo su
  ancho

#### Scenario: Más mensajes a la vista

- **GIVEN** el log tiene más filas de las que entran en la lista
- **WHEN** la persona usuaria agranda la ventana
- **THEN** se ven más filas a la vez que antes de agrandarla

#### Scenario: Muchas filas

- **GIVEN** el log tiene más filas de las que entran en la lista
- **WHEN** la persona usuaria las recorre
- **THEN** se desplaza la lista, y el encabezado del log y la barra de tabs
  quedan quietos
