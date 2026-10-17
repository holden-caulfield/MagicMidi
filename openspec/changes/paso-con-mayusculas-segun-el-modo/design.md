# Design

## Context

`ModoNumerico` (`componentes/modo-numerico.ts`) es el controlador que
comparten los tres campos con modo (`campo-numero`, `campo-rango` y
`campo-secuencia`): sabe en qué modo está el campo y cómo se escribe y se lee
un número en cada uno, a partir de la tabla `MODOS`. Las flechas, en cambio,
las maneja cada campo, y el paso con Mayúsculas está escrito como
`evento.shiftKey ? 10 : 1` en cinco lugares: las flechas propias y el teclado
de `campo-numero`, el campo y la perilla de `campo-rango`, y el teclado de
`campo-secuencia`. Ver proposal.md para el porqué del cambio y la spec
`tipos-de-parametro` para el comportamiento.

## Goals / Non-Goals

**Goals:**

- Que el paso con Mayúsculas salga de un solo lugar, el modo, y que ningún
  campo sepa cuánto vale.
- No sumar código a los campos: cada uno cambia una expresión por una
  llamada.

**Non-Goals:**

- Cambiar el paso sin Mayúsculas, que sigue siendo 1 en cualquier modo.
- Sumar otras teclas (Re Pág / Av Pág) o cambiar Inicio y Fin de la perilla.
- Redondear a la octava o a la cifra (ir al próximo C, o al próximo múltiplo
  de 16): el paso suma exactamente 12 o 16, así la nota o la última cifra
  hexadecimal no cambian.

## Decisions

**El paso grande es un dato de cada modo, en `MODOS`.** Cada entrada suma
`pasoGrande` (10, 12 y 16) al lado de `escribir` y `leer`, que es donde ya
está lo único que cambia de un modo a otro. Alternativa descartada: un
`switch` por modo en cada campo, que repetiría el dato en cinco lugares en vez
de sacarlo de ellos.

**El controlador da el paso entero: `paso(conMayusculas: boolean)`.**
Devuelve 1, o el paso grande del modo actual, y cada campo lo multiplica por
el sentido: `sentido * this.modo.paso(evento.shiftKey)`. Así la regla "1, o el
del modo con Mayúsculas" vive en un solo lugar, como dice AGENTS.md ("los
numéricos son dueños de su modo y de sus flechas"). Recibe un booleano y no el
evento para que el controlador no dependa del DOM y se pruebe en el entorno
`node` de Vitest, como el resto de sus funciones. Alternativas descartadas:
un getter `pasoGrande` (cada campo seguiría escribiendo el
`shiftKey ? … : 1`), y que el controlador maneje las teclas (cada campo
dibuja sus flechas y sus campos de texto distinto, y la perilla del rango
además responde a izquierda, derecha, Inicio y Fin: moverlo al controlador
lo obligaría a conocer cada control).

**La perilla del rango usa el mismo paso que los campos de los extremos.** La
spec dice que el campo mueve su extremo como lo mueve la perilla, y la
perilla ya anuncia su valor en el modo del campo: dos pasos distintos en el
mismo control serían una sorpresa.

**El paso es el del modo, aunque el número se muestre en decimal.** Un
negativo se muestra en decimal en los modos nota y hexadecimal. Solo puede
pasar con un valor que ya tiene error, porque esos modos exigen un mínimo de 0
o más, y no vale un caso especial: el paso sigue siendo el del modo.

## Risks / Trade-offs

- [En hexadecimal, un número de tres cifras o más mueve la segunda cifra
  desde la derecha, no la primera] → Hoy ningún parámetro que ofrece
  hexadecimal pasa de 127 (dos cifras). La spec lo dice así ("la segunda
  cifra desde la derecha"), así que queda definido igual.
- [Cerca del máximo, el paso se frena en el tope y la nota o la última cifra
  cambian (de C9 a G9, de 70 a 7F)] → Es lo mismo que pasa en decimal (de 120
  a 127), y la flecha deshabilitada muestra que no hay más lugar.

## Migration Plan

Nada que migrar: lo que guarda la caja (el modo y los bemoles) no cambia, y
el paso sale del modo guardado.
