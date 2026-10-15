# Spec Delta

## Purpose

Define el apareo de Nota Off: cómo un Nota Off que el flujo no maneja apaga
las notas que prendió su Nota On, aunque el flujo haya cambiado en el medio,
para que no queden notas colgadas. Es una excepción de la regla de "sale tal
cual" de la spec `ejecucion-de-workflow`, y no depende de ninguna caja.

## ADDED Requirements

### Requirement: Un Nota Off que no llega a ninguna caja de fin apaga lo que prendió su Nota On

Cuando un Nota Off (también un Nota On con velocidad 0, que se lee como Nota
Off) no llega a ninguna caja de fin, en lugar de salir tal cual SHALL salir
un Nota Off por cada nota que prendió su Nota On (ver "Se anota qué prendió
cada Nota On"), en el orden en que salieron esas notas. Cada uno SHALL ser el
Nota Off que entró, con el canal y la nota de la nota que apaga: conserva su
forma (`8n`, o `9n` con velocidad 0) y su velocidad de soltar.

Si una caja falla al procesar el Nota Off, no SHALL salir nada, como con
cualquier mensaje (ver la spec `ejecucion-de-workflow`). Ninguna caja SHALL
tener que declarar nada para que haya apareo: lo decide el recorrido.

#### Scenario: Transponer solo los Nota On

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Desplazar" (datos 1,
  +12) → "Emitir"
- **WHEN** llega `90 3C 64` y después `80 3C 40`
- **THEN** sale `90 48 64` y después `80 48 40`

#### Scenario: Cambiar una caja con la tecla apretada

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Desplazar" (datos 1,
  +12) → "Emitir"
- **WHEN** llega `90 3C 64`, la persona usuaria cambia el desplazamiento a
  +7, y llega `80 3C 40`
- **THEN** por el Nota On sale `90 48 64`, y por el Nota Off sale `80 48 40`,
  que apaga la nota que sigue sonando, y no `80 43 40`

#### Scenario: Acorde

- **GIVEN** trigger → "Filtrar" (solo "Nota On"), y la salida de "Filtrar" va
  a tres cajas "Desplazar" (datos 1, +0, +4 y +7), cada una con su "Emitir"
- **WHEN** llega `90 3C 64` y después `80 3C 40`
- **THEN** por el Nota On salen `90 3C 64`, `90 40 64` y `90 43 64`, y por el
  Nota Off salen `80 3C 40`, `80 40 40` y `80 43 40`, en ese orden

#### Scenario: Cambiar el canal

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Fijar" (byte "Canal",
  valor 2) → "Emitir"
- **WHEN** llega `90 3C 64` y después `80 3C 40`
- **THEN** sale `91 3C 64` y después `81 3C 40`

#### Scenario: Un Nota On con velocidad 0 conserva su forma

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Desplazar" (datos 1,
  +12) → "Emitir"
- **WHEN** llega `90 3C 64` y después `90 3C 00`
- **THEN** sale `90 48 64` y después `90 48 00`

### Requirement: Un Nota Off que llega a una caja de fin no se aparea

Si el Nota Off llega a al menos una caja de fin, por cualquier camino del
flujo, SHALL salir solo lo que devuelvan esas cajas, como cualquier otro
mensaje, sin apareo: manejar el Nota Off en el flujo es la forma explícita de
tomar el control. Alcanza con que llegue a una caja de fin por un camino: que
haya apareo depende de todo el flujo, no de una rama.

#### Scenario: El Nota Off tal cual, armado a mano

- **GIVEN** la salida del trigger va a "Filtrar" (solo "Nota On") →
  "Desplazar" (datos 1, +12) → "Emitir", y a "Filtrar" (solo "Nota Off") →
  "Emitir"
- **WHEN** llega `90 3C 64` y después `80 3C 40`
- **THEN** sale `90 48 64` y después `80 3C 40`, tal como llegó

#### Scenario: Otra rama lleva el Nota Off a un Emitir

- **GIVEN** la salida del trigger va a una caja "Emitir", y a "Filtrar" (solo
  "Nota On") → "Desplazar" (datos 1, +12) → "Emitir"
