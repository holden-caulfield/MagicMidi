# Design

## Context

Ver `proposal.md` (Why) para la motivación, y las specs `nodo-alternar`,
`ejecucion-de-workflow` ("Cada caja tiene su memoria") y `tipos-de-parametro`
("El parámetro secuencia", "El control de secuencia") para el comportamiento.
Lo que condiciona el diseño:

- **`procesar(mensaje, parametros)` no tiene memoria.** Un tipo de nodo es un
  objeto con una función; las cajas de un mismo tipo comparten ese objeto, y
  lo único propio de cada caja que recibe la función son sus `parametros`.
  `procesarEn` (`ejecutar.ts`) llama a `procesar` solo si la caja no tiene
  errores de configuración.
- **Ya hay una memoria de la ejecución**: lo anotado del apareo
  (`notas-prendidas.ts`), estado propio del módulo `workflow`, fuera del
  store. `main.ts` lo olvida en una suscripción al store mientras
  `estado.conectado` es `false`, y el design del apareo dejó dicho que si el
  ejecutor guardaba otra cosa, se olvidaría en el mismo lugar.
- **Lo que cambia con cada mensaje MIDI no va al store** (AGENTS.md, "Estado
  de la interfaz"): `actualizar()` haría volver a dibujar todos los
  componentes.
- **El `id` de una caja es un `crypto.randomUUID()`** (`lienzo.ts`,
  `agregarCaja`): nunca se repite, ni entre una caja borrada y una nueva.
- **Fijar ya resuelve "Byte"**: la lista Canal / datos 1 / datos 2, con el
  canal en la posición 0, y cómo poner un canal sin cambiar el tipo
  (`(status & 0xF0) | (canal - 1)`).
- **Los campos numéricos comparten `ModoNumerico`**: el modo es del campo, y
  `campo-rango` ya muestra dos números con un solo botón de modo. Ningún
  campo dibuja otro campo adentro, y un campo avisa valores, no texto.
- **El test del catálogo** llama a `procesar` de cada tipo con sus valores
  iniciales, y revisa los modos de todo parámetro que trae `modos`.

## Goals / Non-Goals

**Goals:**

- Que la memoria de una caja sea parte del contrato de los tipos de nodo, con
  un solo dueño (el ejecutor), y que un tipo nuevo con memoria (Hold, Mono, CC
  repetidos) no necesite nada más que lo que usa Alternar.
- Que un tipo con memoria se pruebe como cualquier otro: llamando a
  `procesar`, sin el ejecutor.
- Que los tipos de nodo que ya existen no cambien.
- Que el campo de la secuencia siga las reglas de los campos: un solo modo
  para toda la lista, sin campos adentro, y todo con el teclado.

**Non-Goals:**

- Reordenar los valores arrastrando: los botones de subir y bajar sirven con
  el mouse y con el teclado. Se puede sumar después sin cambiar el valor ni
  el contrato del campo.
- Mostrar en algún lado qué recuerda una caja (en qué posición va Alternar).
- Una opción para que el pánico, o un mensaje, vuelva a cero los ciclos.
- Sacar a un lugar común las opciones de "Byte" o la forma de poner un canal,
  que repiten lo de Fijar: son pocas líneas y cada tipo de nodo tiene que
  poder leerse solo.

## Decisions

### La memoria de una caja es un `Map` que guarda el ejecutor

`procesar` recibe un tercer argumento, la memoria de su caja:

```ts
procesar(
  mensaje: MensajeMidi,
  parametros: Record<string, unknown>,
  memoria: Map<string, unknown>,
): MensajeMidi | MensajeMidi[] | null | void;
```

El tipo guarda con `memoria.set(nombre, valor)` y lee con
`memoria.get(nombre)`, con los nombres que elige. Como en `parametros`, los
valores son `unknown` y el tipo los convierte al leerlos
(`Number(memoria.get(clave) ?? 0)`). Un tipo que no la usa no la declara:
TypeScript acepta una función con menos argumentos, así que los ocho tipos
de hoy no cambian.

La memoria vive en un módulo nuevo, `src/workflow/memoria-de-las-cajas.ts`,
como lo anotado del apareo: un `Map` del `id` de cada caja a su memoria, y dos
funciones:

- `memoriaDeLaCaja(id)`: la memoria de esa caja, que crea vacía la primera
  vez;
- `olvidarLaMemoriaDeLasCajas()`: vacía todo.

`procesarEn` le pasa `memoriaDeLaCaja(nodo.id)` a `procesar`, después de
revisar los errores de configuración: una caja con errores no llega a pedir
su memoria. El ejecutor no sabe qué guarda cada caja, y ninguna caja ve la
memoria de otra.

Un `Map` y no un objeto común, porque los nombres de Alternar se arman con
los bytes de cada mensaje, y `get`/`set` dicen qué es leer y qué es guardar
sin que el nombre choque con lo que ya trae un objeto.

Alternativas descartadas:

- **Estado en el archivo del tipo** (una variable del módulo): lo
  compartirían todas las cajas de ese tipo, y no se olvidaría al desconectar.
  `procesar` tampoco recibe el `id` de la caja para separarlo.
- **En el store, junto a la configuración de la caja**: cambia con cada
  mensaje, y cada cambio haría volver a dibujar toda la ventana.
- **Que el tipo declare su memoria inicial** (`memoriaInicial()`, con un tipo
  propio): más contrato para aprender, y la conversión al leer no desaparece,
  porque el catálogo generaliza todos los tipos a `TipoDeNodo`.
- **Una instancia por caja** (el tipo como clase): obliga a todos los tipos a
  cambiar de forma, y la guía de tipos de nodo tendría que explicar clases a
  quien recién empieza.

### Cuándo se olvida la memoria

`main.ts` suma `olvidarLaMemoriaDeLasCajas()` a la suscripción que ya olvida
lo anotado mientras no hay conexión:

```ts
// Sin conexión, la ejecución vuelve a cero: ni lo anotado ni la memoria de
// las cajas pasan a la próxima.
suscribir(() => {
  if (!estado.conectado) {
    olvidarNotasPrendidas();
    olvidarLaMemoriaDeLasCajas();
  }
});
```

- **Al borrar una caja no se olvida su memoria.** Como el `id` nunca se
  repite, una caja nueva arranca vacía igual, y lo que quedó de la borrada no
  lo lee nadie y se olvida al desconectar. Limpiarla al borrar obligaría al
  editor a conocer la ejecución, o a recorrer las cajas del flujo en cada
  aviso del store, para algo que no cambia lo que sale.
- **Editar el flujo no la toca**: es lo que permite cambiar la lista de un
  Alternar mientras se toca, sin que el ciclo vuelva a empezar.
- **El pánico no la olvida**, por lo mismo que no olvida lo anotado: para que
  la caja Pánico la olvidara, el ejecutor tendría que reconocer un tipo de
  nodo, y los tres accesos al pánico tienen que hacer lo mismo. Ver Risks.

### Alternar guarda la posición siguiente de cada ciclo

`procesar` de Alternar, en orden:

1. Si el mensaje no tiene lo elegido en "Byte" (sin canal, o con menos bytes
   que la posición), lo devuelve sin leer ni tocar la memoria: el ciclo no
   avanza.
2. Arma el nombre del ciclo con el mensaje tal como llegó: por cada opción
   elegida en "Un ciclo por", en el orden de las opciones, el canal o el byte
   de datos, o una marca de que falta. Sin opciones elegidas, el nombre es
   siempre el mismo, y hay un solo ciclo.
3. Lee la posición guardada con ese nombre (0 si no hay); si quedó afuera de
   la lista, usa 0.
4. Pone el valor de esa posición en el byte (el canal, como en Fijar), y
   guarda la posición siguiente: `(posicion + 1) % valores.length`.

Se guarda la posición siguiente y no la última usada porque así leer es solo
"¿está dentro de la lista?", y el caso de la lista que se acorta sale de la
misma regla. Los valores de "Byte" y "Un ciclo por" son las posiciones de los
bytes (0 para el canal, 1 y 2 para los datos), como en Fijar, así las dos
listas se leen igual.

Alternativas descartadas:

- **Guardar el valor**: con valores repetidos (`127, 80, 80, 80`) el ciclo se
  traba en el 80. Era parte del diseño acordado.
- **Volver a cero al cambiar la configuración**: obligaría a reconocer qué
  cambió, y cortaría el ciclo cada vez que se ajusta un valor mientras se
  toca.
- **Un ciclo por tipo de mensaje**: los nodos no miran el tipo (AGENTS.md);
  para separar, va un Filtrar antes.
- **Que un mensaje sin un byte de "Un ciclo por" no avance**: dejaría sin
  alternar los mensajes que sí tienen el byte de "Byte" (un Cambio de Programa
  con un ciclo por datos 2). Que falte cuenta como un valor más.

### Validación: la secuencia revisa la lista, Alternar revisa el canal

Como en Fijar, el parámetro revisa lo que no depende de otros, y la regla del
tipo, lo que depende de "Byte":

- `secuencia` (en su `validar`): que sea una lista de enteros, que no esté
  vacía y que cada valor esté entre su mínimo y su máximo, nombrando el
  primero que no cumple:
  ``formato`Los valores tienen que ir de ${minimo} a ${maximo}, y hay un ${valor}` ``;
- Alternar (en su `validar`, que corre solo si la secuencia ya está bien): con
  "Canal", el primer valor fuera de 1 a 16:
  ``formato`Con Canal, los valores tienen que ir de ${1} a ${16}, y hay un ${valor}` ``,
  asociado a `valores`.

Nombrar el valor es la forma de encontrarlo en una lista larga: el error se
muestra una sola vez, debajo de todo el campo, y la regla del canal es del
tipo de nodo, que el campo no conoce.

### El tipo de parámetro `secuencia` y su campo

`parametros/secuencia.ts` exporta `secuencia({ clave, etiqueta, inicial,
minimo, maximo, modos? })`, que devuelve el parámetro con sus `modos` ya
resueltos, como `entero` y `rango`: así el test del catálogo revisa que le
entren, sin cambios. Mínimo y máximo son obligatorios, como en el rango: el
único uso los tiene, y el botón de agregar necesita el mínimo.

`componentes/campo-secuencia.ts` define `<campo-secuencia>`, que extiende
`Campo<number[]>`:

- **Un solo `ModoNumerico`** para toda la lista, con su botón de modo en la
  fila de la etiqueta y `formatearValor` en ese modo, como `campo-rango`. Lo
  que conserva en la caja es el modo, igual que los otros numéricos.
- **`esGrupo = true`**: la etiqueta nombra al grupo, y cada campo y cada
  botón lleva su propio `aria-label` con la posición ("Valor 2", "Subir el
  valor 2"). No hace falta enlazar nada por `id`.
- **Una fila por valor, dibujada por posición** (no con `repeat` por clave):
  los valores se pueden repetir, así que no hay una clave estable, y lo que
  hay que conservar entre dibujos es la posición del foco, no el elemento.
- **Leer lo escrito**, como `campo-numero`: al salir del campo
  (`change`), `modo.leer`; si se puede leer, avisa la lista con ese valor
  cambiado; si no, vuelve a dibujar para mostrar el que tiene. Las flechas
  del teclado suman de a 1 o de a 10, con `limitar` de `campo-numero.ts`.
- **Botones propios** (`button.control`, con los íconos `ArrowUp`,
  `ArrowDown`, `X` y `Plus`), como las flechas de `campo-numero`: son partes
  del control, y el campo tiene que poder enfocarlos. `boton-de-accion` no
  delega el foco a su `<button>`.
- **El foco después de un cambio**: el campo no guarda el valor, así que
  anota a dónde tiene que ir el foco (posición y control) al avisar, y lo
  pone en `updated()`, cuando el valor nuevo ya volvió y está dibujado. Un
  botón deshabilitado no puede tener el foco: por eso, al llegar a una punta,
  el foco pasa al otro botón de mover.
- **Agregar copia el último valor**: los patrones con repetidos (`127, 80,
  80, 80`) se arman de a un clic, y la copia sirve para el mismo byte (un
  canal copiado sigue siendo un canal; el mínimo, 0, no). Con la lista vacía,
  agrega el mínimo.

Alternativas descartadas:

- **Un solo campo de texto con los valores separados por comas**: lo más
  simple de escribir, pero quitar y reordenar sería editar texto, las flechas
  no tendrían a qué valor aplicarse, y el diseño acordado pide agregar, quitar
  y reordenar.
- **Un `campo-numero` por fila**: ningún campo dibuja otro campo; cada uno
  tendría su modo, y habría que sincronizarlos.
- **Los valores en una fila, como píldoras**: no hay un "antes y después" que
  se lea bien al reordenar con el teclado, y una lista larga se corta.

### Dónde va Alternar

En `nodos/catalogo.ts`, justo después de Fijar: es Fijar con una lista. El
ícono es `Repeat` de Lucide, que no usa ningún otro tipo. Valores iniciales:
byte datos 2, valores `[127, 0]` (el latch, el caso más común) y ningún ciclo
por, sin errores.

### Documentación

- `nodos/LEEME.md`: una sección sobre la memoria, después de la de
  `procesar`, con un ejemplo corto (una caja que cuenta los mensajes que le
  llegan) y cómo probarla pasando `new Map()`; y en "Cómo escribir el test",
  que un tipo con memoria usa una memoria nueva en cada `test`, para que no
  dependan unos de otros.
- `parametros/LEEME.md`: la secuencia en "Los que hay".
- `README.md`: Alternar en "Cajas disponibles", con el latch de pedal y que,
  para alternar notas, alcanza con pasar los Nota On.

## Risks / Trade-offs

- [Después del pánico, un latch de pedal puede quedar al revés: el pánico
  levanta el pedal (CC 64 en 0), pero el ciclo sigue donde estaba, y si le
  tocaba el 0, la próxima pisada no cambia nada] → Se pierde una pisada, y la
  siguiente funciona. Es el costo de que el pánico no olvide, que sí importa
  para el apareo. Reconectar vuelve todo a cero.
- [Un mensaje que llega a Alternar por dos caminos avanza el ciclo dos veces]
  → Es la regla de siempre ("se procesa dos veces"); la spec lo dice con un
  escenario, y el README ya lo explica para Filtrar.
- [Si el Nota Off también pasa por Alternar, apaga otra nota] → Límite
  aceptado en el diseño acordado; la spec lo dice con un escenario, y el
  README y la receta del round-robin filtran solo los Nota On.
- [Con "Un ciclo por" en varias opciones, la memoria guarda un ciclo por cada
  combinación que llega] → Solo las que llegan, cada una es un nombre corto y
  un número, y se olvidan al desconectar.
- [La memoria de una caja borrada queda hasta desconectar] → Nadie la lee,
  porque el `id` no se repite. Ver "Cuándo se olvida la memoria".
- [`procesar` cambia de forma] → Los tipos que no la usan no cambian; el
  ejecutor y el test del catálogo, que llaman a `procesar` como `TipoDeNodo`,
  pasan una memoria.
- [El nombre "Un ciclo por" era tentativo en el diseño acordado] → Es solo la
  etiqueta del parámetro; cambiarlo no toca la clave ni el comportamiento.
