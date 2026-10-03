# Spec Delta

## MODIFIED Requirements

### Requirement: Qué define un tipo de parámetro

El archivo de un tipo de parámetro SHALL definir:

- su **identificador**, el que escribe un tipo de nodo para declarar un
  parámetro de ese tipo;
- la **forma de la declaración**: además de la clave, la etiqueta y el valor
  inicial, que tienen todos los parámetros, los datos propios de ese tipo (por
  ejemplo, la lista de opciones, o el rango de un entero);
- el **control** con que la persona usuaria edita el valor en el panel de
  configuración;
- si lo que se escribe en el control puede no ser un valor de ese tipo, **cómo
  se interpreta**: qué valor resulta de lo escrito, o que no se puede
  interpretar;
- **qué valores le sirven**: para un valor que no le sirve a la declaración
  (por ejemplo, un entero fuera de su rango), el texto del error que se le
  muestra a la persona usuaria.

La etiqueta, su vínculo con el control (para que hacer clic en ella o leerla
con un lector de pantalla lleve al control), el texto del error debajo del
control y la apariencia común de los campos SHALL resolverse fuera del archivo
del tipo: el archivo define solo lo propio de su control. Cuando el control es
un grupo de controles (como en opciones), la etiqueta SHALL ser el
nombre del grupo, el que anuncia un lector de pantalla al entrar en él, y cada
control del grupo SHALL llevar su propio texto.

