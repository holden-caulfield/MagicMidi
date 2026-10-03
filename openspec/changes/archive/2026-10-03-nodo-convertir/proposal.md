# Proposal

## Why

Hay arreglos muy comunes que piden cambiar el **tipo** de un mensaje, y hoy no
se pueden armar sin escribir un nodo propio: llevar el aftertouch a un CC para
un sinte que no responde a la presión, usar una perilla (CC) como pitch bend o
el pitch bend como un CC (de 14 a 7 bits), cambiar de patch en vivo con un pad
o un pedal que solo manda notas (Nota → Cambio de Programa), o arrancar y
detener un secuenciador con un pedal. Fijar no alcanza: cambia valores, pero
no sabe que cada tipo tiene sus bytes de datos en otro lugar, ni cuántos.

## What Changes

- Nuevo tipo de nodo **Convertir**, con entrada y salida y un solo parámetro,
  **Convertir a**: uno de los siete tipos de canal o de los siete tipos de
  sistema cuyos datos tienen un rol fijo (Posición de Canción, Selección de
  Canción, Solicitud de Afinación, Inicio, Continuar, Detener y Reset del
  Sistema). Quedan afuera SysEx y Cuadro de Tiempo (MTC). Una caja nueva
  arranca en Cambio de Control.
- Convertir cambia el status y reacomoda los bytes de datos con una regla
  general, en lugar de un caso por cada par de tipos:
  - cada byte de datos tiene un **rol**: **ordinal** (cuál: la nota, el
    controlador, el programa, la canción), **cardinal** (cuánto: velocidad,
    presión, valor de un CC, la parte gruesa de un valor de 14 bits) o
    **cardinal-fino** (la parte fina de un valor de 14 bits). Cada dato pasa
    al lugar de su mismo rol; un dato cuyo rol no existe en el destino se
    descarta. Un dato nunca cambia de rol;
  - entre Pitch Bend y Posición de Canción, los dos tipos de 14 bits, pasan
    las dos partes y se conserva el valor completo;
  - lo que el destino necesita y el origen no tiene se rellena con 0, salvo el
    controlador (1, Modulación: el 0 es Bank Select), la velocidad de las
    notas (64: con 0, un Nota On sería un Nota Off) y la parte gruesa del
    Pitch Bend (64, el centro);
  - el canal se conserva entre tipos de canal; de sistema a canal, va el 1.
- Un mensaje que ya es del tipo elegido, un SysEx, un MTC, o uno no definido o
  desconocido pasa sin cambios. Para convertir solo algunos mensajes, se pone
  antes un Filtrar: lo que no llega a una caja de fin sale tal cual.
- Es el primer nodo que **cambia la cantidad de bytes** de un mensaje.
- La barra ofrece siete cajas, en este orden: Filtrar, **Convertir**, Fijar,
  Desplazar, Mapear, Emitir y Descartar. Desplazar pasa a ir después de
  Fijar.
- El ícono es `RefreshCw` de Lucide.

## Capabilities

### New Capabilities

- `nodo-convertir`: parámetro, regla de conversión por roles, valores de 14
  bits, rellenos, canal, mensajes que pasan sin cambios y los arreglos que
  motivan el nodo.

### Modified Capabilities

- `tipos-de-nodo`: los tipos de esta versión pasan a ser siete.
- `editor-de-workflow`: la barra ofrece siete cajas, en el orden nuevo, y
  Convertir queda en el medio del flujo.

## Impact

- Código nuevo: `src/workflow/nodos/convertir.ts` y `convertir.test.ts`.
- Código que cambia: `nodos/catalogo.ts` (la entrada nueva y el orden). Usa
  `NOMBRES_DE_TIPO` de `src/midi/mensaje.ts` para los textos de las opciones,
  sin cambiar ese módulo.
- Documentación: la sección "Qué hace hoy" de `README.md` y
  `nodos/LEEME.md`. Al archivar, se propondrá ajustar en AGENTS.md la frase
  "Tampoco miran el tipo de mensaje" de los nodos que tocan bytes, porque
  Convertir sí lo mira.
- Sin cambios en el backend, el ejecutor ni el log: ya manejan mensajes de
  cualquier largo.
