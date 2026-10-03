# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador, o con `verificacion-para-agentes/` (ver AGENTS.md, "Verificación
antes de dar por terminada una tarea"). El flujo MIDI completo se prueba con
`npm run tauri dev` y dos buses del IAC Driver.

## 1. Nodo Convertir

- [x] 1.1 Crear `src/workflow/nodos/convertir.ts` con el ícono `RefreshCw`, el
      parámetro "Convertir a" (lista de los catorce tipos de la spec, en su
      orden, textos de `NOMBRES_DE_TIPO`, inicial "cambio-de-control"), una
      tabla por tipo con su status y la posición de cada rol que tiene
      (ordinal, cardinal, cardinal-fino), y `procesar` con la regla de la
      spec: sin cambios si ya es del tipo, o si es SysEx, MTC, no definido o
      desconocido; cada dato a su mismo rol; rellenos 0, controlador 1,
      velocidad 64 y parte gruesa del Pitch Bend 64; canal conservado, 1 desde
      sistema, ninguno hacia sistema (design.md, "Los datos se ubican por su
      rol" y siguientes); verificar con `npx tsc --noEmit`
- [x] 1.2 En `nodos/catalogo.ts`, registrar `convertir` y dejar la lista en
      el orden Filtrar, Convertir, Fijar, Desplazar, Mapear, Emitir,
      Descartar; verificar con `npx tsc --noEmit` y que `catalogo.test.ts`
      pasa sin cambios, con `npm test`
- [x] 1.3 Crear `convertir.test.ts`, en el estilo de `desplazar.test.ts` (un
      `test` por comportamiento, bytes literales, sin helpers), con un caso
      por escenario de la spec `nodo-convertir` que mira una sola caja: los
      cinco del pedido (Nota → PC, CC → PB, PB → CC, Aftertouch → CC, CC →
      Aftertouch), CC → PC, el canal (conservado, de sistema a canal, de canal
      a sistema), PC → Selección de Canción, Pitch Bend → Posición de Canción
      con los 14 bits, el dato que no cambia de rol, los rellenos, el mensaje
      incompleto y los que pasan sin cambios; verificar con `npm test`
- [x] 1.4 Sumar a `ejecutar.test.ts` los escenarios de flujo de la spec
      ("Otro controlador con un Fijar", "Aftertouch a CC sin tocar las
      notas", "Cambiar de programa con un pad", "Siempre el mismo
      programa", "Una fila de botones elige programas", "Arrancar un
      secuenciador con un pedal"); verificar con `npm test`

## 2. Documentación

- [x] 2.1 Actualizar la sección "Qué hace hoy" de `README.md` con Convertir
      (qué hace, la regla de roles en una oración y el ejemplo de Filtrar
      antes) y el orden nuevo de las cajas; verificar releyéndola
- [x] 2.2 En `src/workflow/nodos/LEEME.md`, donde explica que las cajas tocan
      bytes sin mirar el tipo y que cambiar un status puede dejar un byte de
      más, aclarar que Convertir es la excepción: mira el tipo y arma el
      mensaje con la cantidad de bytes correcta; y avisar que un pad o un
      pedal manda dos mensajes (apretar y soltar), así que antes de
      convertir conviene un Filtrar; verificar releyendo la guía de punta a
      punta

## 3. Verificación

- [x] 3.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y desde
      `src-tauri/` `cargo check`, `cargo test`, `cargo fmt --check` y
      `cargo clippy --all-targets -- -D warnings`; todo tiene que pasar
- [x] 3.2 En el navegador, revisar que la barra muestra las siete cajas en el
      orden de la spec, que Convertir tiene entrada y salida con el color de
      las intermedias y el ícono `RefreshCw`, y que su panel muestra
      "Convertir a" con las catorce opciones y "Cambio de Control" elegido
- [ ] 3.3 En `npm run tauri dev`, con dos buses del IAC Driver, probar
      Filtrar (Presión de Canal) → Convertir (CC) → Emitir, Filtrar (Nota On)
      → Convertir (Cambio de Programa) → Fijar → Emitir, CC ↔ Pitch Bend y
      Filtrar (CC, datos 2 desde 64) → Convertir (Inicio) → Emitir,
      revisando en el log de salida que cada mensaje sale con el tipo, el
      canal, los valores y la cantidad de bytes esperados
