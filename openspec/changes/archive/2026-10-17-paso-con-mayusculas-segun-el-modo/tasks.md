# Tasks

La verificación visual se hace con `verificacion-para-agentes/` (ver
AGENTS.md, "Verificación antes de dar por terminada una tarea").

## 1. El paso es del modo

- [x] 1.1 En `src/componentes/modo-numerico.ts`, sumar `pasoGrande` a cada
      entrada de `MODOS` (decimal 10, nota 12, hexadecimal 16) y el método
      `paso(conMayusculas: boolean)` de `ModoNumerico`, que devuelve 1 o el
      paso grande del modo actual, con su JSDoc (design.md, "El controlador da
      el paso entero"); en `modo-numerico.test.ts`, que sin Mayúsculas el
      paso es 1 en los tres modos, que con Mayúsculas es 10, 12 y 16, y que
      después de pasar a otro modo (con el botón o leyendo lo escrito) el paso
      es el del modo nuevo; verificar con `npm test`

## 2. Los campos piden el paso

- [x] 2.1 En `campo-numero.ts`, que las flechas propias y las del teclado usen
      `this.modo.paso(evento.shiftKey)` en lugar de `evento.shiftKey ? 10 : 1`,
      y que el JSDoc de la clase diga que con Mayúsculas suman el paso del
      modo
- [x] 2.2 En `campo-rango.ts`, lo mismo en `teclaEnCampo` y en
      `teclaEnPerilla`, y en el comentario de `teclaEnCampo`
- [x] 2.3 En `campo-secuencia.ts`, lo mismo en `tecla` y en su comentario
- [x] 2.4 Verificar que en `src/` no queda ningún paso de 10 escrito a mano
      (`grep -rn "? 10 : 1" src`, sin resultados), y que pasan
      `npx tsc --noEmit` y `npm test`

## 3. Verificación

- [x] 3.1 En `verificacion-para-agentes/pruebas/modos.js`, actualizar lo que
      espera la flecha con Mayúsculas en modo nota (desde "Eb4" ahora da
      "Eb5", y la flecha abajo que sigue, "D5"), y sumar los escenarios nuevos
      de la spec `tipos-de-parametro`: de a 16 en hexadecimal ("3C" a "4C"),
      el tope en hexadecimal ("70" a "7F", con la flecha de subir
      deshabilitada), la octava que conserva el bemol ("Db4" a "Db3"), un
      extremo de un rango en modo nota ("C3" a "C4") y una perilla en
      hexadecimal; correrla en WebKit con `correr.sh` y verificar que cada
      resultado coincide con su escenario
- [x] 3.2 Correr `pruebas/alternar.js` y verificar que la secuencia, en
      decimal, sigue sumando 10 con Mayúsculas
- [x] 3.3 Comparar la huella de la interfaz con la de `main`
      (`verificacion-para-agentes/huella/`): tiene que dar igual, porque el
      cambio no se ve hasta que se aprieta una flecha

## 4. Al cerrar el cambio

- [x] 4.1 Al archivar, revisar si queda algo para devolver a AGENTS.md: se
      espera que no, porque la regla de que los numéricos son dueños de su
      modo y de sus flechas (`ModoNumerico`) ya lo cubre. Si aparece algo,
      proponer el diff a la persona usuaria antes de tocar el archivo. El
      roadmap no tiene una idea para este cambio
