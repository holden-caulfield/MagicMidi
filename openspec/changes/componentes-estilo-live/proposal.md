# Proposal

## Why

Los controles de la aplicación no se ven iguales: los botones y selects del
panel de conexión son grandes, redondeados y con mucho padding, mientras que
la barra de tabs, la barra de estado y las píldoras de los parámetros son
finas y compactas. Además, un mismo control (un select, un botón) se ve
distinto según esté en un parámetro del workflow o en otro panel, porque cada
lugar arma sus estilos. Queremos una sola estética, cercana a la de Ableton
Live (fina, legible, poco padding, sin efectos de profundidad), resuelta en un
único juego de componentes que usen todos. Los mockups aprobados son la
propuesta "A · Live" con el rango de "barra con chevrones".

Aprovechando el cambio, los rangos de Filtrar y Mapear, que hoy son dos
enteros sueltos ("desde" y "hasta"), pasan a ser un control de rango con dos
perillas.

## What Changes

- **Componentes compartidos** en `src/componentes/`: botón, lista (select),
  campo numérico, interruptor, píldoras, autocompletar y rango, como
  componentes Lit con sus estilos. Los `parametro-…` del workflow y los
  paneles de conexión, log y workflow los usan, en lugar de estilizar
  controles nativos cada uno por su lado. `estilos/compartidos.ts` deja de
  estilizar controles.
- **Estética "Live"**: letra base de 12 px (etiquetas de 11 px), controles de
  20 px de alto, esquinas de 2 px, campos rellenos de gris sin borde, sin
  sombras ni transiciones de profundidad.
- **Ámbar como único acento**: el azul sale de toda la aplicación. Lo
  encendido (botón activo, píldora y chip elegidos, interruptor), el foco, la
  selección en el lienzo, los cables y los conectores pasan a ámbar. El hover
  de lo encendido es un ámbar más claro, con letra oscura, legible en los dos
  modos.
- **Lienzo**: las cajas bajan de 72 px a 48 px, con borde fino y esquinas de
  4 px. La caja seleccionada se marca con un anillo ámbar plano por fuera
  (sin el halo con sombra de hoy), así el borde sigue diciendo la etapa. Los
  conectores son cuadrados chicos ámbar y los cables, ámbar finos. Las cajas
  y los controles de la barra de herramientas son claros (blanco, verde y
  naranja claros) en los dos modos.
- **Barra de herramientas**: los controles se achican a la escala nueva, con
  el mismo borde fino que las cajas (sin reborde más grueso en las naranjas).
- **Tabs**: el orden pasa a ser Conexión, Workflow, Log; Workflow queda en el
  centro.
- **Tipo de parámetro `rango` nuevo**: un valor `{ desde, hasta }` con
  mínimo y máximo, que se edita con un control de dos perillas sobre una
  barra, con un campo numérico a cada lado. El tramo entre las perillas tiene
  chevrones tenues que apuntan de "desde" a "hasta". La declaración dice si
  el rango se puede invertir: si no, las perillas se frenan al tocarse.
- **BREAKING (parámetros de nodos)**: Filtrar reemplaza "Datos 1 desde/hasta"
  y "Datos 2 desde/hasta" por dos rangos no invertibles, "Datos 1" y "Datos
  2". Mapear reemplaza sus cuatro extremos por dos rangos invertibles,
  "Entrada" y "Salida". El flujo no se guarda entre sesiones, así que no hay
  nada que migrar.
- **Ícono de la aplicación**: el mismo dibujo (puerto MIDI y destellos) en
  gris grafito plano, con el puerto claro y los destellos en ámbar. Se
  regeneran los PNG, `.icns` e `.ico` desde `src-tauri/icons/icono.svg`.

## Capabilities

### New Capabilities

- `estilo-de-la-interfaz`: la apariencia común de toda la interfaz: un único
  juego de controles con la misma apariencia en cualquier panel, la escala
  (letra, alto de controles, esquinas), la ausencia de efectos de
  profundidad, el ámbar como único acento (sin azul), el foco visible, la
  legibilidad de los estados en modo claro y oscuro, y el ícono de la
  aplicación.

### Modified Capabilities

- `navegacion-por-tabs`: el orden de los tabs pasa a ser Conexión, Workflow,
  Log.
- `tipos-de-parametro`: se suma el tipo `rango` (seis tipos disponibles), con
  su valor, sus errores y su control de dos perillas.
- `nodo-filtrar`: los rangos de datos pasan a ser dos parámetros `rango` no
  invertibles; el error de "desde mayor que hasta" pasa a ser el del tipo de
  parámetro.
- `nodo-mapear`: los cuatro extremos pasan a ser dos parámetros `rango`
  invertibles, "Entrada" y "Salida"; los errores se asocian a esos rangos.
- `editor-de-workflow`: tamaño de las cajas y de los controles de la barra,
  señal de selección, color de cables y conectores, cajas claras en los dos
  modos, y los escenarios de errores que nombran los extremos de Mapear.

## Impact

- **Código nuevo**: `src/componentes/` (un archivo por componente, más sus
  estilos comunes) y `src/workflow/parametros/rango.ts` con su test.
- **Código modificado**: `estilos/global.css` (variables: se quita
  `--acento` azul, se suman las de ámbar y la escala nueva),
  `estilos/compartidos.ts`, `conexion/panel-conexion.ts`,
  `conexion/selector-de-puerto.ts`, `log/panel-log.ts` (botón Limpiar), la
  barra de tabs y la de estado, `workflow/parametros/*` (cada control usa su
  componente), `parametros/catalogo.ts`, `workflow/editor/lienzo.ts` (caja,
  conectores y cables vía `customize.socket` y `customize.connection` del
  preset clásico), `barra-de-herramientas.ts`, `globo.ts`,
  `ventana/ventana-principal.ts` (orden de `PANELES`), `nodos/filtrar.ts`,
  `nodos/mapear.ts` y sus tests, `ejecutar.test.ts`, y las guías
  `nodos/LEEME.md` y `parametros/LEEME.md`.
- **Ícono**: `src-tauri/icons/icono.svg` y los archivos generados con
  `npx tauri icon`.
- **Verificación**: la huella de `verificacion-para-agentes/` va a cambiar a
  propósito (es un cambio visual), y `huella.js` y las pruebas que nombran los
  parámetros de Filtrar y Mapear se actualizan.
- **AGENTS.md**: al archivar, proponer los cambios a la sección de estilos
  (componentes en `src/componentes/`, ya no `compartidos` para controles) y a
  la de organización del código.
- Sin dependencias nuevas: Lit y Lucide ya están.
