# Design

## Context

Ver proposal.md (Why). Lo que condiciona el enfoque:

- El lienzo tiene dos fuentes para la selección: en `seleccionar(id)` marca
  las cajas de Rete (`caja.selected`) y además escribe `nodoSeleccionado` en
  el store. El panel de configuración lee el store. Nada marca las cajas
  cuando `nodoSeleccionado` cambia por otro camino, y eso es lo que hoy hacen
  la huella y la prueba de configuración con `actualizar()`.
- `eliminarCaja` (en el lienzo) limpia `nodoSeleccionado` en la misma
  llamada a `actualizar()` con la que saca la caja del flujo.
- El lienzo copia `estado.flujo` a Rete una sola vez, al montarse (cuando
  el panel tiene tamaño): una caja agregada al store después no aparece en el
  lienzo. Hoy la prueba de configuración agrega sus cajas así, y por eso las
  selecciona con `actualizar()` y no con un clic.
- `ventana-principal` tiene un `ControladorDeEstado` solo por `panelActivo`.
  Los componentes que leen el store (`panel-conexion`, `barra-de-estado`,
  `lienzo-workflow`, `panel-de-configuracion`) tienen el suyo, así que nada
  depende de que la ventana se vuelva a dibujar con el store.
- Los paneles ocultos no se desmontan (`?hidden`), así que el `@state` de
  `panel-workflow` sobrevive a los cambios de tab, como hoy el store.
- La huella y las pruebas seleccionan cajas con `actualizar()`, que deja de
  existir para la selección. La huella no captura el `div.caja` (no es una
  hoja), así que no ve la marca de la selección, pero sí el panel de
  configuración; las pruebas del editor y de configuración sí miran la
  marca.

## Goals / Non-Goals

**Goals:**

- Que la selección tenga un solo dueño, `panel-workflow`, y que el lienzo y
  el panel de configuración la reciban de él.
- Que el store quede solo con lo que usa la lógica: la conexión y el flujo.
- Que la huella y las pruebas den lo mismo antes y después del cambio.

**Non-Goals:**

- Context de Lit: con un solo nivel entre el contenedor y sus hijos, las
  propiedades muestran en la plantilla de dónde viene cada dato (descartado
  en la revisión; se evalúa en la nota 9, cambio E).
- Las presentaciones de los parámetros y los campos: es el cambio E.
- Mover otros datos de la conexión (los puertos elegidos, el mensaje): los
  usa la lógica (`conectar`) y la barra de estado, que es de otra área.
- Que el lienzo agregue cajas que aparecen en el store después de montarse.

## Decisions

### `nodoSeleccionado` es `@state` de `panel-workflow`

`panel-workflow` declara `@state() private nodoSeleccionado: string | null`,
que empieza en `null`, y lo pasa con `.nodoSeleccionado=${…}` al lienzo y al
panel de configuración, que lo declaran como
`@property({ attribute: false })`. Se mantiene el nombre del store para que
el cambio se lea como una mudanza.

`panel-de-configuracion` busca la caja en `estado.flujo` con esa propiedad
en lugar de `estado.nodoSeleccionado`; sigue con su `ControladorDeEstado`
porque lee el flujo.

### El lienzo pide la selección con `seleccionar-caja` y la marca desde la propiedad

`seleccionar(id)` deja de tocar las cajas y el store: solo despacha
`seleccionar-caja` con `detail: string | null` (`null` al hacer clic en el
fondo). Sigue el patrón de `agregar-caja` y `eliminar-caja`: el hijo pide, el
contenedor decide. No lleva `bubbles` ni `composed`, porque `panel-workflow`
lo escucha en el propio `<lienzo-workflow>`, sin cruzar ninguna raíz. El
JSDoc de `LienzoWorkflow` lo dice, como el de `panel-de-configuracion` dice
el suyo.

Las cajas se marcan en `updated()`, junto con `marcarErrores()`: un
`marcarSeleccion()` recorre las cajas y llama a `area.update` solo en las que
cambian (`caja.selected !== (caja.id === this.nodoSeleccionado)`), como hace
`marcarErrores()` con los errores. También se llama al final de `montar()`,
porque la propiedad puede llegar antes de que Rete tenga las cajas.

Alternativas: que el lienzo siga marcando por su cuenta y además avise (son
otra vez dos dueños, el problema de la nota 4); que el lienzo sea el dueño y
el panel de configuración se la pida (`panel-workflow` tendría que leer un
hijo para dársela a otro, y la selección quedaría atada a Rete).

### La selección la limpia `panel-workflow` al borrar

