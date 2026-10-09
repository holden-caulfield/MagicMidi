# panico Specification

## Purpose
Define el pánico: los mensajes que apagan todo lo que suena en el equipo
conectado a la salida, y los dos accesos que no dependen del flujo, el botón
siempre a la vista y el atajo de teclado. La caja del flujo que manda lo
mismo está en la spec `nodo-panico`.

## Requirements

### Requirement: El pánico apaga todo en los 16 canales

El pánico SHALL ser una lista de 64 mensajes de Cambio de Control, cuatro por
canal, recorriendo los canales del 1 al 16 en orden. En cada canal SHALL ir,
en este orden:

1. el pedal de sustain (CC 64) con valor 0, porque All Notes Off deja sonando
   las notas que retiene el pedal;
2. All Sound Off (CC 120) con valor 0, que corta el sonido al instante,
   incluidas las colas;
3. Reset All Controllers (CC 121) con valor 0, que vuelve el pitch bend al
   centro, la modulación a 0 y los pedales arriba;
4. All Notes Off (CC 123) con valor 0.

El pánico no SHALL incluir ningún otro mensaje: ni un Nota Off por cada nota,
ni Reset del Sistema (`FF`), ni Detener (`FC`), ni mensajes de SysEx. Los tres
accesos al pánico (el botón, el atajo de teclado y la caja Pánico) SHALL
mandar exactamente esta lista, en este orden.

#### Scenario: El primer canal

- **WHEN** se manda el pánico
- **THEN** los primeros cuatro mensajes que salen son `B0 40 00`, `B0 78 00`,
  `B0 79 00` y `B0 7B 00`, en ese orden

#### Scenario: El último canal

- **WHEN** se manda el pánico
- **THEN** los últimos cuatro mensajes que salen son `BF 40 00`, `BF 78 00`,
  `BF 79 00` y `BF 7B 00`, y en total salen 64

#### Scenario: Nada más que Cambios de Control

- **WHEN** se manda el pánico
- **THEN** todos los mensajes que salen son Cambios de Control con valor 0:
  ningún Nota Off, ningún mensaje de sistema y ningún SysEx

### Requirement: El pánico respeta el orden de la salida

Los mensajes del pánico SHALL salir por el puerto de salida en el mismo orden
que todo lo demás que se envía: después de lo que ya se había pedido enviar,
incluido lo que emitió el flujo, y antes de lo que se pida enviar después.

#### Scenario: Entre dos mensajes del flujo

- **GIVEN** hay una conexión activa y el lienzo está como al abrir la
  aplicación (trigger → Emitir)
- **WHEN** llega `90 3C 64`, después la persona usuaria aprieta el botón de
  pánico y después llega `90 40 64`
- **THEN** por el puerto de salida sale `90 3C 64`, después los 64 mensajes
  del pánico y después `90 40 64`

### Requirement: Un botón de pánico siempre a la vista

La ventana SHALL mostrar un botón con el ícono del pánico y el texto
"Pánico", a la derecha de la barra de navegación, visible desde cualquier tab
(ver la spec `navegacion-por-tabs`). El ícono SHALL ser el mismo que el de la
caja Pánico.

El botón SHALL estar habilitado solo mientras hay una conexión activa.
Habilitado, SHALL verse con el fondo y la letra del rojo de los errores, en
modo claro y en modo oscuro, y el puntero encima SHALL distinguirse del estado
normal sin perder la legibilidad. Mientras se aprieta, SHALL verse como
cualquier botón apretado (ver la spec `estilo-de-la-interfaz`). Deshabilitado,
SHALL verse atenuado, como cualquier botón deshabilitado, y sin rojo.

Activar el botón, con el mouse o con el teclado, SHALL mandar el pánico.
Deshabilitado, no SHALL mandar nada ni mostrar ningún error. El botón SHALL
anunciarse a las tecnologías de asistencia como "Pánico", junto con su atajo
de teclado, y SHALL mostrar el atajo al pasar el puntero.

#### Scenario: Apretar el botón con conexión

- **GIVEN** hay una conexión activa
- **WHEN** la persona usuaria hace clic en "Pánico"
- **THEN** salen por el puerto de salida los 64 mensajes del pánico

#### Scenario: Visible desde cualquier tab

- **WHEN** la persona usuaria pasa por los tabs "Conexión", "Workflow" y "Log"
- **THEN** en los tres ve el botón "Pánico" en el mismo lugar, a la derecha
  de la barra de navegación

#### Scenario: Sin conexión

- **GIVEN** la aplicación está desconectada
- **WHEN** la persona usuaria mira el botón "Pánico" y le hace clic
- **THEN** el botón se ve atenuado y sin rojo, no sale nada y no aparece
  ningún error

#### Scenario: Se pierde la conexión

- **GIVEN** hay una conexión activa y el botón "Pánico" se ve rojo
- **WHEN** se desconecta el puerto de salida
- **THEN** el botón pasa a verse atenuado y deja de responder

#### Scenario: Rojo en modo oscuro

- **GIVEN** la aplicación está en modo oscuro y hay una conexión activa
- **WHEN** la persona usuaria mira el botón "Pánico"
- **THEN** se ve con el rojo de los errores del modo oscuro, con el texto
  legible, igual que la barra de estado cuando hay un error

### Requirement: Un atajo de teclado para el pánico

Mientras la ventana de la aplicación tiene el foco, Cmd+. en macOS, y Ctrl+.
en Windows y Linux, SHALL mandar el pánico, sea cual sea el tab activo y esté
donde esté el foco del teclado, también dentro de un campo de texto. No SHALL
ser un atajo global del sistema: con otra aplicación al frente, la
combinación no SHALL llegar a MagicMidi.

Sin conexión, el atajo no SHALL hacer nada. Mantener la combinación apretada
no SHALL repetir el pánico. Cada vez que el atajo manda el pánico, el botón de
pánico SHALL encenderse un instante, así se ve que funcionó.

#### Scenario: Desde un campo de texto

- **GIVEN** hay una conexión activa y el foco está en un campo numérico del
  panel de configuración
- **WHEN** la persona usuaria aprieta Cmd+. (Ctrl+. fuera de macOS)
- **THEN** salen los 64 mensajes del pánico, el botón se enciende un instante
  y el valor del campo no cambia

#### Scenario: Sin conexión

- **GIVEN** la aplicación está desconectada
- **WHEN** la persona usuaria aprieta el atajo
- **THEN** no sale nada, no aparece ningún error y el botón no se enciende

#### Scenario: Mantener apretado

- **GIVEN** hay una conexión activa
- **WHEN** la persona usuaria mantiene apretado el atajo durante varios
  segundos
- **THEN** el pánico sale una sola vez

#### Scenario: Otra aplicación al frente

- **GIVEN** hay una conexión activa y otra aplicación tiene el foco
- **WHEN** la persona usuaria aprieta Cmd+.
- **THEN** MagicMidi no manda nada