Lo escrito que no se puede interpretar no SHALL cambiar la configuración de la
caja: la caja conserva su valor anterior y el control vuelve a mostrarlo. Un
valor que se puede interpretar pero no le sirve a la declaración, en cambio,
SHALL guardarse en la caja, y SHALL mostrarse como un error de configuración
(ver la spec `editor-de-workflow`, "Los errores de configuración se ven en el
panel y en el lienzo").

La interpretación de lo escrito y la revisión de qué valores sirven SHALL
poder probarse sin la interfaz, con un test al lado del archivo del tipo.

#### Scenario: Valor no válido

- **GIVEN** una caja tiene un parámetro entero con valor 4
- **WHEN** la persona usuaria escribe "2.5" en su campo, o lo deja vacío, y
  sale del campo
- **THEN** la caja sigue con el valor 4 y el campo vuelve a mostrar 4

#### Scenario: La etiqueta lleva al control

- **WHEN** la persona usuaria hace clic en la etiqueta de un parámetro
- **THEN** el foco va al control de ese parámetro (o, en un sí/no, el control
  cambia de estado)

#### Scenario: La etiqueta nombra al grupo

- **GIVEN** una caja "Filtrar" seleccionada
- **WHEN** una persona que usa lector de pantalla llega con el teclado a la
  primera opción de los canales
- **THEN** el lector anuncia el grupo "Canales" y la opción "1", con su estado
  (elegida o no)

## ADDED Requirements

### Requirement: Los tipos de parámetro disponibles siguen el contrato

Los tipos de parámetro disponibles SHALL ser número entero, sí/no, lista (una
sola opción de una lista cerrada), y dos para elegir varias opciones de una
lista cerrada: opciones y autocompletar. En los de lista, cada opción tiene un valor y un
texto visible. Cada uno SHALL estar definido en su propio archivo, con la misma
forma que cualquier tipo nuevo, sin recibir un trato especial fuera de él.

#### Scenario: Los cinco tipos en su carpeta

- **WHEN** se revisa la carpeta de tipos de parámetro
- **THEN** entero, sí/no, lista, opciones y autocompletar están definidos
  cada uno en su propio archivo y registrados en el catálogo, y el panel de
  configuración no nombra a ninguno

### Requirement: Los parámetros de varias opciones

Un parámetro **opciones** y uno **autocompletar** SHALL declarar los dos una
lista cerrada de opciones, cada una con un valor y un texto visible, y su valor
SHALL ser la lista de los valores elegidos, en el orden de las opciones, sin
importar en qué orden se eligieron. Elegir ninguna SHALL ser un valor válido.

Un valor que tenga algo que no es una de las opciones, o una opción repetida,
SHALL ser un valor que no le sirve al parámetro, con el error "Tiene que tener
solo opciones de la lista, sin repetir".

Los dos tipos se diferencian solo en el control: opciones es para pocas
opciones de texto corto, y autocompletar, para listas largas.

#### Scenario: El orden es el de las opciones

- **GIVEN** una caja "Filtrar" sin canales elegidos
- **WHEN** la persona usuaria elige el 10 y después el 1
- **THEN** la caja queda con los canales 1 y 10, en ese orden

#### Scenario: Ninguna elegida

- **GIVEN** una caja "Filtrar" con solo el canal 1 elegido
- **WHEN** la persona usuaria deja de elegirlo
- **THEN** la caja queda sin canales, sin error, y las dieciséis píldoras
  se ven apagadas

#### Scenario: Un valor que no es de la lista

- **WHEN** se revisa un valor de opciones o de autocompletar que tiene un
  valor que no está entre las opciones, o el mismo valor dos veces
- **THEN** tiene el error "Tiene que tener solo opciones de la lista, sin
  repetir"

### Requirement: El control de opciones

El control de un parámetro **opciones** SHALL mostrar todas las opciones a la
vista, cada una como una píldora con su texto, que se ve encendida si está
elegida. Cada píldora SHALL encenderse o apagarse con un clic, o con el
teclado, sin que cambien las demás. Las píldoras SHALL acomodarse en filas
según el ancho del panel, sin desplazarlo a lo ancho.

#### Scenario: Encender y apagar

- **GIVEN** una caja "Filtrar" con los canales 1 y 10 elegidos
- **WHEN** la persona usuaria enciende el 2 y apaga el 10
- **THEN** la caja queda con los canales 1 y 2

#### Scenario: Las píldoras comparten fila

- **GIVEN** el panel de configuración con su ancho de siempre
- **WHEN** la persona usuaria selecciona una caja "Filtrar"
- **THEN** los dieciséis canales se ven en varias filas de varios canales
  cada una, y el panel no se desplaza a lo ancho

### Requirement: El control de autocompletar

El control de un parámetro **autocompletar** SHALL tener un campo de texto y,
debajo, las opciones elegidas, cada una con un botón para quitarla. Al entrar
al campo, con un clic o con el teclado, SHALL desplegarse la lista de las
opciones que todavía no están elegidas, así se ven sin tener que saber qué
escribir. Mientras se escribe, la lista SHALL mostrar solo las opciones cuyo
texto contiene lo escrito, sin distinguir mayúsculas de minúsculas ni letras
con o sin tilde.

La declaración SHALL poder indicar un **texto de ayuda**, que se muestra debajo
del campo, en lugar de las elegidas, cuando no hay ninguna elegida.

Elegir una opción de la lista, con un clic o con las flechas y Enter, SHALL
sumarla a las elegidas, vaciar el campo y dejar el foco en él. Escape SHALL
cerrar la lista sin elegir nada. Lo escrito que no coincide con ninguna opción
no SHALL cambiar la configuración de la caja: la lista lo dice ("Ninguna
coincide"), y Enter no hace nada.

La lista SHALL desplegarse flotando debajo del campo, por encima de los
parámetros que siguen y sin moverlos de lugar.

#### Scenario: Texto de ayuda

- **GIVEN** una caja "Filtrar" con solo "Nota On" elegido
- **WHEN** la persona usuaria quita "Nota On"
- **THEN** debajo del campo de los tipos de mensaje se ve "Cualquier tipo"

#### Scenario: La lista flota

- **GIVEN** una caja "Filtrar" seleccionada
- **WHEN** la persona usuaria despliega la lista de los tipos de mensaje
- **THEN** la lista se ve por encima de los canales, y los canales no se
  mueven de lugar

#### Scenario: Ver todas las opciones

- **GIVEN** una caja "Filtrar" con "Nota On" elegido
- **WHEN** la persona usuaria hace clic en el campo de los tipos de mensaje
- **THEN** se despliegan las otras quince opciones, en el orden de la lista

#### Scenario: Filtrar mientras se escribe

- **GIVEN** la lista de los tipos de mensaje desplegada
- **WHEN** la persona usuaria escribe "presion"
- **THEN** la lista muestra solo "Presión Polifónica" y "Presión de Canal"

#### Scenario: Elegir con el teclado

- **GIVEN** el foco en el campo de los tipos de mensaje, sin nada escrito
- **WHEN** la persona usuaria escribe "nota", baja con la flecha hasta "Nota
  Off" y aprieta Enter
- **THEN** la caja suma "Nota Off" a sus tipos, el campo queda vacío y con el
  foco, y "Nota Off" aparece entre las elegidas

#### Scenario: Quitar una elegida

- **GIVEN** una caja "Filtrar" con "Nota On" y "Nota Off" elegidos
- **WHEN** la persona usuaria aprieta el botón de quitar de "Nota On"
- **THEN** la caja queda solo con "Nota Off"

#### Scenario: Nada coincide

- **GIVEN** el foco en el campo de los tipos de mensaje
- **WHEN** la persona usuaria escribe "xyz" y aprieta Enter
- **THEN** la lista dice "Ninguna coincide" y los tipos de la caja no
  cambian

#### Scenario: El lector de pantalla sigue la lista

- **GIVEN** una persona que usa lector de pantalla, con el foco en el campo
  de los tipos de mensaje
- **WHEN** baja con la flecha por la lista
- **THEN** el lector anuncia cada opción a la que llega, sin que el foco deje
  el campo

## REMOVED Requirements

### Requirement: Los tipos de parámetro de esta versión siguen el contrato

**Reason**: Lo reemplaza "Los tipos de parámetro disponibles siguen el
contrato", que suma los tipos opciones y autocompletar y llama lista al que elige una
sola opción; su escenario nombraba los tres
tipos de la versión anterior.

**Migration**: Los tipos de nodo que declaraban `opciones` para elegir una
sola opción pasan a declarar `lista`, en este mismo cambio.
