# Proposal

## Why

El modo de los números (decimal, nota, hexadecimal) se guarda como
*presentación* de la caja y pasa por el store, el panel, el catálogo de
parámetros, la validación, el lienzo y el ejecutor, aunque solo lo usan dos
campos. Las firmas de `erroresDeConfiguracion`, `error` y `validar` crecieron
para que los errores se escriban en el modo del campo, y quienes no formatean
nada (el lienzo, los tests de Fijar) pagan igual. Además, `campo-numero` avisa
el texto crudo, así que interpretar lo escrito queda repartido en los tipos de
parámetro. Es el cambio E de la revisión de arquitectura del 6 de octubre de
2026 (notas 6, 8 y 9), y va después del C y del D, que dejaron las bases de los
campos y el panel de configuración como los toma este cambio.

## What Changes

- **El modo es estado del campo numérico.** `campo-numero` y `campo-rango`
  reciben y avisan números (el rango, `{ desde, hasta }`), junto con los modos
  que ofrece el parámetro y sus límites. Guardan el modo actual y si las notas
  van con bemoles, el botón de modo lo cambia ahí mismo, leen lo escrito
  probando los modos, resuelven solos lo que no se puede leer y manejan las
  flechas, frenándolas en los límites. **BREAKING** (interno): desaparecen el
  evento `paso`, el evento `siguiente-modo` y las propiedades `modo`,
  `puedeSubir`, `puedeBajar` y `decimales` de los campos, y `formatear` y
  `leer` de `campo-rango`. El rasgo es un controlador reactivo,
  `ModoNumerico`; en el rango hay un solo modo, que el rango le pasa a sus dos
  campos.
- **`modos.ts` se muda de `workflow/parametros/` a `componentes/`**, con sus
  tests, y `nombreDeNota` y `numeroDeNota` pasan de `midi/describir.ts` a
  `midi/notas.ts`, que usan los modos y `describir.ts`.
- **Los mensajes llevan valores y los escribe el campo.** El `validar` de los
  tipos de parámetro (hoy `error`, ver abajo) y el de los tipos de nodo
  nombran valores con la plantilla marcada `formato`, en un módulo propio,
  `src/formato.ts`: lo importan los campos, los tipos de parámetro y los tipos
  de nodo, y no es de la interfaz. `Campo` escribe cada valor con el formato
  del campo donde se muestra el mensaje (los numéricos, en su modo); el
  ejecutor, con `String`, para el log. Los mensajes sin valores siguen siendo
  texto común.
- **Las firmas vuelven a lo simple**: `erroresDeConfiguracion(tipo,
  parametros)`, `validar(parametro, valor)` en los tipos de parámetro y
  `validar(parametros)` en los de nodo. Se van el
  `formatear` del catálogo de parámetros, `formatearParametro` y el segundo
  argumento de `validar`. El lienzo solo pregunta si hay errores.
- **`estadoDeLosParametros` reemplaza a `presentaciones`** en
  `NodoDelFlujo`: por clave de parámetro, lo que cada campo quiere conservar
  entre montajes (hoy, el modo y los bemoles). El panel le pasa a cada campo
  el suyo y lo guarda cuando el campo avisa que cambió. Solo lo leen los
  campos: el ejecutor, el lienzo y la validación no lo tocan.
- **Cada campo queda atado a su caja y su parámetro**: el panel dibuja los
  parámetros con `repeat` por `${nodo.id}/${clave}`, así el modo de una caja
  no aparece en otra al pasar de una a la otra.
- **El `error` de los tipos de parámetro pasa a llamarse `validar`**, como en
  los tipos de nodo y en línea con `dibujar`: la función dice si un valor
  sirve, y `error` queda como nombre de lo que devuelve, que es lo que recibe
  `dibujar`. `errorDelParametro` pasa a `validarParametro`.