- **WHEN** llega `90 3C 64` y después `80 3C 40`
- **THEN** por el Nota On salen `90 3C 64` y `90 48 64`, y por el Nota Off
  sale solo `80 3C 40`, el del primer "Emitir": la nota 72 queda sonando

#### Scenario: Descartar los Nota Off

- **GIVEN** trigger → "Filtrar" (solo "Nota Off") → "Descartar"
- **WHEN** llega `90 3C 64` y después `80 3C 40`
- **THEN** sale `90 3C 64`, y `80 3C 40` no sale

### Requirement: Se anota qué prendió cada Nota On

Por cada Nota On que entra por el puerto de entrada SHALL anotarse, bajo su
canal y su nota, el canal y la nota de cada Nota On que salió por el puerto a
partir de él, en el orden en que salieron. Se anota pase por donde pase:
también si salió tal cual porque no llegó a ninguna caja de fin, y también si
no salió ningún Nota On, que es una anotación vacía. Solo cuentan como notas
prendidas los Nota On con velocidad mayor que 0: lo que salió de otro tipo no
se anota.

Si se aprieta la misma nota dos veces antes de soltarla, SHALL quedar una
anotación por cada vez, y cada Nota Off que entra SHALL cerrar la más vieja
de su canal y su nota. Cada Nota Off SHALL cerrar su anotación aunque no se
aparee (porque llegó a una caja de fin, o porque una caja falló): la tecla se
soltó igual.

Solo se anota lo que entra como Nota On, y solo se aparea lo que entra como
Nota Off. Las notas que salen de otro tipo de mensaje (un Cambio de Control
convertido en Nota On y en Nota Off) no se anotan ni se aparean: salen como lo
decida el flujo.

#### Scenario: Un Nota On que salió tal cual

- **GIVEN** el lienzo tiene solo el trigger
- **WHEN** llega `90 3C 64`, la persona usuaria arma trigger → "Filtrar"
  (solo "Nota On") → "Desplazar" (datos 1, +12) → "Emitir", y llega
  `80 3C 40`
- **THEN** por el Nota On sale `90 3C 64`, y por el Nota Off sale `80 3C 40`,
  que apaga la nota que había salido tal cual

#### Scenario: La misma nota dos veces

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Desplazar" (datos 1,
  +12) → "Emitir"
- **WHEN** llega `90 3C 64`, la persona usuaria cambia el desplazamiento a
  +7, llega `90 3C 64` otra vez, y después llegan dos `80 3C 40`
- **THEN** por los Nota On salen `90 48 64` y `90 43 64`, y por los Nota Off
  salen `80 48 40` y después `80 43 40`

#### Scenario: Un Nota Off que llega a un Emitir también cierra su anotación

- **GIVEN** trigger → "Filtrar" ("Nota On" y "Nota Off") → "Desplazar" (datos
  1, +12) → "Emitir"
- **WHEN** llegan `90 3C 64` y `80 3C 40`, la persona usuaria saca "Nota Off"
  del "Filtrar" y cambia el desplazamiento a +7, y llegan otra vez `90 3C 64`
  y `80 3C 40`
- **THEN** por el primer Nota Off sale `80 48 40`, desplazado por el flujo, y
  por el segundo sale `80 43 40`, que apaga la nota que prendió su Nota On

#### Scenario: Notas que salen de un Cambio de Control

- **GIVEN** trigger → "Filtrar" (solo "Cambio de Control") → "Convertir"
  (a "Nota On") → "Emitir"
- **WHEN** llega `B0 40 7F` y después `B0 40 00`
- **THEN** sale `90 40 7F` y después `90 40 00`, como los devuelve el flujo

### Requirement: Si el Nota On no prendió ninguna nota, su Nota Off no sale

Si la anotación que cierra un Nota Off está vacía, porque su Nota On no hizo
salir ningún Nota On (el flujo lo descartó, lo convirtió en otra cosa, o una
caja falló), y el Nota Off no llega a ninguna caja de fin, no SHALL salir
nada.

