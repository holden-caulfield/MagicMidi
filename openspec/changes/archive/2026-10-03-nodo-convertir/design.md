# Design

## Context

Ver `proposal.md` (Why) para la motivación, y la spec `nodo-convertir` para el
comportamiento. Lo que condiciona el diseño:

- **`MensajeMidi` ya sabe el tipo y el canal** (`midi/mensaje.ts`), y
  `NOMBRES_DE_TIPO` tiene los textos de todos los tipos elegibles. Un Nota On
  con velocidad 0 se lee como Nota Off.
- **Los nodos que tocan bytes no miran el tipo** (AGENTS.md): Desplazar, Fijar
  y Mapear operan sobre una posición, y lo que hay que limitar a un tipo se
  resuelve con un Filtrar antes. Convertir es, por definición, el primero que
  tiene que mirarlo.
- **Ningún nodo cambia la cantidad de bytes.** Fijar y Mapear dejan pasar sin
  cambios un mensaje que no tiene el byte elegido, en lugar de agregarlo. El
  ejecutor, el envío y el log no suponen un largo: la descripción ya cuenta
  como 0 un byte que falta.
- **No hay nodo para mover un byte de lugar.** Fijar pone constantes; nada
  copia el 2.º byte al 3.º. Así que lo que Convertir descarta se pierde, y
  dónde deja cada dato decide qué arreglos se pueden armar después.
- **Fijar funciona sobre cualquier mensaje con el byte elegido**, también de
  sistema: después de un Convertir a Posición de Canción, un Fijar de datos 2
  ajusta la posición.

## Goals / Non-Goals

**Goals:**

- Una regla general, que se pueda explicar en pocas líneas, en lugar de una
  tabla de pares escrita a mano. Los casos del pedido tienen que salir de la
  regla, no ser excepciones.
- Que el resultado sea siempre un mensaje bien formado del tipo elegido, con
  la cantidad de bytes de ese tipo.
- Que el archivo del nodo siga siendo legible para quien recién empieza, como
  los otros nodos, con su test en el estilo de `desplazar.test.ts`.

**Non-Goals:**

