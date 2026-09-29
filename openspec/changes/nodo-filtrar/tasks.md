# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador (ver AGENTS.md, "Verificación antes de dar por terminada una
tarea"): se arma el flujo en el tab Workflow y se simula la llegada de
mensajes llamando a mano, desde la consola, a `procesarMensaje` y
`agregarAlLog`. El flujo MIDI completo se prueba con `npm run tauri dev` y dos
buses del IAC Driver.

## 1. El mensaje como objeto

- [ ] 1.1 En `src/workflow/tipos.ts`, reemplazar `type MensajeMidi = number[]`
      por la clase `MensajeMidi` (`bytes`, getters `tipo` y `canal`,
      `copiar()`), el tipo `TipoDeMensaje`, la lista de tipos elegibles y sus
      nombres visibles (design.md, "`MensajeMidi` pasa a ser una clase…"), y
      escribir `src/workflow/tipos.test.ts` con los escenarios de "El mensaje
      dice su tipo y su canal" (los siete tipos de canal, `9n` con velocidad 0
      y sin tercer byte, sistema, sin status, vacío, canales 1 y 16, y que la
      lectura sigue a los bytes después de modificarlos); verificar con
      `npm test`
- [ ] 1.2 Pasar `src/describir.ts` a recibir un `MensajeMidi` y usar `tipo`,
      `canal` y los nombres compartidos, sin cambiar ningún texto; adaptar
      `describir.test.ts` solo en cómo arma los mensajes; verificar con
      `npm test` que siguen pasando todos los casos
- [ ] 1.3 Adaptar los bordes: el listener de `mensaje-midi` en `ejecutar.ts`
      crea el `MensajeMidi` desde `evento.payload.datos`, `enviarMensaje`
      (`salida.ts`) manda `mensaje.bytes`, y `src/log.ts` recibe y compara
      objetos (`clasificarSalidas` sobre `bytes`), con `log.test.ts`
      adaptado; verificar con `npx tsc --noEmit` y `npm test`
