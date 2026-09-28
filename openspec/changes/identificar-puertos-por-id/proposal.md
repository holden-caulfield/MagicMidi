# Proposal

## Why

La aplicación identifica cada puerto solo por su nombre: los selectores guardan
nombres, `conectar` abre el primer puerto con ese nombre y el vigilante de la
conexión busca ese nombre en la lista. Si dos puertos se llaman igual (por
ejemplo, dos controladores del mismo modelo), el segundo no se puede usar, y si
se pierde el que estaba conectado, el vigilante ve al otro con el mismo nombre
y no detecta la pérdida. Es el Hallazgo 5 de `documentar-conexion-y-log`.
`midir` da, para cada puerto, un identificador que el sistema asigna y que en
macOS se mantiene al desenchufar y volver a enchufar el dispositivo, incluso en
otro puerto USB (verificado con el Launchkey MK3).

## What Changes

- Cada puerto se identifica por el identificador que da el sistema. El nombre
  pasa a ser solo lo que se muestra.
- Los comandos de listado devuelven, para cada puerto, su identificador y su
  nombre. `conectar` recibe los identificadores elegidos y, para armar los
  mensajes, el nombre con que se muestra cada uno.
- El vigilante de la conexión busca los puertos por identificador.
- Si dos puertos del mismo lado tienen el mismo nombre, el selector los
  distingue agregando " (2)", " (3)", … a partir del segundo, en el orden en que
  los informa el sistema.
- Los mensajes que ve la persona usuaria siguen nombrando los puertos, con el
  nombre que muestra el selector (incluido el " (2)" si lo tiene).

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `conexion-midi`: "Los puertos se ofrecen por nombre" pasa a "Los puertos se
  identifican por el sistema y se muestran por nombre" (con el caso de nombres
  repetidos); "Una conexión es siempre un par entrada/salida" y "Perder un
  puerto cierra la conexión" buscan por identificador.
- `estado-de-la-interfaz`: "La lista de puertos refleja los puertos
  disponibles" aclara que la elección se conserva si sigue el mismo puerto, no
  otro con el mismo nombre.

## Impact

- **Backend** (`src-tauri/src/lib.rs`): `listar_puertos_*`, `conectar`,
  `abrir_conexiones` y `vigilar_conexion`. Cambia la forma de los comandos de
  listado y de `conectar`; el evento `mensaje-midi` no cambia.
- **Frontend**: `src/estado.ts` (las listas pasan a ser de puertos con
  identificador y nombre, y lo elegido es un identificador) y `src/conexion.ts`.
- **Otros sistemas**: en Linux (ALSA) el identificador son los números de
  cliente y puerto, que pueden cambiar al volver a enchufar; en JACK es el
  nombre. Ver design.md.
- **AGENTS.md**: la sección de backend describe el vigilante "por nombre"; se
  propone el diff al archivar.
