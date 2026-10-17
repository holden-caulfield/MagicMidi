# Proposal

## Why

Hay arreglos que ninguna caja de hoy puede armar porque dependen de lo que
pasó antes: que un pedal momentáneo funcione como interruptor (una pisada
lo baja, la siguiente lo sube), repartir las notas entre varios canales por
turno, o acentuar una nota de cada cuatro. Todas las cajas actuales responden
a cada mensaje por separado, sin memoria. Ahora que el apareo de Nota Off está
hecho, alternar el canal de las notas apaga cada una donde se prendió, y una
caja que alterna valores resuelve todos esos casos con una sola idea.

## What Changes

- **Caja Alternar.** Una caja intermedia, con salida, que pone el byte
  elegido (Canal, Datos 1 o Datos 2, como Fijar) en el siguiente valor de una
  lista: sin memoria, arranca por el primero, y después del último vuelve al
  primero. Nunca descarta: siempre devuelve el mensaje, y lo que haya que
  descartar se arma a la vista con Filtrar y Descartar.
- **"Un ciclo por".** Un parámetro de opciones (Canal, Datos 1, Datos 2) que
  separa los ciclos: sin ninguna elegida hay un solo ciclo; con varias, uno
  por cada combinación. La combinación se lee del mensaje tal como llega,
  antes de cambiarlo. Así una sola caja maneja una pedalera entera (un ciclo
  por Datos 1) o un round-robin independiente por teclado (alternar el canal
  con un ciclo por canal).
- **Qué recuerda.** La posición en la lista, no el valor: con valores
  repetidos (`127, 80, 80, 80`), recordar el valor trabaría el ciclo en el 80.
  Si la lista cambia y la posición queda afuera, vuelve al primero. Un
  mensaje que no tiene el byte elegido (un Cambio de Programa no tiene datos
  2; uno de sistema no tiene canal) pasa sin cambios y no avanza el ciclo.
  Cada mensaje que llega a la caja avanza su ciclo, aunque una caja posterior
  falle.
- **La memoria de las cajas.** Alternar es la primera caja que recuerda algo
  entre un mensaje y el siguiente, y lo que se decide acá vale para las que
  vengan (Hold, Mono, CC repetidos). La función de procesamiento de todo tipo
  de nodo recibe la memoria de su caja: es de cada caja, arranca vacía y la
  guarda el ejecutor. Se olvida cuando no hay conexión, junto con lo anotado
  del apareo. Editar el flujo no la borra, y el pánico tampoco, por lo mismo
  que no olvida lo anotado.
- **Un tipo de parámetro nuevo, `secuencia`.** Una lista de números enteros
  en orden, que se pueden repetir, entre un mínimo y un máximo. Su campo
  muestra un valor por fila, todos en el mismo modo (decimal, nota o
  hexadecimal, con un solo botón de modo), y permite agregar, quitar y
  reordenar valores con el mouse y con el teclado. La lista vacía es un
  error, y el error de un valor fuera de rango lo nombra.
- **Validación de Alternar.** Con Canal, cada valor tiene que ir de 1 a 16,
  como en Fijar; el error nombra el valor que falla.

## Capabilities

### New Capabilities

- `nodo-alternar`: los parámetros de la caja Alternar, cómo recorre la lista,
  cómo separa los ciclos, qué pasa con un mensaje sin el byte elegido y con
  una lista editada, y cómo se combina con el apareo.

### Modified Capabilities

- `tipos-de-nodo`: la función de procesamiento recibe la memoria de su caja;
  la guía de la carpeta de tipos de nodo explica cómo usarla; Alternar se suma
  a los tipos que siguen el contrato.
- `ejecucion-de-workflow`: cada caja tiene su memoria, y se dice cuándo
  arranca vacía, cuándo se conserva y cuándo se olvida.
- `tipos-de-parametro`: el tipo `secuencia` se suma a los disponibles, con su
  validación y su control; los parámetros numéricos (modos y flechas del
  teclado) incluyen la secuencia.

## Impact

- Código nuevo:
  - `src/workflow/nodos/alternar.ts` y su test, registrado en
    `nodos/catalogo.ts` después de Fijar;
  - `src/workflow/memoria-de-las-cajas.ts`, la memoria de cada caja (estado
    propio del módulo `workflow`, fuera del store, como lo anotado del
    apareo), con su test;
  - `src/workflow/parametros/secuencia.ts` y su test;
  - `src/componentes/campo-secuencia.ts`, el campo de la secuencia.
- Código que cambia:
  - `workflow/tipos.ts`: `procesar` recibe la memoria;
  - `workflow/ejecutar.ts`: le pasa a cada caja su memoria;
  - `main.ts`: sin conexión, olvida también la memoria de las cajas;
  - `nodos/catalogo.test.ts`: llama a `procesar` con una memoria.
- Los tipos de nodo que ya existen no cambian: no usan la memoria y pueden
  ignorarla.
- Sin cambios en el backend ni en el log. La huella de la interfaz no cambia
  fuera del panel de configuración de una caja Alternar.
- Documentación: `README.md` (la caja en "Cajas disponibles"),
  `nodos/LEEME.md` (la memoria de una caja) y `parametros/LEEME.md` (la
  secuencia en "Los que hay"). Al archivar, se propondrá a AGENTS.md la regla
  de la memoria de las cajas (de quién es, dónde vive y cuándo se olvida) y
  la del campo de la secuencia, si deja una regla que cruce módulos.
- Roadmap: resuelve "Pedal momentáneo → latch" y "Round-robin de canales".
