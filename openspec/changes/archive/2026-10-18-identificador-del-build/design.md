# Design

## Context

- La versión vive solo en `src-tauri/Cargo.toml` y es la del próximo release
  (ver "Versiones y distribución" en AGENTS.md).
- `.github/workflows/distribucion.yml` calcula hoy el identificador del build
  `dev` en su paso `preparar`, con `git describe` y `git rev-list`, y lee la
  versión con `cargo metadata`. Ese identificador va solo al título del
  release: la app no lo conoce.
- La barra de estado es `<barra-de-estado>`, en `src/conexion/`, y dibuja
  solo el estado de la conexión. Su `<footer>` lleva `role="status"`, así que
  todo lo que tiene adentro es una región que se anuncia.
- `<ventana-principal>` dibuja la barra de tabs y las secciones de los
  paneles, que se enlazan por `id` (`aria-controls` en cada tab,
  `aria-labelledby` en cada sección). Por eso las dibuja el mismo componente:
  un `id` no cruza de una raíz de Shadow DOM a otra. El botón de pánico, que
  va en la barra de tabs, es `<boton-de-panico>`, en `src/conexion/`.
- El frontend se compila con Vite en los dos casos en que se arma la app:
  `tauri dev` y el `beforeBuildCommand` de `tauri build`. Donde se compila la
  app hay Node, y casi siempre git.

## Goals / Non-Goals

**Goals:**

- Que un solo código calcule el identificador, y que la app y el workflow lo
  tomen de ahí.
- Que un build local también se identifique, sin que nadie le pase nada.

**Non-Goals:**

- Marcar un build hecho con cambios sin commitear: lleva el identificador
  del último commit.
- Cambiar la versión que llevan los instaladores (el `Info.plist`, el `.deb`,
  el instalador de Windows): sigue siendo la de `Cargo.toml`, porque cada
  formato tiene sus reglas de versión y algunos solo aceptan números.
- Mostrar el identificador en otro lado, como una ventana de "Acerca de".

## Decisions

### Un módulo de Node en la raíz calcula el identificador

`identificador-del-build.mjs`, al lado de `vite.config.ts`, exporta la
función que lo calcula y, ejecutado con `node`, lo imprime. Lo importa
`vite.config.ts` y lo ejecuta el workflow.

Adentro separa la parte pura (armar el texto a partir de la versión, si el
commit es estable, los merges y el commit) de la lectura de git, para poder
probar la primera sin repositorio. La versión la lee de la primera línea
`version = "…"` de `Cargo.toml`, que es la de `[package]` porque esa sección
va primera, sin depender de `cargo`: así sirve también en los tests y en el
job de frontend del CI. El commit son los primeros 7 caracteres del hash
completo, y no `--short`, que se alarga solo cuando hay ambigüedad. Si
cualquier comando de git falla, el resultado es `<versión>-dev`.

Es `.mjs` y no TypeScript: `tsc` revisa solo `src/`, así que un `.ts` afuera
no se revisaría, y uno adentro mezclaría código de Node con el del navegador,
que no tiene los tipos de Node. Va en la raíz porque es un solo archivo, que
usan el build y el CI, y no la app.

Alternativas descartadas:

- **`build.rs` en Rust**, con un comando del backend para pedirlo. La app lo
  tendría, pero el workflow no podría usarlo sin compilar, y sumaría un
  comando para una constante.
- **Que lo calcule el workflow y se lo pase al build** con una variable de
  entorno. Un build local quedaría sin identificador, o lo calcularía otro
  código.
- **`getVersion()` de Tauri más un sufijo armado en el frontend.** El
  identificador se armaría en dos lugares.

### Vite lo deja fijo en el frontend

`vite.config.ts` lo calcula una vez al arrancar y lo pone en una constante
global con `define`, declarada en un `.d.ts` de `src/` para que `tsc` la
conozca. Vale igual en `vite build` y en el servidor de `tauri dev`. Vitest
usa la misma configuración, así que la constante existe también en los
tests.

Se descartó `import.meta.env` con una variable `VITE_…` cargada desde la
configuración: es la misma idea, con un paso más.

### El workflow toma el identificador del módulo

- `preparar` corre `node identificador-del-build.mjs` y deja de usar
  `git describe`, `git rev-list` y `cargo metadata`. En un push de un tag
  `vX.Y.Z`, el identificador tiene que empezar con `X.Y.Z+`: eso solo pasa si
  el commit es estable y su versión es la del tag, así que una sola
  comprobación cubre las dos condiciones. Si no se cumple, falla antes de
  compilar, como hoy.
- La etiqueta de los archivos sigue saliendo del evento: `dev` en un push a
  `main`, la versión en un tag. No sale del identificador porque un commit de
  `main` con tag (al volver a correr el workflow de ese merge) daría un
  identificador estable, y sus archivos tienen que seguir llamándose `dev`.
- `preparar` y los tres jobs de `compilar` hacen el checkout con
  `fetch-depth: 0`, que trae el historial y los tags. Sin eso, el conteo de
  merges sale mal sin dar error.

Como `preparar` y los builds corren el mismo código sobre el mismo commit,
el título del release y la app dicen lo mismo.

### El módulo `ventana` es la estructura de la ventana

