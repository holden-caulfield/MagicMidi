# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador (ver AGENTS.md, "Verificación antes de dar por terminada una
tarea"). Lo que el navegador no muestra, como el globo al llegar con Tab y lo
que anuncia un lector de pantalla, se prueba en la ventana real con
`npm run tauri dev` y VoiceOver.

## 1. Etapa de la caja en el catálogo

- [x] 1.1 En `src/workflow/catalogo.ts`, agregar al lado de `tieneSalida` la
      función que da la etapa de un tipo (`"fin"` sin salida, `"intermedia"`
      con salida) (design.md, "La etapa sale del catálogo, no de un campo de
      color"); verificar con `npx tsc --noEmit`
- [x] 1.2 En `src/workflow/catalogo.test.ts`, agregar un test que revise que
      Emitir da `"fin"` y Desplazar da `"intermedia"`, y que la etapa coincide
      con `tieneSalida` en todos los tipos del catálogo; verificar con
      `npm test`

## 2. Cajas del lienzo

- [x] 2.1 En `src/workflow/iconos.ts`, hacer que `dibujarIcono` reciba el
      tamaño, con 18 por defecto; verificar con `npx tsc --noEmit` que la barra
      y el lienzo siguen compilando sin cambios
- [x] 2.2 En `src/workflow/lienzo.ts`, reemplazar `ANCHO_CAJA`/`ALTO_CAJA` por
      `LADO_CAJA = 72`, bajar `SEPARACION_INICIAL` a 180, guardar la etapa en
      `Caja` (el trigger siempre `"inicio"`) y cambiar la plantilla: ícono de
      36 px, sin el nombre escrito, globo con el nombre y clase
      `caja-inicio`/`caja-fin` según la etapa (design.md, "Tamaños" y "Globo de
      ayuda propio"); verificar con `npx tsc --noEmit`
- [x] 2.3 En `src/styles.css`, hacer la caja cuadrada con el ícono centrado,
      pasar los conectores a `position: absolute` con `top`/`left`/`right` (sin
      `transform`) y actualizar el comentario sobre la restricción de Rete
      (design.md, "Conectores con posición absoluta"); verificar en el
      navegador que las conexiones del lienzo inicial salen y llegan al centro
      de los conectores, también después de mover las cajas y de hacer zoom

## 3. Barra de herramientas

- [x] 3.1 En `src/workflow/panel.ts`, dejar en cada botón de la barra solo el
      ícono, con `aria-label` con el nombre, el globo con `aria-hidden="true"`
      y la clase de etapa; verificar con `npx tsc --noEmit` y, en el navegador,
      con el árbol de accesibilidad, que los botones se llaman "Desplazar" y
      "Emitir"
- [x] 3.2 En `src/styles.css`, hacer los botones de la barra cuadrados, con la
      misma altura que antes (`aspect-ratio: 1` y el mismo padding en los
      cuatro lados); verificar en el navegador que la altura medida del botón
      no cambió respecto de `main`

## 4. Globo de ayuda y colores

- [x] 4.1 En `src/styles.css`, agregar el globo: debajo de la caja, centrado,
      visible en `:hover` (y en `:focus-visible` en la barra), oculto con
      `opacity` en el lienzo, y el `z-index` del contenedor de la caja con
      `:has(.caja:hover)` (design.md, "Globo de ayuda propio"); verificar en el
      navegador "Nombre al pasar el puntero" en la barra y en el lienzo, y que
      el globo de una caja no queda tapado por otra caja puesta justo debajo
- [x] 4.2 En `src/styles.css`, agregar las variables de color de inicio y de
      fin en `:root`, sus variantes para los botones en modo oscuro y las reglas
      de `caja-inicio`/`caja-fin`, cuidando que la caja seleccionada conserve
      su fondo (design.md, "Colores"); verificar en el navegador "Lienzo
      inicial con colores", "Caja intermedia", "La barra anticipa el color" y
      "Seleccionar una caja de color", en modo claro y en modo oscuro

## 5. Documentación

- [x] 5.1 En `src/workflow/nodos/LEEME.md`, decir que el `nombre` se ve en el
      globo de ayuda y en el panel, que dentro de la caja solo va el ícono (así
      que conviene elegir uno que se reconozca solo), y que las cajas sin salida
      se ven con el color de fin sin declarar nada; verificar releyendo la guía
      contra el requisito "Qué declara un tipo de nodo" de la spec

## 6. Verificación

- [x] 6.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y verificar
      que pasan
- [x] 6.2 En el navegador, verificar los escenarios de
      `editor-de-workflow` de este cambio que no se probaron antes ("Partes del
      tab", "Cajas con ícono", "Cajas cuadradas en el lienzo", "El panel sigue
      nombrando la caja") y que el lienzo inicial muestra las dos cajas sin
      superponerse y con la conexión visible
- [x] 6.3 En la ventana real (`npm run tauri dev`), verificar "Nombre al llegar
      con el teclado": con Tab sobre "Emitir" aparece el globo y VoiceOver lo
      anuncia como "Emitir"; y que arrastrar un botón de la barra al lienzo
      sigue agregando la caja donde se suelta, centrada bajo el puntero
