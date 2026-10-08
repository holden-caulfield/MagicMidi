# Tasks

El orden sigue design.md ("El orden, para que cada paso compile"): cada grupo
termina con `npx tsc --noEmit` y `npm test` en verde. Los modos se ven igual
antes y después; lo único que cambia a la vista es el log, que escribe en
decimal los valores de un error.

## 1. Referencia sobre el código actual

- [x] 1.1 Escribir `verificacion-para-agentes/pruebas/modos.js`, que maneje el
      panel solo con lo que se ve, como `configuracion.js`: dos cajas "Fijar"
      y una "Filtrar" agregadas antes de abrir el tab; escribir "C4", "3C",
      "Db4" y "mucho" en el valor, flechas con `keydown` (con y sin
      Mayúsculas) y con clic, el botón de modo, el error con byte "Canal" en
      cada modo, los dos campos de un rango (escribir una nota, flechas
      frenadas en la otra perilla) y pasar a la otra caja y volver. Que lea lo
      que muestran los campos, los botones de modo y los errores. Verificar
      corriéndola en WebKit sobre el código actual y guardar su salida como
      referencia
- [x] 1.2 Tomar la huella `antes` con `verificacion-para-agentes/huella/comparar.sh antes`
      sobre el código actual, y verificar que se generaron los dos JSON (claro
      y oscuro)

## 2. Las notas y los modos se mudan

- [x] 2.1 Crear `src/midi/notas.ts` con `nombreDeNota` y `numeroDeNota`, mover
      sus tests de `describir.test.ts` a `notas.test.ts` e importarlas desde
      `describir.ts`. Verificar con `npm test` y que
      `grep -rn "nombreDeNota\|numeroDeNota" src` no las encuentre definidas
      en `describir.ts`
- [x] 2.2 Mover `workflow/parametros/modos.ts` y `modos.test.ts` a
      `src/componentes/`, con `Presentacion` como `EstadoNumerico` y
      `presentacionActual` como `estadoRevisado`, y ajustar los imports de
      `entero.ts`, `rango.ts`, `entero.test.ts` y `nodos/catalogo.test.ts`.
      Verificar con `npx tsc --noEmit` y `npm test`

## 3. `formato`

- [x] 3.1 Crear `src/formato.ts` con `TextoConValores`, `formato` (que copia
      las partes a un arreglo común) y `escribir`, y su `formato.test.ts`: un
      texto sin valores, valores con `String`, valores con otra función, y
      dos textos iguales escritos en lugares distintos que dan `toEqual`.
      Verificar con `npm test`

## 4. El modo es estado del campo

- [x] 4.1 Crear `componentes/modo-numerico.ts` con `ModoNumerico` como dice
      design.md (`formatear`, `leer`, `siguiente`, `boton`, `cambiar`, el
      `estado` recibido adoptado en `hostUpdate` sin avisar, y el aviso de los
      cambios que nacen en el campo). Verificar con
      `npx tsc --noEmit`
- [x] 4.2 En `Campo`, reemplazar la propiedad `modo` y `siguiente-modo` por
      `protected botonDeModo()`, y agregar `estado` y `avisarEstado`
      (`cambio-de-estado`). Verificar con `npx tsc --noEmit` (fallan los
      usos de `modo`, que arreglan 4.3 y 4.4)
- [x] 4.3 En `campo-numero`, pasar a `valor: number` con `modos`, `minimo`,
      `maximo` y el controlador; leer al salir del campo, manejar las flechas
      con `limitar` (mudado de `entero.ts`, con su test en
      `campo-numero.test.ts`) y sacar `paso`, `Paso`, `puedeSubir`,
      `puedeBajar` y `decimales`. Verificar con `npm test`
- [x] 4.4 En `campo-rango`, agregar el controlador, `modos` y `estado`;
      pasarle a cada campo compacto el estado, los modos y los límites de
      `limitesDelExtremo`; adoptar su `cambio-de-estado` y sacar `formatear`,
      `leer`, `pasarExtremo` e `interpretarExtremo`, con los tests de
      `campo-rango.test.ts` ajustados. Verificar con `npm test`
- [x] 4.5 En `parametro-entero` y `parametro-rango`, dejar de interpretar:
      pasarles a los campos los modos, los límites y la presentación como
      `estado`, y reenviar `cambio-de-estado` como `cambio-de-presentacion`.
      Sacar `interpretar` y `limitar` de `entero.ts` y mover sus tests a los
      de los modos y de `campo-numero`. Ajustar `desplazar.test.ts` para que
      pruebe con `leer`. Verificar con `npx tsc --noEmit` y `npm test`