- [ ] 1.4 Adaptar `desplazar.ts`, `emitir.ts` y sus tests al objeto, con
      `toEqual(new MensajeMidi([...]))` y bytes literales (design.md, "Las
      pruebas comparan objetos con `toEqual`"), y `catalogo.test.ts` para que
      envuelva `MENSAJES_TIPICOS` y revise `resultado.bytes`; verificar con
      `npm test`

## 2. Reenvío por defecto y errores

- [ ] 2.1 En `ejecutar.ts`, dejar que entre cajas viaje solo `salidas`:
      `procesarEn` devuelve `true` si llegó a una caja sin salida (antes de
      llamar a `procesar`) o lo que devuelva `entregar` para sus conexiones,
      y `entregar` devuelve si alguna rama llegó
      (procesándolas todas, sin `.some()`); `procesarEn` deja de
      atrapar lo que lanza `procesar` y lo vuelve a lanzar como
      `new Error('La caja "<nombre>" falló: <detalle>', { cause })`, y un
      resultado inválido lanza `new Error('La caja "<nombre>" produjo un
      mensaje MIDI inválido')`; copiar con `mensaje.copiar()`; validar que el
      resultado sea un `MensajeMidi` con bytes válidos; y que
      `procesarMensaje` tenga el único `try/catch`, deje el `Error` completo
      en la consola y devuelva `{ salidas, error }`: `[]` y el `message` del
      error si falló, y si no lo de las cajas de fin o `[mensaje]` con
      `error: null` (design.md, "El reenvío por defecto y los errores se
      deciden en el ejecutor"); que el listener de `mensaje-midi` le pase el
      texto del error a `agregarAlLog` y que ninguna excepción salga de
      `procesarMensaje`; verificar con `npx tsc --noEmit`
- [ ] 2.2 Actualizar `ejecutar.test.ts` al nuevo resultado: "una caja que
      descarta el mensaje corta solo su rama" y "sin una caja Emitir al final
      no sale nada" pasan a esperar el original; "una caja que falla no corta
      las otras ramas", "un mensaje inválido no sigue adelante…" y "lo
      inválido que devuelve una caja sin salida no sale" pasan a esperar
      ninguna salida y un `error` que nombra la caja; sumar casos para solo el trigger, un camino
      sin caja de fin, Emitir más una rama que descarta (sale una sola vez),
      que el original reenviado no tenga los cambios de una rama, un error
      después de que un Emitir ya devolvió (no sale nada), que después del
      error ninguna caja vuelve a procesar ese mensaje (con un espía sobre
      `procesar`), y que el mensaje siguiente se procesa normalmente;
      verificar con `npm test`

## 3. El error en el log

- [ ] 3.1 En `src/log.ts`, que `agregarAlLog` reciba el texto del error (o
      `null`) y `clasificarSalidas` devuelva `{ tipo: "error", texto }` antes
      que los demás casos; la fila de entrada lleva la clase `error` y la
      marca con `TriangleAlert`, cuyo texto es "Error: " más el texto del
      error (design.md, "El log suma un estado 'error', con el texto del
      error"); sumar a `log.test.ts` que con un error el resultado es error
      con ese texto aunque las salidas estén vacías; verificar con
      `npx tsc --noEmit` y `npm test`
- [ ] 3.2 En `src/styles.css`, fondo rojo suave y letra roja para la fila de
      entrada con error, en modo claro y oscuro, sin que ninguna otra fila use
      rojo; verificar en el navegador (tarea 6.2)

## 4. Nodos nuevos

- [ ] 4.1 Crear `src/workflow/nodos/descartar.ts` (sin salida, sin
      parámetros, ícono `Ban`, no devuelve nada) y `descartar.test.ts` en el
      estilo de `desplazar.test.ts`; verificar con `npm test`
- [ ] 4.2 Crear `src/workflow/nodos/filtrar.ts` (ícono `Filter`, un sí/no por
      tipo elegible con clave igual al identificador e inicial `false`) y
      `filtrar.test.ts` con los escenarios de la spec `nodo-filtrar` (solo
      notas, `9n` con velocidad 0, cualquier canal, sistema, nada marcado,
      mensaje sin status); verificar con `npm test`
- [ ] 4.3 Registrar Filtrar y Descartar en `catalogo.ts` en el orden Filtrar,
      Desplazar, Emitir, Descartar, y sumar a `catalogo.test.ts` que Descartar
      es "fin" y Filtrar "intermedia"; sumar a `ejecutar.test.ts` los
      escenarios "Filtrar sin tener que ocuparse del resto" y "Sacar los Nota
      Off"; verificar con `npm test`

## 5. Documentación

- [ ] 5.1 Reescribir `src/workflow/nodos/LEEME.md`: el objeto `MensajeMidi`
      (`bytes`, `tipo`, `canal`, cómo crear uno nuevo), qué pasa con un
      mensaje que no llega a ninguna caja de fin, que un error en una caja
      hace que no salga nada de ese mensaje (hoy dice que "el resto del flujo
      sigue funcionando"), el ejemplo completo
      "Velocidad fija" con su test (Nota On con velocidad 0 sin tocar,
      velocidad ajustada a 1–127, mensajes que no son Nota On), y "Filtrar
      (Nota Off) → Descartar" en lugar de "Sin Nota Off"; verificar copiando
      el ejemplo a la carpeta y registrándolo, corriendo `npx tsc --noEmit` y
      `npm test`, y borrándolo después
- [ ] 5.2 Actualizar "Qué hace hoy" en `README.md` (reenvío por defecto,
      editor de flujos con Filtrar, Desplazar, Emitir y Descartar); verificar
      leyéndolo contra las specs

## 6. Verificación

- [ ] 6.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y desde
      `src-tauri/` `cargo check`, `cargo test`, `cargo fmt --check` y
      `cargo clippy --all-targets -- -D warnings` (el backend no cambia, pero
      el CI los corre)
- [ ] 6.2 En el navegador: la barra muestra las cuatro cajas en orden,
      Descartar se ve naranja y sin conector de salida, el panel de Filtrar
      muestra las ocho casillas desmarcadas, y el log marca "salió sin
      cambios" con solo el trigger, "descartado" con trigger → Descartar, y
      error (rojo, con su ícono, y al pasar el puntero el texto con la caja
      que falló y por qué) cuando una caja falla, en modo
      claro y oscuro (se provoca el error reemplazando a mano, desde la
      consola, el `procesar` de un tipo del catálogo)
- [ ] 6.3 En `npm run tauri dev` con dos buses del IAC Driver: el acorde con
      Filtrar (Nota On y Nota Off) deja pasar un Cambio de Control tal cual, y
      Filtrar (Nota Off) → Descartar corta los Nota Off
- [ ] 6.4 Antes de archivar, proponer a la persona usuaria el diff de la
      sección Workflow de AGENTS.md (el reenvío por defecto en lugar de "solo
      sale lo que llega a una caja Emitir", que un error cancela todo lo de
      ese mensaje, el `MensajeMidi` como objeto, la
      lectura del status en `tipos.ts` en vez de `describir.ts`) y aplicarlo
      solo con su aprobación
