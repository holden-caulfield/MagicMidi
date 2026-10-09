# Spec Delta

## MODIFIED Requirements

### Requirement: El ámbar es el único color de acento

La interfaz no SHALL usar azul. Un solo color ámbar SHALL marcar todo lo que
está encendido o elegido: el botón activo, la píldora y el chip elegidos, el
interruptor encendido, la perilla "hasta" y el tramo del rango, la caja
seleccionada en el lienzo, las conexiones y los conectores del lienzo, y el
foco del teclado. El texto sobre el ámbar SHALL ser oscuro en los dos modos.

Los colores con significado propio no cambian: el verde de las cajas de
inicio y de la conexión activa, el naranja de las cajas de fin, el rojo de los
errores y los colores del log. El rojo de los errores SHALL marcar también el
botón de pánico mientras está habilitado, porque avisa de una acción de
emergencia; no SHALL usarse como acento en ningún otro control. El botón de
pánico apretado, encendido o con el foco del teclado SHALL verse como
cualquier otro botón en ese estado, con el ámbar.

#### Scenario: Sin azul

- **WHEN** la persona usuaria recorre los tres tabs, en modo claro y en modo
  oscuro, con una caja seleccionada y el foco en un control
- **THEN** no hay ningún elemento azul

#### Scenario: Píldora elegida

- **GIVEN** una caja "Filtrar" seleccionada
- **WHEN** la persona usuaria elige el canal 10
- **THEN** la píldora "10" se ve con fondo ámbar y letra oscura

#### Scenario: El rojo del pánico

- **GIVEN** hay una conexión activa
- **WHEN** la persona usuaria mira la barra de navegación
- **THEN** el botón "Pánico" se ve con el fondo y la letra roja de los
  errores, y ningún otro botón de la ventana es rojo

#### Scenario: Apretar el botón de pánico

- **GIVEN** hay una conexión activa
- **WHEN** la persona usuaria aprieta el botón "Pánico" y lo mantiene
  apretado
- **THEN** el botón se ve con fondo ámbar y letra gris hasta que lo suelta,
  como cualquier botón apretado