- [x] 4.6 En `panel-de-configuracion`, dibujar los parámetros con `repeat` y
      la clave `${nodo.id}/${parametro.clave}`. Verificar con
      `npx tsc --noEmit`, y corriendo `pruebas/modos.js` en WebKit: da lo
      mismo que en 1.1, incluida la caja que nunca cambió de modo, que se ve
      en decimal

## 5. Los mensajes llevan valores

- [x] 5.1 Renombrar `error` a `validar` en los seis tipos de parámetro y en
      `TipoDeParametro`, y `errorDelParametro` a `validarParametro`. Hacer que
      el `validar` del entero y del rango devuelva los textos con valores con
      `formato`, sin presentación, y pasar `ErrorDeConfiguracion`,
      `TipoDeParametro`, `validarParametro` y `TipoDeNodo.validar` a las
      firmas nuevas; sacar `formatear` del catálogo y `formatearParametro`.
      Hacer que `Campo` escriba el error con `escribir` y `formatearValor`, y
      que los numéricos lo redefinan con su modo. Verificar con
      `npx tsc --noEmit` y que
      `grep -rn "errorDelParametro\|export function error\|^  error" src/workflow/parametros`
      no encuentre nada
- [x] 5.2 Pasar `erroresDeConfiguracion` a `(tipo, parametros)`, Fijar a
      `validar(parametros)` con `formato`, el ejecutor a
      `escribir(primerError.mensaje)` y el lienzo y el panel a la firma nueva.
      Verificar con `npx tsc --noEmit` y que
      `grep -rn "presentaciones\|formatear(" src/workflow` solo encuentre lo
      que queda del paso 6
- [x] 5.3 Ajustar los tests: `entero.test.ts`, `rango.test.ts`,
      `opciones.test.ts` y `autocompletar.test.ts` prueban `validar` (con sus
      comentarios), y los del entero y el rango comparan con `formato`;
      `validacion.test.ts` pierde los de presentación;
      `fijar.test.ts` pierde `enDecimal` y revisa que el 1 y el 16 van
      marcados como valores; `ejecutar.test.ts` pasa a esperar en decimal el
      error de una caja Fijar en hexadecimal. Verificar con `npm test`

## 6. Sin los `parametro-…`

- [x] 6.1 Hacer que `avisar` y `avisarEstado` de `Campo` vayan con
      `bubbles: true`, y que el `dibujar` de cada tipo dibuje su `campo-…`
      directamente (los numéricos, con `.modos`, `.minimo`, `.maximo` y
      `.estado`). Borrar los seis `@customElement("parametro-…")` y
      `campo-de-parametro.ts`, con `ParametroBase` en
      `parametros/parametro.ts`. Verificar con `npx tsc --noEmit` y que
      `grep -rn "parametro-\|CampoDeParametro" src` no encuentre nada
- [x] 6.2 Pasar `NodoDelFlujo.presentaciones` a `estadoDeLosParametros`, y en
      el panel, `cambiarPresentacion` a `cambiarEstado`, que escucha
      `cambio-de-estado` y le pasa a `dibujarParametro` el de cada parámetro.
      Verificar con `npx tsc --noEmit`, `npm test` y que
      `grep -rni "presentaci" src` no encuentre nada

## 7. Guías

- [x] 7.1 Reescribir `src/workflow/parametros/LEEME.md`: un tipo es la
      declaración, `validar` (con `formato` para nombrar valores) y `dibujar`
      (qué campo y con qué datos, y el `estado` que se le pasa sin leerlo);
      interpretar lo escrito es del campo, y si ningún campo sirve hace falta
      uno nuevo en `src/componentes/`; los modos se declaran y el campo se
      ocupa de ellos. El ejemplo completo pasa a ser un tipo `nota` que dibuja
      `campo-numero` con `modos: ["nota"]`, de 0 a 127, con su test de
      `validar`, y `dibujar` recibe en `error` lo que devolvió `validar`.
      Verificar que el ejemplo compile copiándolo a `parametros/nota.ts` y
      `nota.test.ts`, registrándolo en el catálogo,
      corriendo `npx tsc --noEmit` y `npm test`, y borrándolo después; y
      releer la guía como alguien con nociones básicas de programación
- [x] 7.2 En `src/workflow/nodos/LEEME.md`, explicar `validar(parametros)` sin
      `formatear`, con `formato` para nombrar valores (el ejemplo de Fijar), y
      el test sin la ayuda que escribe en decimal. Verificar que los
      fragmentos coincidan con `fijar.ts` y `fijar.test.ts`, y releerla como
      alguien que recién empieza a programar

## 8. Verificación

- [x] 8.1 Correr `pruebas/modos.js` en WebKit y verificar que dé lo mismo que
      en 1.1.
      Correr `configuracion`, `editor`, `conexion`, `tabs`, `log`, `cuadros` y
      `ventana-oculta`, y verificar que den lo mismo que antes del cambio
