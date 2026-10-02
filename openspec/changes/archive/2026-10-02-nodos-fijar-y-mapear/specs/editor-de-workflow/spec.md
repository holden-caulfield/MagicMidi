# Spec Delta

## MODIFIED Requirements

### Requirement: La barra de herramientas agrega cajas al lienzo

La barra de herramientas SHALL ofrecer, en esta versión, exactamente seis
cajas, en este orden: **Filtrar**, **Desplazar**, **Fijar**, **Mapear**,
**Emitir** y **Descartar**. Una caja SHALL poder agregarse arrastrándola desde
la barra hasta un punto del lienzo, y queda ubicada donde se soltó. SHALL poder
agregarse también activando su control en la barra, con el mouse o con el
teclado, y en ese caso queda en un lugar visible del lienzo. Se SHALL poder
agregar cualquier cantidad de cajas de cada tipo. Cada caja nueva arranca con
la configuración inicial de su tipo.

#### Scenario: Cajas disponibles

- **WHEN** la persona usuaria mira la barra de herramientas
- **THEN** ve "Filtrar", "Desplazar", "Fijar", "Mapear", "Emitir" y
  "Descartar", en ese orden

#### Scenario: Arrastrar al lienzo

- **WHEN** la persona usuaria arrastra "Desplazar" desde la barra y lo suelta en
  un punto del lienzo
- **THEN** aparece una caja "Desplazar" nueva en ese punto, sin conexiones

#### Scenario: Agregar con un clic o con el teclado

- **WHEN** la persona usuaria activa el control "Emitir" de la barra con un clic,
  o con Enter o barra espaciadora
- **THEN** aparece una caja "Emitir" nueva a la vista en el lienzo

#### Scenario: Varias cajas del mismo tipo

- **GIVEN** ya hay una caja "Desplazar" en el lienzo
- **WHEN** la persona usuaria agrega otra
- **THEN** hay dos cajas "Desplazar", cada una con su propia configuración

#### Scenario: Las cajas de fin se ven igual

- **WHEN** la persona usuaria agrega una caja "Descartar"
- **THEN** la caja tiene conector de entrada, ningún conector de salida, y el
  mismo color que "Emitir"

#### Scenario: Fijar y Mapear quedan en el medio del flujo

- **WHEN** la persona usuaria agrega una caja "Fijar" y una "Mapear"
- **THEN** las dos tienen conector de entrada y de salida, y el mismo color
  neutro que "Desplazar"

## ADDED Requirements

### Requirement: Los errores de configuración se ven en el panel y en el lienzo

Cada error de configuración de una caja (ver la spec `tipos-de-nodo`, "Qué
declara un tipo de nodo") SHALL mostrarse en el panel de configuración, debajo
del campo del parámetro al que está asociado, con su texto, y el campo SHALL
quedar marcado como inválido para los lectores de pantalla, con el texto del
error como descripción. Los errores SHALL actualizarse con cada cambio de la
configuración, incluidos los de un parámetro que no se tocó (una regla que mira
dos parámetros puede dejar de cumplirse al cambiar cualquiera de los dos).

Una caja con al menos un error de configuración SHALL verse en el lienzo con un
borde rojo, el mismo rojo que marca un error en el log, legible en el modo
claro y en el oscuro. El rojo no SHALL confundirse con el naranja de las cajas
de fin, y una caja con error seleccionada SHALL seguir viéndose seleccionada.
La caja SHALL dejar de verse en rojo apenas se corrigen todos sus errores.

#### Scenario: Error debajo del campo

- **GIVEN** una caja "Fijar" seleccionada, con byte "3.º (datos 2)"
- **WHEN** la persona usuaria escribe 128 en "Valor" y sale del campo
- **THEN** debajo del campo "Valor" aparece que tiene que ir de 0 a 127, y la
  caja se ve con borde rojo en el lienzo

#### Scenario: Un error que aparece por otro parámetro

- **GIVEN** una caja "Fijar" seleccionada, con byte "3.º (datos 2)" y valor
  100, sin errores
- **WHEN** la persona usuaria elige el byte "Canal"
- **THEN** aparece el error debajo del campo "Valor", que no se tocó

#### Scenario: Caja con error seleccionada

- **GIVEN** una caja "Mapear" con entrada de 64 a 64
- **WHEN** la persona usuaria la selecciona y después selecciona otra caja
- **THEN** mientras está seleccionada se ve seleccionada y con borde rojo, y
  al seleccionar otra sigue con borde rojo

#### Scenario: Corregir todos los errores

- **GIVEN** una caja "Mapear" con entrada de 64 a 64, y salida hasta 200
- **WHEN** la persona usuaria cambia la entrada hasta a 127
- **THEN** sigue con borde rojo y con el error en "Salida hasta"; al cambiar
  "Salida hasta" a 127, el borde rojo desaparece
