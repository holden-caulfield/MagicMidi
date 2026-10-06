# Proposal

## Why

Hoy la interfaz tiene dos clases de piezas: componentes, y funciones que otro
archivo dibuja (`barraDeEstado()`, `barraDeTabs()`). Esas funciones exportan
sus estilos para que los sume quien las dibuja, y `barraDeEstado()` se
actualiza solo porque `ventana-principal` está suscripta al store: si la
dibujara otro componente sin `ControladorDeEstado`, quedaría vieja sin dar
ningún error. Además, `compartidos` depende de que cada componente se acuerde
de sumarlo, y cinco no lo hacen (`panel-workflow`, el lienzo, la caja, el
cable y la base de los `parametro-…`). Es el cambio C de la revisión de
arquitectura del 6 de octubre de 2026 (notas 2, 5 y 7), y va antes del D y
del E porque tocan las mismas bases.

## What Changes

- **Una clase base para todos los componentes** que suma `compartidos` sola,
  con `finalizeStyles` de Lit. Extienden de ella todos los componentes,
  incluidas las bases `Campo` y `CampoDeParametro` y la caja y el cable del
  lienzo; ninguno vuelve a sumar `compartidos` a mano.
- **`<barra-de-estado>`**, un componente en `conexion/barra-de-estado.ts`, con
  sus estilos y su propio `ControladorDeEstado`. De `conexion.ts` se van
  `barraDeEstado()` y `estilosDeLaBarraDeEstado`; la lógica pura
  (`estadoDeLaConexion`, `conNombresAMostrar`, `puertoElegido`) se queda ahí,
  con sus tests.
- **La barra de tabs vuelve a `ventana-principal`**, que dibuja también las
  secciones a las que apunta. Dentro del archivo, la barra y las secciones
  son métodos privados con su plantilla, cada uno con su constante de estilos
  al lado, que `static styles` junta. `ventana/barra-de-tabs.ts` desaparece, y
  `ventana-principal` deja de importar estilos de otros módulos.
- **AGENTS.md**: todos los componentes usan Shadow DOM y extienden la clase
  base; lo que se enlaza por `id` lo dibuja un mismo componente; toda pieza de
  interfaz que se dibuja desde otro archivo es un componente, y las funciones
  que devuelven plantillas son ayudas internas de su archivo, salvo
  `dibujarIcono`. El diff se propone y se aplica con aprobación explícita.
- **Verificación para agentes**: `pruebas/tabs.js` busca la barra de estado
  con `uno()` en lugar de en la raíz de la ventana, porque pasa a vivir en el
  shadow root de su componente.

No cambia nada de lo que ve o hace la persona usuaria: la huella de la
interfaz tiene que dar igual antes y después.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna. Es un cambio de estructura sin cambios de comportamiento: los
requisitos de `navegacion-por-tabs` (los tabs, la barra de estado) y de
`estilo-de-la-interfaz` siguen igual. El cambio se marca con
`skip_specs: true`.

## Impact

- Código: `src/componentes/` (la clase base nueva, `campo.ts`, `estilos.ts`,
  `boton-de-accion.ts`), `src/conexion/` (`conexion.ts`, `panel-conexion.ts`
  y el componente nuevo), `src/ventana/` (`ventana-principal.ts`, y se borra
  `barra-de-tabs.ts`), `src/log/panel-log.ts`, `src/workflow/editor/` (panel,
  barra de herramientas, panel de configuración, lienzo) y
  `src/workflow/parametros/campo-de-parametro.ts`.
- Documentación: AGENTS.md ("Frontend", "Estilos y Shadow DOM",
  "Componentes", "Paneles y tabs"). Las guías no cambian: el ejemplo de
  `parametros/LEEME.md` extiende `CampoDeParametro`, que sigue existiendo.
- Verificación: `verificacion-para-agentes/pruebas/tabs.js`.
- Sin cambios en el backend, en las dependencias ni en las specs.
