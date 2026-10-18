# Spec Delta

## Purpose

Que cada build de la aplicación diga de qué build se trata: un identificador
que distingue un release estable de un build de desarrollo, nombra el commit
del que se compiló, y es el mismo en la aplicación y en el release que la
publica.

## ADDED Requirements

### Requirement: Formato del identificador

Cada build SHALL tener un identificador que depende del commit del que se
compiló:

- **Estable**, si ese commit tiene el tag `v<versión>` de su misma versión:
  `<versión>+<commit>`.
- **Dev**, en cualquier otro caso: `<versión>-dev.<merges>+<commit>`, donde
  `<merges>` es la cantidad de commits de la rama principal, siguiendo solo
  el primer padre de cada merge, desde el último tag de la forma `v*`, o
  desde el principio si todavía no hay ninguno.

La versión SHALL ser la de la aplicación, la misma que llevan sus
instaladores, y el commit, su forma corta de 7 caracteres hexadecimales en
minúsculas. Si el código no está en un repositorio de git, el identificador
SHALL ser `<versión>-dev`, sin merges ni commit, y el build SHALL completarse
igual.

#### Scenario: Build estable

- **GIVEN** la versión es 0.1.0 y el commit `a897f0c` tiene el tag `v0.1.0`
- **WHEN** se compila ese commit
- **THEN** el identificador es `0.1.0+a897f0c`

#### Scenario: Build dev después de un release

- **GIVEN** el último tag es `v0.1.0`, la versión es 0.1.1, y desde ese tag
  hubo cinco merges a la rama principal, el último en el commit `b83b9c7`
- **WHEN** se compila ese commit
- **THEN** el identificador es `0.1.1-dev.5+b83b9c7`

#### Scenario: Antes del primer release

- **GIVEN** no hay ningún tag `v*`, la versión es 0.1.0 y la rama principal
  tiene 51 commits siguiendo el primer padre, el último `2eb4cca`
- **WHEN** se compila ese commit
- **THEN** el identificador es `0.1.0-dev.51+2eb4cca`

#### Scenario: El commit tiene el tag de otra versión

- **GIVEN** la versión es 0.2.0 y el commit tiene el tag `v0.3.0`
- **WHEN** se compila ese commit
- **THEN** el identificador es de dev, no estable

#### Scenario: Sin git

- **GIVEN** la versión es 0.1.1 y el código se bajó como un zip, sin el
  repositorio
- **WHEN** se compila
- **THEN** el identificador es `0.1.1-dev` y el build termina bien

### Requirement: El mismo identificador en la aplicación y en el release

El release de desarrollo SHALL llevar en su título el mismo identificador que
muestra la aplicación compilada para ese release: "Desarrollo
<identificador>". Un release estable SHALL armarse solo si el identificador
del commit del tag es estable: si no lo es, porque el tag no coincide con la
versión, la publicación SHALL fallar antes de compilar, sin dejar ningún
release.

#### Scenario: Merge a la rama principal

- **WHEN** termina la publicación del canal de desarrollo para el commit
  `b83b9c7`, el quinto merge desde `v0.1.0`, con la versión 0.1.1
- **THEN** el release se titula "Desarrollo 0.1.1-dev.5+b83b9c7", y la
  aplicación que se baja de ese release muestra `0.1.1-dev.5+b83b9c7`

#### Scenario: Release estable

- **WHEN** se sube el tag `v0.2.0` sobre un commit con la versión 0.2.0
- **THEN** el borrador del release trae binarios que muestran
  `0.2.0+<commit>`, con el commit del tag

#### Scenario: Tag que no coincide con la versión

- **GIVEN** la versión es 0.2.0
- **WHEN** se sube el tag `v0.3.0`
- **THEN** la publicación falla antes de compilar y no aparece ningún release
  `v0.3.0`
