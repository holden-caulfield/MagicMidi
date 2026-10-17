# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador, o con `verificacion-para-agentes/` (ver AGENTS.md, "Verificación
antes de dar por terminada una tarea"). El flujo MIDI completo se prueba con
`npm run tauri dev`, dos buses del IAC Driver y `midi.sh`.

## 1. La memoria de las cajas

- [x] 1.1 Crear `src/workflow/memoria-de-las-cajas.ts`, con la memoria como
      estado del módulo (un `Map` del `id` de cada caja a un
      `Map<string, unknown>`) y dos funciones: `memoriaDeLaCaja(id)` (la crea
      vacía la primera vez) y `olvidarLaMemoriaDeLasCajas()` (design.md, "La
      memoria de una caja es un `Map` que guarda el ejecutor"); y su test al
      lado: la misma caja recibe la misma memoria, dos cajas reciben memorias
      distintas, y olvidar las deja vacías; verificar con `npm test`
- [x] 1.2 En `workflow/tipos.ts`, sumar a `procesar` el argumento `memoria`,
      con su JSDoc (de quién es, cómo se guarda y se lee, que arranca vacía y
      se olvida sin conexión, y que un tipo que no la usa puede ignorarla); en
      `workflow/ejecutar.ts`, que `procesarEn` le pase
      `memoriaDeLaCaja(nodo.id)` después de revisar los errores de
      configuración; en `nodos/catalogo.test.ts`, pasarle una memoria nueva a
      `procesar`; verificar con `npx tsc --noEmit` y con que los tests
      existentes pasan sin tocar ningún otro tipo de nodo, con `npm test`
- [x] 1.3 En `main.ts`, que la suscripción que olvida lo anotado sin conexión
      olvide también la memoria de las cajas, y actualizar su comentario
      (design.md, "Cuándo se olvida la memoria"); verificar con
      `npx tsc --noEmit`, y en el navegador que, con una caja que guardó algo,
      `actualizar({ conectado: false })` la deja vacía

## 2. El tipo de parámetro `secuencia`

- [x] 2.1 Crear `src/workflow/parametros/secuencia.ts`: la función
      `secuencia({ clave, etiqueta, inicial, minimo, maximo, modos? })`, con
      los modos ya resueltos, y su `validar` con los tres errores en orden
      (no es una lista de enteros, lista vacía, el primer valor fuera de
      rango marcado con `formato`) (spec `tipos-de-parametro`, "El parámetro
      secuencia"); y `secuencia.test.ts` al lado, con los escenarios de esa
      spec y un caso por cada error; verificar con `npx tsc --noEmit` y
      `npm test`
- [x] 2.2 Crear `src/componentes/campo-secuencia.ts`, `<campo-secuencia>`,
      que extiende `Campo<number[]>` con `esGrupo = true` y un solo
      `ModoNumerico`: una fila por valor, dibujada por posición, con su campo
      de texto (lee como `campo-numero` al salir del campo, flechas del
      teclado de a 1 o de a 10 con `limitar`) y sus botones de subir, bajar y
      quitar, y el botón de agregar al final, que copia el último valor o
      agrega el mínimo; los nombres para lectores de pantalla ("Valor 2",
      "Subir el valor 2"…), los botones deshabilitados en las puntas, y el
      foco después de cada cambio, puesto en `updated()` (spec
      `tipos-de-parametro`, "El control de secuencia"; design.md, "El tipo de
      parámetro `secuencia` y su campo"); que `secuencia.ts` lo dibuje;
      verificar con `npx tsc --noEmit`
- [x] 2.3 En `src/workflow/parametros/LEEME.md`, sumar la secuencia a "Los
      que hay"; verificar releyendo la sección

## 3. La caja Alternar

- [x] 3.1 Crear `src/workflow/nodos/alternar.ts`, con el ícono `Repeat`, los
      parámetros "Byte" (como Fijar), "Valores" (secuencia de 0 a 127,
      inicial `[127, 0]`) y "Un ciclo por" (opciones Canal, Datos 1 y Datos
      2, inicial vacío), su `validar` (con Canal, el primer valor fuera de 1 a
      16) y su `procesar` con la memoria (design.md, "Alternar guarda la
      posición siguiente de cada ciclo"); registrarlo en `nodos/catalogo.ts`
      después de Fijar, y sumarlo a las intermedias del test de etapas de
      `catalogo.test.ts`; verificar con `npx tsc --noEmit` y con que
      `catalogo.test.ts` pasa con `npm test`
- [x] 3.2 Crear `src/workflow/nodos/alternar.test.ts` con el estilo de
      `desplazar.test.ts` (un `test` por comportamiento, bytes literales, sin
      helpers, una memoria nueva en cada `test`), con los escenarios de la
      spec `nodo-alternar` que dependen solo de la caja: el pedal como
      interruptor, notas repartidas entre canales, acento cada cuatro notas,
      la lista que se acorta y la que cambia sin acortarse, la pedalera, un
      ciclo por teclado, varias opciones, les falta lo mismo, Cambio de
      Programa y tercer byte, y un mensaje de sistema sin canal; y los casos
      de `validar` (canales de 1 a 16 bien, el 0 y el 17 mal, nombrando el
      primero que falla, y un byte de datos con 127 bien); verificar con
      `npm test`
- [x] 3.3 Sumar a `workflow/ejecutar.test.ts` los escenarios que necesitan el
      flujo: de `nodo-alternar`, el latch armado en el flujo, el pad como
      interruptor, una caja siguiente que falla, dos caminos hasta la caja, el
      round-robin de canales con el apareo y el Nota Off que también pasa por
      la caja; de `ejecucion-de-workflow`, cada caja recuerda lo suyo, editar
      el flujo no la borra, una caja nueva arranca vacía, el pánico desde una
      caja no la borra, y una caja mal configurada no cambia su memoria; con
      `olvidarLaMemoriaDeLasCajas()` en `beforeEach`; verificar con
      `npm test`
- [x] 3.4 En el navegador, con una caja Alternar seleccionada: los escenarios
      de "Parámetros del nodo Alternar" y de "El control de secuencia" que no
      dependen de la activación con teclado (escribir un valor, una nota, algo
      que no es un número, agregar, quitar, subir y bajar con clics, quitar
      todos, el foco después de cada cambio, los nombres para lectores de
      pantalla, un solo botón de modo y los errores en hexadecimal); que el
      control entra en el ancho del panel con diez valores, en modo claro y
      oscuro, en WebKit y en Chromium (`verificacion-para-agentes/`); y que
      el modo se conserva al seleccionar otra caja y volver; mostrar capturas

## 4. Documentación

- [x] 4.1 En `src/workflow/nodos/LEEME.md`, una sección sobre la memoria
      después de la de `procesar`: qué es, que es de cada caja, que arranca
      vacía y se olvida sin conexión, por qué no se guarda nada fuera de la
      función, y un ejemplo corto (una caja que cuenta los mensajes que le
      llegan); en "Cómo escribir el test", que un tipo con memoria le pasa a
      `procesar` una memoria nueva en cada `test` (spec `tipos-de-nodo`, "La
      carpeta de tipos de nodo explica cómo crear uno"); verificar releyendo
      la guía de punta a punta, como alguien que recién empieza
- [x] 4.2 En `README.md`, sumar Alternar a "Cajas disponibles", con el latch
      de pedal como ejemplo (y por qué hace falta filtrar las pisadas) y que,
      para alternar notas, alcanza con pasar los Nota On; verificar
      releyéndolo

## 5. Verificación

- [x] 5.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y desde
      `src-tauri/` `cargo check`, `cargo test`, `cargo fmt --check` y
      `cargo clippy --all-targets -- -D warnings`; todo tiene que pasar
- [x] 5.2 Comparar la huella de la interfaz con la de `main`
      (`verificacion-para-agentes/huella/`) sin cajas Alternar: tiene que dar
      igual, salvo la barra de herramientas, que suma el botón de Alternar
      después de Fijar y corre los que siguen
- [x] 5.3 En `npm run tauri dev`, con dos buses del IAC Driver y `midi.sh`
      escuchando la salida: el latch armado en el flujo alterna 127 y 0 con
      cada pisada y no deja salir las soltadas; el round-robin de canales
      apaga cada nota en su canal; el pánico (botón y Cmd+.) no vuelve a cero
      el ciclo, y volver a conectar sí; y en el panel, subir, bajar, quitar y
      agregar valores con Enter y con la barra espaciadora, con el foco donde
      dice la spec

## 6. Al cerrar el cambio

- [x] 6.1 Proponer a la persona usuaria, sin hacerlo por cuenta propia, los
      cambios del roadmap: marcar "Pedal momentáneo → latch" y "Round-robin
      de canales" como hechas, y borrar el artifact del diseño acordado de
      Alternar y el apareo, que pide borrarse cuando los dos cambios estén
      implementados
- [x] 6.2 Al archivar, proponer el diff de AGENTS.md ("Devolver el
      conocimiento a este archivo"): la memoria de las cajas (es del
      ejecutor, cada caja recibe la suya en `procesar`, un tipo no guarda
      nada fuera de la función, y se olvida sin conexión junto con lo
      anotado), y lo que deje el campo de la secuencia que cruce módulos, si
      deja algo
