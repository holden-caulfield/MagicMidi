# Proposal

## Why

Si se cambia una caja con una tecla apretada (un Desplazar de +12 a +7, por
ejemplo), el Nota Off sale con la configuración nueva y apaga otra nota: la
que prendió el Nota On queda colgada. Lo mismo pasa con cualquier flujo que
filtra solo los Nota On, porque el Nota Off sale tal cual, a la nota y el
canal originales. Hoy la única forma de evitarlo es pasar también el Nota Off
por el flujo, y ni así alcanza si el flujo cambió en el medio. Es además lo
que necesitan la caja Alternar (para el round-robin de notas) y la idea
"Probabilidad" del roadmap.

## What Changes

- **El Nota Off apaga lo que prendió su Nota On.** La regla "un mensaje que
  no llega a ninguna caja de fin sale tal cual" suma una excepción: un Nota
  Off (también un Nota On con velocidad 0) que no llega a ninguna caja de fin
  sale como un Nota Off por cada Nota On que salió a partir de su Nota On, con
  el canal y la nota de cada uno y la velocidad de soltar del Nota Off que
  entró.
- **Lo hace el ejecutor, no una caja.** Es el mismo lugar donde vive hoy la
  regla de "sale tal cual", y ninguna caja sabe que existe.
- **Manejar el Nota Off en el flujo es tomar el control.** Si el Nota Off
  llega a al menos una caja de fin, por cualquier camino, sale lo que
  devuelvan esas cajas, sin apareo. El comportamiento de hoy se sigue
  pudiendo armar con `Filtrar (Nota Off) → Emitir`, así que no hace falta una
  opción de configuración.
- **Qué se anota:** por cada Nota On que entra, los Nota On que salieron a
  partir de él (canal y nota de cada uno), bajo su canal y su nota. Pueden ser
  ninguno, uno o varios. Si se aprieta la misma nota dos veces antes de
  soltarla, cada Nota Off saca la anotación más vieja.
- **Casos de borde:** sin nada anotado (el Nota On llegó antes de conectar),
  el Nota Off sale tal cual, como hoy. Si el Nota On no hizo salir ninguna
  nota (lo descartó el flujo, o salió convertido en otra cosa), el Nota Off
  tampoco sale. **BREAKING** para un flujo que filtra solo los Nota On hacia
  un Descartar o un Convertir: hasta ahora su Nota Off salía tal cual, y deja
  de salir.
- **Cuándo se olvida lo anotado:** cuando no hay conexión. Una conexión nueva
  arranca la ejecución desde cero. El pánico no olvida, por ningún acceso: una
  tecla que sigue apretada después del pánico, al soltarse, tiene que apagar
  lo que prendió y no salir tal cual. Al editar el flujo tampoco se olvida:
  es justamente lo que evita las notas colgadas al editar en vivo.
- **Límite:** solo se aparea lo que entra como nota. Las notas que salen de
  otra cosa (un CC convertido en Nota On y Nota Off) quedan como hoy.
- **En el log:** cuando el apareo cambió lo que sale, el Nota Off se ve con
  una marca propia en la fila de entrada, y lo que salió por el apareo va en
  sub-filas, como una transformación del flujo, con un fondo de un tono
  distinto. Si salió igual que entró, se ve como "salió sin cambios".

## Capabilities

### New Capabilities

- `apareo-de-nota-off`: cuándo se aparea un Nota Off, qué se anota de cada
  Nota On, qué sale, y cuándo se olvida lo anotado.

### Modified Capabilities

- `ejecucion-de-workflow`: la regla de "sale tal cual" tiene la excepción del
  Nota Off.
- `log-de-mensajes`: un Nota Off cuyo apareo cambió lo que sale tiene su
  marca, sus sub-filas y su color; uno que no prendió ninguna nota no se
  muestra como "descartado".
- `nodo-convertir`: el pad que cambia de programa ya no deja salir su Nota Off
  al soltarlo, porque su Nota On no prendió ninguna nota.

## Impact

- Código nuevo: `src/workflow/notas-prendidas.ts`, lo anotado (estado propio
  del módulo `workflow`, fuera del store, como el registro del log) y cómo se
  aparea, con su test.
- Código que cambia:
  - `workflow/ejecutar.ts`: `procesarMensaje` anota cada Nota On, aparea el
    Nota Off que no llegó a una caja de fin y avisa si apareó;
  - `main.ts`: engancha el olvido de lo anotado a los avisos del store,
    mientras no hay conexión;
  - `log/log.ts` y `log/panel-log.ts`: el resultado "apareado", su marca y sus
    sub-filas;
  - `estilos/global.css`: el fondo de las sub-filas del apareo, en modo claro
    y oscuro.
- Sin cambios en el backend ni en los tipos de nodo.
- La huella de la interfaz no cambia fuera del log apareado.
- Documentación: `README.md` (qué sale por el puerto) y la sección "Qué sale
  por el puerto" de `nodos/LEEME.md`, con el caso de la octava mal armada. Al
  archivar, se propondrá ajustar en AGENTS.md la regla del ejecutor ("sale tal
  cual"), que `procesarMensaje` deja de ser puro (anota y aparea), y una regla
  común para el log y lo anotado: lo que cambia con cada mensaje MIDI no va al
  store, es estado del módulo que lo usa.
- Roadmap: resuelve "Evitar notas colgadas al editar en vivo", y hay que
  actualizar las recetas que hoy filtran Nota On y Nota Off juntos (acorde,
  espejo de teclado).
