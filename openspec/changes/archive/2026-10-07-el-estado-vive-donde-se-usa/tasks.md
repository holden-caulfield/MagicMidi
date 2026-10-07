# Tasks

Es un cambio sin efectos visibles: la huella y las pruebas de
`verificacion-para-agentes/` tienen que dar lo mismo antes y después. Como
hoy manejan la selección y el tab activo con `actualizar()`, primero se
adaptan y se corren sobre el código actual (ver design.md, "Las pruebas
seleccionan con clics y leen lo que se ve").

## 1. Pruebas que no tocan el estado que se muda

- [x] 1.1 Agregar `cajaDelLienzo(id)` a `verificacion-para-agentes/ayudas/comun.js`
      y usarla en `pruebas/editor.js` en lugar de armar la caja con
      `area.nodeViews`. En `editor.js`, leer la selección por la clase
      `seleccionada` de las cajas y el título del panel de configuración en
      lugar de `m.estado.nodoSeleccionado`. Verificar corriendo `editor` en
      WebKit: da lo mismo que antes del cambio en todo menos las claves que
      leían el store, que ahora muestran la clase o el panel
- [x] 1.2 En `pruebas/configuracion.js`, agregar `d1` y `d2` al flujo antes del
      clic en Workflow, seleccionar cada caja con un clic (con
      `cajaDelLienzo` y `arrastrar`) y leer la selección por lo que se ve.
      En `pruebas/conexion.js`, cambiar de tab con `boton('Log')` y
      `boton('Conexión')`, y conservar el `actualizar({ mensajeConexion })`.
      Verificar corriendo las dos en WebKit sobre el código actual, y guardar
      su salida como referencia
- [x] 1.3 En `huella/huella.js`, agregar `d` y `f` sin `nodoSeleccionado` y
      seleccionar con un clic en cada caja en las capturas `seleccionada …`.
      Verificar que `grep -rn "nodoSeleccionado\|panelActivo"
      verificacion-para-agentes` no encuentre nada, y tomar la huella
      `antes` con `huella/comparar.sh antes` sobre el código actual. Revisar
      en la salida que el panel de cada captura `seleccionada …` muestre esa
      caja (la huella no captura el `div.caja`, así que la marca de la
      selección la revisan las pruebas del editor y de configuración)

## 2. La selección en `panel-workflow`

- [x] 2.1 En `lienzo.ts`, agregar la propiedad `nodoSeleccionado`; hacer que
      `seleccionar(id)` solo despache `seleccionar-caja`; marcar las cajas en
      `marcarSeleccion()`, llamado desde `updated()` y al final de `montar()`;
      sacar `nodoSeleccionado` de `eliminarCaja`; y documentar el evento en el
      JSDoc de `LienzoWorkflow`, como dice design.md. Verificar con
      `npx tsc --noEmit`
- [x] 2.2 En `panel-de-configuracion.ts`, agregar la propiedad
      `nodoSeleccionado` y buscar la caja con ella. En `panel-workflow.ts`,
      agregar `@state() private nodoSeleccionado`, pasárselo al lienzo y al
      panel de configuración, escuchar `seleccionar-caja` y limpiar la
      selección después de `eliminarCaja` si era la caja borrada. Verificar
      con `npx tsc --noEmit`

## 3. El tab activo en `ventana-principal`

- [x] 3.1 En `ventana-principal.ts`, agregar `@state() private panelActivo =
      "conexion"`, usarlo en la barra de tabs y en las secciones, y sacar el
      import del store y el `ControladorDeEstado`. Verificar con
      `npx tsc --noEmit`

## 4. El store

- [x] 4.1 Sacar `panelActivo` y `nodoSeleccionado` de `Estado` y del valor
      inicial en `estado/estado.ts`, y ajustar su JSDoc a lo que queda.
      Verificar con `npx tsc --noEmit`, `npm test` y que
      `grep -rn "nodoSeleccionado\|panelActivo" src` solo muestre
      `ventana-principal.ts` y `workflow/editor/`

## 5. Verificación

- [x] 5.1 Correr las pruebas `tabs`, `conexion`, `configuracion` y `editor`
      en WebKit, y verificar que den lo mismo que en 1.1 y 1.2. Correr el
      resto (`log`, `cuadros`, `ventana-oculta`) y verificar que den lo mismo
      que antes del cambio
- [x] 5.2 Tomar la huella con `comparar.sh despues` (reiniciando el servidor
      antes) y verificar que `diferencias.py antes despues` termine en 0
- [x] 5.3 En el navegador, seleccionar una caja desde la consola asignando
      `nodoSeleccionado` a `panel-workflow`, y verificar que el lienzo marque
      esa caja y el panel muestre la misma (lo que hoy no pasa)

## 6. Cierre

- [x] 6.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y verificar
      que pasen sin errores
- [x] 6.2 Proponerle a la persona usuaria el diff de AGENTS.md, con el
      criterio de "Cómo se escribe este archivo", y aplicarlo solo con su
      aprobación explícita: en "Estado de la interfaz", el principio del
      ancestro común más cercano (el componente, el contenedor del área o el
      store), lo más cerca posible ante la duda, y subirlo cuando aparece
      otro uso; en "Componentes", que un componente de área puede recibir por
      propiedades lo que vive en su contenedor; y en "Verificación", que lo
      que vive en un componente se maneja con clics o asignando su propiedad,
      no con `actualizar()`
- [x] 6.3 Pedirle a la persona usuaria que pruebe en la ventana real
      (`npm run tauri dev`): seleccionar cajas, borrar la seleccionada,
      cambiar de tab con el mouse, con Enter y con la barra espaciadora, y
      volver al tab Workflow con la misma caja seleccionada
