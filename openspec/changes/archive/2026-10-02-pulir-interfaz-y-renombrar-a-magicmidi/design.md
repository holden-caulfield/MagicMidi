# Design

## Context

La motivación está en `proposal.md`, y el comportamiento esperado en las delta
specs. Lo que condiciona el enfoque:

- `<ventana-principal>` dibuja hoy, en este orden, un encabezado (`<h1>` más
  `indicadorDeEstado()`), las `<section>` de los paneles y, última,
  `barraDeTabs()`. La barra va última para que el recorrido con el teclado siga
  el orden visual. Tanto la barra como el indicador son funciones, no
  componentes: la barra, para que los `aria-controls` queden en la misma raíz
  que los paneles; el indicador, porque no tiene estado propio.
- `describirMensaje()` devuelve un solo texto con las partes unidas por
  " · ", y `<panel-log>` lo pone en una sola columna de una grilla de cuatro
  (hora, bytes, descripción, marca). El ancho máximo de la lista (51rem) está
  calculado para la descripción más larga en una línea.
- `MensajeMidi` guarda solo los bytes; `tipo` y `canal` son getters, y
  AGENTS.md prohíbe sumar campos derivados que haya que mantener
  sincronizados.
- El nombre viejo aparece en `index.html`, `tauri.conf.json` (`productName`,
  `identifier`, título de la ventana), `Cargo.toml` (crate `tauri-midi`, lib
  `tauri_midi_lib`), `main.rs`, los nueve nombres de cliente de `midir` en
  `lib.rs`, `package.json`, `package-lock.json` y el README.
- `verificacion-para-agentes/pruebas/` busca el indicador con `.estado` y el
  botón de limpiar por su texto.

## Goals / Non-Goals

**Goals:**

- Que la ventana se vea como una aplicación de escritorio sin cambiar ningún
  comportamiento de conexión, log o flujo, más allá de lo que piden las specs.
- Que en el tamaño por defecto de la ventana (800 × 600) el log entre a lo
  ancho sin desplazamiento horizontal. El desplazamiento a lo ancho que pide
  la spec es la salida para ventanas más angostas, no el caso normal.
- Que el renombre no rompa nada que ya funciona: ni el CI, ni los clones
  existentes del repositorio.

**Non-Goals:**

- Un ícono nuevo para la aplicación (los de `src-tauri/icons/` quedan como
  están).
- Configurar la convención de octava (C3 o C4) desde la interfaz.
- Mostrar en la barra de estado errores de las cajas del flujo.
- Cambiar el tamaño por defecto de la ventana.

## Decisions

### `nota` es un getter de `MensajeMidi`; el nombre de la nota lo arma `describir.ts`

`MensajeMidi` suma `get nota(): number | null`: el segundo byte en Nota On,
Nota Off y Presión Polifónica (0 si falta, igual que hoy en `describir.ts`), y
`null` en los demás. `describir.ts` suma `nombreDeNota(numero)`, que devuelve
`"C4"`, `"C#4"`, `"C-1"`, etc.

- *Alternativa: un campo opcional `nota` en el constructor.* Se descarta:
  quedaría viejo en cuanto una caja como Desplazar cambie el segundo byte, que
  es justo lo que AGENTS.md pide evitar.
- *Alternativa: todo en `describir.ts`, sin tocar `MensajeMidi`.* Funciona,
  pero saber qué tipos llevan nota es un dato del protocolo, como el canal, y
  hoy `describir.ts` lo resuelve con un `switch` propio. El getter deja esa
  lectura en el mismo lugar que `tipo` y `canal`, y es lo que leería un nodo
  futuro que filtre por rango de notas. El nombre, en cambio, es presentación
  y queda fuera de `MensajeMidi`.

### La descripción se arma por partes

`describir.ts` exporta `partesDeLaDescripcion(mensaje): string[]`, y
`describirMensaje()` pasa a ser `partes.join(" · ")`. Así el texto completo
sigue existiendo para los tests y para cualquier otro uso, y el log dibuja
cada parte en su sub-columna. Los mensajes de canal dan entre tres y cuatro
partes (tipo, "canal N", valor, valor); los de sistema y los no reconocidos,
una sola parte, que el log dibuja con `grid-column: span 4`.

