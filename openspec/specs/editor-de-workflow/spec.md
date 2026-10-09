# editor-de-workflow Specification

## Purpose
Define el tab Workflow: un editor visual donde la persona usuaria arma, sin
escribir código, el flujo que siguen los mensajes MIDI. Ubica cajas en un lienzo, las
conecta entre sí y configura cada una desde la misma pantalla.

## Requirements

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

### Requirement: El flujo arranca con un único trigger conectado a un Emitir

Al abrir la aplicación, el lienzo SHALL contener exactamente dos cajas: el
trigger "Mensaje MIDI recibido" y una caja **Emitir**, con la salida del
trigger conectada a la entrada del Emitir, de modo que el flujo por defecto deja
pasar todo sin cambios. Esa caja Emitir y su conexión SHALL ser como cualquier
otra: se pueden mover y borrar.

El trigger SHALL tener solo un conector de salida. No SHALL poder borrarse, y
no SHALL poder agregarse otro: la barra de herramientas no lo ofrece.

#### Scenario: Lienzo inicial

- **WHEN** se abre la aplicación y se activa el tab "Workflow"
- **THEN** el lienzo tiene la caja "Mensaje MIDI recibido" conectada a una caja
  "Emitir", sin ninguna otra caja ni conexión, y las dos cajas se ven sin
  superponerse

#### Scenario: El Emitir inicial se puede borrar

- **WHEN** la persona usuaria borra la caja "Emitir" del lienzo inicial
- **THEN** queda solo el trigger, sin conexiones

#### Scenario: El trigger no se borra

- **WHEN** la persona usuaria selecciona el trigger
- **THEN** no hay ninguna acción disponible para borrarlo

#### Scenario: No se agrega un segundo trigger

- **WHEN** la persona usuaria mira la barra de herramientas
- **THEN** no ofrece ningún trigger

### Requirement: La barra de herramientas agrega cajas al lienzo

La barra de herramientas SHALL ofrecer, en esta versión, exactamente ocho
cajas, en este orden: **Filtrar**, **Convertir**, **Fijar**, **Desplazar**,
**Mapear**, **Emitir**, **Descartar** y **Pánico**. Una caja SHALL poder
agregarse arrastrándola desde la barra hasta un punto del lienzo, y queda
ubicada donde se soltó. SHALL poder agregarse también activando su control en
la barra, con el mouse o con el teclado, y en ese caso queda en un lugar
visible del lienzo. Se SHALL poder agregar cualquier cantidad de cajas de cada
tipo. Cada caja nueva arranca con la configuración inicial de su tipo.

#### Scenario: Cajas disponibles

- **WHEN** la persona usuaria mira la barra de herramientas
- **THEN** ve "Filtrar", "Convertir", "Fijar", "Desplazar", "Mapear",
  "Emitir", "Descartar" y "Pánico", en ese orden

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

- **WHEN** la persona usuaria agrega una caja "Descartar" y una "Pánico"
- **THEN** las dos tienen conector de entrada, ningún conector de salida, y el
  mismo color que "Emitir"

#### Scenario: Fijar y Mapear quedan en el medio del flujo

- **WHEN** la persona usuaria agrega una caja "Fijar" y una "Mapear"
- **THEN** las dos tienen conector de entrada y de salida, y el mismo color
  neutro que "Desplazar"

#### Scenario: Convertir queda en el medio del flujo

- **WHEN** la persona usuaria agrega una caja "Convertir"
- **THEN** tiene conector de entrada y de salida, y el mismo color neutro que
  "Desplazar"

### Requirement: Las cajas se mueven dentro del lienzo

La persona usuaria SHALL poder arrastrar cualquier caja del lienzo, incluido el
trigger, para reubicarla. Las conexiones de la caja SHALL acompañarla. Mover una
caja no SHALL cambiar su configuración ni sus conexiones.

#### Scenario: Mover una caja conectada

- **GIVEN** el trigger está conectado a una caja "Emitir"
- **WHEN** la persona usuaria arrastra la caja "Emitir" a otro lugar
- **THEN** la caja queda en el lugar nuevo y la conexión sigue uniéndola al
  trigger

### Requirement: Las conexiones van de una salida a una entrada