#### Scenario: Un pad como interruptor

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Convertir" (a "Cambio de
  Control") → "Emitir"
- **WHEN** llega `90 24 7F` y después `80 24 40`
- **THEN** por el Nota On sale `B0 24 7F`, y por el Nota Off no sale nada

#### Scenario: Un Nota On descartado

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Descartar"
- **WHEN** llega `90 3C 64` y después `80 3C 40`
- **THEN** no sale nada, ni por el Nota On ni por el Nota Off


### Requirement: Sin anotación, el Nota Off sale tal cual

Si no hay ninguna anotación abierta para el canal y la nota de un Nota Off
(porque su Nota On llegó antes de conectar o en una conexión anterior, o
porque nunca llegó) y el Nota Off no llega a ninguna caja de fin, SHALL salir
tal cual, como cualquier mensaje.

#### Scenario: Un Nota Off sin su Nota On

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Desplazar" (datos 1,
  +12) → "Emitir"
- **WHEN** llega `80 3C 40`, sin que haya llegado antes `90 3C 64`
- **THEN** sale `80 3C 40`

### Requirement: Lo anotado no pasa de una conexión a otra

Mientras no hay conexión, no SHALL quedar nada anotado: cada conexión nueva
arranca la ejecución desde cero, sea que la anterior se cerró con
"Desconectar", porque se perdió, o que nunca llegó a abrirse.

El pánico no SHALL olvidar lo anotado, por ninguno de sus accesos (el botón,
el atajo de teclado o la caja Pánico): una tecla que sigue apretada después
del pánico, al soltarse, SHALL apagar lo que prendió su Nota On, que el
pánico ya apagó, en lugar de salir tal cual y apagar otra nota.

Editar el flujo no SHALL cambiar lo anotado: agregar, borrar, conectar o
configurar cajas no lo borra, y por eso un Nota Off apaga lo que prendió su
Nota On aunque el flujo haya cambiado en el medio.

#### Scenario: Volver a conectar

- **GIVEN** hay una conexión activa y trigger → "Filtrar" (solo "Nota On") →
  "Desplazar" (datos 1, +12) → "Emitir"
- **WHEN** llega `90 3C 64`, la persona usuaria desconecta y vuelve a
  conectar, y llega `80 3C 40`
- **THEN** sale `80 3C 40`, tal como llegó

#### Scenario: Pánico desde el botón

- **GIVEN** hay una conexión activa y trigger → "Filtrar" (solo "Nota On") →
  "Desplazar" (datos 1, +12) → "Emitir"
- **WHEN** llega `90 3C 64`, la persona usuaria aprieta "Pánico", y llega
  `80 3C 40`
- **THEN** después de los mensajes del pánico sale `80 48 40`

#### Scenario: Pánico desde una caja

- **GIVEN** la salida del trigger va a "Filtrar" (solo "Nota On") →
  "Desplazar" (datos 1, +12) → "Emitir", y a "Filtrar" (solo "Cambio de
  Control") → "Pánico"
- **WHEN** llega `90 3C 64`, después `B0 14 7F`, y después `80 3C 40`
- **THEN** por el Cambio de Control salen los mensajes del pánico, y por el
  Nota Off sale `80 48 40`

#### Scenario: Pánico con otra tecla prendida

- **GIVEN** hay una conexión activa y trigger → "Filtrar" (solo "Nota On") →
  "Desplazar" (datos 1, +12) → "Emitir"
- **WHEN** llega `90 3C 64`, la persona usuaria aprieta "Pánico", llega
  `90 30 64` y después llega `80 3C 40`
- **THEN** por el Nota On de la nota 48 sale `90 3C 64`, y por el Nota Off de
  la nota 60 sale `80 48 40`, que no apaga la nota 60 que prendió la otra
  tecla

#### Scenario: Borrar el flujo no olvida

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Desplazar" (datos 1,
  +12) → "Emitir"
- **WHEN** llega `90 3C 64`, la persona usuaria borra todas las cajas, y
  llega `80 3C 40`
- **THEN** sale `80 48 40`, que apaga la nota que prendió el Nota On
