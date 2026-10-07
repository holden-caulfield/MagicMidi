# Proposal

## Why

La regla de AGENTS.md que reparte el estado de la interfaz en dos niveles
(store o `@state` de un componente) no tiene lugar para lo que comparten
varios componentes de una misma área, y con "ante la duda, va al store"
terminan en el estado global datos que usa un área sola: `nodoSeleccionado`
(el editor de flujos) y `panelActivo` (la ventana). Además, la selección
tiene dos dueños: el lienzo marca las cajas por su cuenta y el store guarda
cuál está seleccionada, así que si `nodoSeleccionado` cambia desde afuera del
lienzo, el panel de configuración muestra una caja y el lienzo marca otra, o
ninguna. Es el cambio D de la revisión de arquitectura del 6 de octubre de
2026 (nota 4), y va después del C, que dejó la barra de tabs en
`ventana-principal`.

## What Changes

- **El principio, en "Estado de la interfaz" de AGENTS.md**: el estado vive
  en el ancestro común más cercano de los componentes que lo usan. Es el
  propio componente (`@state`) si lo usa uno solo; el contenedor del área
  (`@state`, que baja por propiedades y sube con eventos) si son varios de
  esa área; y el store si lo usa la lógica o componentes de áreas distintas.
  Ante la duda, lo más cerca posible, y se sube cuando aparece otro uso. En
  "Componentes", un componente de área puede recibir por propiedades lo que
  vive en su contenedor. El diff se propone y se aplica con aprobación
  explícita.
- **`nodoSeleccionado` pasa a `@state` de `panel-workflow`.** El lienzo avisa
  la selección con un evento; `panel-workflow` se la pasa al panel de
  configuración y al lienzo, que marca las cajas a partir de esa propiedad y
  ya no por su cuenta. Al borrar la caja seleccionada, la selección la limpia
  `panel-workflow`, y no `eliminarCaja` en el store.
- **`panelActivo` pasa a `@state` de `ventana-principal`**, que dibuja la
  barra de tabs y las secciones. Sin él, `ventana-principal` deja de leer el
  store y de suscribirse a él.
- **El store se queda con lo que usa la lógica**: la conexión y el flujo.
- **Verificación para agentes**: las pruebas y la huella que manejan
  `nodoSeleccionado` o `panelActivo` con `actualizar()` pasan a hacer clic en
  la caja o en el tab.

No cambia nada de lo que ve o hace la persona usuaria: hoy la selección solo
cambia desde el lienzo y al borrar una caja, y en esos casos el lienzo y el
panel ya coinciden. La huella de la interfaz tiene que dar igual antes y
después.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna. Es un cambio de estructura sin cambios de comportamiento: los
requisitos de `editor-de-workflow` ("La caja seleccionada se configura en el
mismo tab", "Cajas y conexiones se pueden borrar") y de `navegacion-por-tabs`
describen qué ve la persona usuaria, no dónde vive el estado, y siguen igual.
El cambio se marca con `skip_specs: true`.

## Impact

- Código: `src/estado/estado.ts` (se van `panelActivo` y
  `nodoSeleccionado`), `src/ventana/ventana-principal.ts` y
  `src/workflow/editor/` (`panel-workflow.ts`, `lienzo.ts`,
  `panel-de-configuracion.ts`).
- Documentación: AGENTS.md ("Estado de la interfaz", "Componentes" y, si
  hace falta, la parte de "Verificación" que maneja el estado desde la
  consola). Las guías no cambian.
- Verificación: `verificacion-para-agentes/huella/huella.js` y las pruebas
  `configuracion.js`, `conexion.js` y `editor.js`.
- Sin cambios en el backend, en las dependencias ni en las specs.