La persona usuaria SHALL poder conectar el conector de salida de una caja con el
conector de entrada de otra. El trigger tiene solo salida, **Desplazar** tiene
entrada y salida, y **Emitir** tiene solo entrada. Una salida SHALL poder
conectarse a varias entradas, y una entrada SHALL poder recibir varias
conexiones. La interfaz SHALL rechazar, sin crearla, cualquier conexión que:

- una una caja consigo misma,
- repita una conexión que ya existe entre las mismas dos cajas, o
- cierre un ciclo, es decir, que siguiendo las conexiones desde la caja de
  destino se pueda volver a la de origen.

#### Scenario: Conectar trigger a Emitir

- **GIVEN** el trigger no está conectado a ninguna caja
- **WHEN** la persona usuaria arrastra desde la salida del trigger hasta la
  entrada de una caja "Emitir"
- **THEN** queda una conexión visible entre las dos cajas

#### Scenario: Una salida hacia varias cajas

- **GIVEN** el trigger está conectado a una caja "Emitir"
- **WHEN** la persona usuaria conecta además la salida del trigger con la
  entrada de una caja "Desplazar"
- **THEN** quedan las dos conexiones

#### Scenario: Emitir no tiene salida

- **WHEN** hay una caja "Emitir" en el lienzo
- **THEN** no tiene ningún conector de salida desde donde arrastrar una
  conexión

#### Scenario: Ciclo rechazado

- **GIVEN** la salida de la caja "Desplazar" A está conectada a la entrada de la
  caja "Desplazar" B
- **WHEN** la persona usuaria intenta conectar la salida de B con la entrada de A
- **THEN** la conexión no se crea y el flujo queda como estaba

#### Scenario: Conexión consigo misma rechazada

- **WHEN** la persona usuaria intenta conectar la salida de una caja "Desplazar"
  con su propia entrada
- **THEN** la conexión no se crea

### Requirement: Cajas y conexiones se pueden borrar

La persona usuaria SHALL poder borrar cualquier caja salvo el trigger. Al borrar
una caja SHALL desaparecer también cada conexión que entraba o salía de ella.
SHALL poder borrar también una conexión suelta, sin borrar ninguna de las dos
cajas que unía.

#### Scenario: Borrar una caja conectada

- **GIVEN** el trigger está conectado a una caja "Desplazar", y esa caja a una
  "Emitir"
- **WHEN** la persona usuaria borra la caja "Desplazar"
- **THEN** la caja desaparece junto con sus dos conexiones, y el trigger y la
  caja "Emitir" siguen en el lienzo, sin conexiones

#### Scenario: Borrar una conexión

- **GIVEN** el trigger está conectado a una caja "Emitir"
- **WHEN** la persona usuaria borra esa conexión
- **THEN** las dos cajas siguen en el lienzo, sin conexión entre ellas

### Requirement: La caja seleccionada se configura en el mismo tab

La persona usuaria SHALL poder seleccionar una caja del lienzo, y la caja
seleccionada SHALL distinguirse de las demás. El panel de configuración SHALL
mostrar el nombre de la caja seleccionada y un campo por cada parámetro de su
tipo, con el valor que tiene esa caja. Cambiar un campo SHALL cambiar la
configuración de esa caja y de ninguna otra, y el cambio SHALL regir para los
mensajes que lleguen desde ese momento. Si la caja no tiene parámetros, o no
hay ninguna seleccionada, el panel SHALL decirlo. Un campo numérico entero no
SHALL aceptar un valor que no sea entero: la caja conserva su valor anterior.

#### Scenario: Seleccionar una caja con parámetros

- **WHEN** la persona usuaria selecciona una caja "Desplazar"
- **THEN** la caja queda señalada en el lienzo y el panel muestra sus campos
  "Byte", "Desplazamiento" y "Overflow" con los valores de esa caja

#### Scenario: Cada caja tiene su configuración

- **GIVEN** hay dos cajas "Desplazar"
- **WHEN** la persona usuaria cambia el desplazamiento de una y después
  selecciona la otra
- **THEN** la segunda muestra su propio desplazamiento, sin el cambio

#### Scenario: Caja sin parámetros

- **WHEN** la persona usuaria selecciona el trigger o una caja "Emitir"
- **THEN** el panel muestra su nombre y dice que no tiene nada para configurar

