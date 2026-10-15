# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador, o con `verificacion-para-agentes/` (ver AGENTS.md, "Verificación
antes de dar por terminada una tarea"). El flujo MIDI completo se prueba con
`npm run tauri dev`, dos buses del IAC Driver y `midi.sh`.

## 1. Lo anotado

- [x] 1.1 Crear `src/workflow/notas-prendidas.ts`, con lo anotado como estado
      del módulo (un `Map` de canal y nota a una cola de listas) y tres
      funciones: `anotarNotasPrendidas(notaOn, salidas)` (solo las salidas que
      son Nota On, como `{ canal, nota }`, bajo el canal y la nota del que
      entró), `soltarNota(notaOff)` (saca la anotación más vieja de su clave y
      devuelve sus Nota Off, armados como copia del que entró con el canal y la
      nota cambiados; `null` sin anotación; borra la clave cuando su cola
      queda vacía) y `olvidarNotasPrendidas()` (design.md, "Lo anotado es
      estado propio del módulo `workflow`"); verificar con `npx tsc --noEmit`
- [x] 1.2 Crear `src/workflow/notas-prendidas.test.ts`, con bytes literales y
      `olvidarNotasPrendidas()` en `beforeEach`: un Nota On transpuesto se
      suelta con su nota; un acorde suelta todas sus notas en orden; el canal
      cambiado; un `9n` con velocidad 0 conserva su forma y un `8n` su
      velocidad; la misma nota dos veces se suelta de la más vieja a la más
      nueva; una anotación vacía da una lista vacía; sin anotación da `null`;
      las salidas que no son Nota On (CC, Nota On con velocidad 0) no se
      anotan; olvidar vacía todo; verificar con `npm test`

## 2. El ejecutor

- [x] 2.1 En `workflow/ejecutar.ts`, que `procesarMensaje` devuelva
      `apareado`: anota cada Nota On con sus salidas (vacías si hubo error),
      suelta cada Nota Off siempre, y si no llegó a ninguna caja de fin, no
      hubo error y `soltarNota` no dio `null`, sale lo que devolvió
      `soltarNota` (design.md, "`procesarMensaje` anota y aparea"); actualizar
      su JSDoc y el de `ResultadoDelFlujo`, y que `recibirMensaje` le pase el
      `apareado` al log; verificar con `npx tsc --noEmit` y con que los tests
      existentes de `ejecutar.test.ts` pasan con `olvidarNotasPrendidas()` en
      `beforeEach`, con `npm test`
- [x] 2.2 En `main.ts`, suscribir al store la función que olvida lo anotado
      cada vez que `estado.conectado` es `false` (design.md, "Sin conexión, la
      ejecución está en cero"); verificar con `npx tsc --noEmit`, y en el
      navegador que, con un Nota On anotado, `actualizar({ conectado: false })`
      lo olvida y el Nota Off siguiente sale tal cual
- [x] 2.3 Sumar a `ejecutar.test.ts` los escenarios de la spec
      `apareo-de-nota-off` que no dependen de la conexión ni del botón:
      transponer solo los Nota On, cambiar la caja con la tecla apretada,
      acorde, cambiar el canal, Nota On con velocidad 0, el Nota Off tal cual
      armado a mano, otra rama que lleva el Nota Off a un Emitir, descartar
      los Nota Off, un Nota On que salió tal cual, la misma nota dos veces, un
      Nota Off que llega a un Emitir también cierra su anotación, notas que
      salen de un CC, un pad como interruptor, un Nota On descartado, un Nota
      Off sin su Nota On, pánico desde una caja, borrar el flujo no olvida, y
      que una caja que falla con el Nota Off no deja salir nada pero cierra la
      anotación; el escenario nuevo de `ejecucion-de-workflow`; y que el test
      del pad que cambia de programa diga que su Nota Off no sale, como el
      escenario modificado de `nodo-convertir`; verificar con `npm test`

## 3. El log

- [x] 3.1 En `log/log.ts`, sumar a `Resultado` el tipo `"apareado"` con sus
      salidas, y que `agregarAlLog` y `clasificarSalidas` reciban si hubo
      apareo y lo clasifiquen después del error y de "sin cambios", y antes
      de "descartado" (design.md, "En el log, 'apareado' es un resultado
      más"); sumar a `log.test.ts` los casos: apareado con salidas, con una
      sola salida igual a la entrada (sin cambios), con la misma nota y otra,
      sin salidas, y error que gana sobre el apareo; verificar con `npm test`
- [x] 3.2 En `estilos/global.css`, sumar `--fondo-apareo` en modo claro y
      oscuro, cercano a `--fondo-salida` pero distinguible; en
      `log/panel-log.ts`, la marca con el ícono `Link2` y el texto "Apareado
      con su Nota On", la clase `apareado` en la fila de entrada (fondo gris,
      letra normal) y las sub-filas del apareo con su fondo y la letra de
      salida; verificar con `npx tsc --noEmit` y en el navegador, llamando a
      `recibirMensaje` desde la consola con los escenarios de "Un Nota Off
      apareado se marca como tal", en modo claro y oscuro; mostrar capturas

## 4. Documentación

- [x] 4.1 En `README.md`, sumar a lo que sale por el puerto la excepción del
      Nota Off: si no llega a ninguna caja de fin, apaga lo que prendió su
      Nota On; verificar releyéndolo
- [x] 4.2 En "Qué sale por el puerto" de `src/workflow/nodos/LEEME.md`,
      explicar el apareo para quien recién empieza: qué pasa con el Nota Off
      que no llega a una caja de fin, que alcanza con que llegue por un
      camino para que no se aparee, el caso de la octava mal armada con su
      forma bien armada, cómo se arma el comportamiento de antes
      (`Filtrar (Nota Off) → Emitir`), y que el log muestra si un Nota Off
      salió apareado; verificar releyendo la guía de punta a punta

## 5. Verificación

- [x] 5.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y desde
      `src-tauri/` `cargo check`, `cargo test`, `cargo fmt --check` y
      `cargo clippy --all-targets -- -D warnings`; todo tiene que pasar
- [x] 5.2 Comparar la huella de la interfaz con la de `main`
      (`verificacion-para-agentes/huella/`) con un log sin Nota Off
      apareados: tiene que dar igual
- [x] 5.3 En `npm run tauri dev`, con dos buses del IAC Driver y `midi.sh`
      escuchando la salida: con `Filtrar (Nota On) → Desplazar (+12) →
      Emitir`, cambiar el desplazamiento entre un Nota On y su Nota Off apaga
      la nota que sonaba; el pánico (botón y Cmd+.) no olvida lo anotado, y
      volver a conectar sí, así que el Nota Off siguiente sale tal cual; el log
      muestra la marca de apareado y sus sub-filas. Tener en cuenta que el
      IAC convierte `90 nn 00` en `80 nn 40` antes de que llegue a la
      aplicación

## 6. Al cerrar el cambio

- [ ] 6.1 Proponer a la persona usuaria, sin hacerlo por cuenta propia, los
      cambios del roadmap: marcar "Evitar notas colgadas al editar en vivo"
      como hecha, y actualizar las recetas que hoy filtran Nota On y Nota Off
      juntos (acorde, espejo de teclado) para que filtren solo los Nota On
- [ ] 6.2 Al archivar, proponer el diff de AGENTS.md ("Devolver el
      conocimiento a este archivo"): la excepción del Nota Off en la regla del
      ejecutor, que `procesarMensaje` anota y aparea, que sin conexión la
      ejecución vuelve a cero, y la regla común del log y lo anotado (lo que
      cambia con cada mensaje MIDI es estado del módulo que lo usa, fuera del
      store)