- *Alternativa: que el log parta el texto por " · ".* Se descarta: ata la
  vista a un detalle del formato del texto.

### Grilla de ancho fijo en `ch`, con encabezado fijo dentro del mismo scroll

Las filas y la fila de encabezados usan la misma `grid-template-columns`, con
las sub-columnas de la descripción en `ch` (la letra del log es monoespaciada):
tipo 18ch ("Presión Polifónica"), canal 8ch ("canal 16"), primer valor 15ch
("controlador 127", "nota C#-1 (1)"), segundo valor 13ch ("velocidad 127"). La
separación entre sub-columnas es menor que entre columnas, para que se lean
como una sola descripción.

La fila de encabezados va dentro del mismo contenedor que se desplaza, con
`position: sticky; top: 0`: así se desplaza a lo ancho junto con las filas y
queda quieta al desplazar a lo alto, sin sincronizar dos scrolls a mano. La
fila de encabezados conserva la letra monoespaciada, porque los `ch` de la
grilla se miden con la letra del contenedor; los títulos cambian a la letra
de la interfaz en cada `<span>`. Esa fila suma una columna `minmax(0, 1fr)`
que llega hasta el borde derecho, donde va el botón de limpiar. La
lista deja de tener tope de ancho: ocupa todo el panel, y lo que sobra queda a
la derecha porque las columnas no se estiran.

- *Alternativa: `<table>`.* Se descarta: los grupos (entrada más sub-filas) y
  la sub-fila sin hora son más simples con la grilla que ya existe.

### La barra de estado reemplaza a `indicadorDeEstado()` y sigue siendo una función

`conexion/conexion.ts` cambia `indicadorDeEstado()` por `barraDeEstado()` y
`estilosDelIndicador` por `estilosDeLaBarraDeEstado`. Como hoy, la dibuja
`<ventana-principal>`, que ya se redibuja con cada cambio del store. El estado
de la barra sale de una función pura, `estadoDeLaConexion(estado)`, que
devuelve `"conectado" | "desconectado" | "error"` y se testea en
`conexion.test.ts`. Error es estar desconectado con `mensajeConexion` no
vacío: es el mismo dato que muestra el panel, así los dos no se pueden
contradecir. Los nombres de los puertos salen de `puertoElegido()`, que ya
aplica `conNombresAMostrar`.

La barra lleva `role="status"` (que es *polite*), un ícono de Lucide por
estado (`Unplug`, `CircleCheck`, `TriangleAlert`), `white-space: nowrap` con
`text-overflow: ellipsis`, y el texto completo en `title`. Los colores son
variables nuevas en `estilos/global.css`, con su valor para modo oscuro:
`--fondo-estado-conectado`, `--letra-estado-conectado`,
`--fondo-estado-error` y `--letra-estado-error`. El estado desconectado usa el
fondo neutro que ya existe.

- *Alternativa: un componente `<barra-de-estado>`.* No tiene estado propio,
  estilos que encapsular ni ciclo de vida; AGENTS.md pide que eso siga siendo
  una función.

### Navegación: `barraDeTabs()` pasa arriba, como selector segmentado con íconos

`barraDeTabs()` sigue siendo una función en `ventana/barra-de-tabs.ts`, por la
misma razón que hoy (los `aria-controls`), y pasa a ser lo primero de la raíz:
con la barra arriba, el orden visual y el del teclado coinciden si va primera.
`Panel` suma `icono: IconNode`, y `PANELES` le da a cada tab el suyo (`Plug`,
`List`, `Workflow`: los de Lucide más parecidos a los
de Tabler que se usaron en los mockups). El ícono se dibuja con `dibujarIcono()` y es
`aria-hidden`, así que el nombre accesible sigue siendo el texto. El estilo
pasa de botones sueltos a un grupo con borde común y el tab activo con fondo,
centrado, sobre un fondo apenas distinto del de los paneles, como la barra de
herramientas de una ventana de macOS.

- *Alternativas que se mostraron en los mockups:* un riel de íconos a la
  izquierda (le resta ancho al lienzo de Workflow en una ventana de 800 px) y
  tabs y estado en una sola franja al pie (mezcla navegación con estado y le
  deja poco lugar a los nombres de los puertos). Se eligió el selector arriba.

### Paneles sin tarjeta

