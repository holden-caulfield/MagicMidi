# Proposal

## Why

El nombre "Tauri MIDI" habla de la tecnología con que está hecha la
aplicación, que a quien la usa no le importa. Lo que sí le importa es para qué
sirve: es una herramienta para aprender MIDI. Además, la interfaz se ve como
una página web dentro de una ventana: repite el título que el sistema ya
muestra, usa tarjetas con bordes redondeados, títulos de sección que no
aportan y un encabezado alto para un indicador de una sola palabra. Este
cambio la acerca a una aplicación de escritorio y aprovecha para sumar al log
algo didáctico que hoy falta: el nombre de las notas.

## What Changes

- **Nombre**: la aplicación pasa a llamarse **MagicMidi** en el título de la
  ventana, el `productName`, el `identifier` del bundle
  (`com.jpsaraceno.magicmidi`), el crate de Rust, `package.json`, los nombres
  de cliente con que `midir` se registra en el sistema y el README. Al final,
  el repositorio de GitHub se renombra a `MagicMidi`. GitHub deja una
  redirección desde el nombre viejo, así que no es destructivo. Ese paso lo
  confirma la persona usuaria en el momento.
- **Sin encabezado**: se saca el título "Tauri MIDI" de adentro de la ventana,
  porque el sistema ya lo muestra en la barra de la ventana.
- **Navegación arriba**: la barra de tabs del pie se reemplaza por un selector
  segmentado con íconos y nombres, arriba de los paneles, como la barra de
  herramientas de una aplicación de macOS.
- **Barra de estado al pie**: el indicador "Conectado / Desconectado" pasa a
  una barra fina al pie de la ventana, con un ícono y un color de fondo
  distintos para cada estado: desconectado, conectado (con los nombres de los
  puertos de entrada y salida) y con error (con el texto del error, por
  ejemplo, que se perdió un puerto).
- **Paneles sin tarjeta**: los paneles dejan de dibujarse como tarjetas con
  borde, fondo y esquinas redondeadas: ocupan todo el lugar entre la
  navegación y la barra de estado.
- **Log sin título**: se saca el título "Mensajes MIDI". En su lugar, la lista
  tiene una fila de encabezados de columna (Hora, Bytes, Descripción), y el
  botón "Limpiar" pasa a ser un botón con ícono al final de esa fila.
- **Nombre de la nota en el log**: Nota On, Nota Off y Presión Polifónica
  muestran la nota con su nombre y su número, como "nota C4 (60)", con el Do
  central (60) como C4 y sostenidos para las notas negras.
- **Descripción en columnas alineadas**: cada parte de la descripción (tipo,
  canal, primer valor, segundo valor) ocupa una sub-columna de ancho fijo, así
  los valores de filas distintas quedan uno debajo del otro y se pueden
  comparar de un vistazo. Esto también rige para las sub-filas de salida.
- `MensajeMidi` suma un getter `nota` (el número de nota, o `null` en los
  mensajes que no llevan nota), calculado en cada lectura como `tipo` y
  `canal`. El nombre de la nota es presentación y lo arma `describir.ts`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `navegacion-por-tabs`: los tabs pasan arriba, como selector segmentado; el
  encabezado con el título desaparece y el estado de la conexión pasa a una
  barra de estado al pie, que muestra los puertos conectados y los errores;
  los paneles dejan de verse como tarjetas; el título de la ventana es
  "MagicMidi".
- `log-de-mensajes`: la descripción de las notas incluye el nombre de la nota;
  la descripción se dibuja en sub-columnas alineadas; la lista tiene fila de
  encabezados de columna y el botón de limpiar va en ella; se saca el título
  del log.
- `conexion-midi`: los escenarios de "Perder un puerto cierra la conexión"
  dejan de hablar del encabezado y pasan a la barra de estado, que ahora
  también muestra el error.
- `estado-de-la-interfaz`: los requisitos que nombran el indicador del
  encabezado pasan a nombrar la barra de estado.
- `editor-de-workflow`: "El lienzo ocupa el espacio disponible" pasa a medirse
  entre la navegación y la barra de estado.

## Impact

- **Frontend**: `src/ventana/` (sin `<h1>`, navegación arriba, barra de estado
  al pie, paneles sin tarjeta), `src/conexion/conexion.ts` (el indicador se
  convierte en la barra de estado), `src/log/panel-log.ts` (encabezados de
  columna, botón con ícono, sub-columnas), `src/midi/mensaje.ts` (getter
  `nota`), `src/midi/describir.ts` (nombre de la nota y descripción en
  partes), `src/estilos/global.css` (colores de la barra de estado en los dos
  modos), `index.html` (título).
- **Backend**: `src-tauri/Cargo.toml` y `Cargo.lock` (crate `magicmidi`, lib
  `magicmidi_lib`), `src-tauri/src/main.rs`, los nombres de cliente de `midir`
  en `src-tauri/src/lib.rs`, `tauri.conf.json`.
- **Efectos colaterales**: con otro `identifier`, el sistema trata a la
  aplicación como una nueva (otra carpeta de datos, y en macOS otra entrada
  en los permisos). Hoy no guarda nada entre sesiones, así que no se pierde
  nada. Los nombres de cliente de `midir` se ven en algunas herramientas del
  sistema (por ejemplo, `aconnect -l` en Linux). El renombre del repositorio
  cambia la URL del remoto; el nombre viejo sigue redirigiendo, pero conviene
  actualizar el `origin` local. La carpeta local pasa a llamarse
  `MagicMidi`, como último paso y con la sesión de trabajo cerrada.
- **AGENTS.md**: varias convenciones cambian (la barra de tabs ya no va
  última, la "fila más ancha" del log, el indicador como función). El diff se
  le propone a la persona usuaria antes de archivar.
- **Tests**: `mensaje.test.ts` y `describir.test.ts` suman casos. La huella de
  `verificacion-para-agentes/` cambia a propósito.
