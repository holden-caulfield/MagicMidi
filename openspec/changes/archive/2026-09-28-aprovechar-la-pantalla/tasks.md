# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador (ver AGENTS.md, "Verificación antes de dar por terminada una
tarea"), cambiando el tamaño de la vista con `resize_window` para simular
una ventana grande (1600 × 1000), la de por defecto (800 × 600) y una muy baja
(800 × 350). El navegador de desarrollo es Chromium y la ventana real usa
WebKit: lo que depende de la ventana nativa (entrar y salir de pantalla
completa, el arrastre real de cajas) se prueba con `npm run tauri dev`.

## 1. Raíz y contenedor común

- [x] 1.1 En `src/styles.css`, reemplazar `height: 100dvh` de `body` por
      `overflow: hidden`, y atar `#app` a la ventana con
      `position: fixed; inset: 0` (design.md, "La raíz atada a la ventana, que
      nunca se desplaza"); verificar en el navegador que en los tres tamaños
      el documento no se desplaza y la barra de tabs termina justo en el borde
      inferior de la vista
- [x] 1.2 En `src/styles.css`, sacar el tope de 900 px de `.contenedor` y de
      `.encabezado`, pasar `.contenedor` a una fila flex sin desplazamiento
      propio, y darle a `.panel` todo el layout común (`flex: 1`,
      `min-width: 0`, `overflow: auto`, columna flex con `gap`); borrar
      `.panel-log` y `.panel-workflow` (design.md, "Un solo contenedor para los
      tres paneles"); verificar en el navegador "Los tres paneles son iguales"
      y "El encabezado acompaña a los paneles", y que los paneles ocultos no
      ocupan lugar
- [x] 1.3 En `src/main.ts`, dejar las `<section>` de los paneles solo con la
      clase `panel`; verificar con `npx tsc --noEmit` y con un `grep` que
      ninguna regla ni módulo use las clases `panel-<id>`

## 2. Contenido de cada panel

- [x] 2.1 En `src/conexion.ts`, envolver el contenido de `panelConexion()` en un
      `div.formulario-conexion`, y en `src/styles.css` pasarle el layout de
      `.panel-conexion` con `max-width: 804px` y `margin-inline: auto`
      (design.md, "El contenido de Conexión centrado dentro de su panel");
      verificar en el navegador "Contenido de Conexión centrado": a 1600 px de
      ancho mide 804 px, igual que el contenido del panel en `main`, y queda
      centrado
- [x] 2.2 En `src/styles.css`, reemplazar `height: 360px` de `.lista-mensajes`
      por `flex: 1; min-height: 0` (design.md, "Las áreas que crecen se
      confinan al lugar que tienen"); verificar en el navegador los escenarios
      de `log-de-mensajes`, con filas agregadas a mano desde la consola al
      contenedor `#lista-mensajes`
- [x] 2.3 En `src/styles.css`, reemplazar `min-height: 420px` de
      `.area-workflow` por `flex: 1; min-height: 0`, sumarle
      `overflow-y: auto` a `.configuracion` y `contain: strict` a `.lienzo`;
      verificar en el navegador "Ventana grande" y "Ventana por defecto" de
      `editor-de-workflow`, y que el panel de configuración mantiene sus 220 px
      de ancho y tiene el mismo alto que el lienzo
- [x] 2.4 Verificar en el navegador "Ventana muy baja" de
      `navegacion-por-tabs`: con 800 × 350, Conexión se desplaza dentro de su
      panel, la lista y el lienzo se achican, y en ningún tab se desplaza el
      documento ni se mueve la barra de tabs

## 3. Lienzo al cambiar de tamaño

- [x] 3.1 Sin tocar `lienzo.ts` (design.md, "No avisarle a Rete del cambio de
      tamaño"), verificar en el navegador "Agrandar la ventana con el flujo a
      la vista": con el flujo inicial y una caja Desplazar conectada, pasar la
      vista de 800 × 600 a 1600 × 1000 y de vuelta, y comprobar que las cajas
      no se mueven, el zoom no cambia, las conexiones siguen unidas a sus
      conectores y el arrastre de cajas sigue bajo el puntero
- [x] 3.2 Verificar en el navegador "Agregar una caja con clic en un lienzo
      grande": con la vista en 1600 × 1000, un clic en "Desplazar" de la barra
      agrega la caja en el centro de la parte visible del lienzo
- [x] 3.3 Verificar en el navegador "Volver de pantalla completa con una caja
      lejos", simulándolo con la vista: con 1600 × 1000, mover "Emitir" cerca
      de la esquina inferior derecha del lienzo, pasar a 800 × 600 y comprobar
      que ningún tab se desplaza y la barra sigue al pie
- [x] 3.4 Verificar que entrar por primera vez al tab Workflow con la vista ya
      en 1600 × 1000 monta el lienzo bien: las dos cajas iniciales se ven sin
      superponerse y con la conexión dibujada

## 4. Verificación

- [x] 4.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y verificar
      que pasan
- [x] 4.2 En el navegador, con la vista por defecto (800 × 600), recorrer los
      tres tabs y verificar que ninguno se desplaza y que, fuera del tamaño de
      los paneles, se ven como en `main`; y en modo oscuro, que los colores no
      cambiaron
- [x] 4.3 En la ventana real (`npm run tauri dev`), verificar "Pantalla
      completa" y "Salir de pantalla completa" en los tres tabs (la barra
      pegada al borde inferior, sin margen debajo, y sin desplazamiento al
      volver), y repetir "Volver de pantalla completa con una caja lejos" con
      una caja movida de verdad al borde derecho del lienzo
