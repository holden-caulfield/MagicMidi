# Spec Delta

## ADDED Requirements

### Requirement: Las notas se nombran con letra y octava

Cuando un mensaje lleva un número de nota (Nota On, Nota Off y Presión
Polifónica), la descripción SHALL mostrar el nombre de la nota seguido del
número entre paréntesis, como "nota C4 (60)". El nombre SHALL armarse con la
letra de la nota en notación inglesa (C, D, E, F, G, A, B), un `#` para las
notas negras (siempre como sostenido, nunca como bemol) y la octava, con el
Do central (nota 60) como C4: la octava es el número de nota dividido 12, sin
decimales, menos 1. Así, la nota 0 es C-1 y la 127 es G9. Las sub-filas de
salida SHALL seguir la misma regla.

#### Scenario: Do central

- **WHEN** llega `90 3C 64`
- **THEN** la descripción es "Nota On · canal 1 · nota C4 (60) · velocidad
  100"

#### Scenario: Nota negra

- **WHEN** llega `A0 3D 22`
- **THEN** la descripción es "Presión Polifónica · canal 1 · nota C#4 (61) ·
  presión 34"

#### Scenario: Extremos del rango

- **WHEN** llegan `80 00 40` y `80 7F 40`
- **THEN** sus descripciones nombran "nota C-1 (0)" y "nota G9 (127)"

#### Scenario: Nota en una sub-fila

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** la sub-fila describe "Nota On · canal 1 · nota E4 (64) · velocidad
  100"

#### Scenario: Los mensajes sin nota no cambian

- **WHEN** llega `B0 07 64`
- **THEN** la descripción es "Cambio de Control · canal 1 · controlador 7 ·
  valor 100", sin ningún nombre de nota

## MODIFIED Requirements

### Requirement: Cada fila muestra hora, bytes y descripción

La fila de entrada de cada grupo SHALL tener cuatro columnas:

- la hora en que la aplicación recibió el mensaje, en formato de 24 horas con
  milisegundos (`HH:MM:SS.mmm`);
- los bytes del mensaje en hexadecimal, en mayúsculas, con dos dígitos por byte
  y separados por un espacio;
