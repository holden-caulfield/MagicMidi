# estilo-de-la-interfaz Specification

## Purpose
Define la apariencia común de toda la interfaz de MagicMidi: un único juego de
controles que se ve igual en cualquier panel, con una estética fina y compacta
(cercana a la de Ableton Live), el ámbar como único color de acento y el ícono
de la aplicación.

## Requirements

### Requirement: Un mismo control se ve igual en cualquier lugar

Cada clase de control (botón, lista desplegable, campo numérico, interruptor,
píldora, chip de una opción elegida, campo de búsqueda y rango) SHALL tener una
única apariencia en toda la aplicación: la misma letra, alto, esquinas,
colores y estados, esté en el panel de conexión, en el log, en la barra de
herramientas del workflow o en el panel de configuración de una caja.

#### Scenario: Lista de puertos y lista de un parámetro

- **GIVEN** el tab "Conexión" y una caja "Mapear" seleccionada en el tab
  "Workflow"
- **WHEN** la persona usuaria compara el selector "Puerto de entrada" con el
  campo "Byte" de la caja
- **THEN** los dos tienen el mismo alto, la misma letra, las mismas esquinas,
  el mismo fondo y la misma flecha

#### Scenario: La lista desplegada es de la aplicación

- **WHEN** la persona usuaria abre el selector "Puerto de entrada" o el
  campo "Byte" de una caja
- **THEN** la lista que se despliega tiene el mismo ancho que el control y
  se ve igual que la del campo de los tipos de mensaje, en lugar de la lista
  del sistema

#### Scenario: Botones de distintos paneles

- **WHEN** la persona usuaria compara el botón "Conectar" del tab "Conexión"
  con cualquier otro botón de texto de la aplicación
- **THEN** se ven con el mismo alto, letra, esquinas y fondo

### Requirement: La interfaz es fina y compacta, sin efectos de profundidad

La letra base de la interfaz SHALL ser de 12 px, y la de las etiquetas de los
campos, de 11 px. Los botones SHALL medir 22 px de alto; las listas, campos y
búsquedas, 20 px, y las píldoras, chips y el rango, 18 px. Las esquinas de los controles
SHALL ser de 2 px. Los campos SHALL distinguirse del panel por un fondo gris
de relleno, sin borde. Ningún control, caja ni panel SHALL tener sombras,
degradés de profundidad ni halos difuminados. La barra de tabs y la barra de
estado SHALL seguir la misma escala.

El log conserva su letra monoespaciada.

#### Scenario: Controles a la misma escala que las barras

- **WHEN** la persona usuaria mira el tab "Conexión"
- **THEN** los selectores y botones tienen la misma escala de letra y de alto
  que los controles de la barra de tabs, y ninguno tiene sombra

#### Scenario: Sin profundidad en el lienzo

- **WHEN** la persona usuaria selecciona una caja del lienzo
- **THEN** la señal de selección es una línea nítida, sin sombra ni halo
  difuminado

### Requirement: El ámbar es el único color de acento

La interfaz no SHALL usar azul. Un solo color ámbar SHALL marcar todo lo que
está encendido o elegido: el botón activo, la píldora y el chip elegidos, el
interruptor encendido, la perilla "hasta" y el tramo del rango, la caja
seleccionada en el lienzo, las conexiones y los conectores del lienzo, y el
foco del teclado. El texto sobre el ámbar SHALL ser oscuro en los dos modos.

Los colores con significado propio no cambian: el verde de las cajas de
inicio y de la conexión activa, el naranja de las cajas de fin, el rojo de los
errores y los colores del log.

#### Scenario: Sin azul

- **WHEN** la persona usuaria recorre los tres tabs, en modo claro y en modo
  oscuro, con una caja seleccionada y el foco en un control
- **THEN** no hay ningún elemento azul

#### Scenario: Píldora elegida

- **GIVEN** una caja "Filtrar" seleccionada
- **WHEN** la persona usuaria elige el canal 10
- **THEN** la píldora "10" se ve con fondo ámbar y letra oscura

### Requirement: Los estados se leen en modo claro y en modo oscuro

El estado normal, el de puntero encima, el encendido, el encendido con
puntero encima, el deshabilitado y el de error de cada control SHALL
distinguirse entre sí y mantener su texto legible en el modo claro y en el
oscuro. El puntero encima de un control encendido SHALL aclarar el ámbar y
conservar la letra oscura, en lugar de pasar al gris del estado normal.
Mientras se aprieta, un botón SHALL pasar a fondo ámbar con letra gris, así
responde al clic.

#### Scenario: Puntero sobre un botón activo

- **GIVEN** la aplicación en modo oscuro y un control encendido
- **WHEN** la persona usuaria pasa el puntero por encima
- **THEN** el control se ve en un ámbar más claro y su texto sigue oscuro y
  legible

#### Scenario: Apretar un botón

- **WHEN** la persona usuaria aprieta el botón "Actualizar puertos" y lo
  mantiene apretado
- **THEN** el botón se ve con fondo ámbar y letra gris hasta que lo suelta

#### Scenario: Deshabilitado

- **GIVEN** la aplicación está conectada
- **WHEN** la persona usuaria mira el botón "Conectar"
- **THEN** se ve atenuado, distinto de "Desconectar", y el puntero encima no
  lo cambia

### Requirement: El foco del teclado siempre se ve

Todo control enfocable SHALL mostrar, mientras tiene el foco del teclado, un
contorno ámbar fino separado del control, que se distinga también sobre un
control encendido. El foco que llega con el mouse no SHALL mostrar el
contorno.

#### Scenario: El contorno de foco no se corta

- **GIVEN** una caja "Filtrar" seleccionada
- **WHEN** la persona usuaria recorre con Tab los controles del panel de
  configuración
- **THEN** el contorno de foco de cada control se ve entero, también en los
  que llegan a los bordes del panel

#### Scenario: Foco sobre una píldora elegida

- **GIVEN** una caja "Filtrar" con el canal 1 elegido
- **WHEN** la persona usuaria llega con Tab a la píldora "1"
- **THEN** la píldora muestra el contorno de foco, separado de su fondo ámbar

### Requirement: Ícono de la aplicación

El ícono de la aplicación SHALL ser un cuadrado de esquinas redondeadas gris
grafito, plano, con el dibujo del puerto MIDI de cinco contactos en un gris
claro y los dos destellos en ámbar. SHALL ser el mismo en todas las medidas
que usa el sistema (Dock, barra de tareas, ventana) y reconocerse a 32 px.

#### Scenario: Ícono en el Dock

- **WHEN** se abre la aplicación en macOS
- **THEN** el Dock muestra el ícono gris con el puerto MIDI claro y los
  destellos ámbar, sin azul
