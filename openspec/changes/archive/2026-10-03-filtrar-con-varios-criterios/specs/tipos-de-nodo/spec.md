# Spec Delta

## MODIFIED Requirements

### Requirement: El mensaje dice su tipo y su canal

El mensaje que recibe la función de procesamiento SHALL dar acceso a su lista
de bytes y SHALL permitir leer, sin hacer cuentas con los bits del status:

- su **tipo**, que es uno de:
  - de canal: Nota On, Nota Off, Presión Polifónica, Cambio de Control,
    Cambio de Programa, Presión de Canal o Pitch Bend;
  - de sistema, uno por cada status definido: SysEx (`F0`), Cuadro de Tiempo
    (`F1`), Posición de Canción (`F2`), Selección de Canción (`F3`),
    Solicitud de Afinación (`F6`), Reloj MIDI (`F8`), Inicio (`FA`),
    Continuar (`FB`), Detener (`FC`), Sensor Activo (`FE`) y Reset del
    Sistema (`FF`);
  - sistema no definido, para los demás status de `F0` a `FF` (`F4`, `F5`,
    `F7`, `F9` y `FD`);
  - desconocido: sin bytes, o con un primer byte que no es un status, es
    decir menor que `80`.

  Un Nota On (`9n`) con velocidad 0 SHALL leerse como Nota Off, igual que en
  la descripción del log; un `9n` sin tercer byte cuenta como velocidad 0;
- su **canal**, de 1 a 16, en los mensajes de canal (status `80` a `EF`). Los
  demás mensajes no SHALL tener canal.

El tipo y el canal SHALL salir siempre de los bytes que el mensaje tiene en
ese momento: si una caja cambia el status o la velocidad, lo que se lee
después SHALL reflejar el cambio. La descripción del log y cualquier caja que
necesite el tipo o el canal SHALL usar esta misma lectura, para que no haya
dos interpretaciones del status.

#### Scenario: Tipo y canal de un Nota On

- **WHEN** se lee el mensaje `91 3C 64`
- **THEN** su tipo es Nota On y su canal es 2

#### Scenario: Nota On con velocidad cero

- **WHEN** se lee el mensaje `90 3C 00`
- **THEN** su tipo es Nota Off y su canal es 1

#### Scenario: Mensaje de sistema

- **WHEN** se lee el mensaje `FA`
- **THEN** su tipo es Inicio y no tiene canal

#### Scenario: SysEx

- **WHEN** se lee el mensaje `F0 7E 7F 06 01 F7`
- **THEN** su tipo es SysEx y no tiene canal

#### Scenario: Status de sistema no definido

- **WHEN** se lee el mensaje `F9`
- **THEN** su tipo es sistema no definido y no tiene canal

#### Scenario: Mensaje sin status

- **WHEN** se lee el mensaje `3C 40`
- **THEN** su tipo es desconocido y no tiene canal

#### Scenario: La lectura sigue a los bytes

- **GIVEN** una caja recibe `90 3C 64` y cambia su primer byte a `B0`
- **WHEN** la caja siguiente lee el mensaje
- **THEN** su tipo es Cambio de Control