Con el identificador, la barra de estado junta dos cosas y deja de ser solo
de la conexión. En vez de buscarle otro dueño suelto, `ventana/` pasa a
reunir lo que está siempre presente, sea cual sea el panel: los tabs con sus
paneles y la barra de estado, y a futuro los menús y los atajos generales.
Cada pieza es un componente en su archivo:

- `ventana-principal.ts`: la raíz. Importa los paneles de sus módulos y tiene
  `PANELES`, que sigue siendo la única fuente de los paneles. Dibuja
  `<navegacion-por-tabs>`, al que le pasa los paneles y las acciones, y
  `<barra-de-estado>`.
- `navegacion-por-tabs.ts`, nuevo: la barra de tabs y las secciones de los
  paneles, con sus estilos. Recibe los paneles por propiedad, con su
  contenido, y dibuja cada uno en su sección. El panel activo pasa a ser
  estado suyo (`@state`), porque es el único que lo usa.
- `boton-de-panico.ts`, movido de `conexion/`. `mandarPanico` sigue en
  `conexion/`: la ventana dibuja el botón, y la conexión manda el pánico.
- `barra-de-estado.ts`, movido de `conexion/`. La parte de la conexión se
  sigue calculando con las funciones de `conexion/`.
  - El identificador va a la derecha (`margin-left: auto`), sin achicarse ni
    cortarse; el texto de la conexión es el que se corta.
  - `role="status"` pasa del `<footer>` al texto de la conexión, así el
    identificador queda fuera de lo que se anuncia.
  - Hereda el color de texto del estado, como el resto de la barra, y se
    puede seleccionar.

Es una excepción a la regla de AGENTS.md de que un módulo es dueño de un
comportamiento y no de una región de la pantalla: `ventana/` es dueño de la
estructura, y lo que cada pieza hace sigue en su módulo. Al archivar se
propone el diff de AGENTS.md para "Organización del código" y "Paneles y
tabs".

### Los tabs y sus paneles, en un mismo componente

Los tabs y las secciones siguen enlazándose por `id` (`aria-controls`,
`aria-labelledby`), y un `id` solo se encuentra en su misma raíz de Shadow
DOM. Por eso el componente nuevo no es solo la barra de tabs: recibe el
contenido de los paneles y dibuja también las secciones, en la misma raíz
que los tabs. Es como ARIA define el patrón de tabs: un solo control con la
lista de tabs y sus paneles.

Alternativas descartadas:

- **Solo la barra en su componente**, con las secciones en
  `<ventana-principal>`. Los enlaces por `id` quedarían rotos sin dar error:
  habría que nombrar cada sección con `aria-label` y sacar `aria-controls`,
  y se perdería la relación entre cada tab y su panel.
- **Dejar los tabs en `ventana-principal.ts`**, como hoy. No quedan en su
  archivo.
- **`ariaControlsElements`**, una referencia a elementos que sí puede apuntar
  a la raíz de arriba. Depende de que WebKit la soporte, y no está
  confirmado.

### Las acciones de la barra llegan por un slot

`<navegacion-por-tabs>` no sabe del pánico: lo que va a la derecha de la
barra lo decide la ventana, que le pasa `<boton-de-panico>` en un slot
`acciones`. Es la forma de la plataforma de pasarle contenido a un
componente, y ya se usa en `boton-de-accion`. Los paneles, en cambio, van por
propiedad porque cada uno necesita su id, su título y su ícono junto con el
contenido, en una sola lista; una acción solo necesita su lugar. El slot va
en la barra, antes de las secciones, así que el orden de tabulación sigue
siendo tabs, pánico y panel. Se llama `acciones` porque así llama AGENTS.md
a lo que va a la derecha de la barra, y porque un menú futuro no sería un
botón.

Alternativas descartadas:

- **Que el componente de tabs importe el botón de pánico.** Mezcla la
  navegación con una acción puntual.
- **Una propiedad con la plantilla de las acciones.** Funciona igual, pero
  pasa una plantilla donde la plataforma ya tiene una forma de pasar
  contenido.

## Risks / Trade-offs

- [Un checkout sin historial calcula mal el conteo, sin dar error] →
  `fetch-depth: 0` donde el resultado se publica (los jobs de
  `distribucion.yml`). El job de frontend de `ci.yml` compila con un clon
  corto, así que su identificador sale mal, pero no se publica.
- [En `tauri dev`, el identificador se calcula al arrancar Vite] → un commit
  nuevo no lo cambia hasta reiniciar. Es solo para desarrollo.
- [Leer la versión con un patrón en vez de con `cargo`] → depende de que
  `[package]` vaya primero en `Cargo.toml`, que es como lo genera cargo y
  como está hoy. El test del módulo lo cubre leyendo el `Cargo.toml` real.
- [Mover componentes de carpeta y sacar los tabs de la raíz] → no cambia
  nada visible, pero se puede romper sin dar error: el orden de tabulación,
  la activación con el teclado, los enlaces por `id` o un panel que deja de
  ocultarse. Se revisa con `verificacion-para-agentes/pruebas/tabs.js`, que
  ya comprueba los enlaces y que los paneles ocultos sigan montados, con la
  huella de la interfaz antes y después, y en la ventana real, que es donde
  se prueban Enter y la barra espaciadora.

## Migration Plan

No hay nada que migrar. Al mergear, el primer release `dev` ya toma el
identificador del módulo, y el próximo estable lo comprueba igual que hoy. Si
algo sale mal, se revierte el PR.
