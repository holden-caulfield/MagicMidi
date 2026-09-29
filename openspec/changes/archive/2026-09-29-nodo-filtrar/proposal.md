# Proposal

## Why

Para armar flujos útiles hace falta poder elegir a qué mensajes se les aplica
una transformación: transponer solo las notas, o sacar solo los Nota Off. Hoy
no hay forma de seleccionar mensajes, y con el contrato actual (solo sale lo
que llega a un Emitir) un filtro descartaría todo lo que no selecciona. Por
ejemplo, para armar un acorde solo con las notas habría que agregar un segundo
filtro con todos los demás tipos conectado a otro Emitir, solo para que los
Cambios de Control sigan pasando. Eso es poco intuitivo y complica el flujo.

## What Changes

- **BREAKING** (comportamiento del flujo): cada mensaje que entra **se reenvía
  tal cual por defecto**, salvo que al procesarlo llegue a **al menos una
  caja de fin** (las naranjas, sin salida).

  Lo que devuelven las cajas de fin sigue saliendo por el puerto como hoy. Es
  decir: Emitir, además de agregar lo que recibe a la salida, **cancela** el
  reenvío del original. Un camino que se corta antes de llegar a una caja de
  fin (porque una caja lo descartó o porque no sigue a ningún lado) no cancela
  nada.
- **BREAKING** (errores): si una caja falla o produce un mensaje inválido, el
  procesamiento de ese mensaje se corta y **no sale nada**: ni el reenvío ni
  lo que ya hayan devuelto las cajas de fin de otras ramas. Hoy, en cambio,
  las otras ramas siguen emitiendo, y un flujo roto sale a medias sin que se
  note. El log marca ese mensaje como **error** (fondo y letra rojos, ícono de
  advertencia), distinto de "descartado", y la marca trae el texto del error:
  qué caja falló y por qué. El detalle completo sigue en la consola.
- Consecuencia: borrar el Emitir del flujo por defecto deja todo igual (se
  sigue reenviando todo). El lienzo inicial sigue siendo trigger → Emitir.
- Nuevo tipo de nodo **Filtrar**, con salida: deja pasar hacia las cajas
  siguientes solo los mensajes de los tipos elegidos, y descarta los demás en
  esa rama. Los tipos se eligen con una casilla por tipo: Nota On, Nota Off,
  Presión Polifónica, Cambio de Control, Cambio de Programa, Presión de Canal,
  Pitch Bend y Mensajes de sistema. Por ahora es el único criterio.
- Nuevo tipo de nodo **Descartar**, sin salida (caja de fin): no agrega nada a
  la salida, pero cancela el reenvío del original. Es la forma de decir "este
  mensaje no sale".
- **BREAKING** (contrato de los tipos de nodo): `MensajeMidi` deja de ser una
  lista de bytes y pasa a ser un objeto con la lista (`bytes`) y dos valores
  que se leen de ella: el **tipo** de mensaje y el **canal**. Se calculan
  cada vez que se leen, así que siguen siendo correctos si una caja cambia el
  status. La interpretación del status que hoy está dentro de
  `src/describir.ts` pasa a ese objeto, y la usan tanto la descripción del log
  como Filtrar.
- La guía para crear nodos (`nodos/LEEME.md`) cambia de ejemplo: "Sin Nota
  Off" ya no hace falta (es Filtrar con Nota Off → Descartar), y su lugar lo
  toma **Velocidad fija**, que pone a los Nota On una velocidad
  configurable. La guía explica también el nuevo contrato (el objeto
  `MensajeMidi` y el reenvío por defecto).
- La barra de herramientas pasa a ofrecer cuatro cajas: Filtrar, Desplazar,
  Emitir y Descartar.
- Queda **fuera**: otros criterios de filtrado (canal, rango de notas, número
  de controlador), filtrar mensajes de sistema uno por uno, y un parámetro de
  "varias opciones" en el panel (las casillas usan el tipo sí/no que ya existe).

## Capabilities

### New Capabilities

- `nodo-filtrar`: la caja Filtrar, sus parámetros y qué mensajes deja pasar.
- `nodo-descartar`: la caja Descartar, que cancela el reenvío sin emitir nada.

### Modified Capabilities

- `ejecucion-de-workflow`: "El flujo reemplaza al pass-through" se reemplaza
  por el reenvío por defecto; "Un error en una caja no frena el flujo" se
  reemplaza por uno que cancela todo lo de ese mensaje; "Cada caja recibe,
  procesa y pasa el mensaje" dice cuándo se cancela el reenvío, y "El log
  sigue mostrando lo que entra" suma el caso del error.
- `tipos-de-nodo`: la función de procesamiento recibe y devuelve el objeto
  `MensajeMidi`, que expone su tipo y su canal; las cajas de fin cancelan el
  reenvío; los tipos de esta versión pasan a ser cuatro; la guía cambia de
  ejemplo.
- `editor-de-workflow`: la barra de herramientas ofrece Filtrar, Desplazar,
  Emitir y Descartar.
- `log-de-mensajes`: se agrega la marca de error; "Lo que no sale se marca
  como descartado" cambia sus escenarios (un lienzo con solo el trigger ya no
  descarta nada) y aclara que un error no es un descarte; "Los colores
  separan lo que salió de lo que solo entró" suma el rojo del error; "El log
  muestra los mensajes que entran…" y "Cada fila muestra hora, bytes y
  descripción" nombran la marca nueva.

## Impact

- `src/workflow/tipos.ts` (con un test nuevo, `tipos.test.ts`): la clase
  `MensajeMidi`, con los bytes, el tipo y el canal.
- `src/workflow/ejecutar.ts`: registra si se llegó a una caja de fin, corta
  el recorrido ante el primer error, y devuelve el resultado del mensaje
  (salidas o error) en vez de solo la lista de salidas; las copias por rama
  pasan a ser copias del objeto. `ejecutar.test.ts` cambia los casos que hoy
  esperan que no salga nada y los de errores.
- `src/describir.ts` y su test: usan el tipo y el canal del objeto en vez de
  leer el status a mano.
- `src/log.ts` y su test: reciben y comparan objetos `MensajeMidi` en vez de
  listas, y suman el estado de error con su marca.
- `src/styles.css`: colores del error en modo claro y oscuro.
- `src/workflow/salida.ts`: envía los bytes del objeto al backend. El backend
  y el evento `mensaje-midi` no cambian: siguen siendo bytes.
- `src/workflow/nodos/`: `filtrar.ts` y `descartar.ts` nuevos, con sus tests;
  `desplazar.ts`, `emitir.ts` y sus tests se adaptan al objeto; `LEEME.md`
  cambia de ejemplo y explica el nuevo contrato.
- `src/workflow/catalogo.ts` y `catalogo.test.ts`: los dos tipos nuevos.
- `README.md`: "Qué hace hoy" quedó viejo (habla de un pass-through fijo).
- Al archivar: la sección Workflow de AGENTS.md ("solo sale lo que llega a una
  caja Emitir") necesita actualizarse, con aprobación de la persona usuaria.