- **Desaparecen los `parametro-…` y `CampoDeParametro`.** El `dibujar` de cada
  tipo dibuja su campo directamente, y `Campo` avisa `cambio` con `bubbles`
  para que llegue al panel. Un tipo de parámetro queda en la declaración,
  `validar` y `dibujar`.
- **El log escribe en decimal** los valores de un error de configuración,
  sea cual sea el modo del campo: el panel sigue mostrándolos en su modo.
- **Guías.** `parametros/LEEME.md` pierde la clase del control y la
  presentación, y su ejemplo completo pasa a ser un tipo `nota`, que dibuja
  `campo-numero` con el modo nota como único modo. `nodos/LEEME.md` explica
  `validar` sin `formatear`, con `formato` para nombrar valores.
- **Tests.** Los de interpretar del entero pasan a los de los modos; los de
  presentación de `validacion.test.ts` se reemplazan por los de `formato`;
  los de `validar` de Fijar pierden la ayuda `enDecimal`; los de las notas
  pasan a `midi/notas.test.ts`.
- **AGENTS.md**, al archivar y con aprobación explícita: "Controles",
  "Workflow" y las podas que el cambio A dejó para este (la lista de los
  `campo-…` y quién usa `erroresDeConfiguracion`).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `tipos-de-parametro`: un tipo de parámetro define su declaración, qué
  valores le sirven y qué campo lo dibuja con qué datos; interpretar lo
  escrito pasa a ser del campo. La presentación se reemplaza por lo que el
  campo conserva en la caja, que solo lee el campo, y desaparece el "escribir
  un número como lo muestra" de los tipos. Los errores con números los
  muestran en su modo el panel, no el log. La guía cambia su ejemplo a `nota`.
  Un escenario nuevo deja escrito que una caja no hereda el modo de la que se
  seleccionó antes, que hoy ya se cumple y el cambio no tiene que romper.
- `tipos-de-nodo`: las reglas de validación nombran valores en sus mensajes
  sin pedirle nada a los parámetros, los errores se calculan sin la
  presentación, y el texto del error es el mismo en el panel y en el log salvo
  por cómo se escriben sus valores. El escenario "Archivo autocontenido" suma
  la plantilla `formato` a lo que puede importar un tipo de nodo: no es de la
  interfaz, así que el requisito no negociable no cambia.
- `ejecucion-de-workflow`: el error de una caja mal configurada escribe sus
  valores en decimal, cualquiera sea el modo del campo.

## Impact

- Código: `src/componentes/` (`campo.ts`, `campo-numero.ts`,
  `campo-rango.ts`, más `modos.ts` y el controlador `ModoNumerico`),
  `src/formato.ts` (nuevo), `src/midi/` (`notas.ts` nuevo, `describir.ts`),
  `src/workflow/parametros/` (se van `campo-de-parametro.ts` y `modos.ts`; los
  seis tipos y `catalogo.ts` cambian), `src/workflow/validacion.ts`,
  `tipos.ts`, `ejecutar.ts`, `nodos/fijar.ts`, `editor/lienzo.ts`,
  `editor/panel-de-configuracion.ts` y `src/estado/estado.ts`.
- Tests: `entero.test.ts`, `rango.test.ts`, `opciones.test.ts`,
  `autocompletar.test.ts`, `modos.test.ts` (se muda),
  `validacion.test.ts`, `fijar.test.ts`, `desplazar.test.ts`,
  `catalogo.test.ts`, `campo-rango.test.ts`, `describir.test.ts`, más
  `formato.test.ts` y `notas.test.ts` nuevos.
- Documentación: `parametros/LEEME.md`, `nodos/LEEME.md` y AGENTS.md.
- Verificación: la huella de `verificacion-para-agentes/` tiene que dar igual
  (sin los `parametro-…` el panel tiene que verse igual); las pruebas que
  buscan campos siguen sirviendo.
- Sin cambios en el backend ni en las dependencias.
