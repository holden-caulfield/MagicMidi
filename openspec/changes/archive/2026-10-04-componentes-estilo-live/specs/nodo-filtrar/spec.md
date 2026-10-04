# Spec Delta

## MODIFIED Requirements

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
