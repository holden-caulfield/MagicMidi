# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador (ver AGENTS.md, "Verificación antes de dar por terminada una
tarea"). Desde el paso 2, el estado se maneja desde la consola y hay que
esperar el dibujado (`await …updateComplete`) antes de mirar el DOM. La
activación con teclado, el layout en WebKit (también al entrar y salir de
pantalla completa) y el flujo MIDI completo se prueban con
`npm run tauri dev` y dos buses del IAC Driver. Al cerrar cada grupo,
`npx tsc --noEmit`, `npm test` y `npm run build` tienen que pasar, y la
aplicación tiene que seguir andando.

Lo que piden "en WebKit" se corre en un `WKWebView` del sistema (el mismo
motor que la ventana de Tauri), con un script de Swift fuera del repositorio
que carga `localhost:1420`, ejecuta una prueba en la página y saca una
captura. El WebKit de Playwright no arranca en macOS 14.1.

## 1. Pruebas previas

- [x] 1.1 Probar los decoradores estándar con `accessor` (design.md, D9): un
      componente de prueba con `@customElement`, `@property` y `@state`;
      verificar que `npm run build` y `npm run dev` lo transforman y que se
      dibuja y reacciona a un cambio de propiedad en WebKit (Safari con la
      URL de desarrollo). Anotar el resultado en design.md; si falla, fijar
      `static properties` con `declare` como forma de escribir los
      componentes
- [x] 1.2 Probar Rete dentro de shadow roots anidados (design.md, D6): montar
      el lienzo actual dentro del shadow root de un componente de prueba
      anidado en otro, con una caja como componente Lit con Shadow DOM.
      Verificar en Chromium y en WebKit que se pueden arrastrar cajas,
      conectar y desconectar, seleccionar, soltar una caja desde la barra, y
      que una caja fuera de la vista no agranda el panel. Anotar el resultado
      en design.md; si algo falla, fijar light DOM para `<lienzo-workflow>` y
      `<caja-del-flujo>`
- [x] 1.3 Borrar el código de prueba de 1.1 y 1.2; verificar con `git status`
      que solo quedan las anotaciones en design.md

## 2. Base

- [x] 2.1 Quitar `lit-html` de `package.json` y pasar todos los imports a
      `lit` y `lit/directives/…` (design.md, D10), con la configuración de
      decoradores que haya fijado 1.1 en `tsconfig.json`; verificar con
      `npm install`, `npx tsc --noEmit` y `npm run build`
- [x] 2.2 Mover `src/estado.ts` a `src/estado/estado.ts`, hacer que
      `suscribir` devuelva la función para desuscribirse, y escribir
      `ControladorDeEstado` en `estado/controlador.ts`, genérico sobre
      cualquier fuente con `suscribir` (design.md, D3 y D8); verificar con
      `npx tsc --noEmit` y `npm test`
- [x] 2.3 Crear `src/estilos/global.css` (variables en `:root`, `body`, el
      bloque que fija la ventana) y `src/estilos/compartidos.ts` (botones,
      `select`, `input`, foco, `.campo`) a partir de `styles.css`, sin
      borrar todavía lo que siguen usando las plantillas viejas; verificar
      con `npm run dev` que la ventana se ve igual que antes

## 3. Conexión

- [x] 3.1 Escribir `<selector-de-puerto>` (componente hoja: puertos, elegido y
      deshabilitado por propiedad, evento `cambio`) y `<panel-conexion>`
      (componente de área) en `src/conexion/`, y mover `conexion.ts` y su
      test ahí, sin plantillas; el indicador de estado queda como función
      que exporta `conexion.ts`. Verificar en el navegador, manejando el
      estado desde la consola, los escenarios de `estado-de-la-interfaz`
      sobre los controles de conexión, y que la elección de puerto sobrevive
      a un redibujado
- [x] 3.2 Verificar con el reemplazo del puente de IPC (AGENTS.md) que una
      falla al pedir los puertos y un intento de conexión fallido se
      muestran como antes

## 4. Tipos de parámetro

- [ ] 4.1 Crear `src/workflow/parametros/` con `campo-de-parametro.ts`
      (`CampoDeParametro`: etiqueta e `id` en la misma raíz, estilos de
      campo, `avisarCambio`) y `catalogo.ts` (unión `Parametro`,
      `ValorDeParametro` y mapa con `satisfies`), según design.md, D7, y
      hacer que `workflow/tipos.ts` tome de ahí `Parametro` y
      `ValorDeParametro`; verificar con `npx tsc --noEmit`
- [ ] 4.2 Escribir `entero.ts` con `interpretar` y su test (enteros
      positivos y negativos, "2.5", vacío, espacios, texto); `si-no.ts`; y
      `opciones.ts` para valores numéricos, de texto y sí/no. Verificar con
      `npm test`
- [ ] 4.3 Verificar al compilar los escenarios de "Un tipo de parámetro es un
      archivo registrado en su catálogo": declarar por un momento en un tipo
      de nodo un parámetro de tipo inexistente, uno entero con inicial
      `true`, y sacar un tipo del mapa del catálogo, y comprobar que
      `npx tsc --noEmit` falla en cada caso señalando el problema