- una descripción legible del mensaje;
- la marca de lo que pasó con el mensaje, cuando corresponde (ver "Un mensaje
  que pasa sin cambios se marca en la fila de entrada", "Lo que no sale se
  marca como descartado" y "Un mensaje cuyo procesamiento falló se marca como
  error").

En los mensajes de canal, cada parte de la descripción (el tipo, el canal y
cada uno de los valores) SHALL ocupar su propia sub-columna, con el mismo
ancho en todas las filas, para que las partes equivalentes de filas distintas
queden una debajo de la otra. El separador " · " no SHALL dibujarse entre
sub-columnas: la alineación ya separa las partes. Los mensajes de sistema y
los no reconocidos SHALL mostrar su descripción entera, ocupando el lugar de
todas las sub-columnas.

Arriba de la lista SHALL haber una fila de encabezados con los nombres de las
columnas ("Hora", "Bytes" y "Descripción"), que no se desplaza con la lista.

Las sub-filas de salida SHALL mostrar los bytes y la descripción con el mismo
formato y alineados con las columnas y sub-columnas de la fila de entrada, y
no SHALL mostrar hora.

#### Scenario: Formato de una fila

- **WHEN** llega `90 3C 64` a las 14:05:09 con 7 milisegundos
- **THEN** la fila de entrada muestra `14:05:09.007`, `90 3C 64` y, en sus
  sub-columnas, "Nota On", "canal 1", "nota C4 (60)" y "velocidad 100"

#### Scenario: Formato de una sub-fila

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** la sub-fila muestra `90 40 64` debajo de `90 3C 64` y "nota E4
  (64)" debajo de "nota C4 (60)", sin hora

#### Scenario: Valores alineados entre filas

- **WHEN** llegan `90 3C 64`, `B9 07 64` y `A0 3D 22`
- **THEN** "canal 1", "canal 10" y "canal 1" empiezan a la misma distancia del
  borde izquierdo, y lo mismo pasa con "nota C4 (60)", "controlador 7" y "nota
  C#4 (61)", y con "velocidad 100", "valor 100" y "presión 34"

#### Scenario: Mensaje de sistema

- **WHEN** llega `FC`
- **THEN** la fila muestra "Detener (Stop)" entero desde el comienzo de la
  columna de descripción, sin cortarse en las sub-columnas

#### Scenario: Encabezados de columna

- **GIVEN** el log tiene más filas de las que entran en la lista
- **WHEN** la persona usuaria la desplaza
- **THEN** la fila con "Hora", "Bytes" y "Descripción" sigue a la vista arriba
  de la lista

### Requirement: Descripción de los mensajes de canal

Los mensajes de canal SHALL describirse con su tipo, el canal numerado de 1 a
16 y sus valores, separados por " · ", así:

| Status | Descripción |
|---|---|
| `8n` | Nota Off · canal · nota · velocidad |
| `9n` con velocidad 0 | Nota Off · canal · nota · velocidad 0 |
| `9n` | Nota On · canal · nota · velocidad |
| `An` | Presión Polifónica · canal · nota · presión |
| `Bn` | Cambio de Control · canal · controlador · valor |
| `Cn` | Cambio de Programa · canal · programa |
| `Dn` | Presión de Canal · canal · presión |
| `En` | Pitch Bend · canal · valor |

Los valores SHALL mostrarse en decimal; la nota, además, con su nombre, según
"Las notas se nombran con letra y octava". El valor de Pitch Bend SHALL ser el
número de 14 bits que forman los dos bytes de datos (de 0 a 16383).

#### Scenario: Nota On con velocidad cero

- **WHEN** llega `90 3C 00`
- **THEN** la descripción es "Nota Off · canal 1 · nota C4 (60) · velocidad 0"

#### Scenario: Canal distinto de 1

- **WHEN** llega `B9 07 64`
- **THEN** la descripción es "Cambio de Control · canal 10 · controlador 7 ·
  valor 100"

#### Scenario: Pitch Bend centrado

- **WHEN** llega `E0 00 40`
- **THEN** la descripción es "Pitch Bend · canal 1 · valor 8192"

### Requirement: Limpiar vacía el log

El log SHALL tener un botón "Limpiar", ubicado al final de la fila de
encabezados de la lista y dibujado con un ícono. El botón SHALL anunciarse
como "Limpiar" a las tecnologías de asistencia y SHALL mostrar ese nombre
al pasarle el puntero por encima. Al presionarlo, SHALL borrar todas las filas
del log, esté o no la aplicación conectada. Los mensajes que lleguen después
SHALL seguir agregándose normalmente. Desconectar o volver a conectar no SHALL
borrar el log.

#### Scenario: Limpiar con conexión activa

- **GIVEN** hay una conexión activa y el log tiene filas
- **WHEN** la persona usuaria presiona "Limpiar" y después llega `90 3C 64`
- **THEN** el log queda con una sola fila, la de `90 3C 64`

#### Scenario: Desconectar no borra el log

- **GIVEN** el log tiene filas
- **WHEN** la persona usuaria desconecta y vuelve a conectar
- **THEN** las filas anteriores siguen en el log

#### Scenario: El botón se identifica

- **WHEN** la persona usuaria enfoca el botón con el teclado o le pasa el
  puntero por encima
- **THEN** el botón se anuncia, o se ve en un globo, como "Limpiar"

### Requirement: La lista de mensajes ocupa el espacio disponible

La lista de mensajes del tab Log SHALL ocupar todo el alto del panel debajo
de su fila de encabezados, y todo el ancho del panel. El tab Log no SHALL
tener un título propio. Las columnas y sub-columnas SHALL tener un ancho fijo,
que no depende del ancho de la ventana: el que hace falta para que entre la
parte más ancha que pueden producir los mensajes de canal. La marca SHALL ir
pegada después de la última sub-columna, y el espacio que sobre SHALL quedar a
la derecha de las filas. La lista SHALL acompañar los cambios de tamaño de la
ventana. Cuando las filas no entran a lo alto, la que se desplaza SHALL ser la
lista: ni el panel ni la ventana. Cuando el panel es más angosto que la suma
de las columnas, la lista y su fila de encabezados SHALL desplazarse juntas a
lo ancho, sin que las sub-columnas pierdan su alineación.

#### Scenario: Ventana grande

- **GIVEN** la ventana está en pantalla completa y el tab activo es "Log"
- **WHEN** la persona usuaria mira el log
- **THEN** la lista llega hasta el pie del panel y ocupa todo su ancho, las
  columnas tienen el mismo ancho que con la ventana chica, y las marcas de
  "salió sin cambios" y "descartado" quedan cerca de la descripción de su fila

#### Scenario: Sin título

- **WHEN** el tab activo es "Log"
- **THEN** arriba de la lista no hay ningún título: lo primero es la fila de
  encabezados de columna

#### Scenario: Ventana angosta

- **GIVEN** el panel es más angosto que la suma de las columnas
- **WHEN** la persona usuaria desplaza la lista a lo ancho
- **THEN** los encabezados se desplazan con ella y las sub-columnas siguen
  alineadas

#### Scenario: Más mensajes a la vista

- **GIVEN** el log tiene más filas de las que entran en la lista
- **WHEN** la persona usuaria agranda la ventana
- **THEN** se ven más filas a la vez que antes de agrandarla

#### Scenario: Muchas filas

- **GIVEN** el log tiene más filas de las que entran en la lista
- **WHEN** la persona usuaria las recorre
- **THEN** se desplaza la lista, y la fila de encabezados, la navegación y la
  barra de estado quedan quietas
