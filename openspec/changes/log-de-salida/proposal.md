# Proposal

## Why

El log muestra solo lo que entra, así que la persona usuaria no puede ver qué
hace su flujo con cada mensaje: si lo dejó pasar, si lo transformó, en qué, o
si lo descartó. Ahora que el flujo reemplazó al pass-through, esa es justo la
información que hace falta para entender y corregir un flujo mientras se lo
arma, y para aprender qué hace cada caja.

## What Changes

- El log pasa a mostrar, junto a cada mensaje que entra, **lo que el flujo
  emitió a partir de él**. Cada mensaje de entrada forma un **grupo**: su fila,
  como hoy, y debajo una **sub-fila por cada mensaje que salió**, con los bytes y la descripción en las mismas columnas que la
  entrada para compararlos a simple vista. Las sub-filas no llevan hora: salen
  en el mismo instante que la entrada que las provocó.
- Para no duplicar filas, cuando la única salida es **igual** a la entrada no
  hay sub-fila: se marca con un ícono al final de la fila de entrada ("salió
  sin cambios"). Si salió más de un mensaje, van todos como sub-filas, aunque
  alguno sea igual a la entrada: un acorde que incluye la nota original se ve
  igual que cualquier otro caso de varias salidas.
- Un mensaje de entrada del que no salió nada se marca con otro ícono
  ("descartado").
- Si salen varios mensajes, las sub-filas van en el orden en que se
  emitieron, y los repetidos se muestran repetidos: cada uno es un envío real.
- Los colores separan lo que salió de lo que no: **letra violeta** para toda
  fila que salió por el puerto (las sub-filas, con un fondo violeta suave, y
  la entrada que salió sin cambios, sobre el fondo normal para que no llame la
  atención), y **fondo gris** para la entrada que se transformó o se descartó
  (la descartada, además, con la letra atenuada). Así, leer la letra violeta
  es leer todo lo que salió.
- El log deja de estirarse a todo el ancho del panel: su encabezado y la lista
  llegan hasta un ancho máximo (el de la fila más ancha de un mensaje de
  canal) y quedan centrados, para que las marcas no queden lejos de la
  descripción en una pantalla grande.
- El máximo de 500 pasa a contar **mensajes de entrada** (grupos), no filas.
- La descripción legible de los mensajes pasa del backend al frontend, porque
  ahora también hay que describir lo que produce el flujo, y eso nunca pasa por
  el backend antes de dibujarse. Las descripciones no cambian. **BREAKING**
  (interno): el evento `mensaje-midi` deja de traer `descripcion`.
- Queda **fuera**: mostrar lo que el backend reenvía directo (reloj y Sensor
  Activo), señalar en el log que una caja falló, confirmar en el log que el
  envío a la salida tuvo éxito, filtrar el log, y señalar en el lienzo por qué
  cajas pasó cada mensaje.

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `log-de-mensajes`: el log deja de mostrar solo la entrada; se modifican
  "El log muestra los mensajes que entran…", "Cada fila muestra hora, bytes y
  descripción", "Los mensajes más nuevos van arriba" y "El log conserva los
  últimos 500 mensajes" y "La lista de mensajes ocupa el espacio disponible"
  (ahora con un ancho máximo, centrada), y se agregan requisitos para las sub-filas de salida,
  la marca de "salió sin cambios", la de "descartado" y los colores que
  separan lo que salió de lo que solo entró.
- `ejecucion-de-workflow`: "El log sigue mostrando lo que entra" pasa a decir
  que el log muestra lo que entra y lo que el flujo emitió a partir de eso.

## Impact

- `src/log.ts`: las filas pasan a ser grupos (entrada, marca y sub-filas), se
  siguen agregando a mano. Deja de escuchar `mensaje-midi` por su cuenta.
- `src/workflow/ejecutar.ts` y `src/workflow/salida.ts`: procesar un mensaje
  devuelve lo que se emitió, y un solo listener de `mensaje-midi` procesa y
  después le pasa al log la entrada y sus salidas.
- Nuevo módulo de descripción en TypeScript (`src/describir.ts`, con su
  `.test.ts`), con los tests que hoy tiene `describir_mensaje` en Rust.
- `src-tauri/src/lib.rs`: se va `describir_mensaje` y sus tests; el evento
  queda con los bytes y la marca temporal.
- `src/styles.css`: estilos del grupo, las sub-filas y las marcas.
- Íconos nuevos de Lucide para las marcas. Sin dependencias nuevas.
- Al archivar: la sección de arquitectura de AGENTS.md (el backend ya no
  describe mensajes; el orden de los `listen` en el arranque) necesita
  actualizarse, con aprobación de la persona usuaria.
