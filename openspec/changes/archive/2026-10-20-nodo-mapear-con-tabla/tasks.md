# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador, o con `verificacion-para-agentes/` (ver AGENTS.md, "Verificación
antes de dar por terminada una tarea"). El flujo MIDI completo se prueba con
`npm run tauri dev`, dos buses del IAC Driver y `midi.sh`.

## 1. Mapear pasa a llamarse Interpolar

- [x] 1.1 Con `git mv`, pasar `src/workflow/nodos/mapear.ts` y
      `mapear.test.ts` a `interpolar.ts` e `interpolar.test.ts`; cambiar
      `nombre` a "Interpolar" y lo que nombre a la caja en el test; en
      `nodos/catalogo.ts`, importar `interpolar` y ponerlo donde estaba
      `mapear`; en `nodos/catalogo.test.ts` y `workflow/ejecutar.test.ts`, lo
      que usa la caja lineal pasa a `interpolar` (design.md, "El renombre
      cambia el archivo, el nombre y el identificador"); verificar con
      `npx tsc --noEmit` y con que `npm test` pasa con los mismos casos que
      antes
- [x] 1.2 Pasar a Interpolar los ejemplos de la caja lineal en
      `src/workflow/nodos/LEEME.md` (la lista del catálogo, la regla de
      `validar` y su test, la nota sobre la velocidad) y en
      `src/workflow/parametros/LEEME.md` (el rango invertible), y en
      `README.md` cambiar Mapear por Interpolar en las cajas disponibles;
      verificar con `grep -rn "Mapear" README.md src/` que lo que queda nombra
      solo lo que sigue siendo cierto de una caja que elige un byte
- [x] 1.3 Commitear el renombre solo, antes de crear el `mapear.ts` nuevo;
      verificar con `git log --follow src/workflow/nodos/interpolar.ts` que
      la historia de la caja lineal sigue al archivo nuevo

## 2. El tipo de parámetro `mapa`

- [x] 2.1 Crear `src/componentes/campo-mapa.ts` con los tipos `Par` y `Mapa`,
      y la función pura `siguienteEntrada(mapa, minimo, maximo)` (design.md,
      "El campo del mapa"); y `campo-mapa.test.ts` al lado, con los casos de
      la spec `tipos-de-parametro` ("El control de mapa"): la siguiente
      después del último par, saltear las que ya están, seguir desde el mínimo
      después del máximo, el mapa vacío y `null` cuando no queda ninguna;
      verificar con `npm test`
- [x] 2.2 Crear `src/workflow/parametros/mapa.ts`: la función
      `mapa({ clave, etiqueta, inicial, minimo, maximo, modos?, textoDeAyuda? })`,
      con los modos ya resueltos, y su `validar` con los tres errores en orden
      (no es una lista de pares de enteros, el primer valor fuera de rango y la
      primera entrada repetida, los dos últimos marcados con `formato`) (spec
      `tipos-de-parametro`, "El parámetro mapa"; design.md, "El tipo revisa
      que no se repita una entrada"); y `mapa.test.ts` al lado, con los
      escenarios de esa spec y un caso por cada error, incluido que una
      salida repetida sirve; verificar con `npx tsc --noEmit` y `npm test`
- [x] 2.3 Completar `<campo-mapa>`, que extiende `Campo<Mapa>` con
      `esGrupo = true` y un solo `ModoNumerico`: una fila por par, dibujada
      por posición, con el campo de la entrada, la flecha decorativa, el
      campo de la salida y el botón de quitar; el texto de ayuda con el mapa
      vacío; el botón de agregar, deshabilitado cuando `siguienteEntrada` da
      `null`; leer lo escrito y las flechas del teclado como en
      `campo-secuencia`; los nombres para lectores de pantalla ("Entrada 2",
      "Salida 2", "Quitar el par 2", "Agregar un par"); y el foco después de
      quitar y de agregar, puesto en `updated()` (spec `tipos-de-parametro`,
      "El control de mapa"); que `mapa.ts` lo dibuje; verificar con
      `npx tsc --noEmit`
- [x] 2.4 En `src/workflow/parametros/LEEME.md`, sumar el mapa a "Los que
      hay", y `campo-mapa` a la lista de campos y a "Los modos de los
      números"; en `nodos/catalogo.test.ts`, que el comentario de los modos
      deje de decir que los numéricos son "el entero y el rango"; verificar
      releyendo la guía

## 3. La caja Mapear

- [x] 3.1 Crear `src/workflow/nodos/mapear.ts`, con el ícono
      `TableProperties`, los parámetros "Byte" (Canal, datos 1 y datos 2,
      inicial datos 1) y "Mapa" (de 0 a 127, inicial vacío, modos nota,
      decimal y hexadecimal, con el texto de ayuda "Sin pares: todo pasa sin
      cambios."), su `validar` (con Canal, el primer valor fuera de 1 a 16) y
      su `procesar` (design.md, "Mapear cambia el valor una sola vez");
      registrarlo en `nodos/catalogo.ts` justo después de Interpolar, y
      sumarlo a las intermedias del test de etapas de `catalogo.test.ts`;
      verificar con `npx tsc --noEmit` y con que `catalogo.test.ts` pasa con
      `npm test`
- [x] 3.2 Crear `src/workflow/nodos/mapear.test.ts` con el estilo de
      `desplazar.test.ts` (un `test` por comportamiento, bytes literales, sin
      helpers), con los escenarios de la spec `nodo-mapear` que dependen solo
      de la caja: los pads al mapa de batería GM, cambiar de canal,
      intercambiar dos notas, una nota que no está en el mapa, el mapa vacío,
      Presión de Canal y tercer byte, y un mensaje de sistema con Canal; y los
      casos de `validar` (con Canal, de 1 a 16 bien, el 0 y el 17 mal,
      nombrando el primero que falla, y con datos 1 el 0 bien); verificar con
      `npm test`
- [x] 3.3 Sumar a `workflow/ejecutar.test.ts` los escenarios de `nodo-mapear`
      que necesitan el flujo: un controlador por otro solo en los Cambios de
      Control, el Nota Off que pasa por el mapa, y solo los Nota On con el
      apareo; verificar con `npm test`
- [x] 3.4 En el navegador, con una caja Mapear seleccionada: los escenarios de
      "Los parámetros de Mapear son el byte y el mapa" y de "El control de
      mapa" que no dependen de la activación con teclado (la configuración
      inicial, escribir una salida, escribir en otro modo, algo que no es un
      número, agregar, agregar salteando, después del máximo y al mapa vacío,
      quitar, quitar el último, el foco después de cada cambio, los nombres
      para lectores de pantalla, el botón de modo, la entrada repetida en modo
      nota y el canal fuera de 1 a 16); que el par más ancho ("D#-1 → F#9")
      entra en una fila y el panel no se desplaza a lo ancho, en modo claro y
      oscuro, en WebKit y en Chromium (`verificacion-para-agentes/`); y que el
      modo se conserva al seleccionar otra caja y volver; mostrar capturas

## 4. Documentación

- [x] 4.1 En `README.md`, sumar Mapear a las cajas disponibles, después de
      Interpolar, con el ejemplo de los pads llevados al mapa de batería GM y
      que, para cambiar solo las notas, va un Filtrar antes; verificar
      releyéndolo

## 5. Verificación

- [x] 5.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y desde
      `src-tauri/` `cargo check`, `cargo test`, `cargo fmt --check` y
      `cargo clippy --all-targets -- -D warnings`; todo tiene que pasar
- [x] 5.2 Comparar la huella de la interfaz con la de `main`
      (`verificacion-para-agentes/huella/`) sin cajas Mapear: tiene que dar
      igual, salvo la barra de herramientas, que suma el botón de Mapear
      después de Interpolar y corre los que siguen, y el globo de la caja
      lineal, que dice "Interpolar"
- [x] 5.3 En `npm run tauri dev`, con dos buses del IAC Driver y `midi.sh`
      escuchando la salida: un mapa de pads a batería cambia cada nota y su
      Nota Off; con un Filtrar de solo Nota On, el apareo apaga la nota
      cambiada; con Canal, un mapa 1 → 10 cambia el canal sin cambiar el tipo;
      y en el panel, quitar y agregar pares con Enter y con la barra
      espaciadora, con el foco donde dice la spec

## 6. Al cerrar el cambio

- [x] 6.1 Proponer a la persona usuaria, sin hacerlo por cuenta propia, los
      cambios del roadmap: marcar "Remapear notas con una tabla" como hecha y
      renombrar la idea hecha "Mapear rango" con el nombre nuevo
- [x] 6.2 Al archivar, reescribir a mano el propósito de
      `openspec/specs/nodo-mapear/spec.md` (los deltas no lo cambian) para
      que describa la caja que cambia valores con un mapa; verificar con
      `npx openspec validate --specs --strict`
- [x] 6.3 Al archivar, revisar si el tipo `mapa` o su campo dejan una regla
      que cruce módulos para AGENTS.md ("Devolver el conocimiento a este
      archivo"), por ejemplo, que un texto que depende de la caja lo declara
      quien usa el parámetro; si deja alguna, proponer el diff y esperar
      aprobación
