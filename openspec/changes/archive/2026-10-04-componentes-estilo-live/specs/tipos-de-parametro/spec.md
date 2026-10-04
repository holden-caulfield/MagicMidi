# Spec Delta

## REMOVED Requirements

### Requirement: Los tipos de parámetro disponibles siguen el contrato

**Reason**: La lista de tipos disponibles suma el rango; el requisito se
reemplaza por "Los tipos de parámetro disponibles incluyen el rango", con la
lista de seis tipos.
**Migration**: Ninguna para el código existente: los cinco tipos anteriores
siguen igual, y el rango se suma con la misma forma que cualquier tipo.

## ADDED Requirements

### Requirement: Los tipos de parámetro disponibles incluyen el rango

Los tipos de parámetro disponibles SHALL ser número entero, sí/no, lista (una
sola opción de una lista cerrada), dos para elegir varias opciones de una
lista cerrada (opciones y autocompletar) y rango (dos extremos enteros). En
los de lista, cada opción tiene un valor y un texto visible. Cada uno SHALL
estar definido en su propio archivo, con la misma forma que cualquier tipo
nuevo, sin recibir un trato especial fuera de él.

#### Scenario: Los seis tipos en su carpeta

- **WHEN** se revisa la carpeta de tipos de parámetro
- **THEN** entero, sí/no, lista, opciones, autocompletar y rango están
  definidos cada uno en su propio archivo y registrados en el catálogo, y el
  panel de configuración no nombra a ninguno

### Requirement: El parámetro rango

Un parámetro **rango** SHALL declarar un mínimo y un máximo enteros, y si se
puede **invertir**. Su valor SHALL ser un par de enteros, "desde" y "hasta".

Un valor SHALL no servirle al parámetro, con estos errores, revisados en este
orden:

- si "desde" o "hasta" no es un entero: "Tiene que ser un número entero";
- si "desde" o "hasta" queda fuera del mínimo y el máximo: "Tiene que ir de
  <mínimo> a <máximo>" (por ejemplo, "Tiene que ir de 0 a 127");
- si el rango no se puede invertir y "desde" es mayor que "hasta": "Desde
  tiene que ser igual o menor que hasta".

"Desde" igual a "hasta" SHALL ser un valor válido para el tipo. En un rango
que se puede invertir, "desde" mayor que "hasta" SHALL ser un valor válido:
indica el sentido contrario.

#### Scenario: Rango invertido que se puede invertir

- **WHEN** se revisa el valor de 127 a 0 de un rango de 0 a 127 que se puede
  invertir
- **THEN** no tiene error

#### Scenario: Rango invertido que no se puede invertir

- **WHEN** se revisa el valor de 72 a 60 de un rango de 0 a 127 que no se
  puede invertir
- **THEN** tiene el error "Desde tiene que ser igual o menor que hasta"

#### Scenario: Extremo fuera de rango

- **WHEN** se revisa el valor de 0 a 200 de un rango de 0 a 127
- **THEN** tiene el error "Tiene que ir de 0 a 127"

#### Scenario: Un solo valor

- **WHEN** se revisa el valor de 64 a 64 de un rango de 0 a 127
- **THEN** no tiene error

### Requirement: El control de rango

El control de un parámetro **rango** SHALL ser una barra horizontal con dos
perillas, una para "desde" y otra para "hasta", ubicadas en proporción a su
valor entre el mínimo y el máximo, con un campo numérico a cada lado: el de la
izquierda para "desde" y el de la derecha para "hasta". El tramo de la barra
entre las dos perillas SHALL verse resaltado, con marcas tenues en forma de
punta de flecha que apuntan de "desde" hacia "hasta", así se lee el sentido
del rango. Las dos perillas SHALL distinguirse entre sí.

La persona usuaria SHALL poder cambiar cada extremo:

- arrastrando su perilla;
- haciendo clic en la barra, que mueve la perilla más cercana a ese punto;
- con el foco en una perilla, con las flechas (de a 1) o con Mayúsculas y las
  flechas (de a 10);
- escribiendo en su campo numérico, que interpreta lo escrito como un entero
  (lo que no se puede interpretar no cambia la caja, como en el parámetro
  entero).

Arrastrando o con las flechas, ninguna perilla SHALL pasar del mínimo ni del
máximo. Si el rango no se puede invertir, una perilla SHALL frenarse al llegar
a la otra; si se puede invertir, SHALL poder pasarla, y entonces las marcas
del tramo SHALL apuntar hacia el otro lado. Lo escrito en un campo que se
puede interpretar pero no sirve (fuera de rango, o al revés en un rango que
no se puede invertir) SHALL guardarse y mostrarse como error, como en
cualquier parámetro.

Cada perilla SHALL anunciarse a los lectores de pantalla como un deslizador,
con su nombre ("desde" o "hasta", junto con la etiqueta del parámetro), su
valor, su mínimo y su máximo. La etiqueta del parámetro SHALL nombrar al
grupo. El control SHALL caber en el ancho del panel de configuración sin
desplazarlo a lo ancho.

#### Scenario: Arrastrar una perilla

- **GIVEN** una caja "Filtrar" con datos 1 de 0 a 127
- **WHEN** la persona usuaria arrastra la perilla "desde" de Datos 1 hasta la
  mitad de la barra
- **THEN** la caja queda con datos 1 desde un valor cercano a 64 hasta 127, y
  el campo de la izquierda muestra ese valor

#### Scenario: Las perillas se frenan

- **GIVEN** una caja "Filtrar" con datos 1 de 60 a 72
- **WHEN** la persona usuaria arrastra la perilla "desde" más allá de la
  perilla "hasta"
- **THEN** la perilla "desde" se queda en 72 y la caja queda con datos 1 de
  72 a 72

#### Scenario: Las perillas se cruzan

- **GIVEN** una caja "Mapear" con salida de 0 a 127
- **WHEN** la persona usuaria arrastra la perilla "desde" de Salida hasta el
  extremo derecho y la perilla "hasta" hasta el extremo izquierdo
- **THEN** la caja queda con salida de 127 a 0, y las marcas del tramo
  apuntan hacia la izquierda

#### Scenario: Con el teclado

- **GIVEN** una caja "Mapear" con entrada de 0 a 127 y el foco en la perilla
  "hasta" de Entrada
- **WHEN** la persona usuaria aprieta la flecha izquierda y después
  Mayúsculas y la flecha izquierda
- **THEN** la caja queda con entrada de 0 a 116

#### Scenario: Escribir un extremo

- **GIVEN** una caja "Filtrar" con datos 2 de 0 a 127
- **WHEN** la persona usuaria escribe 100 en el campo de la izquierda de
  Datos 2 y sale del campo
- **THEN** la caja queda con datos 2 de 100 a 127 y la perilla "desde" se
  mueve a ese punto

#### Scenario: Escribir algo que no es un número

- **GIVEN** una caja "Filtrar" con datos 2 de 0 a 127
- **WHEN** la persona usuaria escribe "mucho" en el campo de la derecha y sale
  del campo
- **THEN** la caja sigue con datos 2 de 0 a 127 y el campo vuelve a mostrar
  127

#### Scenario: El lector de pantalla anuncia la perilla

- **GIVEN** una persona que usa lector de pantalla y una caja "Filtrar"
  seleccionada
- **WHEN** llega con Tab a la perilla "desde" de Datos 1
- **THEN** el lector la anuncia como un deslizador "desde" del grupo "Datos
  1", con su valor
