# nodo-convertir Specification

## Purpose
Define el nodo Convertir, que cambia el tipo de un mensaje por otro y
reacomoda sus bytes de datos según el rol de cada uno en el protocolo. Es la
base de arreglos como llevar el aftertouch a un CC, usar un CC como pitch bend
(o al revés), cambiar de programa con un pad que manda notas o arrancar y
detener un secuenciador con un pedal.

## Requirements

### Requirement: Parámetro del nodo Convertir

Una caja **Convertir** SHALL tener entrada y salida, y un solo parámetro:

- **Convertir a**: una lista con estos tipos, en este orden: "Nota On", "Nota
  Off", "Presión Polifónica", "Cambio de Control", "Cambio de Programa",
  "Presión de Canal", "Pitch Bend", "Posición de Canción", "Selección de
  Canción", "Solicitud de Afinación", "Inicio", "Continuar", "Detener" y
  "Reset del Sistema".

No SHALL ofrecerse SysEx ni Cuadro de Tiempo (MTC), cuyos bytes de datos no
tienen un rol fijo, ni el reloj MIDI ni el Sensor Activo, que nunca llegan al
flujo.

Una caja nueva SHALL arrancar en "Cambio de Control", sin errores.

#### Scenario: Configuración inicial

- **WHEN** la persona usuaria agrega una caja "Convertir" y la selecciona
- **THEN** el panel muestra "Convertir a" con "Cambio de Control" elegido, sin
  errores

#### Scenario: Las catorce opciones

- **GIVEN** una caja "Convertir" seleccionada
- **WHEN** la persona usuaria despliega "Convertir a"
- **THEN** ve las catorce opciones, en el orden de arriba, y ninguna para
  SysEx, Cuadro de Tiempo, el reloj MIDI ni el Sensor Activo

### Requirement: Convierte el tipo, con el canal que corresponde

Un mensaje que se convierte SHALL salir con el status del tipo elegido y con
la cantidad de bytes de ese tipo: tres para Nota On, Nota Off, Presión
Polifónica, Cambio de Control, Pitch Bend y Posición de Canción; dos para
Cambio de Programa, Presión de Canal y Selección de Canción; uno para
Solicitud de Afinación, Inicio, Continuar, Detener y Reset del Sistema.

El canal SHALL ser:

- el mismo con el que llegó, si el mensaje recibido y el tipo elegido son de
  canal;
- el canal 1, si el mensaje recibido es de sistema y el tipo elegido es de
  canal (con un Fijar "Canal" después se elige otro);
- ninguno, si el tipo elegido es de sistema.

#### Scenario: El canal no cambia

- **GIVEN** "Convertir a" en "Cambio de Control"
- **WHEN** recibe `D2 50` (Presión de Canal, canal 3)
- **THEN** emite un mensaje de tres bytes que empieza con `B2` (Cambio de
  Control, canal 3)

#### Scenario: De tres bytes a dos

- **GIVEN** "Convertir a" en "Cambio de Programa"
- **WHEN** recibe `90 3C 64`
- **THEN** emite un mensaje de dos bytes

#### Scenario: De sistema a canal

- **GIVEN** "Convertir a" en "Nota On"
- **WHEN** recibe `FA` (Inicio)
- **THEN** emite `90 00 40` (canal 1, nota 0, velocidad 64)

#### Scenario: De canal a sistema

- **GIVEN** "Convertir a" en "Inicio"
- **WHEN** recibe `99 24 64` (Nota On, canal 10)
- **THEN** emite `FA`

### Requirement: Cada dato va al lugar con el mismo rol

Cada byte de datos SHALL tener uno de estos roles: **ordinal** (cuál: qué
nota, qué controlador, qué programa, qué canción), **cardinal** (cuánto:
velocidad, presión, valor de un CC, o la parte gruesa de un valor de 14 bits)
o **cardinal-fino** (la parte fina de un valor de 14 bits):

| Tipo                    | 2.º byte (datos 1)          | 3.º byte (datos 2)         |
| ----------------------- | --------------------------- | -------------------------- |
| Nota On / Nota Off      | ordinal (la nota)           | cardinal (la velocidad)    |
| Presión Polifónica      | ordinal (la nota)           | cardinal (la presión)      |
| Cambio de Control       | ordinal (el controlador)    | cardinal (el valor)        |
| Cambio de Programa      | ordinal (el programa)       | —                          |
| Presión de Canal        | cardinal (la presión)       | —                          |
| Pitch Bend              | cardinal-fino (LSB)         | cardinal (MSB)             |
| Posición de Canción     | cardinal-fino (LSB)         | cardinal (MSB)             |
| Selección de Canción    | ordinal (la canción)        | —                          |
| Solicitud de Afinación, Inicio, Continuar, Detener, Reset | — | —                  |

Al convertir, el dato de cada rol del mensaje recibido SHALL pasar al lugar de
ese mismo rol en el tipo elegido. Un dato cuyo rol no existe en el tipo
elegido SHALL descartarse, aunque al tipo elegido le quede un lugar de otro
rol sin llenar: un dato nunca cambia de rol.

