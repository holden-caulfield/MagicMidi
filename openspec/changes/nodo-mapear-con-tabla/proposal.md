# Proposal

## Why

Hoy no hay forma de cambiar un valor puntual por otro, uno por uno. El caso
típico es llevar los pads de un controlador al mapa de batería GM: el pad que
manda C2 tiene que sonar como bombo (C1), el que manda C#2 como redoblante
(D1), el de D2 como hi-hat cerrado (F#1). Cada pad va a una nota distinta, sin
ninguna proporción entre ellas. Mapear reparte un rango de forma lineal y no
lo puede expresar, y con Filtrar y Fijar haría falta una rama por pad. Es la
idea "Remapear notas con una tabla" del roadmap, y necesita un tipo de
parámetro que todavía no existe.

## What Changes

- **Mapear pasa a llamarse Interpolar.** Hace lo mismo, con los mismos
  parámetros, el mismo ícono y el mismo lugar en la barra: cambian solo el
  nombre y el identificador. "Interpolar" dice lo que hace (repartir los
  valores entre dos extremos), y libera "Mapear" para la caja nueva, que es la
  que hace un mapa de verdad, como un mapa de batería. No rompe nada, porque
  los flujos no se guardan de una sesión a otra. Es además el momento más
  barato para renombrar: cuando llegue "Guardar y cargar workflows", un cambio
  de nombre rompería los flujos guardados.
- **Caja Mapear nueva.** Es una caja intermedia, con salida, y elige el byte
  como Fijar y Alternar: Canal, 2.º (datos 1) o 3.º (datos 2). Arranca en
  datos 1, porque el caso principal son las notas. Si el valor de ese byte
  figura como entrada en el mapa, lo cambia por su salida; si no figura, el
  mensaje pasa sin cambios. Un mensaje que no tiene el byte elegido también
  pasa sin cambios. No mira el tipo de mensaje: para cambiar solo las notas,
  se pone antes un Filtrar. Con Canal, las entradas y las salidas tienen que ir
  de 1 a 16, como en Fijar. En la barra va justo después de Interpolar, con el
  ícono de una tabla.
- **Un tipo de parámetro nuevo: `mapa`.** Es una lista de pares entrada →
  salida, de números enteros entre un mínimo y un máximo, con modos como el
  entero. Cada entrada puede aparecer una sola vez, porque en un mapa una
  entrada lleva a una sola salida. Un mapa vacío es válido: no cambia nada.
  Los errores son tres: que no sea una lista de pares de enteros, que un valor
  quede fuera de rango y que una entrada esté repetida. Los dos últimos nombran
  el valor. La forma del valor deja lugar para extenderlo más adelante (otra
  clase de valores, o un límite de filas) sin cambiar lo que ya existe, pero no
  se anticipa nada de eso.
- **El campo del mapa.** Muestra un par por fila: el campo de la entrada, una
  flecha, el campo de la salida y un botón para quitar el par. No tiene títulos
  de columna, porque la flecha ya dice cuál es cuál. Un solo botón de modo
  cambia todos los valores. No hay botones para subir ni bajar, porque el orden
  no cambia el resultado. "Agregar" suma la siguiente entrada que no esté en el
  mapa, con la misma salida, así no crea un repetido ni cambia nada hasta que
  se edita. Todo se puede hacer con el teclado.
- **La barra en la spec del editor se pone al día.** La spec todavía lista
  ocho cajas, sin Alternar; como este cambio la toca, pasa a listar las diez.

## Capabilities

### New Capabilities

- `nodo-interpolar`: lo que hoy describe `nodo-mapear` (parámetros, cómo
  reparte los valores, qué pasa fuera del rango de entrada y con un mensaje
  sin el byte elegido), con el nombre nuevo.

### Modified Capabilities

- `nodo-mapear`: sus requisitos pasan a `nodo-interpolar`, y en su lugar van
  los de la caja nueva: sus parámetros, cómo cambia un valor por otro, qué pasa
  con un valor que no está en el mapa y con un mensaje sin el byte elegido, y
  cómo se combina con el apareo.
- `tipos-de-parametro`: el tipo `mapa`, con su valor, sus errores y su
  control. Los requisitos de los parámetros numéricos (modos, lectura de lo
  escrito y flechas del teclado) incluyen el mapa. Los escenarios del rango
  que usaban Mapear pasan a Interpolar.
- `tipos-de-nodo`: Interpolar y Mapear se suman a la lista de tipos que siguen
  el contrato y a la de los que no usan la memoria, y Mapear va justo después
  de Interpolar.
- `editor-de-workflow`: la barra ofrece diez cajas, con Alternar, Interpolar y
  Mapear. Los escenarios de errores de configuración que usaban Mapear pasan a
  Interpolar.
- `ejecucion-de-workflow`: el escenario de una caja mal configurada en una
  rama que no se recorre pasa a Interpolar.

## Impact

- Código que cambia:
  - `src/workflow/nodos/mapear.ts` y su test pasan a `interpolar.ts` e
    `interpolar.test.ts`, con el nombre "Interpolar";
  - `nodos/catalogo.ts`: Interpolar queda donde estaba Mapear, y la caja
    Mapear nueva va justo después;
  - `nodos/catalogo.test.ts` y `workflow/ejecutar.test.ts`: lo que usa la caja
    lineal pasa a `interpolar`.
- Código nuevo:
  - `src/workflow/nodos/mapear.ts` y su test;
  - `src/workflow/parametros/mapa.ts` y su test;
  - `src/componentes/campo-mapa.ts`, con el test de lo que se puede probar sin
    la interfaz (cuál es la siguiente entrada libre).
- No cambian el backend, el ejecutor, el panel de configuración ni el log. La
  huella de la interfaz cambia solo en la barra (una caja más) y en el panel de
  una caja Mapear.
- Documentación: `README.md` (Interpolar y Mapear en las cajas disponibles),
  `nodos/LEEME.md` y `parametros/LEEME.md` (los ejemplos de la caja lineal
  pasan a Interpolar, y el mapa se suma a los tipos de parámetro). Al archivar,
  el propósito de la spec `nodo-mapear` se reescribe a mano, porque los deltas
  no lo cambian, y se revisa si el mapa deja alguna regla para AGENTS.md.
- Roadmap: resuelve "Remapear notas con una tabla". La idea hecha "Mapear
  rango" pasa a llamarse con el nombre nuevo.
