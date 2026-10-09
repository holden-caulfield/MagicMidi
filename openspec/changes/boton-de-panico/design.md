# Design

## Context

Ver `proposal.md` (Why) para la motivación, y las specs `panico` y
`nodo-panico` para el comportamiento. Lo que condiciona el diseño:

- **El backend no procesa ni describe mensajes** (AGENTS.md): envía lo que el
  frontend le pide con `enviar_mensaje`, de a uno. Del lado del frontend,
  `enviarMensaje` (`workflow/salida.ts`) encadena cada envío al anterior, así
  que todo lo que se pide sale en orden.
- **Las cajas no envían mensajes**: lo que devuelve una caja sin salida es lo
  que sale por el puerto, y el log muestra exactamente eso. Hoy `procesar`
  devuelve un mensaje como máximo.
- **`estado.conectado` ya está en el store**, y lo leen componentes de áreas
  distintas, como la barra de estado.
- **La barra de navegación la dibuja `ventana-principal`**, centrada con flex,
  porque los tabs se enlazan por `id` con sus paneles. Lo que no se enlaza por
  `id`, como la barra de estado, es un componente de su módulo que la ventana
  solo monta.
- **Los controles se estilizan solo en `componentes/`**: el botón de pánico no
  puede pintar un `<button>` por su cuenta.
- **No hay atajos de teclado globales en la aplicación**: cada campo maneja sus
  propias teclas con `@keydown`, y ninguno usa Cmd ni Ctrl con el punto.

## Goals / Non-Goals

**Goals:**

- Una sola fuente de los mensajes del pánico, que usen igual el botón, el
  atajo y la caja.
- Que la caja Pánico sea un tipo de nodo como cualquier otro: un archivo, una
  línea en el catálogo, y sin trato especial en el ejecutor.
- Que el cambio de contrato de `procesar` se explique en pocas líneas en
  `nodos/LEEME.md`, para quien recién empieza.

**Non-Goals:**

- Recordar qué notas quedaron prendidas para apagar solo esas: es la idea
  "Evitar notas colgadas al editar en vivo" del roadmap, y va aparte.
- Un atajo global del sistema o un ítem en el menú nativo de la aplicación.
- Mandar el pánico a más de un puerto: hoy hay una sola salida.
- Registrar en el log lo que manda el botón o el atajo.

## Decisions

### Los mensajes se arman en el frontend, en `midi/panico.ts`

Una función pura, `mensajesDePanico()`, devuelve los 64 mensajes como
`MensajeMidi` nuevos en cada llamada (así una caja o el recorrido los pueden
copiar o modificar sin tocar los de otro disparo). Va en `midi/` porque es
conocimiento del protocolo, como `notas.ts` y `describir.ts`, y la importan
tanto el tipo de nodo como la acción del botón.

Alternativas descartadas:

- **Un comando `panico` en Rust.** Sería más eficiente, pero pondría en el
  backend conocimiento de qué es cada mensaje, contra el límite de AGENTS.md.
  Y la caja no podría usarlo sin enviar algo por su cuenta, que rompe "las
  cajas no envían mensajes" y que el log muestre exactamente lo que salió.
- **Un comando genérico `enviar_mensajes` que envíe una lista de una vez.**
  Respeta el límite (el backend sigue sin saber qué manda), pero con 64
  mensajes no hace falta: son 64 `invoke` en la misma cola, del orden de
  milisegundos. Queda como salida si algún día se manda mucho más.

### Cuatro mensajes por canal, canal por canal

En cada canal, del 1 al 16: CC 64 = 0, CC 120, CC 121 y CC 123, todos con
valor 0 (el porqué de cada uno está en la spec `panico`). El pedal va primero
para que, cuando llega el All Notes Off, ya no retenga nada. Se recorre canal
por canal, y no mensaje por mensaje, porque así cada grupo de cuatro limpia un
canal entero y la lista se lee igual en el test y en el log; la diferencia de
tiempo es despreciable (todo el pánico son 192 bytes, unos 60 ms por un cable
DIN).