#### Scenario: Nada seleccionado

- **WHEN** no hay ninguna caja seleccionada
- **THEN** el panel invita a seleccionar una caja para configurarla

#### Scenario: Valor no entero

- **GIVEN** una caja "Desplazar" tiene desplazamiento 4
- **WHEN** la persona usuaria escribe "2.5" o deja vacío el campo de
  desplazamiento
- **THEN** la caja sigue desplazando 4

#### Scenario: Borrar la caja seleccionada

- **GIVEN** una caja "Desplazar" está seleccionada
- **WHEN** la persona usuaria la borra
- **THEN** el panel pasa a mostrar que no hay ninguna caja seleccionada

### Requirement: El flujo se conserva mientras dura la sesión

El flujo armado (cajas, configuración y conexiones) SHALL conservarse al cambiar
de tab y al conectar o desconectar los puertos. Al cerrar la aplicación se
pierde: la próxima vez arranca de nuevo con el lienzo inicial (trigger
conectado a un Emitir).

#### Scenario: Cambiar de tab

- **GIVEN** la persona usuaria armó un flujo con varias cajas conectadas
- **WHEN** va al tab "Log" y vuelve al de "Workflow"
- **THEN** el flujo está igual: mismas cajas en los mismos lugares, misma
  configuración y mismas conexiones

#### Scenario: Reconectar puertos

- **GIVEN** hay un flujo armado
- **WHEN** la persona usuaria desconecta y vuelve a conectar
- **THEN** el flujo sigue igual y se aplica a los mensajes que llegan

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

### Requirement: El lienzo ocupa el espacio disponible

El lienzo del tab Workflow SHALL ocupar todo el alto que queda en el panel
debajo de la barra de herramientas y del texto de ayuda, y todo el ancho que
deja libre el panel de configuración. El panel de configuración SHALL
conservar su ancho, tener el mismo alto que el lienzo y, si sus campos no
entran, desplazarse él. Lo que haya en el lienzo, incluidas las cajas que
quedan fuera de la parte visible, no SHALL cambiar el tamaño del panel.

Cambiar el tamaño de la ventana, a mano o entrando y saliendo de pantalla
completa, SHALL cambiar solo cuánto del lienzo se ve: las cajas SHALL quedar
en el mismo lugar respecto de la esquina superior izquierda del lienzo, con el
mismo zoom, y las conexiones SHALL seguir unidas a sus conectores.

#### Scenario: Ventana grande

- **GIVEN** la ventana está en pantalla completa y el tab activo es "Workflow"
- **WHEN** la persona usuaria mira el editor
- **THEN** el lienzo llega hasta el pie del panel y se extiende a lo ancho
  hasta el panel de configuración, que mantiene el mismo ancho que con la
  ventana chica

#### Scenario: Ventana por defecto

- **WHEN** se abre la aplicación con la ventana en su tamaño por defecto y se
  activa el tab "Workflow"
- **THEN** el panel entra entero entre la navegación y la barra de estado,
  sin barra de desplazamiento

#### Scenario: Agrandar la ventana con el flujo a la vista

- **GIVEN** el tab activo es "Workflow" y hay un flujo armado
- **WHEN** la persona usuaria agranda la ventana o la pasa a pantalla
  completa
- **THEN** las cajas siguen en el mismo lugar y con el mismo tamaño, se ve
  más superficie libre del lienzo, y las conexiones siguen dibujadas entre
  sus conectores

#### Scenario: Volver de pantalla completa con una caja lejos

- **GIVEN** la ventana está en pantalla completa, el tab activo es "Workflow"
  y la persona usuaria movió una caja cerca del borde derecho del lienzo
- **WHEN** sale de pantalla completa y la ventana vuelve a su tamaño anterior
- **THEN** el lienzo se achica, la caja queda fuera de la parte visible, y la
  barra de estado sigue pegada al pie de la ventana, sin barra de
  desplazamiento

#### Scenario: Agregar una caja con clic en un lienzo grande

- **GIVEN** la ventana está en pantalla completa y el tab activo es "Workflow"
- **WHEN** la persona usuaria hace clic en una caja de la barra de
  herramientas
- **THEN** la caja nueva aparece cerca del centro de la parte visible del
  lienzo

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
