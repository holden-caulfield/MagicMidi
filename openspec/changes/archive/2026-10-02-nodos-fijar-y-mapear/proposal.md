# Proposal

## Why

Desplazar alcanza para transponer, pero varios arreglos muy comunes en un setup
MIDI piden otra cosa: poner siempre el mismo valor (un canal fijo cuando no se
sabe en cuál manda el controlador, una velocidad pareja para un órgano o para
disparar samples) o llevar un rango de valores a otro (invertir un pedal de
expresión con la polaridad al revés, comprimir la velocidad de un teclado duro
o blando, limitar la rueda de modulación para un vibrato sutil). Hoy no hay
forma de armar ninguno de los dos sin escribir un nodo propio.

Pensar estos nodos dejó a la vista dos problemas que ya existen. Tocar el byte
de status entero mezcla el tipo de mensaje con el canal: en Desplazar, `9F` + 1
da `A0`, que ya no es un Nota On en el canal 2 sino una Presión Polifónica en el
canal 1. Y los parámetros se validan de a uno, así que no hay forma de decir que
una combinación (por ejemplo, un rango de entrada de un solo valor) no sirve.

## What Changes

- Nuevo tipo de nodo **Fijar**, con entrada y salida: reemplaza una parte del
  mensaje por un valor fijo. Se elige entre **Canal**, **2.º (datos 1)** y
  **3.º (datos 2)**. En los bytes de datos el valor va de 0 a 127; con Canal,
  de 1 a 16, como lo muestra el log. Fijar el canal cambia solo los cuatro
  bits del canal, y los mensajes de sistema pasan sin cambios.
- Nuevo tipo de nodo **Mapear**, con entrada y salida: lleva linealmente un
  rango de entrada `[a, b]` a uno de salida `[c, d]` sobre un byte de datos.
  Los cuatro extremos van de 0 a 127, y los dos rangos se configuran. El de
  salida puede estar invertido (`c > d`) para invertir la polaridad. Un valor
  fuera del rango de entrada se toma como el extremo más cercano. Una caja
  nueva arranca en `0–127 → 0–127`, que deja todo igual.
- **BREAKING** (Desplazar): la opción **"1.º (status)"** pasa a ser
  **"Canal"**. Desplaza el canal entre 1 y 16 sin tocar el tipo de mensaje,
  con el mismo overflow que los datos (con overflow, después de 16 viene 1).
  Los mensajes de sistema pasan sin cambios. El flujo no se guarda entre
  sesiones, así que no hay cajas viejas que migrar.
- **Validación de la configuración de una caja.** Cada tipo de nodo puede
  sumar reglas propias, que miran varios parámetros juntos, a las que ya
  tiene cada parámetro (por ejemplo, el rango de un entero). Los usan Fijar
  ("con Canal, el valor va de 1 a 16") y Mapear ("los extremos de entrada
  tienen que ser distintos"). Cada error queda asociado a un parámetro:
  - un valor que no cumple una regla **se guarda igual**, y el panel muestra
    el error debajo de su campo. Lo que no se puede interpretar (por ejemplo,
    "2.5" en un entero) se sigue rechazando como hoy;
  - una caja mal configurada se ve en el lienzo con un **borde rojo**;
  - un mensaje que llega a una caja mal configurada **hace fallar la caja**,
    como cualquier caja que falla: no sale nada de ese mensaje y el log lo
    marca con error, con el texto del problema.
- El parámetro **entero** acepta un rango opcional (mínimo y máximo).
  Desplazar no lo usa y sigue aceptando cualquier entero.
- La barra ofrece seis cajas, en este orden: Filtrar, Desplazar, Fijar,
  Mapear, Emitir y Descartar.
- La guía de `nodos/LEEME.md` cambia su ejemplo completo: "Velocidad fija"
  pasa a resolverse con Filtrar (Nota On) → Fijar, y la spec pide que el
  ejemplo no sea algo que ya se arma con las cajas existentes. El ejemplo
  nuevo es **"Nota Off real"**, que convierte un Nota On con velocidad 0 en un
  Nota Off con velocidad 64. Además explica cómo declarar reglas de
  validación.

## Capabilities

### New Capabilities

- `nodo-fijar`: parámetros, validación, comportamiento y bordes del nodo
  Fijar.
- `nodo-mapear`: parámetros, validación, cálculo del mapeo, rangos invertidos
  y valores fuera del rango de entrada del nodo Mapear.

### Modified Capabilities

- `nodo-desplazar`: "1.º (status)" pasa a ser "Canal", con su rango de 1 a 16.
- `tipos-de-parametro`: el entero suma un rango opcional; un valor que se
  puede interpretar pero no cumple las reglas se guarda y se muestra con su
  error, en lugar de rechazarse.
- `tipos-de-nodo`: un tipo de nodo puede declarar reglas de validación; los
  tipos de esta versión pasan a ser seis; el ejemplo de la guía pasa a ser
  "Nota Off real".
- `editor-de-workflow`: la barra ofrece seis cajas; el panel muestra los
  errores de configuración; una caja mal configurada se marca con borde rojo.
- `ejecucion-de-workflow`: una caja mal configurada falla con cada mensaje que
  le llega.

## Impact

- Código nuevo: `src/workflow/nodos/fijar.ts`, `mapear.ts` y sus tests; la
  función que junta los errores de una caja (de sus parámetros y de su tipo),
  con su test.
- Código que cambia: `src/workflow/tipos.ts` (`validar` opcional),
  `parametros/catalogo.ts` y cada tipo de parámetro (devuelven un mensaje de
  error en lugar de un sí/no), `parametros/entero.ts` (rango opcional),
  `parametros/campo-de-parametro.ts` (muestra el error), el panel de
  configuración, `editor/lienzo.ts` (borde rojo), `ejecutar.ts` (falla con una
  caja mal configurada), `nodos/desplazar.ts` (Canal), `catalogo.ts` y los
  tests de todos ellos.
- Documentación: `nodos/LEEME.md`, `parametros/LEEME.md`, la sección "Qué hace
  hoy" de `README.md`, y posiblemente AGENTS.md (al archivar, con aprobación).
- Sin cambios en el backend ni en el formato de los mensajes.
