# Design

## Context

Ver proposal.md (Why). Hoy los nombres de puerto recorren toda la conexión:
`listar_puertos_*` devuelve `Vec<String>`, `estado.ts` guarda listas de nombres
y el nombre elegido, `conectar` recibe dos nombres y busca el primer puerto que
coincida, y el vigilante (cambio `detectar-puerto-perdido`) busca esos nombres
en cada vuelta. `midir` 0.11 expone `MidiInputPort::id()` /
`MidiOutputPort::id()` y `find_port_by_id` en `MidiInput` y `MidiOutput`. En
macOS el identificador es el `uniqueID` de CoreMIDI: se verificó que no cambia
al desenchufar el Launchkey y enchufarlo en otro puerto USB.

## Goals / Non-Goals

**Goals:**
- Que elegir, conectar y vigilar se hagan por identificador, y que dos puertos
  con el mismo nombre se puedan distinguir y usar.

**Non-Goals:**
- Recordar la elección entre sesiones.
- Cambiar lo que muestra el log: `MensajeMidi.puerto` sigue siendo un nombre,
  y el log no lo muestra.

## Decisions

### Un tipo `Puerto` con identificador y nombre

El backend define `Puerto { id, nombre }` (serializable y deserializable), y
el frontend la interfaz equivalente. `listar_puertos_*` devuelve
`Vec<Puerto>` con el nombre que da el sistema. En `estado.ts`,
`puertosEntrada`/`puertosSalida` pasan a ser `Puerto[]` y
`puertoEntradaElegido`/`puertoSalidaElegido` guardan el identificador. Como el
identificador es un texto opaco, "nada elegido" sigue siendo `""`, y
`puertoVigente` compara identificadores.

### El " (2)" se calcula en el frontend, al mostrar

Una función pura toma la lista de un lado y devuelve el nombre a mostrar de
cada puerto: el nombre tal cual para el primero con ese nombre, y " (2)",
" (3)", … para los siguientes, en el orden de la lista. El selector la usa para
las opciones y `conectar` para saber cómo se llama lo elegido. No se guarda en
el estado: se deriva de la lista, que es la única fuente.

Se descartó numerar en el backend: el número es una decisión de presentación y
depende de la lista entera, que el frontend ya tiene. También se descartó
mostrar el identificador (por ejemplo "Teclado [896453812]"): es un número
opaco que no le dice nada a la persona usuaria.

### `conectar` recibe dos `Puerto`, con el nombre que se muestra

`conectar(puerto_entrada: Puerto, puerto_salida: Puerto)`: el backend busca
cada uno con `find_port_by_id` y usa `nombre` solo para los mensajes, tanto el
de "No se encontró el puerto de …" como el del vigilante. El frontend manda en
`nombre` lo que muestra el selector, así los mensajes coinciden con lo que la
persona usuaria eligió ("Teclado (2)"). La alternativa, que el backend
recalcule el nombre a mostrar, repetiría la numeración en dos lugares.

### El vigilante busca por identificador

`vigilar_conexion` recibe los dos `Puerto` y en cada vuelta usa
`find_port_by_id`. El resto (número de conexión, lock, evento
`conexion-perdida`) no cambia.

## Risks / Trade-offs

- [En Linux (ALSA) el identificador son los números de cliente y puerto, que
  pueden cambiar al volver a enchufar] → ahí "volver a conectar sin tocar los
  selectores" falla con "No se encontró el puerto de …" y hay que presionar
  "Actualizar puertos" y elegir de nuevo. En JACK el identificador es el
  nombre, así que los nombres repetidos siguen sin distinguirse. La aplicación
  se prueba en macOS; si se apunta a otro sistema, se revisa entonces.
- [Si desaparece el primero de dos puertos con el mismo nombre, al actualizar
  el que era "Teclado (2)" pasa a mostrarse como "Teclado"] → la elección se
  conserva porque va por identificador; solo cambia la etiqueta, y refleja la
  lista actual.
- [Cambia la forma de los comandos `listar_puertos_*` y `conectar`] → el único
  cliente es el frontend de este repositorio, que se actualiza en el mismo
  cambio.