- Convertir a o desde SysEx o Cuadro de Tiempo (ver "Qué tipos de sistema
  entran").
- CC de 14 bits (los pares 0–31 / 32–63) o RPN/NRPN: son dos o más mensajes,
  y un nodo procesa uno por vez. Un CC es siempre un valor de 7 bits.
- Escalar el valor al convertir (por ejemplo, llevar el CC a todo el rango de
  14 bits del Pitch Bend): para cambiar rangos está Mapear, antes o después.
- Que un Nota On convertido recuerde que la nota sigue sonando, o que el Nota
  Off correspondiente se descarte solo: eso se arma con Filtrar.

## Decisions

### Los datos se ubican por su rol, no por su posición

Cada tipo describe sus bytes de datos con un rol (la tabla está en la spec,
"Cada dato va al lugar con el mismo rol"):

- **ordinal**: cuál. La nota, el controlador, el programa, la canción.
- **cardinal**: cuánto. La velocidad, la presión, el valor de un CC, o la
  parte gruesa (MSB) de un valor de 14 bits.
- **cardinal-fino**: la parte fina (LSB) de un valor de 14 bits.

En el código es una tabla por tipo con su status y la posición de cada rol
que tiene. Convertir lee del mensaje el dato de cada rol, y arma el mensaje
nuevo poniendo cada uno en su lugar, o el relleno si no lo hay.

El pedido sugería como respaldo una regla por posición ("si el destino tiene
un byte más, se rellena con 0; si tiene uno menos, se descarta el último").
Se evaluó y se descartó porque contradice los propios ejemplos del pedido y
falla en casos útiles:

| Conversión                         | Por posición             | Por rol              |
| ---------------------------------- | ------------------------ | -------------------- |
| CC → Aftertouch (`B0 01 64`)       | `D0 01` (el controlador) | `D0 64` (el valor)   |
| Poly AT → Aftertouch (`A0 3C 50`)  | `D0 3C` (la nota)        | `D0 50` (la presión) |
| Aftertouch → CC (`D0 50`)          | `B0 50 00` (CC 80 en 0)  | `B0 01 50`           |
| CC → Pitch Bend (`B0 07 40`)       | `E0 07 40` (fino = 7)    | `E0 00 40`           |

Los cinco ejemplos del pedido (Nota → PC, CC → PB, PB → CC, AT → CC, CC → AT)
salen tal cual de la regla por rol.

### Un dato nunca cambia de rol

La primera versión tenía una excepción: entre tipos de un solo dato, el dato
pasaba aunque los roles no coincidieran. Los únicos pares donde aplicaba son
los que cruzan un ordinal (Cambio de Programa, Selección de Canción) con un
cardinal (Presión de Canal, y Pitch Bend o Posición de Canción tomados a 7
bits). Ninguno tiene un uso musical:

- **cardinal → ordinal** (aftertouch o bend → programa): al apretar o mover la
  rueda llega una ráfaga de valores, y cada uno sería un cambio de programa;
  el equipo recargaría patches sin parar.
- **ordinal → cardinal** (programa → aftertouch o bend): cada cambio de
  programa dejaría la presión o la afinación clavada en un valor arbitrario.

Sin la excepción, esos pares dan un mensaje fijo (`D0 05` → `C0 00`), igual
de predecible y con una regla menos que explicar. Se sacó.

### Valores de 14 bits: Pitch Bend y Posición de Canción

Son los dos únicos tipos con un valor repartido en dos bytes (LSB primero,
MSB después). Al tener los dos roles cardinal-fino y cardinal, la regla
general ya conserva el valor completo entre ellos (`E0 35 40` → `F2 35 40`),
sin un caso aparte. Hacia o desde un tipo de 7 bits, la parte fina queda en 0
o se descarta.

La parte fina se descarta sin redondear: `E0 7F 3F` (justo debajo del centro)
da 63, no 64. Redondear con el LSB podría dar 128 en el extremo y habría que
recortarlo; truncar es lo que hace cualquier lectura a 7 bits del protocolo.

### Qué tipos de sistema entran

La primera versión dejaba afuera todos los de sistema. Revisándolos uno por
uno, la mayoría tienen usos concretos y datos con un rol claro:

| Tipo                   | Datos               | Para qué sirve convertir                                                  |
| ---------------------- | ------------------- | ------------------------------------------------------------------------- |
| Inicio, Detener, Continuar | ninguno         | Un pedal o un pad que arranca y detiene un secuenciador o una caja de ritmos. Al revés: disparar una nota o un CC (un looper, una DAW) cuando arranca el reloj. |
| Selección de Canción   | ordinal (canción)   | Los botones de programa de un teclado eligen la canción de un secuenciador, o al revés. |
| Posición de Canción    | 14 bits             | Un pedal que vuelve al principio: Convertir → Fijar (datos 2 en 0). Además, cierra el par de 14 bits con Pitch Bend. |
| Solicitud de Afinación | ninguno             | Un pedal que pide a un sinte analógico que se reafine.                     |
| Reset del Sistema      | ninguno             | Un botón de reinicio; ver Risks.                                           |
| SysEx                  | variable            | **Afuera**: el largo y el significado de cada byte dependen del fabricante; no hay roles que asignar. |
| Cuadro de Tiempo (MTC) | 1, partido en dos   | **Afuera**: el byte mezcla qué parte del tiempo es (3 bits) y su valor (4 bits); no es ni un ordinal ni un cardinal, y un cuadro suelto no significa nada sin los otros siete. |
| Reloj, Sensor Activo   | ninguno             | **Afuera**: nunca llegan al flujo, y generar reloj desde el flujo le sumaría el jitter que se evita reenviándolo directo. |

Un SysEx o un MTC que llega a la caja pasa sin cambios; tampoco se ofrecen
como destino.

El canal: entre tipos de canal se conserva; de sistema a canal no hay de
dónde sacarlo y va el 1 (como el resto de los rellenos, se cambia con un
Fijar "Canal" después); de canal a sistema se pierde.

### Los rellenos: 0, salvo tres

Lo que el destino necesita y el origen no tiene se rellena con 0, que es lo
que sugería el pedido, con tres excepciones donde el 0 cambia el significado
del mensaje:

- **Controlador = 1** (Modulación). El pedido decía, para Aftertouch → CC,
  "queda el byte 1 en 0 (por defecto CC1)", que se contradice: el log numera
  los controladores desde 0, así que un 0 sería Bank Select (MSB), que hace
  que el equipo cambie de banco. Se toma el CC 1, que además es el mismo
  default que pide Pitch Bend → CC.
- **Velocidad = 64** en Nota On y Nota Off. Con 0, un Nota On se lee como Nota
  Off; 64 es la que la especificación MIDI indica para teclados sin
  velocidad.
- **Parte gruesa del Pitch Bend = 64**. Con 0 sería el bend al mínimo; con
  64 (y la fina en 0) es el centro. Hace falta solo desde tipos sin cardinal
  (Cambio de Programa, Selección de Canción, los de sistema sin datos).

La Posición de Canción se rellena con 0 (el principio de la canción), que es
el valor útil. Se consideró rellenar la nota con 60 (Do central), pero no
cambia el significado del mensaje y sería una excepción más; con un Fijar
después se elige la nota que haga falta.

### CC → Cambio de Programa: el controlador como programa

Por la regla de roles, el número de controlador pasa a ser el programa
(`B0 14 7F` → `C0 14`), y el valor se descarta. Sirve tal cual para el caso
más común de controladores con botones (Launch Control, controladores de pie
con varios switches): cada botón manda un CC distinto, así que con un solo
Filtrar (datos 2 desde 64, para quedarse con el apretar) y un Convertir, cada
botón elige su programa, igual que los pads con notas. Para un solo pedal,
un Fijar después elige el programa.

La alternativa era una excepción que usara el valor como programa, para que
una perilla o un pedal de expresión recorran los patches. Se descartó: al
moverlos llega una ráfaga de valores y cada uno recarga un patch, que es lo
que se evita en vivo; y rompería la regla en un solo par.

### Un solo parámetro: el tipo de destino

No hay parámetro de origen ("convertir de X a Y"). Elegir a qué mensajes se
aplica una caja es trabajo de Filtrar, como en los demás nodos, y el ejecutor
ya deja salir tal cual lo que no llega a una caja de fin (ver los escenarios
de "Convertir solo algunos tipos con un Filtrar"). Tampoco hay parámetros para
el controlador o el programa de destino: los pone un Fijar.

Alternativa descartada: un parámetro "De" con "Cualquier tipo" por defecto.
Ahorra una caja en el caso común, pero duplica lo que hace Filtrar y no se
compone con sus otros criterios (canal, rangos).

### Qué pasa sin cambios

- **Mensaje que ya es del tipo elegido**, según `mensaje.tipo`. Un `90 3C 00`
  con destino Nota Off pasa igual, sin normalizarlo a `80 3C 00`: ya se lee
  como Nota Off en todos lados.
- **SysEx, MTC, no definido o desconocido** (ver "Qué tipos de sistema
  entran").
- **Un Nota Off con velocidad 0 convertido a Nota On** sigue leyéndose como
  Nota Off (`90 3C 00`). Se deja así: es coherente con la regla, y quien
  quiera un Nota On real pone un Fijar de velocidad después.

Un mensaje incompleto (un `D0` sin dato) se convierte contando como 0 los
bytes que faltan, igual que lo lee `MensajeMidi` y lo describe el log.

### Todas las combinaciones

Con `o` = ordinal, `c` = cardinal y `f` = cardinal-fino del origen, en
hexadecimal; las filas son el origen y las columnas el destino, con los bytes
de datos que salen ("—": ninguno). Un mensaje que ya es del tipo elegido pasa
sin cambios.

| Origen ↓ / Destino →         | Nota On/Off | Poly AT | CC      | PC   | Ch AT | Pitch Bend | Pos. Canción | Sel. Canción | Sin datos¹ |
| ---------------------------- | ----------- | ------- | ------- | ---- | ----- | ---------- | ------------ | ------------ | ---------- |
| Nota On/Off, Poly AT, CC `o c` | `o c`     | `o c`   | `o c`   | `o`  | `c`   | `00 c`     | `00 c`       | `o`          | —          |
| PC, Sel. Canción `o`         | `o 40`      | `o 00`  | `o 00`  | `o`  | `00`  | `00 40`    | `00 00`      | `o`          | —          |
| Ch AT `c`                    | `00 c`      | `00 c`  | `01 c`  | `00` | `c`   | `00 c`     | `00 c`       | `00`         | —          |
| Pitch Bend, Pos. Canción `f c` | `00 c`    | `00 c`  | `01 c`  | `00` | `c`   | `f c`      | `f c`        | `00`         | —          |
| Sin datos¹                   | `00 40`     | `00 00` | `01 00` | `00` | `00`  | `00 40`    | `00 00`      | `00`         | —          |

¹ Solicitud de Afinación, Inicio, Continuar, Detener y Reset del Sistema.

Las combinaciones raras (velocidad → bend, Pitch Bend → Nota) dan un mensaje
bien formado y predecible, aunque no tengan un uso obvio.

### Ícono y lugar en la barra

El ícono es `RefreshCw` de Lucide: dos flechas en círculo, "convertir" sin
parecerse al `ArrowUpDown` de Desplazar. La barra queda Filtrar, Convertir,
Fijar, Desplazar, Mapear, Emitir y Descartar: Convertir va justo después de
Filtrar, porque en los flujos de la spec es lo que sigue, y antes de los
nodos que ajustan bytes (que suelen ir después, como el Fijar que elige el
controlador o el programa).

## Risks / Trade-offs

- [Un pad que manda Nota On y Nota Off genera dos mensajes convertidos] →
  La spec muestra los flujos con un Filtrar antes (solo Nota On, o datos 2
  desde 64 para un CC). Sin él, a Cambio de Programa es redundante, pero a
  Inicio o Detener puede arrancar y volver a arrancar: la guía lo avisa.
- [Un Reset del Sistema por un toque accidental reinicia los equipos] → Se
  ofrece igual, porque se elige a propósito y no tiene otro camino en la
  aplicación; queda último en la lista y el log muestra cada uno que sale.
- [CC 1 como default puede no ser el que la persona espera] → Es el de la
  rueda de modulación, el destino más común; un Fijar después lo cambia, y el
  log muestra el controlador que sale.
- [De sistema a canal siempre va el canal 1] → Es el mismo criterio que los
  demás rellenos; un Fijar "Canal" después lo cambia.
- [Romper la regla "los nodos no miran el tipo" de AGENTS.md] → Convertir la
  rompe porque su trabajo es ese; los demás nodos la siguen cumpliendo. Al
  archivar se propone reescribir esa frase para acotarla a Desplazar, Fijar y
  Mapear.
- [Un nodo que cambia el largo del mensaje] → Se revisa en las tareas que el
  log de salida describa bien un mensaje que llegó con tres bytes y sale con
  uno, dos o tres.
