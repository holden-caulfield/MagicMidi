# nodo-filtrar Specification

## Purpose
Define el nodo Filtrar, que deja seguir por el flujo solo los mensajes que
cumplen todos sus criterios: el tipo de mensaje, el canal y un rango para cada
byte de datos.

## Requirements

### Requirement: Parámetros del nodo Filtrar

Una caja **Filtrar** SHALL tener entrada y salida, y estos parámetros, en este
orden:

- **Tipos de mensaje**: autocompletar (ver la spec `tipos-de-parametro`),
  con los tipos que se pueden elegir, en este orden: "Nota On", "Nota Off",
  "Presión Polifónica", "Cambio de Control", "Cambio de Programa", "Presión de
  Canal", "Pitch Bend", "SysEx", "Cuadro de Tiempo (MTC)", "Posición de
  Canción", "Selección de Canción", "Solicitud de Afinación", "Inicio",
  "Continuar", "Detener" y "Reset del Sistema", y el texto de ayuda
  "Cualquier tipo".
- **Canales**: opciones, del "1" al "16".
- **Datos 1**: rango de 0 a 127 que no se puede invertir, para el 2.º byte.
- **Datos 2**: rango de 0 a 127 que no se puede invertir, para el 3.º byte.

El reloj MIDI y el Sensor Activo no SHALL ofrecerse, porque nunca llegan al
flujo (ver la spec `ejecucion-de-workflow`). Una caja nueva SHALL arrancar sin
tipos ni canales elegidos, y con los dos rangos de 0 a 127: así configurada,
deja pasar todo.

#### Scenario: Configuración inicial

- **WHEN** la persona usuaria agrega una caja "Filtrar" y la selecciona
- **THEN** el panel muestra, en este orden, los tipos de mensaje sin ninguno
  elegido y con el texto "Cualquier tipo", los dieciséis canales apagados, y
  los rangos "Datos 1" y "Datos 2", los dos de 0 a 127, con las perillas en
  los extremos de la barra

#### Scenario: Las dieciséis opciones de tipo

- **GIVEN** una caja "Filtrar" nueva, seleccionada
- **WHEN** la persona usuaria despliega la lista de los tipos de mensaje
- **THEN** ve las dieciséis opciones, en el orden de arriba, y ninguna para
  el reloj MIDI ni para el Sensor Activo

### Requirement: Deja pasar solo los tipos elegidos

Si hay tipos elegidos, la caja SHALL dejar pasar solo los mensajes cuyo tipo
(según la lectura del tipo de la spec `tipos-de-nodo`) sea uno de ellos. Si no
hay ninguno elegido, el tipo no SHALL restringir nada. Un mensaje de un tipo
que no se puede elegir (desconocido, o un status de sistema no definido) no
SHALL pasar cuando hay tipos elegidos.

Lo que pasa, pasa sin cambios. Descartar en Filtrar corta solo ese camino: no
cancela el reenvío del original.

#### Scenario: Solo notas

- **GIVEN** una caja "Filtrar" con "Nota On" y "Nota Off" elegidos, conectada
  a un "Emitir"
- **WHEN** recibe `90 3C 64`, `80 3C 40` y `B0 07 64`
- **THEN** pasan al "Emitir" `90 3C 64` y `80 3C 40`, y `B0 07 64` no

#### Scenario: Nota On con velocidad cero

- **GIVEN** una caja "Filtrar" con solo "Nota On" elegido
- **WHEN** recibe `90 3C 00`
- **THEN** no lo deja pasar, porque es un Nota Off

#### Scenario: Mensajes de sistema

- **GIVEN** una caja "Filtrar" con solo "Inicio" y "Detener" elegidos
- **WHEN** recibe `FA`, `FC`, `FB` y `F0 7E 7F 06 01 F7`
- **THEN** deja pasar `FA` y `FC`, y ni `FB` ni el SysEx

#### Scenario: Cualquier canal

- **GIVEN** una caja "Filtrar" con solo "Cambio de Control" elegido
- **WHEN** recibe `B0 07 64` y `BF 07 64`
- **THEN** deja pasar los dos

#### Scenario: Status de sistema no definido

- **GIVEN** una caja "Filtrar" con todos los tipos elegidos
- **WHEN** recibe `F9`
- **THEN** no lo deja pasar

#### Scenario: Nada marcado

- **GIVEN** una caja "Filtrar" nueva, conectada a un "Emitir"
- **WHEN** recibe `90 3C 64`, `B0 07 64` y `FA`
- **THEN** los tres pasan al "Emitir"

#### Scenario: Lo que no pasa se reenvía por defecto

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Desplazar" (datos 1, +12)
  → "Emitir"
- **WHEN** llega `B0 07 64`
- **THEN** sale `B0 07 64` tal como llegó

### Requirement: Deja pasar solo los canales elegidos

Si hay canales elegidos, la caja SHALL dejar pasar solo los mensajes cuyo
canal (según la lectura del canal de la spec `tipos-de-nodo`) sea uno de
ellos. Un mensaje sin canal (de sistema, o desconocido) no SHALL pasar cuando
hay canales elegidos. Si no hay ninguno elegido, el canal no SHALL restringir
nada.

#### Scenario: Un canal

- **GIVEN** una caja "Filtrar" con solo el canal 10 elegido
- **WHEN** recibe `99 24 64`, `90 3C 64` y `B9 07 64`
- **THEN** deja pasar `99 24 64` y `B9 07 64`, y `90 3C 64` no

#### Scenario: Varios canales

- **GIVEN** una caja "Filtrar" con los canales 1 y 2 elegidos
- **WHEN** recibe `90 3C 64`, `91 3C 64` y `92 3C 64`
- **THEN** deja pasar `90 3C 64` y `91 3C 64`, y `92 3C 64` no