Entre Pitch Bend y Posición de Canción, los únicos tipos con un valor de 14
bits, pasan las dos partes, y el valor completo se conserva. Desde uno de ellos
a un tipo de 7 bits, la parte fina SHALL descartarse sin redondear; hacia uno
de ellos desde un tipo de 7 bits, SHALL quedar en 0 (ver "Lo que falta se
rellena").

#### Scenario: Nota a Cambio de Programa

- **GIVEN** "Convertir a" en "Cambio de Programa"
- **WHEN** recibe `90 3C 64` (Nota On, nota 60, velocidad 100)
- **THEN** emite `C0 3C` (programa 60), y la velocidad se descarta

#### Scenario: Cambio de Control a Cambio de Programa

- **GIVEN** "Convertir a" en "Cambio de Programa"
- **WHEN** recibe `B0 14 7F` y `B0 15 7F` (dos botones, controladores 20 y 21)
- **THEN** emite `C0 14` y `C0 15` (programas 20 y 21)

#### Scenario: Cambio de Control a Presión de Canal

- **GIVEN** "Convertir a" en "Presión de Canal"
- **WHEN** recibe `B0 01 64` (controlador 1, valor 100)
- **THEN** emite `D0 64` (presión 100), y el número de controlador se descarta

#### Scenario: Presión Polifónica a Presión de Canal

- **GIVEN** "Convertir a" en "Presión de Canal"
- **WHEN** recibe `A0 3C 50` (nota 60, presión 80)
- **THEN** emite `D0 50` (presión 80)

#### Scenario: Notas a Cambio de Control

- **GIVEN** "Convertir a" en "Cambio de Control"
- **WHEN** recibe `90 24 7F` (nota 36, velocidad 127)
- **THEN** emite `B0 24 7F` (controlador 36, valor 127)

#### Scenario: Un pedal que manda CC como notas

- **GIVEN** "Convertir a" en "Nota On"
- **WHEN** recibe `B0 40 7F` y `B0 40 00` (el pedal de sustain, apretado y
  suelto)
- **THEN** emite `90 40 7F` (Nota On) y `90 40 00`, que se lee como Nota Off

#### Scenario: Cambio de Programa a Selección de Canción

- **GIVEN** "Convertir a" en "Selección de Canción"
- **WHEN** recibe `C3 07` (programa 7, canal 4)
- **THEN** emite `F3 07` (canción 7)

#### Scenario: Cambio de Control a Pitch Bend

- **GIVEN** "Convertir a" en "Pitch Bend"
- **WHEN** recibe `B0 07 40` y `B0 07 7F`
- **THEN** emite `E0 00 40` (el centro) y `E0 00 7F`

#### Scenario: Pitch Bend a Cambio de Control

- **GIVEN** "Convertir a" en "Cambio de Control"
- **WHEN** recibe `E0 35 40` y `E0 7F 7F`
- **THEN** emite `B0 01 40` y `B0 01 7F`: la parte fina se pierde y el
  controlador es el 1 (ver "Lo que falta se rellena")

#### Scenario: Pitch Bend a Posición de Canción conserva los 14 bits

- **GIVEN** "Convertir a" en "Posición de Canción"
- **WHEN** recibe `E0 35 40`
- **THEN** emite `F2 35 40`, con las dos partes

#### Scenario: Un dato no cambia de rol

- **GIVEN** "Convertir a" en "Cambio de Programa"
- **WHEN** recibe `D0 05` (Presión de Canal, presión 5)
- **THEN** emite `C0 00`: la presión es cardinal, el programa es ordinal, y el
  programa se rellena

### Requirement: Lo que falta se rellena

Un lugar del tipo elegido que no recibe ningún dato del mensaje original SHALL
rellenarse con 0, salvo:

- el **controlador** de un Cambio de Control, que SHALL ser 1 (Modulación),
  porque el 0 es Bank Select y cambiaría el banco del equipo;
- la **velocidad** de un Nota On o un Nota Off, que SHALL ser 64, la que el
  protocolo indica para quien no mide velocidad: con 0, un Nota On se leería
  como Nota Off;
- la **parte gruesa** de un Pitch Bend, que SHALL ser 64: con la parte fina en
  0, es el centro, sin desafinar.

Un byte de datos que falta en el mensaje recibido (un mensaje incompleto)
SHALL contar como 0.

Para elegir otro número (otro controlador, otro programa, otra nota) u otro
valor, se SHALL poder poner un Fijar después de la caja, sin que Convertir
tenga parámetros para eso.

#### Scenario: Aftertouch a Cambio de Control

- **GIVEN** "Convertir a" en "Cambio de Control"
- **WHEN** recibe `D0 50` (Presión de Canal, presión 80)
- **THEN** emite `B0 01 50` (controlador 1, valor 80)

#### Scenario: Cambio de Programa a Nota On

- **GIVEN** "Convertir a" en "Nota On"
- **WHEN** recibe `C0 3C` (programa 60)
- **THEN** emite `90 3C 40` (nota 60, velocidad 64)

#### Scenario: Cambio de Programa a Cambio de Control

- **GIVEN** "Convertir a" en "Cambio de Control"
- **WHEN** recibe `C0 05`
- **THEN** emite `B0 05 00` (controlador 5, valor 0)

#### Scenario: Cambio de Programa a Pitch Bend

- **GIVEN** "Convertir a" en "Pitch Bend"
- **WHEN** recibe `C0 05`
- **THEN** emite `E0 00 40` (el centro)

#### Scenario: Presión de Canal a Nota On

- **GIVEN** "Convertir a" en "Nota On"
- **WHEN** recibe `D0 50`
- **THEN** emite `90 00 50` (nota 0, velocidad 80)

#### Scenario: Mensaje incompleto

- **GIVEN** "Convertir a" en "Cambio de Control"
- **WHEN** recibe `D0`, sin byte de datos
- **THEN** emite `B0 01 00`

#### Scenario: Otro controlador con un Fijar

- **GIVEN** trigger → "Convertir" (a "Cambio de Control") → "Fijar" (datos 1,
  valor 74) → "Emitir"
- **WHEN** llega `D0 50`
- **THEN** sale `B0 4A 50` (controlador 74, valor 80)

### Requirement: Lo que no hay que convertir pasa sin cambios

La caja SHALL pasar sin cambios, a las cajas siguientes:

- un mensaje cuyo tipo (según la lectura del tipo de la spec `tipos-de-nodo`)
  ya es el elegido;
- un SysEx o un Cuadro de Tiempo (MTC);
- un mensaje de un status de sistema no definido, o desconocido.

Como el tipo sale de esa lectura, un Nota On con velocidad 0 cuenta como Nota
Off; y un Nota Off con velocidad 0 convertido a Nota On sigue leyéndose como
Nota Off.

#### Scenario: Ya es del tipo elegido

- **GIVEN** "Convertir a" en "Cambio de Control"
- **WHEN** recibe `B0 07 64`
- **THEN** emite `B0 07 64`

#### Scenario: SysEx y Cuadro de Tiempo

- **GIVEN** "Convertir a" en "Cambio de Control"
- **WHEN** recibe `F0 7E 7F 06 01 F7` y `F1 23`
- **THEN** emite `F0 7E 7F 06 01 F7` y `F1 23`

#### Scenario: Nota On con velocidad cero

- **GIVEN** "Convertir a" en "Nota Off"
- **WHEN** recibe `90 3C 00`
- **THEN** emite `90 3C 00`, porque ya es un Nota Off

#### Scenario: Nota Off con velocidad cero a Nota On

- **GIVEN** "Convertir a" en "Nota On"
- **WHEN** recibe `80 3C 00`
- **THEN** emite `90 3C 00`, que se lee como Nota Off

### Requirement: Convertir solo algunos tipos con un Filtrar

Convertir no SHALL tener un parámetro para elegir el tipo de origen: para
convertir solo algunos tipos, o solo algunos mensajes, se pone antes un
Filtrar. Lo que el Filtrar no deja pasar no llega a ninguna caja de fin y sale
tal cual (ver la spec `ejecucion-de-workflow`).

#### Scenario: Aftertouch a CC sin tocar las notas

- **GIVEN** trigger → "Filtrar" (solo "Presión de Canal") → "Convertir" (a
  "Cambio de Control") → "Emitir"
- **WHEN** llegan `90 3C 64` y `D0 50`
- **THEN** sale `90 3C 64` tal como llegó, y `D0 50` sale como `B0 01 50`

#### Scenario: Cambiar de programa con un pad

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Convertir" (a "Cambio de
  Programa") → "Emitir"
- **WHEN** el pad manda `99 24 64` al apretarlo y `89 24 40` al soltarlo
- **THEN** sale `C9 24` una sola vez, y `89 24 40` sale tal como llegó

#### Scenario: Siempre el mismo programa

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Convertir" (a "Cambio de
  Programa") → "Fijar" (datos 1, valor 5) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** sale `C0 05`

#### Scenario: Una fila de botones elige programas

- **GIVEN** trigger → "Filtrar" (solo "Cambio de Control", datos 2 desde 64)
  → "Convertir" (a "Cambio de Programa") → "Emitir"
- **WHEN** un botón manda `B0 14 7F` al apretarlo y `B0 14 00` al soltarlo
- **THEN** sale `C0 14` una sola vez, y `B0 14 00` sale tal como llegó

#### Scenario: Arrancar un secuenciador con un pedal

- **GIVEN** trigger → "Filtrar" (solo "Cambio de Control", datos 2 desde 64)
  → "Convertir" (a "Inicio") → "Emitir"
- **WHEN** el pedal manda `B0 50 7F` al apretarlo y `B0 50 00` al soltarlo
- **THEN** sale `FA` una sola vez, y `B0 50 00` sale tal como llegó
