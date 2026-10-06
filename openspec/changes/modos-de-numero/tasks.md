# Tasks

Antes de empezar, tomar la huella de la interfaz actual con
`verificacion-para-agentes/` (ver su `LEEME.md`) para comparar al final. La
verificación visual se hace con `npm run dev` y las herramientas de
navegador, bajando por `shadowRoot` (ver AGENTS.md, "Verificación antes de dar
por terminada una tarea").

## 1. Formatear y leer números

- [x] 1.1 Sumar `numeroDeNota(texto)` a `src/midi/describir.ts`, al lado de
      `nombreDeNota`: letra A a G sin distinguir mayúsculas, `#` o `b`
      opcional, octava de -1 en adelante; `null` si no es una nota. Verificar
      con tests en `describir.test.ts`: "C4" → 60, "c#4" y "Db4" → 61, "C-1"
      → 0, "G9" → 127, "B#3" → 60, "H4" y "C" → `null`, y que
      `numeroDeNota(nombreDeNota(n)) === n` de 0 a 127
- [x] 1.2 Crear `src/workflow/parametros/modos.ts` con `Modo`,
      `MODOS_POR_DEFECTO` (decimal, nota, hexadecimal), `DeclaracionNumerica`,
      `modosDe`, `modoActual`, `siguienteModo`, el texto del botón de cada
      modo, `formatear(numero, modo)` y `leer(texto, modo, declaracion)`, como
      dice design.md, "Un módulo puro para los modos". Verificar con
      `modos.test.ts`: 100 → "E7" en nota, "64" en hexadecimal; 10 → "0A";
      -3 → "-3" en nota y en hexadecimal; `modoActual` con una presentación
      ausente o que no es un modo ofrecido da el primero; la rotación sigue el
      orden declarado ("nota, decimal, hexadecimal" arranca en nota); y cada
      escenario de la spec `tipos-de-parametro`, "Lo escrito en un parámetro
      numérico elige el modo", con el modo que devuelve `leer` (incluidos
      "60" en nota → 96 en hexadecimal, "C4" en hexadecimal → 196 sin cambiar
      de modo, y solo decimal con `modos: ["decimal"]`)

## 2. La presentación, genérica

- [x] 2.1 Sumar `presentaciones?: Record<string, unknown>` a `NodoDelFlujo`
      (`src/estado/estado.ts`), y la acción
      `cambiarPresentacion(nodoId, clave, presentacion)` y el manejador de
      `cambio-de-presentacion` en `panel-de-configuracion.ts`, al lado de
      `cambiarParametro`. Verificar con `npx tsc --noEmit`, y con
      `grep -rn "Modo\|modo" src/estado src/workflow/editor src/workflow/validacion.ts src/workflow/ejecutar.ts src/workflow/tipos.ts`
      sin resultados al terminar el grupo
- [x] 2.2 Cambiar el contrato de `TipoDeParametro` en
      `parametros/catalogo.ts` a `error(parametro, valor, presentacion)`,
      `dibujar(parametro, valor, error, presentacion)` y
      `formatear?(parametro, numero, presentacion)`; sumar
      `formatearParametro` (en decimal si el tipo no tiene `formatear`), y
      `presentacion` y `avisarCambioDePresentacion` a `CampoDeParametro`. Los
      tipos que no la usan la ignoran. Verificar con `npx tsc --noEmit` y
      `npm test`
- [x] 2.3 Cambiar `erroresDeConfiguracion` a
      `(tipo, parametros, presentaciones)`, y `validar` en `tipos.ts` a
      `(parametros, formatear)`. Actualizar al panel, al lienzo
      (`tieneErrores`) y a `ejecutar.ts` para que pasen
      `nodo.presentaciones ?? {}`. Verificar con un test en
      `validacion.test.ts`, con un tipo de parámetro de prueba que tiene
      `formatear`, que la presentación llega a su `error` y que el `formatear`
      que recibe `validar` usa la presentación de la clave que se le pide
