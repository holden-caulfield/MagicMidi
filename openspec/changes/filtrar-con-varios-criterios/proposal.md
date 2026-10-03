# Proposal

## Why

Filtrar hoy solo elige tipos de mensaje, con una casilla por tipo, y trata
todos los mensajes de sistema como uno solo. Varios arreglos muy comunes en un
setup MIDI piden más: quedarse con un canal (o sacar la batería del 10),
partir el teclado en zonas (notas de 36 a 59 para un sonido, de 60 en adelante
para otro), separar capas de velocidad, o elegir un controlador puntual (el CC
7 y no los demás). Hoy no hay forma de armar ninguno sin escribir un nodo
propio, y tampoco de dejar pasar, por ejemplo, Start y Stop pero no SysEx.

## What Changes

- **Filtrar pasa a tener tres criterios en una misma caja**, que se combinan
  con "y": un mensaje pasa solo si cumple todos los que estén configurados.
  Un criterio sin configurar no restringe nada.
  - **Tipos de mensaje**: un solo parámetro con autocompletar, en lugar de
    una casilla por tipo. Dentro del criterio, las opciones elegidas se
    combinan con "o" (pasa un Nota On *o* un Nota Off).
  - **Canales**: opciones, del 1 al 16. Un mensaje sin canal (de
    sistema) no pasa si hay canales elegidos.
  - **Rango de datos 1 y de datos 2**: un "desde" y un "hasta" para el 2.º y
    el 3.º byte, de 0 a 127. Sirve para un rango de notas, de velocidades, de
    números de controlador o de valores. El rango completo (0 a 127) no
    restringe; uno más chico deja afuera a los mensajes que no tienen ese
    byte. "Desde" mayor que "hasta" es un error de configuración.
- **BREAKING** (Filtrar): una caja nueva, o una sin nada elegido, **deja pasar
  todo**, en lugar de nada. Es lo coherente con criterios que se suman: no
  elegir tipos quiere decir "cualquier tipo", igual que no elegir canales. El
  flujo no se guarda entre sesiones, así que no hay cajas viejas que migrar.
- **Los mensajes de sistema se eligen de a uno**: "Mensajes de sistema" se
  reemplaza por SysEx, Cuadro de Tiempo (MTC), Posición de Canción, Selección
  de Canción, Solicitud de Afinación, Inicio, Continuar, Detener y Reset del
  Sistema. El reloj y el Sensor Activo no se ofrecen porque nunca llegan al
  flujo.
- **El tipo que lee el mensaje distingue cada mensaje de sistema**, en lugar
  de devolver "sistema" para todos. Los status de sistema no definidos (`F4`,
  `F5`, `F7`, `F9`, `FD`) tienen su propio tipo, que no se puede elegir en
  Filtrar. La descripción del log no cambia.
- **El tipo de parámetro "opciones" de hoy (elegir una) pasa a llamarse
  "lista"**, sin cambiar lo que hace ni cómo se ve, para que "opciones" nombre
  a las píldoras.
- **Dos tipos de parámetro nuevos para elegir varias opciones** de una lista
  cerrada (ninguna incluida), con el mismo valor (la lista de los elegidos) y
  la misma regla de validación:
  - **opciones**: todas las opciones a la vista, como píldoras que se
    encienden y se apagan, acomodadas en filas. Para pocas opciones cortas:
    los canales.
  - **autocompletar**: un campo que, al entrar, despliega las opciones que
    faltan elegir y las va filtrando mientras se escribe; las elegidas quedan
    debajo, cada una con un botón para quitarla, y sin ninguna elegida se ve
    un texto de ayuda ("Cualquier tipo"). Para listas largas: los
    tipos de mensaje.
- La **unión** ("o") entre criterios distintos (por ejemplo, "Nota On, o
  cualquier cosa del canal 10") se arma con dos cajas Filtrar en paralelo que
  llegan a la misma caja. La guía y el README explican que un mensaje que
  cumple los dos caminos llega dos veces, como cualquier mensaje que llega por
  dos caminos, y cómo armar los dos filtros para que no se pisen.
- Se descarta, por ahora, un parámetro de "reglas" estilo planilla de cálculo
  ("es igual a", "es mayor que", …): los rangos cubren igual, mayor, menor y
  entre, y lo demás se arma con varias cajas (ver `design.md`).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `nodo-filtrar`: los parámetros pasan a ser tipos, canales y dos rangos de
  datos; los criterios se combinan con "y"; una caja sin nada configurado deja
  pasar todo; los mensajes de sistema se eligen de a uno; nueva regla de
  validación para los rangos.
- `tipos-de-parametro`: se suman los tipos opciones y autocompletar; el que
  elige una sola opción pasa a llamarse lista; los tipos disponibles pasan a
  ser cinco; la etiqueta de un control que es un
  grupo nombra al grupo.
- `tipos-de-nodo`: la lectura del tipo de un mensaje distingue cada mensaje de
  sistema.

## Impact

- Código nuevo: `src/workflow/parametros/opciones.ts` (las píldoras) y
  `autocompletar.ts`, con sus tests.
- Renombre: `parametros/opciones.ts` de hoy pasa a ser `lista.ts`, y
  `nodos/desplazar.ts`, `fijar.ts` y `mapear.ts` lo declaran como
  `tipo: "lista"`.
- Código que cambia: `src/midi/mensaje.ts` (tipos de sistema, lista de tipos
  elegibles y sus nombres) y su test, `src/midi/describir.ts` (deja de
  preguntar por `"sistema"`, sin cambiar los textos),
  `src/workflow/nodos/filtrar.ts` y su test, `parametros/catalogo.ts` (el
  valor de un parámetro puede ser una lista),
  `parametros/campo-de-parametro.ts` (la etiqueta de un grupo de controles),
  `parametros/LEEME.md` y `nodos/LEEME.md` (el nombre `lista`).
- Documentación: `nodos/LEEME.md` (la lista de tipos, cómo armar un "o"),
  `parametros/LEEME.md` (el tipo nuevo), la sección "Qué hace hoy" de
  `README.md`.
- Sin cambios en el backend, en el ejecutor ni en el formato de los mensajes.
