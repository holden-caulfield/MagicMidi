# Spec Delta

## Purpose

Define el nodo Alternar, que pone una parte del mensaje MIDI (el canal o un
byte de datos) en el siguiente valor de una lista, recordando por dónde va. Es
la base de arreglos como usar un pedal momentáneo como interruptor, repartir
las notas entre canales por turno o acentuar una nota de cada cuatro.

## ADDED Requirements

### Requirement: Parámetros del nodo Alternar

Una caja **Alternar** SHALL tener entrada y salida, y tres parámetros:

- **Byte**: qué parte del mensaje cambia. Las opciones son "Canal", "2.º
  (datos 1)" y "3.º (datos 2)", como en Fijar.
- **Valores**: una secuencia de números enteros de 0 a 127 (ver la spec
  `tipos-de-parametro`, "El parámetro secuencia"), los valores que va tomando
  lo elegido, en orden. Ofrece los tres modos, en el orden por defecto
  (decimal, nota y hexadecimal). Con "Canal", cada valor SHALL ir de 1 a 16:
  si alguno no cumple, la caja SHALL tener un error asociado a "Valores" que
  nombra el primero que no cumple, escrito como lo muestra el campo.
- **Un ciclo por**: varias opciones entre "Canal", "Datos 1" y "Datos 2",
  que separan los ciclos (ver "Un ciclo por cada combinación"). Puede no
  tener ninguna elegida.

Una caja nueva SHALL arrancar con byte "3.º (datos 2)", valores 127 y 0, y
ninguna opción elegida en "Un ciclo por", sin errores.

#### Scenario: Configuración inicial

- **WHEN** la persona usuaria agrega una caja "Alternar" y la selecciona
- **THEN** el panel muestra byte "3.º (datos 2)", los valores 127 y 0 en modo
  decimal y ninguna opción elegida en "Un ciclo por", sin errores

#### Scenario: Canal fuera de rango

- **GIVEN** una caja "Alternar" con valores 127 y 0
- **WHEN** la persona usuaria elige el byte "Canal"
- **THEN** el panel muestra debajo de "Valores" "Con Canal, los valores
  tienen que ir de 1 a 16, y hay un 127", y la caja se ve con borde rojo

#### Scenario: Canal fuera de rango en hexadecimal

- **GIVEN** una caja "Alternar" con valores 127 y 0, en modo hexadecimal
- **WHEN** la persona usuaria elige el byte "Canal"
- **THEN** el panel muestra debajo de "Valores" "Con Canal, los valores
  tienen que ir de 01 a 10, y hay un 7F"

#### Scenario: Corregir los canales

- **GIVEN** una caja "Alternar" con byte "Canal", valores 127 y 0, y el error
  a la vista
- **WHEN** la persona usuaria cambia los valores a 1 y 2
- **THEN** el error desaparece del panel y la caja deja de verse con borde
  rojo

### Requirement: Cada mensaje toma el siguiente valor de la lista

Cada mensaje que llega a la caja SHALL salir con lo elegido en "Byte" puesto
en el siguiente valor de la lista: el primero, con el primer valor; cada uno
de los que siguen, con el valor que sigue al del anterior; y después del
último valor, otra vez con el primero.

Con un byte de datos elegido, la caja SHALL cambiar solo ese byte. Con
"Canal", el valor SHALL tomarse como un número de canal, de 1 a 16, y la caja
SHALL cambiar solo el canal del status, como Fijar. El tipo de mensaje, los
demás bytes y la cantidad de bytes SHALL quedar igual.

La caja nunca SHALL descartar un mensaje: siempre lo devuelve, cambiado o no.
Lo que haya que descartar se arma con Filtrar y Descartar.

#### Scenario: Pedal momentáneo como interruptor

- **GIVEN** byte "3.º (datos 2)", valores 127 y 0
- **WHEN** recibe tres veces `B0 40 7F` (pedal de sustain apretado)
- **THEN** emite `B0 40 7F`, después `B0 40 00`, y después otra vez `B0 40 7F`

#### Scenario: Notas repartidas entre canales

- **GIVEN** byte "Canal", valores 1, 2 y 3
- **WHEN** recibe `90 3C 64`, `90 3E 64`, `90 40 64` y `90 41 64`
- **THEN** emite `90 3C 64`, `91 3E 64`, `92 40 64` y `90 41 64`

#### Scenario: El latch armado en el flujo