#### Scenario: Un mensaje de sistema no tiene canal

- **GIVEN** una caja "Filtrar" con solo el canal 1 elegido
- **WHEN** recibe `FA`
- **THEN** no lo deja pasar

### Requirement: Deja pasar solo los datos dentro del rango

Para cada uno de los dos bytes de datos (el 2.º y el 3.º), la caja SHALL dejar
pasar solo los mensajes cuyo byte esté entre "desde" y "hasta", los dos
incluidos. Un rango de 0 a 127 no SHALL restringir nada, aunque el mensaje no
tenga ese byte. Un rango más chico SHALL dejar afuera a los mensajes que no
tienen ese byte (por ejemplo, el 3.º de un Cambio de Programa).

El rango mira el byte tal como está, sea del tipo que sea el mensaje: en un
Nota On, el 2.º es la nota y el 3.º la velocidad; en un Cambio de Control, el
número de controlador y su valor.

#### Scenario: Una zona del teclado

- **GIVEN** una caja "Filtrar" con datos 1 de 60 a 72
- **WHEN** recibe `90 3B 64`, `90 3C 64`, `90 48 64` y `90 49 64`
- **THEN** deja pasar `90 3C 64` y `90 48 64` (notas 60 y 72), y los otros
  dos no

#### Scenario: Un valor exacto

- **GIVEN** una caja "Filtrar" con "Cambio de Control" elegido y datos 1 de 7
  a 7
- **WHEN** recibe `B0 07 64` y `B0 01 64`
- **THEN** deja pasar `B0 07 64` (el CC 7), y `B0 01 64` no

#### Scenario: El rango completo no restringe

- **GIVEN** una caja "Filtrar" con datos 2 de 0 a 127
- **WHEN** recibe `C0 05` y `FA`, que no tienen 3.er byte
- **THEN** deja pasar los dos

#### Scenario: Un rango más chico pide el byte

- **GIVEN** una caja "Filtrar" con datos 2 de 0 a 100
- **WHEN** recibe `C0 05`
- **THEN** no lo deja pasar, porque no tiene 3.er byte

### Requirement: Los criterios de una caja se combinan con "y"

Un mensaje SHALL pasar la caja solo si cumple todos sus criterios a la vez:
los tipos, los canales y los dos rangos. Dentro de los tipos, y dentro de los
canales, basta con que el mensaje coincida con una de las opciones elegidas.

#### Scenario: Nota On en un canal y una zona

- **GIVEN** una caja "Filtrar" con "Nota On" elegido, el canal 1 elegido y
  datos 1 de 60 a 72
- **WHEN** recibe `90 3C 64`, `91 3C 64`, `90 30 64` y `80 3C 40`
- **THEN** deja pasar solo `90 3C 64`: `91 3C 64` es del canal 2, `90 30 64`
  está fuera de la zona y `80 3C 40` es un Nota Off

#### Scenario: Capa de velocidad

- **GIVEN** una caja "Filtrar" con "Nota On" elegido y datos 2 de 100 a 127
- **WHEN** recibe `90 3C 63`, `90 3C 64` y `90 3C 78` (velocidades 99, 100 y
  120)
- **THEN** deja pasar `90 3C 64` y `90 3C 78`, y `90 3C 63` no

### Requirement: Una alternativa entre criterios se arma con varias cajas

Para dejar pasar lo que cumple un criterio *o* el otro, la persona usuaria
SHALL poder conectar dos cajas "Filtrar" a la misma salida y llevar las dos a
la misma caja. Como cualquier mensaje que llega por dos caminos (ver la spec
`ejecucion-de-workflow`, "Las ramas son independientes"), un mensaje que pasa
los dos filtros SHALL llegar dos veces.

#### Scenario: Nota On, o cualquier cosa del canal 10

- **GIVEN** el trigger conectado a un "Filtrar" (solo "Nota On") y a otro
  "Filtrar" (solo el canal 10), y los dos conectados al mismo "Emitir"
- **WHEN** llegan `90 3C 64`, `B9 07 64` y `B0 07 64`
- **THEN** salen `90 3C 64` y `B9 07 64`, y `B0 07 64` se reenvía tal cual,
  porque no llegó a ninguna caja de fin

#### Scenario: Lo que cumple los dos llega dos veces

- **GIVEN** el mismo flujo del escenario anterior
- **WHEN** llega `99 24 64` (Nota On en el canal 10)
- **THEN** sale dos veces

### Requirement: Validación de los rangos

Si en un rango "desde" es mayor que "hasta", la caja SHALL tener un error de
configuración en ese rango: "Desde tiene que ser igual o menor que hasta", el
error del tipo de parámetro rango (ver la spec `tipos-de-parametro`). Con las
perillas no se puede llegar a ese valor, porque se frenan al tocarse, pero sí
escribiendo en los campos numéricos. Como cualquier error de configuración, se
ve en el panel y en el lienzo, y hace fallar la caja con cada mensaje que le
llega (ver las specs `editor-de-workflow` y `ejecucion-de-workflow`).

#### Scenario: Rango al revés

- **GIVEN** una caja "Filtrar" con datos 1 de 60 a 100
- **WHEN** la persona usuaria escribe 72 en el campo de la derecha y después
  80 en el de la izquierda
- **THEN** el panel muestra debajo de "Datos 1" el error "Desde tiene que ser
  igual o menor que hasta", y la caja se ve con borde rojo

#### Scenario: Un solo valor sirve

- **GIVEN** una caja "Filtrar"
- **WHEN** la persona usuaria pone datos 2 de 64 a 64
- **THEN** la caja no tiene errores
