## ADDED Requirements

### Requirement: El panel activo ocupa el espacio de la ventana

El panel del tab activo SHALL ocupar todo el ancho de la ventana, sin un tope
fijo, y todo el alto que hay entre el encabezado y la barra de tabs. Los
paneles de los tres tabs SHALL tener el mismo tamaño y el mismo aspecto, y el
encabezado SHALL quedar alineado con ellos.

La ventana no SHALL desplazarse nunca: la barra de tabs SHALL quedar pegada al
borde inferior de la ventana en cualquier tamaño, también al entrar y salir de
pantalla completa. Lo que no entra en el panel SHALL desplazarse dentro del
panel o dentro del área que lo contiene.

En el tab Conexión, el texto de ayuda, los selectores y los botones SHALL
conservar un ancho máximo, para que no se estiren a lo ancho de una pantalla
grande, y SHALL quedar centrados dentro del panel.

#### Scenario: Los tres paneles son iguales

- **WHEN** la persona usuaria pasa por los tabs "Conexión", "Log" y
  "Workflow" sin cambiar el tamaño de la ventana
- **THEN** el panel de cada tab tiene el mismo tamaño y la misma posición

#### Scenario: Pantalla completa

- **WHEN** la ventana está en pantalla completa, con cualquier tab activo
- **THEN** el panel ocupa todo el ancho de la ventana, salvo los márgenes, y
  llega hasta la barra de tabs, que queda pegada al borde inferior de la
  pantalla, sin espacio libre debajo

#### Scenario: Salir de pantalla completa

- **GIVEN** la ventana está en pantalla completa
- **WHEN** la persona usuaria sale de pantalla completa
- **THEN** la barra de tabs sigue pegada al borde inferior de la ventana, sin
  que haga falta desplazar nada para verla

#### Scenario: Contenido de Conexión centrado

- **WHEN** la ventana está en pantalla completa y el tab activo es "Conexión"
- **THEN** el texto de ayuda, los selectores y los botones se ven con el mismo
  ancho que antes de este cambio, centrados en el panel

#### Scenario: Ventana muy baja

- **WHEN** la ventana es tan baja que el contenido del tab Conexión no entra
  en su panel
- **THEN** ese contenido se desplaza dentro del panel, y el encabezado y la
  barra de tabs siguen a la vista

#### Scenario: El encabezado acompaña a los paneles

- **WHEN** la persona usuaria agranda la ventana
- **THEN** el título queda alineado con el borde izquierdo de los paneles y
  el indicador de conexión con el borde derecho