`.panel` pierde `border`, `border-radius` y `background-color`, y
`.contenedor` pierde su `padding`. Los paneles siguen compartiendo la clase
`.panel`, sin reglas por panel: cada tab pone el margen que necesita en su
propio componente. `<panel-conexion>` y `<panel-workflow>` llevan `padding`,
y la lista del log va a ras de los bordes del panel, sin esquinas
redondeadas, como una tabla de una aplicación de escritorio. El lienzo y el
panel de configuración conservan su borde, porque son controles.

### Renombre

- `productName`: `MagicMidi`; título de la ventana y `<title>`: `MagicMidi`;
  `identifier`: `com.jpsaraceno.magicmidi`.
- Crate `magicmidi`, lib `magicmidi_lib`. `package.json` `name`: `magicmidi`.
  El `Cargo.lock` y el `package-lock.json` se regeneran con `cargo check` y
  `npm install`, no se editan a mano.
- Nombres de cliente de `midir`: `magicmidi-…` en lugar de `tauri-midi-…`.
- README: título "MagicMidi" y una primera línea que lo presente como una
  herramienta para aprender MIDI. Tauri pasa a la sección técnica.
- Repositorio: `gh repo rename MagicMidi` y después
  `git remote set-url origin git@github.com:holden-caulfield/MagicMidi.git`.
  Va último, después del merge, y lo confirma la persona usuaria en el
  momento. GitHub redirige el nombre viejo (clones, links, PRs), así que nada
  se pierde. El CI no nombra el repositorio.
- Carpeta local: de `Tauri-MIDI` a `MagicMidi`, después de renombrar el
  repositorio. Es lo último del cambio porque la sesión de trabajo corre
  dentro de esa carpeta: hay que cerrarla, mover la carpeta y abrir una sesión
  nueva desde la carpeta nueva. Nada del proyecto guarda la ruta absoluta.

## Risks / Trade-offs

- [El `identifier` nuevo hace que el sistema vea otra aplicación: otra carpeta
  de datos del WebView y, en macOS, otra entrada en los permisos] → Hoy la
  aplicación no guarda nada entre sesiones y MIDI no pide permisos, así que
  no se pierde nada. Se avisa en el PR.
- [La redirección de GitHub deja de funcionar si alguna vez se crea otro
  repositorio llamado `Tauri-MIDI` en la misma cuenta] → Se actualiza el
  `origin` local en el mismo paso y se anota en el PR.
- [Las sub-columnas fijas suman ancho: a 800 px el log entra con poco margen]
  → Las medidas en `ch` y la separación angosta entre sub-columnas están
  calculadas para que entre. Si no entra, se ajusta la separación antes que
  abreviar los nombres ("velocidad", "controlador"), que son parte de lo
  didáctico. El desplazamiento a lo ancho queda como red.
- [60 = C4 no coincide con lo que muestran Ableton o Yamaha (C3)] → Es la
  notación científica, la más usada en material didáctico. Se documenta en el
  README.
- [En la barra de estado, los textos largos se cortan] → El texto completo
  queda en el globo y, para los errores, también en el panel de conexión.
- [Lo que guarda la ruta de la carpeta (la memoria y el historial de sesiones
  de Claude Code, editores, terminales abiertas) queda apuntando a la ruta
  vieja] → Se hace con todo cerrado, y la memoria del proyecto se copia a la
  ruta nueva si hace falta conservarla.
- [Las pruebas de `verificacion-para-agentes/` buscan `.estado` y el botón
  "Limpiar" por su texto] → Se actualizan en este mismo cambio, y la huella se
  regenera a propósito.

## Migration Plan

1. Rama `feat/interfaz-magicmidi`: implementación y renombre en el código, con
   la verificación completa de AGENTS.md.
2. Antes de archivar, proponer a la persona usuaria el diff de AGENTS.md: el
   nombre, la barra de tabs que pasa a ir primera, la barra de estado en lugar
   del indicador, el log sin tope de ancho y con la descripción por partes, y
   el getter `nota`.
3. Merge del PR.
4. Con confirmación explícita: `gh repo rename MagicMidi` y actualizar el
   `origin` local.
5. Renombrar la carpeta local a `MagicMidi`, con la sesión cerrada.

Para volver atrás, alcanza con revertir el merge. El renombre del repositorio
se deshace volviendo a renombrarlo.