Alternativas descartadas:

- **Un Nota Off por cada nota de cada canal** (2048 mensajes). Es lo que hace
  el pánico "completo" de Logic o Samplitude, para equipos que ignoran el
  CC 123. Son 6 KB: por DIN tardan entre 1,3 y 2 s, y mientras tanto la cola
  de salida queda tapada y lo que se toca sale con ese retraso.
- **Solo CC 123** (16 mensajes). No apaga las notas que retiene el pedal, y
  algunos equipos responden al 120 y no al 123.
- **Reset del Sistema (`FF`)**: algunos equipos vuelven al estado de encendido
  y pierden los sonidos editados. **Detener (`FC`)** y los reset por SysEx no
  apagan notas y tienen otros efectos.

### `procesar` puede devolver una lista, en cualquier caja

El tipo de `procesar` pasa a ser `MensajeMidi | MensajeMidi[] | null | void`.
`procesarEn` normaliza el resultado a una lista (nada es una lista vacía, un
mensaje es una lista de uno), valida cada elemento con `esMensajeValido`, y
con un elemento inválido lanza el mismo error de siempre ("produjo un mensaje
MIDI inválido"). Después:

- en una caja sin salida, agrega todos a `salidas` y devuelve que llegó a un
  fin, aunque la lista esté vacía (como Descartar hoy);
- en una caja con salida, entrega cada mensaje en orden, con un `for` y no con
  `.some()`, por la misma razón que `entregar`: cortaría en el primero que
  llega a un fin.

Alternativas descartadas:

- **Solo las cajas sin salida pueden devolver una lista.** Pide una excepción
  en la regla, o tipos distintos según `tieneSalida`, y cuesta más que
  permitirlo siempre. Permitirlo en cualquier caja deja una sola regla: "una
  caja devuelve nada, un mensaje o una lista".
- **Que `procesar` devuelva siempre una lista.** Obliga a cambiar todos los
  nodos y sus tests, y complica el caso común, que es devolver un mensaje.

### La caja es un tipo de nodo común

`nodos/panico.ts` declara `tieneSalida: false`, ningún parámetro, el ícono
`Siren` y un `procesar` que devuelve `mensajesDePanico()`. Importar
`@/midi/panico` entra en lo que la spec `tipos-de-nodo` permite: una función
auxiliar del procesamiento MIDI, sin efectos. Va al final del catálogo,
después de Descartar, junto a las otras cajas de fin. El color de caja de fin
sale solo de `etapaDelTipo`.

### El botón y su atajo son un componente de `conexion/`

`conexion/boton-de-panico.ts` define `<boton-de-panico>`. Va en el módulo de la
conexión, como la barra de estado, porque depende de si hay conexión y actúa
sobre la salida. Lee `estado.conectado` con su `ControladorDeEstado`, y
`ventana-principal` solo lo monta en la barra.

La acción que manda el pánico, `mandarPanico()`, va en `conexion/conexion.ts`,
con las demás acciones, porque la lógica que no dibuja no vive en un
componente. Recorre `mensajesDePanico()` con `enviarMensaje`, en la misma cola
que el flujo, y por eso respeta el orden de salida sin hacer nada más.
`enviarMensaje` se queda en `workflow/salida.ts`: moverlo agrandaría el cambio
sin cambiar nada.

El componente es dueño también del atajo, así el listener y el
`aria-keyshortcuts` que lo anuncia están en el mismo lugar:

- escucha `keydown` en `window`, en fase de captura, desde que se conecta
  hasta que se desconecta, para que ningún campo ni el lienzo lo frenen antes;
- reconoce el punto (`evento.key === "."`) con Cmd en macOS y con Ctrl en los
  demás sistemas; la plataforma se lee una vez, del `userAgent`;
- llama a `preventDefault()` para que WebKit no lo tome como un "cancelar", e
  ignora las repeticiones (`evento.repeat`);
- sin conexión no hace nada. Con conexión, llama a `mandarPanico()` y enciende
  el botón un instante (`activo` durante unos 150 ms).

`main.ts` no lo engancha: ahí se conectan los eventos del backend, y el atajo
es un comportamiento de la interfaz.

Alternativas descartadas:

- **Un atajo global** (`tauri-plugin-global-shortcut`): le quita la
  combinación a todas las demás aplicaciones, y suma un plugin y sus permisos.
  Para disparar el pánico con otra aplicación al frente está la caja.
- **Un ítem del menú nativo con su atajo**: macOS lo muestra donde se esperan
  los atajos, pero hay que armar en Rust el menú entero de la aplicación y
  sumar un evento del backend. Puede llegar después, sin cambiar esto.

### El rojo es una variante de `boton-de-accion`

`boton-de-accion` suma dos propiedades:

- `urgente`: mientras el botón está habilitado, lo pinta con `--fondo-error` y
  `--letra-error`, que ya cambian solos en modo oscuro. Deshabilitado se ve
  como cualquier botón deshabilitado, sin rojo. Con el puntero encima se
  invierten fondo y letra, que se distinguen y se leen en los dos modos. Las
  reglas van antes de las de `activo` y del botón apretado, así esos estados
  siguen siendo ámbar.
- `atajo`: lo anuncia con `aria-keyshortcuts` y lo muestra en el globo nativo
  (`title`).

Así el botón de pánico no estiliza nada por su cuenta, y un botón urgente se
vería igual en cualquier otro lugar.

Alternativa descartada: **un botón propio en `boton-de-panico`.** Rompe la
regla de que ningún componente estiliza un `<button>` fuera de
`componentes/`.

### La barra de navegación pasa a tres columnas

`.barra-tabs` deja de ser un flex centrado y pasa a una grilla de tres
columnas (`1fr auto 1fr`): el selector va en la del medio y el botón de pánico
en la derecha, pegado al borde. Así el selector queda centrado a lo ancho
aunque el botón ocupe lugar. El botón va después del selector en el DOM, y el
recorrido con Tab sigue el orden visual.

## Risks / Trade-offs

- [WebKit podría tomar Cmd+. como "cancelar" antes de que llegue a la página]
  → Se prueba en la ventana real antes de dar el cambio por terminado. Si no
  llega, la salida es el ítem del menú nativo con su atajo, que se consultaría
  con la persona usuaria antes de hacerlo.
- [Hay equipos que ignoran el CC 120, el 121 y el 123] → El pánico no los
  apaga. La solución precisa es recordar qué Nota On salió (idea del roadmap),
  no mandar 2048 Nota Off.
- [El CC 121 también vuelve la expresión a 127 y la modulación a 0] → Es lo
  esperable en un pánico, y el próximo movimiento del controlador lo
  restablece.
- [Cada disparo de la caja agrega 64 sub-filas al log, y 128 si un botón
  momentáneo la dispara al apretar y al soltar] → Se acepta: el log muestra
  exactamente lo que salió. La spec `nodo-panico` muestra cómo filtrar para que
  salga una sola vez.
- [Permitir listas en cajas con salida es más de lo que pide el pánico] → Cuesta
  lo mismo que restringirlo, deja una sola regla, y queda cubierto por los
  tests del ejecutor.
- [El botón (22 px) es más alto que los tabs, y la barra de navegación crece
  un par de píxeles] → La huella de la interfaz cambia en esa barra, a
  propósito. Se revisa en la captura con la persona usuaria.
- [Con la ventana muy angosta, la columna derecha puede quedar más chica que el
  botón] → Hay que comprobar el ancho mínimo en que se ve bien. Si hace falta,
  la columna del botón toma al menos su ancho y el selector se corre un poco
  del centro.
