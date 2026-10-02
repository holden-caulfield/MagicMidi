# Spec Delta

## MODIFIED Requirements

### Requirement: La pantalla no muestra estados contradictorios

Todos los elementos de la interfaz que dependen de una misma situación SHALL
mostrarla de forma coherente entre sí, en cualquier momento y sin importar por
qué camino se llegó a esa situación. No SHALL existir ninguna secuencia de
acciones de la persona usuaria que deje un control diciendo una cosa y otro
diciendo la contraria.

#### Scenario: Indicador y botones concuerdan

- **WHEN** se mira la ventana en cualquier momento
- **THEN** si la barra de estado dice "Conectado", el botón "Desconectar" está
  disponible y el de "Conectar" no; y si dice "Desconectado", es al revés

#### Scenario: Barra de estado y panel de conexión concuerdan

- **WHEN** se mira la ventana en cualquier momento
- **THEN** la barra de estado se marca como error si y solo si el panel de
  conexión tiene un mensaje a la vista, y en ese caso muestra el mismo texto

#### Scenario: La barra de tabs y el panel visible concuerdan

- **WHEN** se mira la ventana en cualquier momento
- **THEN** el panel que se ve es exactamente el del tab señalado como activo en
  la navegación, y no hay ningún otro panel a la vista

#### Scenario: Cambiar de tab no altera lo que se muestra

- **GIVEN** hay una conexión activa
- **WHEN** la persona usuaria va al tab "Log" y vuelve al de "Conexión"
- **THEN** el panel de conexión se ve exactamente como lo dejó: mismos puertos
  elegidos, mismos controles disponibles y el mismo mensaje a la vista, si lo
  había

### Requirement: Un intento de conexión fallido deja la interfaz utilizable

Si el intento de conectar falla, la interfaz SHALL explicarlo con un mensaje
visible en el panel de conexión y en la barra de estado, y SHALL quedar como
estaba antes del intento: desconectada y con todos los controles de elección
disponibles, para poder corregir y volver a intentar sin reiniciar la
aplicación.

#### Scenario: El backend rechaza la conexión

- **GIVEN** la aplicación está desconectada
- **WHEN** la persona usuaria elige dos puertos y "Conectar" falla
- **THEN** aparece un mensaje que describe el error en el panel y en la barra
  de estado, que sigue diciendo "Desconectado" y se marca como error, y los
  selectores y "Conectar" siguen disponibles

#### Scenario: Falta elegir un puerto

- **WHEN** la persona usuaria presiona "Conectar" sin haber elegido puerto de
  entrada, de salida, o ninguno de los dos
- **THEN** aparece un mensaje que le pide elegir ambos puertos y no se intenta
  ninguna conexión

#### Scenario: El mensaje no queda pegado

- **GIVEN** hay un mensaje de error a la vista de un intento anterior
- **WHEN** la persona usuaria vuelve a presionar "Conectar" o presiona
  "Desconectar"
- **THEN** el mensaje anterior desaparece del panel y de la barra de estado
  antes de que se muestre el resultado del intento nuevo
