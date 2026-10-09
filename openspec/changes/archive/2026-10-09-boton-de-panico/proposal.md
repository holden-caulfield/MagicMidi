# Proposal

## Why

Cuando una nota queda colgada (porque se cambió un Desplazar con la tecla
apretada, porque se cortó la conexión en medio de una nota, o por el propio
equipo), hoy no hay forma de apagarla desde la aplicación: hay que ir al sinte.
Un botón de pánico es la red de seguridad de cualquier set en vivo, y tiene que
estar a mano de tres formas: en la pantalla, en el teclado de la computadora y
en el controlador MIDI, para cuando la ventana de MagicMidi no está al frente.

## What Changes

- **Los mensajes del pánico**: en cada uno de los 16 canales, y en este orden,
  suelta el pedal de sustain (CC 64 = 0), corta todo el sonido (CC 120, All
  Sound Off), vuelve los controladores a su valor inicial (CC 121, Reset All
  Controllers) y apaga las notas (CC 123, All Notes Off): 64 mensajes, 192
  bytes. Quedan afuera a propósito el Note Off nota por nota, el Reset del
  Sistema (`FF`), Detener (`FC`) y los reset por SysEx.
- Los tres accesos usan **la misma lista de mensajes**, que se arma en el
  frontend. El backend no cambia: sigue enviando lo que le piden, sin saber qué
  es un pánico.
- **Botón de pánico** a la derecha de la barra de navegación, con ícono y el
  texto "Pánico", visible desde cualquier tab. Habilitado solo mientras hay
  conexión, y en ese estado se ve en el rojo de los errores; sin conexión se ve
  atenuado, como cualquier botón deshabilitado.
- **Atajo de teclado**: Cmd+. en macOS y Ctrl+. en Windows y Linux, mientras la
  ventana de la aplicación está enfocada, esté donde esté el foco. Sin conexión
  no hace nada. Al usarlo, el botón se enciende un instante.
- **Caja "Pánico"**: una caja de fin (naranja), sin parámetros, que devuelve los
  mensajes del pánico por cada mensaje que le llega. Mapear un botón del
  controlador al pánico se arma con un Filtrar antes.
- **Una caja puede devolver varios mensajes**: `procesar` pasa a poder devolver
  una lista, en cualquier caja. En una caja de fin salen todos, en orden; en
  una caja con salida, cada uno sigue por separado hacia las cajas siguientes.
  Una lista vacía es lo mismo que no devolver nada, y una lista con algún
  mensaje inválido es un error de la caja.
- **El log**: lo que sale por la caja Pánico se ve como sub-filas del mensaje
  que la disparó, como cualquier salida. Lo que mandan el botón y el atajo no
  aparece en el log, porque no sale de ningún mensaje que entró.
- El ícono del botón y de la caja es `Siren` de Lucide.

## Capabilities

### New Capabilities

- `panico`: qué mensajes manda el pánico y en qué orden, el botón (dónde está,
  cuándo está habilitado, cómo se ve) y el atajo de teclado.
- `nodo-panico`: la caja Pánico, cómo se dispara desde un controlador y cómo se
  ve en el log.

### Modified Capabilities

- `tipos-de-nodo`: la función de procesamiento puede devolver una lista de
  mensajes, y los tipos de esta versión pasan a ser ocho.
- `ejecucion-de-workflow`: una caja que devuelve varios mensajes los pasa por
  separado, o los emite todos si es de fin; un mensaje inválido dentro de una
  lista cuenta como error de la caja.
- `editor-de-workflow`: la barra ofrece ocho cajas, con Pánico al final, y
  Pánico se ve como caja de fin.
- `navegacion-por-tabs`: la barra de navegación lleva el botón de pánico a la
  derecha, y el recorrido con el teclado pasa por él después de los tabs.
- `estilo-de-la-interfaz`: el rojo es el color de los errores, las emergencias
  y las alertas, como el botón de pánico habilitado.
- `log-de-mensajes`: lo que manda el pánico desde el botón o el atajo no
  aparece en el log.

## Impact

- Código nuevo: `src/midi/panico.ts` (la lista de mensajes, con su test),
  `src/workflow/nodos/panico.ts` (con su test) y
  `src/conexion/boton-de-panico.ts` (el botón y su atajo).
- Código que cambia:
  - `workflow/tipos.ts` y `workflow/ejecutar.ts`: `procesar` puede devolver
    una lista;
  - `nodos/catalogo.ts`: la entrada nueva, al final;
  - `conexion/conexion.ts`: la acción que manda el pánico;
  - `componentes/boton-de-accion.ts`: la variante roja y el atajo;
  - `ventana/ventana-principal.ts`: la barra de navegación hace lugar para el
    botón.
- Sin cambios en el backend ni en `workflow/salida.ts`: el pánico usa
  `enviarMensaje`, en la misma cola que lo que emite el flujo.
- Documentación: "Qué hace hoy" y "Cajas disponibles" de `README.md`, y
  `nodos/LEEME.md` (devolver varios mensajes). Al archivar, se propondrá
  ajustar en AGENTS.md la regla de los colores (el rojo, para errores,
  emergencias y alertas) y lo que puede devolver una caja.
- La huella de la interfaz cambia en la barra de navegación, a propósito.
- Roadmap: resuelve la idea "Botón de pánico".