El manejador de `eliminar-caja` en `panel-workflow` espera
`this.lienzo.eliminarCaja(id)` y, si `id` era la seleccionada, pone
`nodoSeleccionado` en `null`. `eliminarCaja` solo saca la caja y sus
conexiones del lienzo y del flujo. El trigger no se borra, pero el panel de
configuración nunca pide borrarlo, así que no hace falta que `eliminarCaja`
avise si borró algo.

### `panelActivo` es `@state` de `ventana-principal`

`@state() private panelActivo = "conexion"` (la spec pide que la aplicación
arranque en Conexión). La barra de tabs lo cambia en el `@click` y las
secciones lo leen para `?hidden`. `ventana-principal` deja de importar el
store y de tener `ControladorDeEstado`.

### El store queda con la conexión y el flujo

Se van `panelActivo` y `nodoSeleccionado` de `Estado` y del valor inicial.
El JSDoc de `Estado` ("Todo lo que la pantalla muestra vive acá") pasa a
decir lo que queda: lo que usa la lógica o componentes de áreas distintas.

### Las pruebas seleccionan con clics y leen lo que se ve

Para que la huella y las pruebas sirvan de comparación, se adaptan **antes**
de tocar el código, se corren sobre `main` y de ahí salen la huella `antes`
y los resultados de referencia. Con el código nuevo tienen que dar lo mismo.

- **Seleccionar**: un clic en la caja, como ya hace `editor.js`
  (`arrastrar(caja, centro, centro)`), en lugar de `actualizar()`. Hoy y
  después del cambio, el clic marca la caja y llena el panel.
- **Cambiar de tab**: un clic en el tab (`boton('Log')`), en lugar de
  `actualizar({ panelActivo })`.
- **Leer la selección**: por lo que se ve, la clase `seleccionada` de las
  cajas y el título del panel de configuración, en lugar de
  `m.estado.nodoSeleccionado`.
- **Cajas que se seleccionan**: se agregan al flujo antes de mostrar el tab
  Workflow por primera vez, así el lienzo las copia al montarse y se les
  puede hacer clic.

Por archivo: `huella.js` agrega `d` y `f` sin seleccionar ninguna, así que
la captura del tab Workflow dentro del recorrido de tabs queda sin
selección, y las tres capturas `seleccionada …` hacen clic en cada caja.
`configuracion.js` agrega `d1` y `d2` antes del clic en Workflow y
selecciona con clics. `conexion.js` fuerza el redibujado con clics en los
tabs más el `actualizar({ mensajeConexion })` que ya tenía, que es el que
vuelve a dibujar `panel-conexion`. `editor.js` lee la selección por la clase
y el panel.

Una ayuda nueva en `ayudas/comun.js`, `cajaDelLienzo(id)`, devuelve el
`<caja-del-flujo>` de una caja (hoy `editor.js` la arma a mano con
`area.nodeViews`), y la usan `huella.js`, `configuracion.js` y `editor.js`.

Alternativa: asignar la propiedad del componente desde la prueba
(`uno('panel-workflow').nodoSeleccionado = 'd'`). Sirve después del cambio
pero no antes, y la huella `antes` no se podría tomar con la misma prueba.

## Risks / Trade-offs

- [La caja se marca un dibujado después del clic, cuando vuelve la
  propiedad] → Es una microtarea, sin un cuadro de por medio; las pruebas ya
  esperan `dibujado()` y la prueba del editor revisa la clase después de
  seleccionar.
- [`updated()` del lienzo corre con cada cambio del store] → `marcarSeleccion`
  solo actualiza las cajas que cambian, como `marcarErrores`.
- [Las cajas `d` y `f` de la huella, o `d1` y `d2` de la configuración,
  quedan fuera de la vista del lienzo y el clic no les llega] → Se ubican a
  150px una de otra desde la izquierda, y el lienzo mide unos 750px en la
  ventana de 1000px de las pruebas; si alguna queda afuera, la prueba la
  mueve antes de hacerle clic.
- [La huella `antes` deja de ser comparable con huellas viejas, porque el
  tab Workflow del recorrido ya no muestra la caja `d`] → Se toma una huella
  `antes` nueva con la `huella.js` adaptada, sobre `main`, antes de tocar el
  código.
- [Un componente de área que dependía de que `ventana-principal` se volviera
  a dibujar con el store] → Todos los que leen el store tienen su propio
  `ControladorDeEstado`; la huella y las pruebas lo confirman.
- [La activación de los tabs con Enter y la barra espaciadora no se puede
  probar con las herramientas] → Se prueba en la ventana real
  (`npm run tauri dev`), junto con seleccionar cajas y borrar la
  seleccionada.