- **GIVEN** la salida del trigger va a "Filtrar" ("Cambio de Control", datos 1
  de 64 a 64, datos 2 de 64 a 127) → "Alternar" (datos 2, valores 127 y 0) →
  "Emitir", y a "Filtrar" ("Cambio de Control", datos 1 de 64 a 64, datos 2
  de 0 a 63) → "Descartar"
- **WHEN** el pedal se aprieta y se suelta dos veces: llegan `B0 40 7F`,
  `B0 40 00`, `B0 40 7F` y `B0 40 00`
- **THEN** sale `B0 40 7F` por la primera pisada y `B0 40 00` por la segunda,
  y por las soltadas no sale nada

#### Scenario: Un pad como interruptor

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Convertir" (a "Cambio de
  Control") → "Alternar" (datos 2, valores 127 y 0) → "Emitir"
- **WHEN** el pad se aprieta y se suelta dos veces: llegan `90 24 64`,
  `80 24 40`, `90 24 64` y `80 24 40`
- **THEN** sale `B0 24 7F` por el primer Nota On y `B0 24 00` por el segundo,
  y por los Nota Off no sale nada, porque su Nota On no prendió ninguna nota
  (ver la spec `apareo-de-nota-off`)

### Requirement: La caja recuerda la posición en la lista

La caja SHALL recordar en qué posición de la lista va, y no el valor: con
valores repetidos, el ciclo SHALL recorrerlos todos. Si la lista cambia, el
ciclo SHALL seguir desde la misma posición en la lista nueva; si esa posición
queda afuera de la lista nueva, SHALL volver al primer valor.

Cada mensaje que llega a la caja SHALL avanzar su ciclo, aunque lo que sale de
ella no llegue al puerto de salida (porque una caja siguiente falla o lo
descarta). Un mensaje que llega a la caja por dos caminos se procesa dos
veces, y por eso SHALL avanzar el ciclo dos veces. Cuándo arranca y cuándo se
olvida lo que recuerda lo dice la spec `ejecucion-de-workflow`, "Cada caja
tiene su memoria".

#### Scenario: Acento cada cuatro notas

- **GIVEN** byte "3.º (datos 2)", valores 127, 80, 80 y 80
- **WHEN** recibe cinco veces `90 3C 64`
- **THEN** emite `90 3C 7F`, tres veces `90 3C 50`, y otra vez `90 3C 7F`

#### Scenario: La lista se acorta

- **GIVEN** byte "3.º (datos 2)", valores 127, 80, 80 y 80, que ya recibió
  tres mensajes
- **WHEN** la persona usuaria quita los dos últimos valores, y llega
  `90 3C 64`
- **THEN** emite `90 3C 7F`, porque la cuarta posición ya no está en la lista

#### Scenario: La lista cambia sin acortarse

- **GIVEN** byte "Canal", valores 1, 2 y 3, que ya recibió un mensaje
- **WHEN** la persona usuaria cambia los valores a 5, 6 y 7, y llega
  `90 3C 64`
- **THEN** emite `95 3C 64`, el segundo valor de la lista nueva

#### Scenario: Una caja siguiente falla

- **GIVEN** trigger → "Alternar" (datos 2, valores 127 y 0) → "Fijar" (byte
  "Canal", valor 100, mal configurada) → "Emitir"
- **WHEN** llega `B0 40 7F`, la persona usuaria cambia el valor de "Fijar" a
  1, y llega otra vez `B0 40 7F`
- **THEN** por el primer mensaje no sale nada, porque "Fijar" falla, y por el
  segundo sale `B0 40 00`

#### Scenario: Dos caminos hasta la caja

- **GIVEN** la salida del trigger va a dos cajas "Filtrar" sin criterios, y
  las dos van a la misma caja "Alternar" (datos 2, valores 127 y 0) →
  "Emitir"
- **WHEN** llega `B0 40 7F`
- **THEN** salen `B0 40 7F` y `B0 40 00`, en ese orden

### Requirement: Un ciclo por cada combinación

Sin ninguna opción elegida en "Un ciclo por", la caja SHALL tener un solo
ciclo para todos los mensajes. Con opciones elegidas, SHALL tener un ciclo
independiente por cada combinación de lo elegido: por ejemplo, con "Canal" y
"Datos 1", uno por cada canal y número de control. Cada ciclo SHALL recordar
su posición por separado.

