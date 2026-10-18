# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador, o con `verificacion-para-agentes/` (ver AGENTS.md, "Verificación
antes de dar por terminada una tarea"). Lo que dependa de WebKit, como
seleccionar texto, se prueba en la ventana real con `npm run tauri dev`.

## 1. El cálculo del identificador

- [x] 1.1 Crear `identificador-del-build.mjs` en la raíz (design.md, "Un
      módulo de Node en la raíz calcula el identificador"): una función pura
      que arma el texto a partir de la versión, los tags del commit, los
      merges y el hash (o sin datos de git), otra pura que lee la versión del
      texto de un `Cargo.toml`, y la que junta todo leyendo git y el archivo;
      ejecutado con `node`, imprime el identificador. Verificar con
      `node identificador-del-build.mjs`, que en este repositorio tiene que
      dar `0.1.1-dev.<n>+<commit>`, con `<n>` igual a
      `git rev-list --count --first-parent v0.1.0..HEAD` y `<commit>` igual a
      los 7 primeros caracteres de `git rev-parse HEAD`
- [x] 1.2 `identificador-del-build.test.mjs` al lado, para las dos funciones
      puras: los escenarios de "Formato del identificador" (spec
      `identificador-del-build`), incluido el commit con el tag de otra
      versión, y la lectura de la versión de un `Cargo.toml` con
      dependencias que también dicen `version`. Verificar con `npm test`
- [x] 1.3 Probar el caso sin git: una copia del código sin `.git` (con
      `git archive`, en una carpeta temporal) y verificar que el módulo
      imprime `0.1.1-dev` sin fallar

## 2. El módulo `ventana`

- [x] 2.1 Mover `boton-de-panico.ts` y `barra-de-estado.ts` de
      `src/conexion/` a `src/ventana/`, con su JSDoc al día y los imports
      (design.md, "El módulo `ventana` es la estructura de la ventana"); lo
      que hace cada uno (`mandarPanico`, el estado de la conexión) sigue en
      `conexion/`. Verificar con `npx tsc --noEmit`, y en el navegador que el
      botón de pánico se habilita y se ve en rojo con
      `actualizar({ conectado: true })`, y que la barra de estado no cambió
- [x] 2.2 Crear `src/ventana/navegacion-por-tabs.ts`, con la barra de tabs,
      las secciones de los paneles y sus estilos: recibe los paneles por
      propiedad, con su contenido, es dueño del panel activo (`@state`), y
      tiene a la derecha de la barra un slot `acciones` (design.md, "Los
      tabs y sus paneles, en un mismo componente" y "Las acciones de la
      barra llegan por un slot"). `ventana-principal.ts` conserva `PANELES`,
      se lo pasa, y le pone `<boton-de-panico>` en el slot. Verificar con
      `npx tsc --noEmit`, y en el navegador: un clic cambia de tab, el panel
      oculto sigue montado, el orden de tabulación es tabs, pánico y panel,
      y se exponen tres tabs con su nombre y cuál está seleccionado, y el
      botón "Pánico" aparte
- [x] 2.3 En `verificacion-para-agentes/pruebas/tabs.js`, buscar los tabs y
      las secciones en la raíz de `<navegacion-por-tabs>`. Verificar
      corriendo esa prueba, con los enlaces por `id` intactos, y que la
      huella de la interfaz es la misma que antes de los movimientos
- [x] 2.4 En la ventana real (`npm run tauri dev`), verificar que los tabs y
      el botón de pánico se activan con Enter y con la barra espaciadora

## 3. El identificador en la barra de estado

- [x] 3.1 En `vite.config.ts`, calcular el identificador y dejarlo en una
      constante global con `define`, declarada en un `.d.ts` de `src/`
      (design.md, "Vite lo deja fijo en el frontend"). Verificar con
      `npx tsc --noEmit` y con `npm run build`, buscando el identificador en
      `dist/`
- [x] 3.2 Dibujar el identificador a la derecha de la barra, sin achicarse,
      con el color del estado y seleccionable, y pasar `role="status"` del
      `<footer>` al texto de la conexión (spec `navegacion-por-tabs`, "Barra
      de estado al pie"). Verificar en el navegador, llevando el store a
      cada estado con `actualizar()`: el identificador se ve entero a la
      derecha en los tres; con la ventana angosta y nombres largos se corta
      solo el texto de la conexión; y el elemento con `role="status"` no lo
      contiene
- [x] 3.3 En `verificacion-para-agentes/pruebas/`, que `conexion.js` lea el
      estado de la conexión sin el identificador, y que `tabs.js` revise que
      el identificador está a la vista. Verificar corriendo esas pruebas
- [x] 3.4 En la ventana real (`npm run tauri dev`), verificar que el
      identificador se ve, se puede seleccionar y se copia entero

## 4. El workflow de distribución

- [x] 4.1 En `preparar`, tomar el identificador de
      `node identificador-del-build.mjs` y sacar `git describe`,
      `git rev-list` y `cargo metadata`; en un tag, exigir que el
      identificador empiece con la versión del tag seguida de `+` (design.md,
      "El workflow toma el identificador del módulo"). Verificar corriendo el
      script del paso localmente, como en #48, en tres casos: una rama (da el
      identificador y la etiqueta `dev`), el tag de la versión sobre un clon
      donde el commit lo tiene (da la versión) y un tag de otra versión
      (falla con el mensaje)
- [ ] 4.2 Checkout con `fetch-depth: 0` en los jobs de `compilar`. Verificar
      en la corrida del PR, que se dispara porque cambia el workflow: el
      paso `preparar` da el identificador del commit del PR, los tres builds
      terminan, y la app del `.dmg` de esa corrida muestra el mismo
      identificador

## 5. Documentación y verificación final

- [x] 5.1 README: en "Descargar", que el identificador de cada build se ve
      también en la barra de estado de la app; en "Estructura del
      repositorio", el módulo nuevo. Verificar releyendo las dos secciones
- [x] 5.2 Correr la verificación de AGENTS.md que corresponde al cambio:
      `npx tsc --noEmit`, `npm test` y `npm run build`
