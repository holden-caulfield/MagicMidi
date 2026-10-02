# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador, o con `verificacion-para-agentes/` (ver AGENTS.md, "Verificación
antes de dar por terminada una tarea"). El flujo MIDI completo se prueba con
`npm run tauri dev` y dos buses del IAC Driver.

Los íconos son `Pin` para Fijar y `AlignCenterHorizontal` para Mapear
(design.md, "Íconos").

## 1. Errores de los parámetros

- [x] 1.1 En `src/workflow/parametros/catalogo.ts`, cambiar `valido` por
      `error(parametro, valor): string | null` y `esValorValido` por
      `errorDelParametro`, sumarle a `dibujar` el error a mostrar, y adaptar
      `entero.ts`, `si-no.ts` y `opciones.ts` (design.md, "Validación: errores
      por parámetro…"); verificar con `npx tsc --noEmit`
- [x] 1.2 En `entero.ts`, sumar `minimo?` y `maximo?` a `ParametroEntero`, que
      `error` devuelva el texto del rango ("Tiene que ir de 0 a 127", "Tiene
      que ser 0 o más", "Tiene que ser 127 o menos"), y que el `<input>` lleve
      `min` y `max` cuando están declarados; `interpretar(texto)` no cambia
      (design.md, "El entero suma `minimo` y `maximo` opcionales"); verificar
      con `npx tsc --noEmit`
- [x] 1.3 Sumar a `entero.test.ts` los casos de `error`: por debajo del mínimo,
      por encima del máximo, los dos extremos sin error, solo mínimo, solo
      máximo, y sin rango 300 y -300 sin error, en el estilo de los casos que ya
      tiene; verificar con `npm test`
- [x] 1.4 En `campo-de-parametro.ts`, sumar la propiedad `error`, dibujar el
      texto debajo del control (`id="error"`, en `--letra-error`) y ponerle a
      `#control` `aria-invalid` y `aria-describedby="error"` en `updated()`
      (design.md, "Un valor que no sirve se guarda…"); verificar con
      `npx tsc --noEmit` y en el navegador (tarea 7.2)

## 2. Errores de configuración de una caja

- [x] 2.1 En `src/workflow/tipos.ts`, sumar `ErrorDeConfiguracion` y el
      `validar` opcional de `TipoDeNodo`; crear `src/workflow/validacion.ts` con
      `erroresDeConfiguracion(tipo, parametros)`: primero los de cada
      parámetro y, solo si no hay ninguno, los de `tipo.validar`; verificar con
      `npx tsc --noEmit`
- [x] 2.2 Escribir `validacion.test.ts`: sin errores, error de un parámetro,
      error de una regla del tipo (con un tipo de prueba declarado en el test),
      y que con un error de parámetro no se llama a `validar` (con un espía);
      verificar con `npm test`
- [x] 2.3 En `catalogo.test.ts`, reemplazar "tiene valores iniciales
      coherentes con sus parámetros" por "sus valores iniciales no tienen
      errores de configuración", con `erroresDeConfiguracion`; verificar con
      `npm test`
- [x] 2.4 En `ejecutar.ts`, que `procesarEn` calcule los errores antes de
      `procesar` y, si hay, lance `La caja "<nombre>" está mal configurada:
      <etiqueta>: <mensaje>`; sumar a `ejecutar.test.ts` los escenarios de la
      spec `ejecucion-de-workflow` ("Canal fuera de rango en Fijar", "Una caja
      mal configurada en una rama que no se recorre", "Corregir la caja") y que
      `procesar` no se llama en una caja con errores (con un espía); verificar
      con `npm test` (los escenarios con Fijar y Mapear se completan después de
      la tarea 5.1)

## 3. La interfaz muestra los errores

- [x] 3.1 En `panel-de-configuracion.ts`, calcular los errores de la caja
      seleccionada al dibujar y pasarle a cada campo el primero de los suyos;
      verificar en el navegador (tarea 7.2) que un error aparece y desaparece
      al cambiar el valor, también en un campo que no se tocó
- [x] 3.2 En `editor/lienzo.ts`, sumar `conErrores` a `Caja`, enganchar
      `<lienzo-workflow>` con `ControladorDeEstado` para recalcularlo y llamar a
      `area.update` solo en las cajas que cambiaron, y dibujar el `outline` rojo
      en `<caja-del-flujo>` (design.md, "El borde rojo no pelea con la
      selección ni con la etapa"); verificar en el navegador (tarea 7.2)

## 4. Desplazar con "Canal"

- [x] 4.1 En `nodos/desplazar.ts`, cambiar el texto de la opción 0 a "Canal" y
      que, con esa opción, desplace `mensaje.canal` dentro de 1–16 (con
      overflow pega la vuelta, sin overflow se limita) sin tocar el tipo, y
      deje igual los mensajes de sistema (design.md, "'Canal' en lugar de
      '1.º (status)'…"); verificar con `npx tsc --noEmit`
- [x] 4.2 En `desplazar.test.ts`, reemplazar los dos tests del status ("en el
      status, cambia el canal…" y "en el status, nunca se pierde el bit alto")
      por los escenarios de la spec `nodo-desplazar`: cambiar de canal, `9F` +1
      sin overflow se queda en `9F`, `9F` +1 con overflow da `90`, `B0` -1 con
      overflow da `BF`, y un mensaje de sistema sin cambios; verificar con
      `npm test`

## 5. Nodos nuevos

- [x] 5.1 Crear `src/workflow/nodos/fijar.ts` (ícono `Pin`, parámetros "Byte" con opciones
      "Canal", "2.º (datos 1)" y "3.º (datos 2)" e inicial "3.º (datos 2)", y
      "Valor" entero de 0 a 127 con inicial 100; `validar` da "Con Canal, tiene
      que ir de 1 a 16" en "Valor"; `procesar` reemplaza el byte de datos si
      existe, o el canal en los mensajes de canal) y `fijar.test.ts` en el
      estilo de `desplazar.test.ts` (un `test` por comportamiento, bytes
      literales, sin helpers), con los escenarios de la spec `nodo-fijar` y los
      de `validar` (canal 0, 17 y 10, y datos con 100); verificar con
      `npm test`
- [x] 5.2 Crear `src/workflow/nodos/mapear.ts` (ícono `AlignCenterHorizontal`,
      parámetros "Byte" con opciones
      "2.º (datos 1)" y "3.º (datos 2)" e inicial "3.º (datos 2)", y "Entrada
      desde", "Entrada hasta", "Salida desde" y "Salida hasta", enteros de 0 a
      127 con iniciales 0, 127, 0 y 127; `validar` da "Tiene que ser distinto
      de Entrada desde" en "Entrada hasta"; `procesar` con el cálculo de
      design.md, "El cálculo de Mapear") y `mapear.test.ts` con los escenarios
      de la spec `nodo-mapear` (iniciales sin cambios, comprimir, invertir,
      limitar, calibrar por debajo y por encima, entrada invertida, Presión de
      Canal sin tercer byte) y los de `validar`; verificar con `npm test`
- [x] 5.3 Registrar Fijar y Mapear en `src/workflow/catalogo.ts` en el orden
      Filtrar, Desplazar, Fijar, Mapear, Emitir, Descartar, y sumar a
      `catalogo.test.ts` que los dos son "intermedia"; sumar a
      `ejecutar.test.ts` "Velocidad fija solo en las notas" (spec `nodo-fijar`)
      y "Comprimir la velocidad solo en las notas" (spec `nodo-mapear`);
      verificar con `npx tsc --noEmit` y `npm test`

## 6. Documentación

- [x] 6.1 En `src/workflow/nodos/LEEME.md`: reemplazar el ejemplo completo
      "Velocidad fija" por "Nota Off real" (`9n kk 00` → `8n kk 40`, mismo
      canal y nota) con su test (caso normal, un `8n` que ya era Nota Off, un
      Nota On con velocidad, un mensaje de otro tipo); cambiar los nombres de
      archivo de ejemplo de los pasos por los del ejemplo nuevo; sumar una
      sección sobre `validar` (qué recibe, qué devuelve, que corre solo si los
      parámetros ya están bien, que el ejecutor no llama a `procesar` con
      errores) con la regla de Mapear y su test; mencionar el rango del entero
      y que para tocar la velocidad con Desplazar, Fijar o Mapear conviene un
      Filtrar (Nota On) antes; verificar copiando el ejemplo a la carpeta,
      registrándolo, corriendo `npx tsc --noEmit` y `npm test`, y borrándolo
      después
- [x] 6.2 En `src/workflow/parametros/LEEME.md`, cambiar `valido` por `error`
      (con el texto que se muestra), explicar la diferencia entre lo que no se
      puede interpretar (se rechaza) y lo que no sirve (se guarda con error), y
      que la base marca `#control` como inválido; adaptar el ejemplo "real" y
      verificar copiándolo a la carpeta, registrándolo, corriendo
      `npx tsc --noEmit` y `npm test`, y borrándolo después
- [x] 6.3 Actualizar "Qué hace hoy" en `README.md` con Fijar, Mapear, el canal
      en Desplazar y los errores de configuración; verificar leyéndolo contra
      las specs

## 7. Verificación

- [x] 7.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y desde
      `src-tauri/` `cargo check`, `cargo test`, `cargo fmt --check` y
      `cargo clippy --all-targets -- -D warnings` (el backend no cambia, pero
      el CI los corre)
- [x] 7.2 En el navegador, en modo claro y oscuro: la barra muestra las seis
      cajas en orden, Fijar y Mapear se ven neutras y con entrada y salida, sus
      íconos se reconocen, el panel muestra los valores iniciales de cada una
      sin errores; escribir 128 en "Valor" de Fijar, o elegir "Canal" con valor
      100, muestra el error debajo del campo y el borde rojo en la caja, que se
      distingue del naranja de fin y convive con la señal de seleccionada; y
      corregirlo saca los dos. Revisar con `javascript_tool` que `#control`
      tiene `aria-invalid` y `aria-describedby` con el error
- [x] 7.3 En `npm run tauri dev` con dos buses del IAC Driver: Fijar (Canal 10)
      manda todo por el canal 10, Desplazar (Canal +1) pasa del canal 16 al 16
      sin overflow y al 1 con overflow, Filtrar (Nota On) → Fijar (datos 2,
      100) toca todas las notas con velocidad 100 sin dejarlas sonando, Mapear
      (0–127 → 127–0) invierte un CC, y una caja mal configurada hace que el log
      marque los mensajes con error
- [x] 7.4 Antes de archivar, proponerle a la persona usuaria el diff de
      AGENTS.md (sección Workflow: los errores de configuración, de dónde
      salen y que el ejecutor no llama a `procesar` con errores; que los nodos
      sobre bytes ofrecen "Canal" y no el status entero, y no protegen el Nota
      On con velocidad 0) y aplicarlo solo con su aprobación