- [x] 2.4 Que el ejecutor use el mismo texto: verificar con un test en
      `ejecutar.test.ts` que una caja "Fijar" en modo hexadecimal, con byte
      Canal y valor 100, falla con el texto "Con Canal, tiene que ir de 01 a
      10"

## 3. Tipos de parámetro entero y rango

- [x] 3.1 En `parametros/entero.ts`: `ParametroEntero` extiende
      `DeclaracionNumerica`; `error` expresa el mínimo y el máximo en el modo
      actual; suma `formatear`; el control pasa el valor formateado, el texto
      del botón de modo (o `null` con un solo modo), y
      `puedeSubir`/`puedeBajar`. Con `siguiente-modo` avisa el modo nuevo; con
      `cambio` y con `paso` lee el texto con `leer`, avisa el modo si cambió
      (antes que el valor, ver design.md, "Escribir puede cambiar el valor y
      el modo a la vez") y avisa el número, sumándole el paso y limitándolo
      al mínimo y al máximo. Verificar con `entero.test.ts`: los escenarios
      de "El parámetro entero puede limitar los valores que le sirven" en los
      tres modos, y un paso que se limita en 127
- [x] 3.2 En `parametros/rango.ts`: `ParametroRango` extiende
      `DeclaracionNumerica`; `error` expresa los límites en el modo; suma
      `formatear`; el control le pasa a `campo-rango` `formatear`, un `leer`
      que avisa el modo si cambió, y el texto del botón de modo. Verificar con
      `rango.test.ts`: "Extremo fuera de rango en modo nota" da "Tiene que ir
      de C-1 a G9"

## 4. Componentes

- [x] 4.1 Botón de modo en `Campo` (`componentes/campo.ts`): propiedad
      `modo: { abreviatura, nombre } | null`, botón en la fila de la
      etiqueta, evento `siguiente-modo`, `aria-label` "Modo de <etiqueta>:
      <nombre>", estilos sobre `.control` con selector más específico, y nada
      si `modo` es `null`. Verificar en el navegador que en Fijar el botón
      pasa por DEC, ♪ y HEX y vuelve a DEC, que se activa con el teclado, que
      Desplazar no lo tiene, y con una captura de la fila en claro y en
      oscuro. Si el "♪" no se ve bien en WebKit, usar el ícono `Music` de
      Lucide (design.md, "Risks / Trade-offs")
- [x] 4.2 Flechas en `campo-numero`: dos chevrones propios apilados a la
      derecha del input, con `tabindex="-1"` y `aria-hidden`, deshabilitados
      según `puedeSubir`/`puedeBajar`. Las teclas arriba y abajo (con
      Mayúsculas, de a 10) despachan `paso` con `{ texto, cantidad }`, y el
      foco no se mueve. Con `compacto` no hay chevrones, pero sí teclas.
      Verificar en el navegador los escenarios de "Las flechas del campo
      numérico", y con una captura del campo en claro y en oscuro
- [x] 4.3 En `campo-rango`: recibir `formatear` y `leer`, reemplazar
      `interpretarExtremo`, formatear cada campo y el `aria-valuetext` de cada
      perilla, y llevar el `paso` de cada campo a `mover(extremo, …)`.
      Verificar con `campo-rango.test.ts`: un paso en el campo "desde" de un
      rango no invertible se frena en "hasta"; y en el navegador, "Un solo
      botón para el rango" y "Escribir una nota en un extremo"
- [x] 4.4 Verificar con una captura que, en modo nota, "G#9" entra en el
      campo compacto del rango y el panel de Filtrar no se desplaza a lo
      ancho; si no entra, agrandar el campo compacto en `ch`

## 5. Nodos

- [x] 5.1 Desplazar: declarar `modos: ["decimal"]` en el desplazamiento; verificar con `desplazar.test.ts` (o el de
      `entero`) que "E4" y "0x0C" no se pueden interpretar ahí, y en el
      navegador que no tiene botón de modo
- [x] 5.2 Fijar: el `validar` arma "Con Canal, tiene que ir de … a …" con
      `formatear("valor", …)`. Verificar con `fijar.test.ts` en decimal ("de 1
      a 16") y en hexadecimal ("de 01 a 10")
- [x] 5.3 En `nodos/catalogo.test.ts`, revisar que todo parámetro que ofrece
      `nota` tenga mínimo y máximo dentro de 0 a 127, y que todo el que ofrece
      `hexadecimal` tenga un mínimo de 0 o más. Verificar que el test falla
      si se le saca temporalmente `modos` a Desplazar, y que pasa con el
      catálogo real

## 6. Guías y cierre

- [x] 6.1 Actualizar `parametros/LEEME.md`: la presentación en `error` y en
      `dibujar`, el `formatear` opcional, los modos del entero y el rango
      (`DeclaracionNumerica`, orden y lectura), y que el ejemplo de decimales
      siga compilando con el contrato nuevo (ignorando la presentación). Verificar
      copiando el ejemplo a un archivo temporal y corriendo
      `npx tsc --noEmit`
- [x] 6.2 Actualizar `nodos/LEEME.md`: cómo declarar `modos` en un entero o
      un rango (y que el primero es el inicial), y el `formatear` de
      `validar` con un ejemplo;
      verificar que el `validar` del ejemplo coincide con la firma de
      `tipos.ts`
- [x] 6.3 Correr `npx tsc --noEmit` y `npm test` sin errores; comparar la
      huella con la del comienzo: solo cambian los paneles con parámetros
      numéricos (botón de modo y flechas)
- [x] 6.4 Probar en la ventana real (`npm run tauri dev`) que el botón de modo
      se activa con Enter y con la barra espaciadora, y que una caja Fijar en
      modo nota con valor C4 envía 60 en el byte elegido
- [ ] 6.5 Al archivar, proponer a la persona usuaria los cambios a AGENTS.md:
      la presentación opaca en `NodoDelFlujo` (solo los tipos de parámetro la
      leen), `parametros/modos.ts`, el `formatear` de `validar`, y que
      `campo-rango` recibe cómo formatear y leer

## 7. Ajustes después de probar en la ventana real

- [x] 7.1 El contorno de foco de `campo-numero` con flechas rodea al campo y a
      las flechas juntos, sin separarlas del campo. Verificar con una captura
      del campo enfocado en el navegador
- [x] 7.2 La presentación del entero y el rango pasa a ser `{ modo, bemoles }`
      (design.md, "Bemoles o sostenidos"): `nombreDeNota` con `bemoles`
      opcional; `leer` y `formatear` en `modos.ts` con la presentación; el
      entero y el rango avisan la presentación si cambió. Actualizar los tests
      que guardan una presentación (validación, Fijar, ejecutor) y
      `parametros/LEEME.md`. Verificar con tests de `modos.ts` y del entero
      los escenarios "Una nota escrita con bemol se muestra con bemol" y "Los
      bemoles siguen hasta que se escribe un sostenido", con
      `describir.test.ts` que el log sigue con sostenidos, y en el navegador
      escribiendo "Db4"

## 8. Revisión del PR

- [x] 8.1 `campo-numero` deja `flechas` y `etiquetaOculta`: las dos salen de
      `compacto` (sin etiqueta visible ni flechas propias). El ejemplo de
      `parametros/LEEME.md` atiende `paso`. Verificar con `npx tsc --noEmit`
      sobre el ejemplo copiado y con la huella igual a la del commit anterior
- [x] 8.2 `dibujarIcono` pasa de `workflow/iconos.ts` a `componentes/icono.ts`,
      como función (las raíces que lo dibujan estilizan su `<svg>`). Verificar
      con `npx tsc --noEmit`, `npm test` y la huella igual

