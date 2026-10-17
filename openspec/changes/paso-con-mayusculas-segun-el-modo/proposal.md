# Proposal

## Why

Con Mayúsculas, las flechas de un campo numérico suman o restan 10 en
cualquier modo. En decimal es el paso natural, pero en los otros dos no dice
nada: en modo nota, 10 semitonos llevan de C3 a A#3, cuando lo que se busca es
la misma nota una octava arriba; en hexadecimal, de A0 a AA, cuando lo útil es
mover la cifra de adelante (A0 a B0). El paso grande tiene que ser el que tiene
sentido en el modo en que se está mirando el número.

## What Changes

- **El paso con Mayúsculas depende del modo.** En decimal sigue siendo 10
  (25 a 35); en nota pasa a ser una octava, 12 semitonos (C3 a C4); en
  hexadecimal, 16, que mueve la cifra de adelante y deja la de atrás como
  está (3C a 4C).
- **Vale en todos los campos con modo.** Las flechas propias y las del
  teclado del entero, las del teclado en los campos de un rango y de una
  secuencia, y las de la perilla de un rango, que se mueve igual que el campo
  de su extremo.
- **Lo demás no cambia.** Sin Mayúsculas el paso sigue siendo 1 en cualquier
  modo, el resultado se sigue frenando en el mínimo y el máximo del
  parámetro, y un campo con un solo modo (decimal, como Desplazar) sigue
  igual.
- **El paso es del modo, en un solo lugar.** Hoy cada campo repite el 10. El
  paso pasa a salir del controlador del modo, que es el dueño de las flechas
  de los campos numéricos.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `tipos-de-parametro`: "Las flechas del campo numérico" pasa a decir que el
  paso con Mayúsculas es el del modo (10, 12 o 16), con escenarios para nota y
  hexadecimal; "El control de rango" deja de fijar el paso en 10 y remite a
  ese requisito, para la perilla y para los campos de los extremos.

## Impact

- `src/componentes/modo-numerico.ts`: cada modo declara su paso grande, y el
  controlador da el paso de las flechas.
- `src/componentes/campo-numero.ts`, `campo-rango.ts` y `campo-secuencia.ts`:
  piden el paso al controlador en lugar de usar 10, y sus comentarios dejan
  de decir "de a 10".
- `src/componentes/modo-numerico.test.ts`: los pasos de cada modo.
- `verificacion-para-agentes/pruebas/modos.js`: la prueba de las flechas en
  modo nota con Mayúsculas da otro resultado, y suma casos en hexadecimal y en
  un rango en modo nota.
- Sin cambios en el procesamiento de mensajes, en los tipos de nodo ni en lo
  que se guarda en la caja: el modo ya se conservaba, y el paso sale de él.