- [x] 8.2 Tomar la huella con `comparar.sh despues` (reiniciando el servidor
      antes) y verificar que `diferencias.py antes despues` termine en 0
- [x] 8.3 En el navegador, con una caja "Fijar" con byte "Canal", valor 100 y
      el valor en hexadecimal, llamar a `recibirMensaje` desde la consola y
      verificar que el error del log diga "de 1 a 16" mientras el panel dice
      "de 01 a 10"

## 9. Cierre

- [x] 9.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y verificar
      que pasen sin errores
- [ ] 9.2 Proponerle a la persona usuaria el diff de AGENTS.md, con el
      criterio de "Cómo se escribe este archivo", y aplicarlo solo con su
      aprobación explícita: en "Controles", que los campos numéricos reciben
      y avisan números y son dueños del modo y de las flechas, sin la lista
      de los `campo-…`; en "Mensajes MIDI", que los nombres de las notas
      viven en `midi/notas.ts`; en "Workflow", los errores con valores que
      escribe el campo (y en decimal en el log), las firmas nuevas,
      `estadoDeLosParametros` en lugar de la presentación, el panel que ata
      cada campo a su caja y su parámetro, y los tipos de parámetro como
      declaración, `validar` y `dibujar`, sin la lista de quién usa
      `erroresDeConfiguracion`; y en "Tests", que interpretar lo escrito se
      prueba al lado del campo
- [x] 9.3 Pedirle a la persona usuaria que pruebe en la ventana real
      (`npm run tauri dev`): escribir en cada modo, usar las flechas (propias
      y del teclado, con y sin Mayúsculas), cambiar de modo con el mouse, con
      Enter y con la barra espaciadora, pasar de una caja a otra y volver, y
      que los errores se lean en el modo del campo en el panel y en decimal
      en el log

## 10. Simplificación después de revisar el PR

- [x] 10.1 Juntar `modos.ts` en `componentes/modo-numerico.ts`: una tabla con
      lo que cambia de un modo a otro y `ModoNumerico` como único dueño del
      modo, que lee el `estado` del campo una sola vez, al dibujarse por
      primera vez. Sin `DeclaracionNumerica` ni las funciones sueltas, y con
      sus tests en `modo-numerico.test.ts`. Verificar con `npx tsc --noEmit` y
      `npm test`
- [x] 10.2 Que `campo-rango` dibuje sus dos campos de texto, con las flechas
      del teclado movidas como la perilla, y sacar `compacto` de
      `campo-numero` y `limitesDelExtremo` del rango. Verificar con
      `npx tsc --noEmit`, `npm test` y que
      `grep -rn "compacto\|limitesDelExtremo\|DeclaracionNumerica" src` no
      encuentre nada
- [x] 10.3 Adaptar `pruebas/modos.js` para que encuentre los campos del rango
      en las dos estructuras, y verificar que dé lo mismo sobre `main` (con la
      versión anterior y con la adaptada) y con el cambio. Correr el resto de
      las pruebas y tomar la huella sobre `main` y con el cambio, y verificar
      que `diferencias.py` termine en 0

## 11. Los tipos de parámetro son funciones (después de revisar el PR)

- [x] 11.1 Pasar cada tipo de parámetro a una función con el nombre del tipo,
      que recibe la declaración y devuelve el parámetro con su `validar` y su
      `dibujar` (`Declaracion<V>` y `Parametro<V>` en `parametros/parametro.ts`),
      y borrar `parametros/catalogo.ts`. Verificar con `npx tsc --noEmit` que
      compilen los tipos de parámetro, y con un archivo de prueba que una
      declaración con un tipo que no existe, un valor inicial de otra clase o
      un dato que falta no compile
- [x] 11.2 Declarar los parámetros de los tipos de nodo con esas funciones, y
      pasar `erroresDeConfiguracion` a recibir la caja, con el panel, el lienzo
      y el ejecutor. Verificar con `npx tsc --noEmit`
- [x] 11.3 Ajustar los tests (los de cada tipo de parámetro arman el
      parámetro con su función; `validacion.test.ts` usa Fijar y Desplazar) y
      las guías de parámetros y de nodos. Verificar con `npm test`, que no
      quede `catalogo` de parámetros ni `tipo: "…"` en las declaraciones, y
      compilando el ejemplo `nota` de la guía
- [x] 11.4 Delta specs: el catálogo se reemplaza por "Un tipo de parámetro es
      un archivo que arma sus parámetros", y se ajusta "Los tipos de nodo no
      dependen del editor". Verificar con `openspec validate --strict`
- [x] 11.5 Correr la prueba de los modos, las demás pruebas y la huella, y
      verificar que den lo mismo que en el grupo 10