La combinación SHALL leerse del mensaje tal como llega a la caja, antes de
cambiarlo. Que al mensaje le falte algo de lo elegido (un mensaje de sistema
no tiene canal, un Cambio de Programa no tiene datos 2) SHALL contar como un
valor más: los mensajes a los que les falta lo mismo comparten su ciclo.

#### Scenario: Una pedalera con una sola caja

- **GIVEN** byte "3.º (datos 2)", valores 127 y 0, un ciclo por "Datos 1"
- **WHEN** recibe `B0 40 7F`, `B0 42 7F`, `B0 40 7F` y `B0 42 7F`
- **THEN** emite `B0 40 7F`, `B0 42 7F`, `B0 40 00` y `B0 42 00`

#### Scenario: Un ciclo por teclado

- **GIVEN** byte "Canal", valores 3 y 4, un ciclo por "Canal"
- **WHEN** recibe `90 3C 64` (canal 1), `91 3C 64` (canal 2) y `90 3E 64`
  (canal 1)
- **THEN** emite `92 3C 64`, `92 3C 64` y `93 3E 64`: cada teclado tiene su
  ciclo, que se elige por el canal con que llega el mensaje y no por el canal
  con que sale

#### Scenario: Varias opciones

- **GIVEN** byte "3.º (datos 2)", valores 127 y 0, un ciclo por "Canal" y
  "Datos 1"
- **WHEN** recibe `B0 40 7F`, `B1 40 7F` y `B0 40 7F`
- **THEN** emite `B0 40 7F`, `B1 40 7F` y `B0 40 00`

#### Scenario: Les falta lo mismo

- **GIVEN** byte "2.º (datos 1)", valores 10 y 20, un ciclo por "Datos 2"
- **WHEN** recibe `C0 05`, `C0 07` y `B0 07 64`
- **THEN** emite `C0 0A`, `C0 14` y `B0 0A 64`: los dos Cambios de Programa
  comparten el ciclo de los mensajes sin datos 2, y el Cambio de Control
  arranca el suyo

### Requirement: Un mensaje sin el byte elegido pasa sin cambios

Si el mensaje no tiene lo elegido en "Byte" (un mensaje de sistema no tiene
canal; un Cambio de Programa no tiene datos 2), la caja SHALL pasarlo tal
cual a las cajas siguientes, sin descartarlo y sin agregarle bytes, y no SHALL
avanzar su ciclo.

#### Scenario: Cambio de Programa y tercer byte

- **GIVEN** byte "3.º (datos 2)", valores 127 y 0
- **WHEN** recibe `C0 05` y después `B0 40 64`
- **THEN** emite `C0 05` y después `B0 40 7F`, con el primer valor

#### Scenario: Un mensaje de sistema no tiene canal

- **GIVEN** byte "Canal", valores 1 y 2
- **WHEN** recibe `90 3C 64`, `FA` y `90 3E 64`
- **THEN** emite `90 3C 64`, `FA` y `91 3E 64`

### Requirement: Alternar notas con el apareo

Para alternar notas, alcanza con que pasen por la caja los Nota On: cada Nota
Off que no llega a ninguna caja de fin SHALL apagar lo que prendió su Nota On,
en el canal y la nota con que salió (ver la spec `apareo-de-nota-off`). Un
Nota Off que llega a la caja, en cambio, SHALL tomar el siguiente valor como
cualquier otro mensaje, y entonces puede no apagar la nota que prendió su Nota
On: si el flujo maneja el Nota Off a mano y además alterna notas, no hay forma
de apagar la nota correcta.

#### Scenario: Round-robin de canales

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Alternar" (byte "Canal",
  valores 1, 2 y 3) → "Emitir"
- **WHEN** llegan `90 3C 64`, `90 3E 64`, `80 3C 40` y `80 3E 40`
- **THEN** salen `90 3C 64`, `91 3E 64`, `80 3C 40` y `81 3E 40`: cada Nota
  Off apaga su nota en el canal donde se prendió

#### Scenario: El Nota Off también pasa por la caja

- **GIVEN** trigger → "Filtrar" ("Nota On" y "Nota Off") → "Alternar" (byte
  "Canal", valores 1 y 2) → "Emitir"
- **WHEN** llegan `90 3C 64` y después `80 3C 40`
- **THEN** salen `90 3C 64` y `81 3C 40`, y la nota prendida en el canal 1
  queda sin apagar
