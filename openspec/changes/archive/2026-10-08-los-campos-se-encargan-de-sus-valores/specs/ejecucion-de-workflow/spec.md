# Spec Delta

## MODIFIED Requirements

### Requirement: Una caja mal configurada falla con cada mensaje

Si un mensaje llega a una caja que tiene errores de configuración (ver la spec
`editor-de-workflow`, "Los errores de configuración se ven en el panel y en el
lienzo"), la caja no SHALL procesarlo: SHALL fallar, igual que una caja que
falla al procesar (ver "Un error en una caja cancela todo lo que produce ese
mensaje"). El texto del error SHALL decir qué caja está mal configurada, en
qué parámetro y por qué. Los valores que nombre ese texto SHALL escribirse
como texto común (un número, en decimal), sea cual sea el modo en que los
muestra el panel. Una caja mal configurada a la que no llega ningún mensaje
no SHALL afectar al flujo.

#### Scenario: Canal fuera de rango en Fijar

- **GIVEN** trigger → "Fijar" (byte "Canal", valor 17) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** no sale nada, y el log marca el mensaje con error, con un texto
  que nombra la caja "Fijar", el parámetro "Valor" y que tiene que ir de 1 a
  16

#### Scenario: Los valores del error van en decimal

- **GIVEN** trigger → "Fijar" (byte "Canal", valor 100, en modo hexadecimal)
  → "Emitir", y el panel muestra que, con Canal, tiene que ir de 01 a 10
- **WHEN** llega `90 3C 64`
- **THEN** el texto del error en el log dice que tiene que ir de 1 a 16

#### Scenario: Una caja mal configurada en una rama que no se recorre

- **GIVEN** trigger → "Filtrar" (solo "Nota On") → "Mapear" (entrada de 64 a
  64) → "Emitir"
- **WHEN** llega `B0 07 64`
- **THEN** sale `B0 07 64` tal como llegó, sin error, porque el Filtrar no lo
  dejó llegar a la caja mal configurada

#### Scenario: Corregir la caja

- **GIVEN** la caja "Fijar" del primer escenario
- **WHEN** la persona usuaria cambia el valor a 10 y llega `90 3C 64`
- **THEN** sale `99 3C 64`, sin error
