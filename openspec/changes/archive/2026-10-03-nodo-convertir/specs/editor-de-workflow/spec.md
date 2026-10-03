# Spec Delta

## MODIFIED Requirements

### Requirement: La barra de herramientas agrega cajas al lienzo

La barra de herramientas SHALL ofrecer, en esta versión, exactamente siete
cajas, en este orden: **Filtrar**, **Convertir**, **Fijar**, **Desplazar**,
**Mapear**, **Emitir** y **Descartar**. Una caja SHALL poder agregarse arrastrándola desde
la barra hasta un punto del lienzo, y queda ubicada donde se soltó. SHALL poder
agregarse también activando su control en la barra, con el mouse o con el
teclado, y en ese caso queda en un lugar visible del lienzo. Se SHALL poder
agregar cualquier cantidad de cajas de cada tipo. Cada caja nueva arranca con
la configuración inicial de su tipo.

#### Scenario: Cajas disponibles

- **WHEN** la persona usuaria mira la barra de herramientas
- **THEN** ve "Filtrar", "Convertir", "Fijar", "Desplazar", "Mapear",
  "Emitir" y "Descartar", en ese orden

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

#### Scenario: Convertir queda en el medio del flujo

- **WHEN** la persona usuaria agrega una caja "Convertir"
- **THEN** tiene conector de entrada y de salida, y el mismo color neutro que
  "Desplazar"
