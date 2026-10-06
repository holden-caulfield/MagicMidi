# Proposal

## Why

Los parámetros numéricos (el entero y los extremos del rango) se escriben y se
leen solo en decimal. Pero en MIDI muchas veces resulta más natural pensar un
valor como una nota ("C4" en vez de 60) o en hexadecimal ("3C"), que es como
aparecen los bytes en la documentación de los equipos. Hoy hay que hacer la
cuenta a mano. Como el valor sigue siendo siempre un número, no hacen falta
parámetros ni nodos nuevos: alcanza con que los campos que ya existen dejen
elegir cómo se muestra ese número.

## What Changes

- **Modo de un parámetro numérico**: cada parámetro entero y cada rango se
  muestra en uno de tres modos: **decimal** (como hasta ahora), **nota**
  (`C4`, en notación científica, con el Do central 60 como C4, igual que el
  log) o **hexadecimal** (`3C`, en mayúsculas y sin prefijo). El valor
  guardado sigue siendo un número, así que el procesamiento de las cajas no
  cambia.
- **Modos que ofrece cada parámetro**: la declaración de un parámetro puede
  indicar qué modos ofrece y en qué orden. Si no lo indica, ofrece decimal,
  nota y hexadecimal, en ese orden. El primero es el modo con que arranca una
  caja nueva. El modo nota requiere que el parámetro vaya de 0 a 127, o un
  tramo dentro de ese rango, y el hexadecimal, que no admita negativos. Un test
  revisa que todos los tipos de nodo lo cumplan.
- **Botón de modo**: si el parámetro ofrece más de un modo, en la fila de la
  etiqueta hay un botón chico (`DEC` / `♪` / `HEX`) que, con un clic o con el
  teclado, pasa al siguiente modo, en el orden en que se declararon. En el
  rango hay un solo botón para los dos extremos. La caja de texto se sigue
  usando como hasta ahora: un clic la enfoca.
- **Escribir en otro modo cambia el modo**: lo escrito se lee probando los
  modos que ofrece el parámetro en el orden en que rotan, empezando por el
  actual. Si se lee en otro modo, el campo pasa a ese modo. Por ejemplo, en
  modo decimal, escribir "C4" guarda 60 y deja el campo en modo nota. Un
  parámetro con un solo modo acepta solo ese formato.
- **El modo se guarda con la caja**: se conserva al seleccionar otra caja y
  volver. Lo guarda la configuración de la caja como "presentación" de cada
  parámetro: algo que el panel, el lienzo, el ejecutor y los tipos de nodo
  guardan y pasan sin saber qué tiene adentro. Fuera de los tipos de
  parámetro entero y rango, nadie sabe que existen los modos.
- **Errores en el modo elegido**: los errores de un parámetro numérico
  expresan los números en su modo ("Tiene que ir de C-1 a G9", "Tiene que ir
  de 00 a 7F"). Una regla de un tipo de nodo que nombra un número le pide al
  parámetro que lo escriba como él lo muestra, sin saber en qué modo está.
- **Flechas en el campo numérico**: el campo de un entero suma dos flechas
  propias (arriba y abajo, al estilo del resto de los controles) que suben o
  bajan el valor de a uno sin pasar del mínimo ni del máximo. Con el foco en
  el campo, las flechas del teclado hacen lo mismo, y con Mayúsculas avanzan de
  a 10. En los campos del rango, que son compactos, solo se puede con el
  teclado, porque para eso están las perillas.
- **Desplazar** ofrece solo el modo decimal: el desplazamiento es un intervalo
  que puede ser negativo, no una nota ni un byte.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `tipos-de-parametro`: el entero y el rango suman los modos, con el botón, la
  lectura en el orden de los modos (que cambia el modo), los errores en el
  modo elegido, y las flechas del campo y del teclado. Además, cualquier tipo
  de parámetro puede guardar una presentación en la caja, y escribir un número
  como lo muestra.
- `tipos-de-nodo`: la configuración de una caja incluye la presentación de
  cada parámetro, y los errores se calculan con ella. Una regla del tipo puede
  pedirle a un parámetro que escriba un número como lo muestra.
- `nodo-desplazar`: el desplazamiento se ofrece solo en decimal.
- `nodo-fijar`: el error de "con Canal, de 1 a 16" escribe los números como
  los muestra el valor.

## Impact

- **Donde viven los modos**: un módulo puro nuevo,
  `src/workflow/parametros/modos.ts`, con su test, más
  `parametros/entero.ts` y `rango.ts` con sus tests. Leer un nombre de nota se
  suma a `nombreDeNota` en `src/midi/describir.ts`.
- **Componentes**: `src/componentes/campo.ts` (el botón de modo, que recibe
  solo el texto a mostrar), `campo-numero.ts` (flechas y teclas) y
  `campo-rango.ts` (recibe cómo formatear y cómo leer). Los componentes no
  conocen los modos.
- **Genérico, sin modos**:
  - `parametros/catalogo.ts` y `campo-de-parametro.ts`: la presentación llega
    a `error` y a `dibujar`, y el `formatear` opcional de cada tipo.
  - `src/estado/estado.ts`: `NodoDelFlujo` guarda las presentaciones.
  - `validacion.ts` y `tipos.ts`: `validar` recibe un `formatear`.
  - `editor/panel-de-configuracion.ts`, `editor/lienzo.ts` y `ejecutar.ts`,
    que pasan las presentaciones al calcular errores.
- **Nodos**: `nodos/desplazar.ts` y `nodos/fijar.ts`, con sus tests, y
  `nodos/catalogo.test.ts`.
- **Guías**: `parametros/LEEME.md` (modos, presentación y `formatear`) y
  `nodos/LEEME.md` (cómo declarar los modos de un parámetro, y el `formatear`
  de `validar`).
- **Verificación**: la huella de `verificacion-para-agentes/` cambia a
  propósito en los paneles con parámetros numéricos (el botón de modo y las
  flechas).
- **Pendiente relacionado**: la convención de octava (C4 o C3 para el 60)
  quedó en pausa como opción de configuración. Si se retoma, también va a
  aplicar al modo nota.
- Sin dependencias nuevas.
