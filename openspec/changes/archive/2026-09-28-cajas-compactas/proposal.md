# Proposal

## Why

Las cajas muestran el ícono y el nombre uno al lado del otro. En el lienzo miden
240 px de ancho, así que un flujo de cuatro o cinco cajas ya no entra a la vista,
y en la barra de herramientas cada tipo nuevo le suma un botón ancho. Además,
todas las cajas se ven iguales, y a simple vista cuesta encontrar dónde empieza
el flujo y dónde sale lo que se emite.

## What Changes

- Las cajas del lienzo y los botones de la barra muestran **solo el ícono**. El
  nombre pasa a un globo de ayuda que aparece al pasar el puntero por encima, y
  también al llegar con el teclado a los botones de la barra. El nombre sigue
  siendo el nombre accesible de cada control, y sigue apareciendo como título
  en el panel de configuración.
- Las cajas del lienzo pasan a ser **cuadradas y un poco más grandes** que la
  altura actual, con un ícono más grande. Los botones de la barra mantienen el
  tamaño de ahora, sin el texto.
- Las cajas se colorean según su **etapa en el flujo**, sin que cada tipo de
  nodo declare nada nuevo:
  - **inicio** (el trigger): fondo verde claro con borde verde;
  - **fin** (todo tipo sin salida, hoy Emitir): fondo naranja claro con borde
    naranja;
  - **intermedias** (el resto, hoy Desplazar): como hasta ahora, fondo blanco.

  El color se deduce de lo que el tipo ya declara (`tieneSalida`), así que un
  tipo nuevo sin salida queda marcado como fin sin tocar nada más. **No** se
  agrega un campo de color por tipo de nodo: ver el diseño.
- Queda **fuera** de esta propuesta conectar desde cualquiera de los cuatro
  bordes de la caja, con la dirección indicada por el propio conector. Rete
  dibuja las conexiones asumiendo que salen hacia la derecha y entran por la
  izquierda, así que hace falta un dibujo de conexiones propio, flechas y
  decidir qué pasa con el lado elegido al mover las cajas. Es un cambio de otra
  escala, con riesgo propio, y conviene proponerlo aparte una vez terminado
  este (ver el diseño).

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `editor-de-workflow`: "El tab Workflow tiene lienzo, barra de herramientas y
  panel de configuración" pasa a mostrar solo el ícono, con el nombre en un
  globo de ayuda, y a pedir cajas cuadradas en el lienzo. Se agrega un
  requisito nuevo: "Las cajas de inicio y de fin del flujo se distinguen por
  color".
- `tipos-de-nodo`: en "Qué declara un tipo de nodo", el nombre deja de verse
  escrito en la caja y pasa al globo de ayuda y al panel, y un tipo sin salida
  se ve automáticamente como caja de fin.

## Impact

- `src/workflow/lienzo.ts`: la plantilla de la caja (sin el nombre escrito,
  con globo de ayuda y clase según su etapa), el tamaño de la caja y la
  separación inicial entre el trigger y el Emitir.
- `src/workflow/panel.ts`: los botones de la barra, con solo el ícono, nombre
  accesible y globo de ayuda.
- `src/workflow/iconos.ts`: el tamaño del ícono pasa a ser un parámetro.
- `src/workflow/catalogo.ts`: una función que dice la etapa de un tipo en el
  flujo, al lado de `tieneSalida`, con su test en `catalogo.test.ts`.
- `src/styles.css`: la caja cuadrada, la ubicación de los conectores, el globo
  de ayuda y los colores de inicio y fin, en modo claro y oscuro.
- `src/workflow/nodos/LEEME.md`: dónde se ve el `nombre` y qué pasa con el
  color de las cajas sin salida.
- Sin cambios en el backend, en el ejecutor del flujo ni en las dependencias.
