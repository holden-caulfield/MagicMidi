# Spec Delta

## MODIFIED Requirements

### Requirement: El tab Workflow tiene lienzo, barra de herramientas y panel de configuración

El panel del tab Workflow SHALL mostrar a la vez tres cosas: un lienzo donde
están las cajas del flujo y sus conexiones, una barra de herramientas con las
cajas que se pueden agregar y un panel con la configuración de la caja
seleccionada.

Cada caja, tanto en el lienzo como en la barra, SHALL mostrar solo el ícono
propio de su tipo, sin su nombre escrito. El nombre SHALL aparecer en un globo
de ayuda al pasar el puntero por encima de la caja, y también al llegar con el
teclado a un control de la barra. El nombre SHALL seguir siendo el nombre
accesible de cada control de la barra y estar disponible para lectores de
pantalla en las cajas del lienzo.

Las cajas del lienzo SHALL ser cuadradas, de 48 px de lado (con el lienzo sin
zoom), con borde fino y esquinas apenas redondeadas, y con un ícono más grande
que el de la barra. Los controles de la barra SHALL ser cuadrados, más chicos
que las cajas del lienzo, con el mismo borde fino que ellas, y SHALL seguir la
escala compacta del resto de la interfaz (ver la spec
`estilo-de-la-interfaz`).

#### Scenario: Partes del tab

- **WHEN** la persona usuaria activa el tab "Workflow"
- **THEN** ve el lienzo, la barra de herramientas y el panel de configuración

#### Scenario: Cajas con ícono

- **WHEN** hay una caja en el lienzo o en la barra
- **THEN** se ve el ícono de su tipo, sin su nombre escrito, y dos cajas de
  tipos distintos tienen íconos distintos

#### Scenario: Nombre al pasar el puntero

- **WHEN** la persona usuaria pasa el puntero por encima de una caja
  "Desplazar", en el lienzo o en la barra
- **THEN** aparece un globo de ayuda que dice "Desplazar", y desaparece al
  sacar el puntero

#### Scenario: Nombre al llegar con el teclado

- **WHEN** la persona usuaria llega con Tab al control "Emitir" de la barra
- **THEN** aparece un globo de ayuda que dice "Emitir", y un lector de
  pantalla anuncia el control como "Emitir"

#### Scenario: Cajas cuadradas en el lienzo

- **WHEN** hay una caja en el lienzo, sin zoom
- **THEN** mide 48 px de ancho y 48 px de alto, y es más grande que el
  control de su tipo en la barra

#### Scenario: El panel sigue nombrando la caja

- **WHEN** la persona usuaria selecciona una caja del lienzo
- **THEN** el panel de configuración muestra su nombre como título, como
  antes

### Requirement: Las cajas de inicio y de fin del flujo se distinguen por color

Cada caja del lienzo SHALL mostrarse con el color que corresponde a su etapa
en el flujo:

- **inicio**: el trigger, con fondo verde claro y borde verde;
- **fin**: toda caja cuyo tipo no tiene salida, con fondo naranja claro y borde
  naranja;
- **intermedia**: el resto, con fondo blanco y borde gris.

Los tres colores SHALL ser los mismos en el modo claro y en el oscuro: las
cajas son claras en los dos, y el ícono, oscuro.

La etapa SHALL deducirse de los conectores de la caja, sin que el tipo de nodo
declare un color. Los controles de la barra SHALL usar el mismo fondo y borde
que tendrá la caja en el lienzo, también en los dos modos. La caja
seleccionada SHALL marcarse con un anillo ámbar plano por fuera de su borde,
sin cambiar su fondo ni su borde, así una caja de inicio o de fin seleccionada
sigue mostrando su etapa y se ve seleccionada igual que las demás. El anillo
no SHALL confundirse con el naranja de las cajas de fin.

#### Scenario: Lienzo inicial con colores

- **WHEN** se abre la aplicación y se activa el tab "Workflow"
- **THEN** la caja "Mensaje MIDI recibido" se ve verde y la caja "Emitir" se ve
  naranja

#### Scenario: Caja intermedia

- **WHEN** la persona usuaria agrega una caja "Desplazar"
- **THEN** se ve con fondo blanco, distinta del trigger y del Emitir

#### Scenario: Cajas claras en modo oscuro

- **GIVEN** la aplicación en modo oscuro
- **WHEN** la persona usuaria mira el lienzo y la barra de herramientas
- **THEN** la caja y el control "Desplazar" se ven blancos, y la caja y el
  control "Emitir", naranja claro, con el ícono oscuro

#### Scenario: La barra anticipa el color

- **WHEN** la persona usuaria mira la barra de herramientas
- **THEN** el control "Emitir" se ve naranja y el control "Desplazar" blanco,
  con el mismo borde fino

#### Scenario: Seleccionar una caja de color

- **WHEN** la persona usuaria selecciona la caja "Emitir"
- **THEN** la caja sigue con su fondo y su borde naranja, y además tiene
  alrededor el anillo ámbar, el mismo que cualquier otra caja seleccionada

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
de fin, y una caja con error seleccionada SHALL seguir viéndose seleccionada:
el borde rojo y el anillo de selección no se tapan entre sí.
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
- **THEN** mientras está seleccionada se ve con el anillo de selección y con
  borde rojo, y al seleccionar otra sigue con borde rojo

#### Scenario: Corregir todos los errores

- **GIVEN** una caja "Mapear" con entrada de 64 a 64, y salida de 0 a 200
- **WHEN** la persona usuaria cambia el "hasta" de la entrada a 127
- **THEN** sigue con borde rojo y con el error en "Salida"; al cambiar el
  "hasta" de la salida a 127, el borde rojo desaparece

## ADDED Requirements

### Requirement: Conexiones y conectores en el color de acento

Los conectores de las cajas SHALL verse como cuadrados chicos de color ámbar,
y las conexiones entre cajas, como líneas finas del mismo ámbar, en el modo
claro y en el oscuro. Un conector SHALL seguir siendo fácil de agarrar con el
puntero para empezar una conexión.

#### Scenario: Conexión inicial

- **WHEN** se abre la aplicación y se activa el tab "Workflow"
- **THEN** la conexión entre el trigger y el "Emitir" se ve como una línea
  fina ámbar, y los conectores de los dos extremos, como cuadrados ámbar

#### Scenario: Conectar sigue funcionando

- **GIVEN** una caja "Desplazar" sin conexiones
- **WHEN** la persona usuaria arrastra desde la salida del trigger hasta el
  conector de entrada de la caja
- **THEN** queda una conexión ámbar entre las dos
