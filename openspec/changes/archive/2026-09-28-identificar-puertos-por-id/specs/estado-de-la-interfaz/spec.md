# Spec Delta

## MODIFIED Requirements

### Requirement: La lista de puertos refleja los puertos disponibles

Al abrir la aplicación y cada vez que se pida actualizar la lista, la interfaz
SHALL ofrecer los puertos de entrada y de salida que informa el sistema. Si un
puerto que estaba elegido sigue disponible, SHALL seguir elegido; si ya no está,
y al abrir la aplicación, no SHALL haber ningún puerto elegido. "Sigue
disponible" SHALL querer decir que sigue el mismo puerto (el mismo
identificador del sistema), no otro con el mismo nombre. Siempre que no haya
nada elegido, el selector SHALL decirlo en lugar de mostrar un puerto señalado:
no puede parecer que hay uno elegido cuando no lo hay. Si no hay ningún puerto
disponible, SHALL decir eso en lugar de mostrar una lista vacía.

#### Scenario: Se conserva la elección

- **GIVEN** la persona usuaria eligió un puerto de entrada y uno de salida
- **WHEN** presiona "Actualizar puertos" y esos puertos siguen estando
- **THEN** quedan elegidos los mismos

#### Scenario: Desapareció el puerto elegido

- **GIVEN** la persona usuaria eligió un puerto de entrada
- **WHEN** presiona "Actualizar puertos" y ese puerto ya no está en la lista
- **THEN** el selector muestra los puertos que sí están, ninguno queda elegido,
  el selector lo dice, y presionar "Conectar" pide elegir los dos puertos

#### Scenario: Desapareció el elegido pero queda otro con su nombre

- **GIVEN** la persona usuaria eligió la entrada "Teclado (2)" y hay otra
  entrada "Teclado"
- **WHEN** presiona "Actualizar puertos" y el puerto elegido ya no está, pero
  el otro "Teclado" sí
- **THEN** ninguno queda elegido y el selector lo dice: la elección no pasa al
  otro "Teclado"

#### Scenario: Al abrir la aplicación no hay nada elegido

- **WHEN** se abre la aplicación y hay puertos disponibles
- **THEN** los dos selectores muestran que todavía no se eligió nada, y
  presionar "Conectar" sin tocarlos pide elegir los dos puertos

#### Scenario: No hay puertos

- **WHEN** el sistema no informa ningún puerto de entrada o ninguno de salida
- **THEN** el selector correspondiente avisa que no hay puertos disponibles, no
  ofrece ninguno para elegir, y presionar "Conectar" pide elegir los dos puertos