- [ ] 4.4 Pasar el panel de configuración a `<panel-de-configuracion>` en
      `src/workflow/editor/`, buscando cada parámetro en el catálogo, sin
      `switch` ni nombres de tipos, y emitiendo `eliminar-caja`; verificar
      en el navegador los escenarios de "La caja seleccionada se configura
      en el mismo tab" (`editor-de-workflow`), incluido "Valor no entero", y
      que hacer clic en una etiqueta lleva a su control

## 5. Editor de flujos

- [ ] 5.1 Pasar `src/workflow/lienzo.ts` a `src/workflow/editor/lienzo.ts`
      como `<lienzo-workflow>`, con `<caja-del-flujo>` en el mismo archivo
      (design.md, D6): montaje con `ResizeObserver`, `dragover`/`drop`
      propios, `agregarCaja`/`eliminarCaja` como métodos, sin `editor` ni
      `area` globales y con la selección como propiedad de la caja.
      Verificar con `grep` que sigue siendo el único archivo que importa
      `rete`, y en el navegador los escenarios de `editor-de-workflow` sobre
      agregar, mover, conectar, borrar, seleccionar, colores por etapa y el
      globo encima de otra caja
- [ ] 5.2 Escribir `<barra-de-herramientas>` (evento `agregar-caja`) y
      `<panel-workflow>`, que conecta los eventos de la barra y del panel de
      configuración con los métodos del lienzo, y borrar `workflow/panel.ts`;
      verificar en el navegador que se agrega una caja con clic y
      arrastrando, que se borra desde el panel, y que el lienzo se monta
      bien la primera vez que se abre el tab, aunque se haya cambiado el
      tamaño de la ventana antes

## 6. Log

- [ ] 6.1 Mover `src/log.ts` y su test a `src/log/`, con el registro de
      entradas (`id` incremental, hora, mensaje y `Resultado` ya
      clasificado, hasta 500, la más nueva primero) y su suscripción, sin
      tocar DOM (design.md, D8); sumar al test que el registro conserva 500
      entradas en el orden correcto y que limpiar lo vacía; verificar con
      `npm test`
- [ ] 6.2 Escribir `<panel-log>` declarativo con `repeat` y borrar
      `inicializarLog`; verificar en el navegador, llamando a `agregarAlLog`
      desde la consola, los escenarios de `log-de-mensajes` (hora, bytes y
      descripción, sub-filas, marcas sin cambios, descartado y error,
      colores, 500 mensajes, Limpiar) y que el log sigue juntando mensajes
      con su tab oculto
- [ ] 6.3 Medir en WebKit con los dos criterios de design.md, D8 (ráfaga de
      2000 mensajes sin cuadros de más de 100 ms; 500 por segundo durante
      10 s con la interfaz respondiendo) y anotar los números en design.md.
      Si no se cumplen, pasar `<panel-log>` al DOM a mano encapsulado (con
      `@query`) y repetir la verificación de 6.2

## 7. Ventana

- [ ] 7.1 Escribir `<ventana-principal>` en `src/ventana/`, con encabezado,
      paneles y barra en la misma raíz, la lista `PANELES` y `?hidden` (nunca
      renderizado condicional), y `<barra-de-tabs>` como función o
      componente en la misma raíz para que los `id` de ARIA se encuentren;
      verificar en el navegador los escenarios de `navegacion-por-tabs`,
      incluidos los atributos ARIA, el orden de tabulación y que ningún
      componente que se oculta pierde `hidden` por su `display`
- [ ] 7.2 Reducir `index.html` a `<ventana-principal>` y `main.ts` a importar
      los componentes y llamar a los `inicializar<X>()`, borrar
      `src/tabs.ts` y lo que quede de `styles.css`; verificar con `grep` que
      ningún módulo llama a `render` ni a `document.querySelector`, y con
      `npm run build`

## 8. Documentación

- [ ] 8.1 Escribir `src/workflow/parametros/LEEME.md` según "La carpeta de
      tipos de parámetro explica cómo crear uno", con el ejemplo completo del
      tipo "nota" y su test (que no se registra en la aplicación); verificar
      siguiendo la guía, en una copia descartable, que el ejemplo compila,
      su test pasa y su control aparece en el panel
- [ ] 8.2 Revisar `src/workflow/nodos/LEEME.md` para que explique los tipos de
      parámetro a partir del catálogo y remita a `parametros/LEEME.md`;
      verificar que sus ejemplos siguen compilando
- [ ] 8.3 Proponerle a la persona usuaria el diff de `AGENTS.md`
      (Frontend, Estado de la interfaz, Componentes, `main.ts`, Paneles y
      tabs, Layout, Excepción del log, Workflow, receta de depuración por
      consola, y el criterio de estado global o local) y aplicarlo solo con
      su aprobación explícita

## 9. Verificación final

- [ ] 9.1 Correr `npx tsc --noEmit`, `npm test`, `npm run build`, y los
      chequeos de Rust de AGENTS.md (no deberían cambiar)
- [ ] 9.2 Probar en `npm run tauri dev` con el IAC Driver: conectar, armar un
      flujo con Filtrar, Desplazar y Emitir, ver el log con un flujo
      sostenido, la activación de tabs y botones con Enter y barra
      espaciadora, y el layout al entrar y salir de pantalla completa
