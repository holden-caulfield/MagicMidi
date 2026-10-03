# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador, o con `verificacion-para-agentes/` (ver AGENTS.md, "Verificación
antes de dar por terminada una tarea"). El flujo MIDI completo se prueba con
`npm run tauri dev` y dos buses del IAC Driver (macOS descarta los status de
sistema no definidos, así que esos casos quedan cubiertos por los tests).

## 1. Tipos de sistema en la lectura del mensaje

- [ ] 1.1 En `src/midi/mensaje.ts`, reemplazar `"sistema"` en `TipoDeMensaje`
      por los tipos de sistema y `"sistema-no-definido"`, leídos con una tabla
      por status; sumar a `TIPOS_ELEGIBLES` los nueve de sistema elegibles, en
      el orden de la spec de Filtrar, y a `NOMBRES_DE_TIPO` sus nombres
      (design.md, "Los tipos de sistema, en `MensajeMidi`"); verificar con
      `npx tsc --noEmit`
- [ ] 1.2 En `mensaje.test.ts`, cambiar el caso de `FA` (ahora Inicio) y sumar
      SysEx, `F9` (sistema no definido), reloj y Sensor Activo, cada uno sin
      canal; verificar con `npm test`
- [ ] 1.3 En `src/midi/describir.ts`, dejar de preguntar por `"sistema"` sin
      cambiar ningún texto; verificar que `describir.test.ts` pasa sin
      tocarlo, con `npm test`

## 2. Parámetros lista, opciones y autocompletar

- [ ] 2.1 Renombrar `parametros/opciones.ts` a `lista.ts` (con `git mv`):
      `ParametroLista<T>`, `tipo: "lista"`, `<parametro-lista>`, `CampoLista`;
      actualizar `parametros/catalogo.ts`, `nodos/desplazar.ts`, `fijar.ts` y
      `mapear.ts`, y las menciones en `nodos/LEEME.md` y `parametros/LEEME.md`
      (design.md, "`opciones` pasa a llamarse `lista`"); verificar con
      `npx tsc --noEmit`, `npm test` y que la huella de la interfaz no cambia
      (`verificacion-para-agentes/`)
- [ ] 2.2 En `campo-de-parametro.ts`, sumar `protected esGrupo = false`: con
      `true`, la etiqueta va con `id="etiqueta"` y `#control` lleva
      `role="group"` y `aria-labelledby="etiqueta"` (design.md, "El control de
      `opciones`"); verificar con `npx tsc --noEmit` y que la huella de la
      interfaz de los parámetros que ya existen no cambia
- [ ] 2.3 Crear el nuevo `src/workflow/parametros/opciones.ts` con
      `ParametroDeOpciones<T>`, su `error` y el control: píldoras finitas con
      `flex-wrap`, encendidas con `:has(:checked)`, foco visible con
      `:has(:focus-visible)`, sin texto extra cuando están todas apagadas;
      cada cambio avisa una lista nueva en el orden de las opciones;
      registrarlo en `parametros/catalogo.ts` con `<number>` y `<string>`;
      verificar con `npx tsc --noEmit`
- [ ] 2.4 Crear `opciones.test.ts` con los casos de `error`: lista vacía,
      opciones válidas, un valor que no está, un repetido y algo que no es una
      lista; verificar con `npm test`
- [ ] 2.5 Crear `src/workflow/parametros/autocompletar.ts` con
      `ParametroAutocompletar<T>` (con `textoDeAyuda` opcional), su propio `error` (sin importarlo de otro
      tipo), la función pura `opcionesQueCoinciden(opciones, elegidas, texto)`
      y el control: combobox con `aria-activedescendant`, lista flotante
      (`position: absolute`, alto máximo, `:host` con `position: relative` y
      `z-index`), teclado (flechas, Enter, Escape), clic con `mousedown` +
      `preventDefault`, "Ninguna coincide", y las elegidas como píldoras
      finitas con un "×" sin borde ni fondo y `aria-label` "Quitar …"
      (design.md, "El control de `autocompletar`"); registrarlo en el catálogo
      con `<number>` y `<string>`; verificar con `npx tsc --noEmit`
- [ ] 2.6 Crear `autocompletar.test.ts` con los casos de `error` (los mismos
      de 2.4) y de `opcionesQueCoinciden`: texto vacío (todas menos las
      elegidas), sin distinguir mayúsculas, sin distinguir tildes ("presion"
      encuentra "Presión"), una parte del medio del texto ("canal"), nada que
      coincida; verificar con `npm test`
- [ ] 2.7 Sumar a `parametros/LEEME.md` los dos tipos nuevos en la lista de
      tipos, cuándo usar `lista`, `opciones` o `autocompletar`, y un párrafo
      sobre `esGrupo` para controles con varias partes; verificar releyendo
      la guía de punta a punta

## 3. Filtrar

- [ ] 3.1 Reescribir `src/workflow/nodos/filtrar.ts` con los seis parámetros,
      `validar` para los dos rangos y `procesar` con un `if` por criterio, en el
      orden de la spec (design.md, "Filtrar"); verificar con
      `npx tsc --noEmit`
- [ ] 3.2 Reescribir `filtrar.test.ts`, en el estilo de `desplazar.test.ts`,
      con un `test` por escenario de la spec `nodo-filtrar` (tipos, canales,
      rangos, combinación con "y", caja nueva que deja pasar todo) y los de
      `validar`; verificar con `npm test`
- [ ] 3.3 Sumar a `ejecutar.test.ts` los dos escenarios de "Una alternativa
      entre criterios se arma con varias cajas", incluido el que sale dos
      veces; verificar con `npm test`
- [ ] 3.4 Revisar que `catalogo.test.ts` sigue pasando con Filtrar sin
      cambios en el test; verificar con `npm test`

## 4. Documentación

- [ ] 4.1 En `src/workflow/nodos/LEEME.md`, actualizar la lista de tipos de
      mensaje, explicar cómo leer un parámetro que es una lista y cómo armar
      un "o" con dos Filtrar sin que se pisen (design.md, "El 'o' con dos
      cajas duplica…"); verificar releyendo la guía de punta a punta
- [ ] 4.2 Actualizar la sección "Qué hace hoy" de `README.md` con los
      criterios nuevos de Filtrar; verificar releyéndola

## 5. Verificación

- [ ] 5.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y desde
      `src-tauri/` `cargo check`, `cargo test`, `cargo fmt --check` y
      `cargo clippy --all-targets -- -D warnings`; todo tiene que pasar
- [ ] 5.2 En el navegador, seleccionar una caja Filtrar y revisar: el orden
      de los parámetros, "Cualquier tipo" sin tipos elegidos, los canales
      apagados, los canales en varias filas sin desplazamiento horizontal,
      encender y apagar canales con clic, desplegar los tipos con clic,
      filtrar escribiendo "presion", elegir con clic, quitar una elegida,
      "Ninguna coincide", que la lista flota por encima de los canales sin
      moverlos, el error y el borde rojo con un rango al revés, y con
      `javascript_tool` los atributos ARIA del grupo y del combobox
- [ ] 5.3 En `npm run tauri dev`, con dos buses del IAC Driver, probar un
      Filtrar con "Nota On", canal 1 y datos 1 de 60 a 72 hacia un Emitir, y
      el "o" con dos Filtrar, revisando en el log lo que sale; en la ventana
      real, probar Tab y barra espaciadora sobre los canales, y flechas,
      Enter y Escape en los tipos, y con VoiceOver que se anuncian el grupo
      "Canales" y la opción activa de la lista
