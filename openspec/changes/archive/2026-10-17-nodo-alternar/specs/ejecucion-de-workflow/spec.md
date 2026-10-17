# Spec Delta

## ADDED Requirements

### Requirement: Cada caja tiene su memoria

Cada caja SHALL tener su propia memoria, donde su tipo guarda lo que necesita
recordar entre un mensaje y el siguiente (como la posición de Alternar en su
lista). La memoria de una caja SHALL ser solo suya: dos cajas del mismo tipo
no la comparten, y ninguna otra caja la lee. Una caja nueva SHALL arrancar con
la memoria vacía, también si reemplaza a una caja borrada del mismo tipo y con
la misma configuración.

La memoria SHALL conservarse de un mensaje al siguiente, y editar el flujo no
SHALL borrarla: cambiar la configuración de la caja, conectarla o
desconectarla, o agregar y borrar otras cajas, la deja como estaba. Qué hace
un tipo con lo que recordó cuando cambia su configuración lo dice la spec de
ese tipo.

Mientras no hay conexión, ninguna caja SHALL tener nada en su memoria: cada
conexión nueva arranca con todas vacías, sea que la anterior se cerró con
"Desconectar", porque se perdió, o que nunca llegó a abrirse, igual que lo
anotado del apareo (ver la spec `apareo-de-nota-off`, "Lo anotado no pasa de
una conexión a otra"). El pánico no SHALL borrar la memoria de ninguna caja,
por ninguno de sus accesos (el botón, el atajo de teclado o la caja Pánico).

Una caja con errores de configuración no procesa los mensajes que le llegan
(ver "Una caja mal configurada falla con cada mensaje"), y por eso no SHALL
cambiar su memoria.

#### Scenario: Cada caja recuerda lo suyo

- **GIVEN** la salida del trigger va a "Filtrar" (solo "Cambio de Control") →
  "Alternar" (datos 2, valores 127 y 0) → "Emitir", y a "Filtrar" (solo "Nota
  On") → otro "Alternar" (datos 2, valores 127 y 0) → "Emitir"
- **WHEN** llegan `B0 40 7F`, `90 3C 64` y `B0 40 7F`
- **THEN** salen `B0 40 7F`, `90 3C 7F` y `B0 40 00`: el Nota On no avanzó el
  ciclo de la caja de los Cambios de Control

#### Scenario: Editar el flujo no la borra

- **GIVEN** trigger → "Alternar" (datos 2, valores 127 y 0) → "Emitir"
- **WHEN** llega `B0 40 7F`, la persona usuaria agrega un "Desplazar" (datos
  1, +12) entre "Alternar" y "Emitir", y llega otra vez `B0 40 7F`
- **THEN** salen `B0 40 7F` y después `B0 4C 00`

#### Scenario: Una caja nueva arranca vacía

- **GIVEN** trigger → "Alternar" (datos 2, valores 127 y 0) → "Emitir"
- **WHEN** llega `B0 40 7F`, la persona usuaria borra la caja "Alternar",
  agrega otra igual y la conecta en el mismo lugar, y llega otra vez
  `B0 40 7F`
- **THEN** sale `B0 40 7F` las dos veces

#### Scenario: Volver a conectar

- **GIVEN** hay una conexión activa y trigger → "Alternar" (datos 2, valores
  127 y 0) → "Emitir"
- **WHEN** llega `B0 40 7F`, la persona usuaria desconecta y vuelve a
  conectar, y llega otra vez `B0 40 7F`
- **THEN** sale `B0 40 7F` las dos veces

#### Scenario: El pánico no la borra

- **GIVEN** hay una conexión activa y trigger → "Alternar" (datos 2, valores
  127 y 0) → "Emitir"
- **WHEN** llega `B0 40 7F`, la persona usuaria aprieta "Pánico", y llega
  otra vez `B0 40 7F`
- **THEN** sale `B0 40 7F`, después los mensajes del pánico, y después
  `B0 40 00`

#### Scenario: Una caja mal configurada no cambia su memoria

- **GIVEN** trigger → "Alternar" (datos 2, valores 127 y 0) → "Emitir"
- **WHEN** llega `B0 40 7F`, la persona usuaria elige el byte "Canal" (que
  deja la caja con error), llega `B0 40 7F`, la persona usuaria cambia los
  valores a 1 y 2, y llega otra vez `B0 40 7F`
- **THEN** por el primer mensaje sale `B0 40 7F`, por el segundo no sale nada
  y el log muestra el error, y por el tercero sale `B1 40 7F`: el mensaje que
  falló no avanzó el ciclo
