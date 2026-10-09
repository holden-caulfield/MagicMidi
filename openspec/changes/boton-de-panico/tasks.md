# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador, o con `verificacion-para-agentes/` (ver AGENTS.md, "Verificación
antes de dar por terminada una tarea"). El flujo MIDI completo y el atajo de
teclado se prueban con `npm run tauri dev` y dos buses del IAC Driver.

## 1. Los mensajes del pánico

- [ ] 1.1 Crear `src/midi/panico.ts` con `mensajesDePanico()`: 64 `MensajeMidi`
      nuevos en cada llamada, canal por canal del 1 al 16, y en cada canal
      CC 64, 120, 121 y 123 con valor 0, en ese orden (design.md, "Cuatro
      mensajes por canal, canal por canal"); verificar con `npx tsc --noEmit`
- [ ] 1.2 Crear `src/midi/panico.test.ts` con los escenarios de la spec
      `panico`, "El pánico apaga todo en los 16 canales": los cuatro primeros
      y los cuatro últimos mensajes en bytes literales, que son 64, que todos
      son Cambio de Control con valor 0, y que dos llamadas devuelven objetos
      distintos; verificar con `npm test`

## 2. Una caja puede devolver varios mensajes

- [ ] 2.1 En `workflow/tipos.ts`, ampliar lo que devuelve `procesar` a
      `MensajeMidi | MensajeMidi[] | null | void` y actualizar su JSDoc; en
      `workflow/ejecutar.ts`, normalizar el resultado a una lista, validar cada
      elemento, emitir todos en una caja sin salida y entregar cada uno en
      orden en una con salida (design.md, "`procesar` puede devolver una
      lista, en cualquier caja"); verificar con `npx tsc --noEmit` y con que
      los tests existentes de `ejecutar.test.ts` pasan sin cambios, con
      `npm test`
- [ ] 2.2 Sumar a `ejecutar.test.ts`, simulando el `procesar` de una caja
      existente con `vi.spyOn` como los tests de error, los escenarios nuevos
      de las specs `ejecucion-de-workflow` y `tipos-de-nodo`: una caja de fin
      que devuelve varios mensajes, varios mensajes que siguen de largo por
      separado y en orden, una lista vacía que descarta, y un mensaje inválido
      dentro de una lista que cancela todo; verificar con `npm test`
- [ ] 2.3 En `nodos/catalogo.test.ts`, que el test "procesa $mensaje sin
      fallar" revise cada mensaje cuando `procesar` devuelve una lista;
      verificar con `npm test`

## 3. La caja Pánico

- [ ] 3.1 Crear `src/workflow/nodos/panico.ts` (nombre "Pánico", ícono `Siren`,
      `tieneSalida: false`, sin parámetros, `procesar` que devuelve
      `mensajesDePanico()`) y registrarlo al final de `nodos/catalogo.ts`,
      después de Descartar; verificar con `npx tsc --noEmit`
- [ ] 3.2 Crear `panico.test.ts` en el estilo de `desplazar.test.ts` (un `test`
      por comportamiento, bytes literales, sin helpers): devuelve los 64
      mensajes sea cual sea el que llega, con el primero y el último en bytes
      literales; y sumar Pánico a "Emitir y Descartar cierran el flujo" en
      `catalogo.test.ts`; verificar con `npm test`
- [ ] 3.3 Sumar a `ejecutar.test.ts` los escenarios de flujo de la spec
      `nodo-panico`: cualquier mensaje la dispara y cancela el original, lo
      emitido por otras ramas sale igual, el botón que dispara dos veces, el
      botón que dispara una vez y no llega al sinte, y el resto de los mensajes
      que sigue de largo; verificar con `npm test`

## 4. El botón y el atajo

- [ ] 4.1 En `componentes/boton-de-accion.ts`, sumar la propiedad `urgente`
      (rojo de los errores mientras está habilitado, invertido con el puntero
      encima, ámbar cuando está activo o apretado) y la propiedad `atajo`
      (`aria-keyshortcuts` y globo nativo) (design.md, "El rojo es una
      variante de `boton-de-accion`"); verificar con `npx tsc --noEmit` y en el
      navegador que los botones existentes se ven igual que antes
- [ ] 4.2 En `conexion/conexion.ts`, sumar la acción `mandarPanico()`, que envía
      `mensajesDePanico()` con `enviarMensaje`; verificar con `npx tsc
      --noEmit`
- [ ] 4.3 Crear `conexion/boton-de-panico.ts` con `<boton-de-panico>`: un
      `boton-de-accion` urgente con el ícono `Siren` y el texto "Pánico",
      deshabilitado sin conexión (lee `estado.conectado` con su
      `ControladorDeEstado`), que llama a `mandarPanico()` al activarlo; y el
      atajo (Cmd+. en macOS, Ctrl+. en los demás) escuchado en `window` en
      fase de captura mientras el componente está conectado, con
      `preventDefault()`, sin repeticiones, sin efecto sin conexión, y que
      enciende el botón unos 150 ms (design.md, "El botón y su atajo son un
      componente de `conexion/`"); verificar con `npx tsc --noEmit`
- [ ] 4.4 En `ventana/ventana-principal.ts`, montar `<boton-de-panico>` después
      del selector de tabs, y pasar `.barra-tabs` a una grilla de tres
      columnas con el selector centrado y el botón contra el borde derecho
      (design.md, "La barra de navegación pasa a tres columnas"); verificar
      en el navegador que el selector sigue centrado y que el botón está
      contra el borde derecho, también con la ventana angosta

## 5. Documentación

- [ ] 5.1 En `README.md`, sumar el pánico a "Qué hace hoy" (el botón, el
      atajo y qué mensajes manda) y la caja Pánico a "Cajas disponibles",
      con el ejemplo del Filtrar para dispararla desde un botón del
      controlador; verificar releyéndolo
- [ ] 5.2 En `src/workflow/nodos/LEEME.md`, explicar en "La función
      `procesar`" que puede devolver una lista de mensajes (qué pasa en una
      caja con salida y en una sin salida, y que una lista vacía es lo mismo
      que no devolver nada), y cómo se prueba; verificar releyendo la guía de
      punta a punta

## 6. Verificación

- [ ] 6.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y desde
      `src-tauri/` `cargo check`, `cargo test`, `cargo fmt --check` y
      `cargo clippy --all-targets -- -D warnings`; todo tiene que pasar
- [ ] 6.2 En el navegador, con el estado manejado desde la consola: el botón
      atenuado y sin rojo desconectado, rojo con `conectado: true`, en modo
      claro y oscuro, con puntero encima y apretado; el mismo lugar en los
      tres tabs; el orden de Tab (tabs, Pánico, panel) y que el botón no se
      anuncia como tab; la barra ofrece las ocho cajas en orden, y Pánico se
      agrega como caja de fin, con el ícono `Siren` y sin parámetros; mostrar
      capturas
- [ ] 6.3 Comparar la huella de la interfaz con la de `main`
      (`verificacion-para-agentes/huella/`): solo tienen que cambiar la barra
      de navegación y la barra de herramientas del Workflow
- [ ] 6.4 En `npm run tauri dev`, con dos buses del IAC Driver y `midi.sh`
      escuchando la salida: el botón y Cmd+. mandan los 64 mensajes en el
      orden de la spec, también con el foco en un campo numérico; mantener
      Cmd+. apretado los manda una sola vez; con otra aplicación al frente,
      Cmd+. no manda nada; Enter y barra espaciadora sobre el botón lo
      activan; desconectado no sale nada; la caja Pánico detrás de un Filtrar
      se dispara con un CC mandado por `midi.sh`, y el log muestra sus 64
      sub-filas, mientras que el botón no agrega nada al log
