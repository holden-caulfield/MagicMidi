# Proposal

## Why

La ventana no aprovecha el espacio cuando se agranda o pasa a pantalla
completa: el contenido queda encerrado en una columna de 900 px de ancho, la
lista del log mide siempre 360 px de alto y el lienzo del workflow, 420 px.
Con una pantalla grande sobra la mayor parte de la ventana, justo en las dos
áreas donde más espacio hace falta: el log, para ver más mensajes sin
desplazarse, y el lienzo, para armar flujos de más cajas sin tener que moverlo.
Además, con el tamaño por defecto el panel del workflow ya no entra en la
ventana y hay que desplazarlo para llegar al pie del lienzo.

## What Changes

- Los paneles de los tres tabs pasan a ser **el mismo contenedor**: ocupa todo
  el ancho y todo el alto que hay entre el encabezado y la barra de tabs, en
  cualquier tamaño de ventana. Cada tab solo decide cómo se acomoda lo que
  dibuja adentro, y eso **se ajusta al lugar que tiene** en vez de agrandar el
  panel.
- La ventana **no se desplaza nunca**: la barra de tabs queda siempre pegada al
  borde inferior, también al entrar y salir de pantalla completa. Lo que no
  entra se desplaza dentro de su propia área: las filas dentro de la lista del
  log, los campos dentro del panel de configuración y, en una ventana muy baja,
  el contenido del tab Conexión dentro de su panel.
- La lista de mensajes del tab **Log** ocupa todo el lugar que deja su
  encabezado.
- El lienzo del tab **Workflow** ocupa todo el lugar que dejan la barra de
  herramientas, el texto de ayuda y el panel de configuración, que conserva su
  ancho. Al cambiar el tamaño de la ventana solo cambia cuánto del lienzo se
  ve: las cajas no se mueven y el zoom no cambia.
- Desaparecen los altos fijos y mínimos de la lista (360 px) y del lienzo
  (420 px): con una ventana chica, se achican.
- Se saca el tope de 900 px de ancho del contenido y del encabezado.
- En el tab **Conexión**, el texto de ayuda, los selectores y los botones
  conservan el ancho máximo que tienen hoy y quedan **centrados** dentro del
  panel: no ganan nada con más ancho.
- Queda **fuera**: que la persona usuaria pueda cambiar a mano el tamaño de
  las áreas (divisores arrastrables) y fijar un tamaño mínimo de la ventana en
  `tauri.conf.json`.

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `log-de-mensajes`: se agrega el requisito "La lista de mensajes ocupa el
  espacio disponible".
- `editor-de-workflow`: se agrega el requisito "El lienzo ocupa el espacio
  disponible", con el comportamiento al cambiar el tamaño de la ventana.
- `navegacion-por-tabs`: se agrega el requisito "El panel activo ocupa el
  espacio de la ventana", que fija que los tres paneles son iguales, que la
  ventana no se desplaza y que la barra queda siempre al pie, y que el
  contenido de Conexión conserva su ancho acotado y queda centrado.

## Impact

- `src/styles.css`: la raíz atada al tamaño de la ventana, una sola regla para
  el contenedor de los tres paneles, y la lista del log, el área del workflow,
  el lienzo y el panel de configuración confinados al lugar que les toca. Se
  van las reglas propias de cada panel y los altos fijos y mínimos.
- `src/main.ts`: las `<section>` de los paneles quedan solo con la clase
  común.
- `src/conexion.ts`: el contenido del panel va dentro de un contenedor propio,
  que es el que se centra con su ancho máximo.
- Sin cambios en el backend, en el estado, en el ejecutor del flujo, en
  `lienzo.ts` ni en las dependencias.
