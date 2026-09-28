# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador (ver AGENTS.md, "Verificación antes de dar por terminada una
tarea"): se arma el flujo en el tab Workflow y se simula la llegada de
mensajes llamando a mano, desde la consola, a la función que maneja
`mensaje-midi` (o a `procesarMensaje` y `agregarAlLog`). El flujo MIDI
completo se prueba con `npm run tauri dev` y dos buses del IAC Driver.

## 1. Descripción en el frontend

- [x] 1.1 Crear `src/describir.ts` con `describirMensaje(datos)`, portado de
      `describir_mensaje` de `src-tauri/src/lib.rs` con los mismos textos, y
      `src/describir.test.ts` con los casos de los tests de Rust (mensajes de
      canal, Nota On con velocidad 0, Pitch Bend, sistema conocidos y no
      reconocidos, truncados); verificar con `npm test`
- [x] 1.2 En `src-tauri/src/lib.rs`, borrar `describir_mensaje`, sus tests y
      el campo `descripcion` del evento; verificar con `cargo check`,
      `cargo test`, `cargo fmt --check` y
      `cargo clippy --all-targets -- -D warnings` desde `src-tauri/`

## 2. Saber qué emitió el flujo

- [x] 2.1 Hacer que Emitir devuelva el mensaje en vez de enviarlo (sin
      importar `../salida`), y pasar `emitir.test.ts` a revisar lo que
      devuelve, sin mocks; sacar el mock de `salida` de `catalogo.test.ts`
      (design.md, "Las cajas describen lo que sale y el envío pasa en un solo
      lugar"); verificar con `npm test`
- [x] 2.2 En `src/workflow/ejecutar.ts`, que `entregar` y `procesarEn` reciban
      la lista `salidas` y le agreguen, validado, lo que devuelve una caja sin
      salida, y que `procesarMensaje` devuelva esa lista; pasar
      `ejecutar.test.ts` a revisar el valor devuelto sin ningún mock, con
      tests para "Acorde que incluye la nota original", "Sale igual dos
      veces", "Lo que falla no figura como salida" y una caja sin salida que
      devuelve un mensaje inválido; verificar con `npm test` que pasan todos,
      también los que ya estaban
- [x] 2.3 Dejar `src/workflow/salida.ts` solo con la cola de `invoke`, sin
      `recolectarEnvios`, y que el listener de `inicializarWorkflow` envíe
      cada salida con `enviarMensaje` antes de `agregarAlLog`; verificar con
      `npx tsc --noEmit` y con un `grep` que ningún archivo de
      `src/workflow/nodos/` importe `../salida`
- [x] 2.4 En `src/workflow/nodos/LEEME.md`, explicar en `tieneSalida` y en lo
      que devuelve `procesar` que lo que devuelve una caja sin salida es lo que
      sale por el puerto, y sacar `../salida` de lo que un nodo puede
      importar; verificar releyendo la guía que alcance para crear una caja
      final sin saber nada más del proyecto

## 3. Grupos en el log

- [x] 3.1 En `src/log.ts`, agregar la función pura que clasifica las salidas
      de una entrada (descartado, sin cambios, o transformado con la lista de
      salidas en orden) y `src/log.test.ts` con los cinco casos: descartado,
      sin cambios, un cambio, varios distintos, y varios con uno igual a la
      entrada (más sale igual dos veces, el mismo distinto dos veces y
      Desplazar +0); verificar con `npm test`
- [x] 3.2 En `src/log.ts`, reemplazar `crearFilaMensaje` por la creación de un
      `div.grupo-mensaje` con la fila de entrada (hora, bytes, descripción de
      `describirMensaje`, marca) y una sub-fila por cada salida, salvo en el
      caso "sin cambios" (ícono de flecha con texto oculto "Salida", bytes, descripción), con los
      íconos `Equal`, `Ban` y `CornerDownRight` de Lucide, `title` y texto
      oculto en las marcas (design.md, "Estructura de un grupo en el DOM");
      exportar `agregarAlLog(evento, salidas)`, que hace el `prepend` y aplica
      el tope de 500 grupos, y sacar el `listen` de `inicializarLog`;
      verificar con `npx tsc --noEmit`
- [x] 3.3 En `src/workflow/ejecutar.ts`, que el listener de `inicializarWorkflow`
      procese el mensaje y después llame a `agregarAlLog` con las salidas; en
      `src/main.ts`, mantener `inicializarLog` antes de `inicializarWorkflow`;
      verificar con `npx tsc --noEmit` y con un `grep` que `mensaje-midi` se
      escuche en un solo lugar
- [x] 3.4 En `src/styles.css`, la grilla de cuatro columnas compartida por
      filas y sub-filas, sin el rayado alternado y con una línea fina entre
      grupos, las marcas (distinguibles entre sí) y la clase de texto oculto
      para lectores de pantalla; verificar en el navegador que los bytes y la
      descripción de las sub-filas quedan alineados con los de la entrada
- [x] 3.5 En `src/styles.css`, las variables de los colores de design.md
      ("Colores: letra violeta para lo que salió, fondo gris para lo que no
      salió tal cual") en `:root` y en modo oscuro, aplicadas a las sub-filas,
      a la entrada que salió sin cambios, a la entrada transformada y a la
      descartada; en `src/log.ts`, las clases que las activan según la
      clasificación; verificar en el navegador los escenarios de "Los colores
      separan lo que salió de lo que solo entró", en modo claro y oscuro

- [x] 3.6 En `src/log.ts`, envolver el encabezado y la lista en un
      `div.contenido-log`, y en `src/styles.css` darle `max-width: 51rem`,
      `margin-inline: auto` y el layout de columna (design.md, "Ancho máximo
      del log"); verificar en el navegador "Ventana grande" y "Ventana
      angosta" de `log-de-mensajes`: con la vista en 1600 × 1000 el contenido
      mide 816 px y queda centrado, y la fila de "Cambio de Control · canal
      16 · controlador 127 · valor 127" entra en una línea

## 4. Verificación

- [x] 4.1 En el navegador, armando cada flujo en el lienzo y simulando
      `90 3C 64`, verificar los escenarios de `log-de-mensajes`: "Flujo por
      defecto", "Sin ningún Emitir", "Camino que no termina en Emitir",
      "Transposición", "Varios mensajes distintos", "El mismo mensaje distinto
      dos veces", "Acorde que incluye la nota original", "Sale igual dos
      veces" y "Un cambio que da los mismos bytes"; y con `read_page`, que las
      marcas y las sub-filas exponen su texto
- [x] 4.2 En el navegador, verificar "Sub-filas debajo de su entrada", "Se
      supera el máximo" y "Las sub-filas no cuentan" (con un flujo de tres
      Desplazar, simulando 501 mensajes desde la consola y contando grupos y
      sub-filas), y que "Limpiar" borra los grupos con sus sub-filas
- [x] 4.3 Correr `npx tsc --noEmit`, `npm test`, `npm run build` y, desde
      `src-tauri/`, `cargo check`, `cargo test`, `cargo fmt --check` y
      `cargo clippy --all-targets -- -D warnings`, y verificar que pasan
- [ ] 4.4 En la ventana real (`npm run tauri dev`, con dos buses del IAC
      Driver), tocar notas con el flujo por defecto, con un Desplazar y con un
      acorde, y verificar que el log muestra lo mismo que llega al bus de
      salida, que el reloj y el Sensor Activo no aparecen, y que las
      descripciones son las de antes del cambio
- [x] 4.5 Proponerle a la persona usuaria el diff de AGENTS.md (el backend ya
      no describe los mensajes; un solo listener de `mensaje-midi` en el
      ejecutor, que le pasa al log entrada y salidas; el primer `listen` del
      arranque pasa a ser el de `inicializarWorkflow`) y aplicarlo solo con su
      aprobación explícita, antes de archivar
