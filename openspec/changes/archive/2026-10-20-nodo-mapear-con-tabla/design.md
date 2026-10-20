# Design

## Context

Ver `proposal.md` (Why) para la motivación, y las specs `nodo-mapear`,
`nodo-interpolar` y `tipos-de-parametro` ("El parámetro mapa", "El control de
mapa") para el comportamiento. Lo que condiciona el diseño:

- **El identificador de un tipo de nodo es la clave del catálogo**
  (`nodos/catalogo.ts`), y cada caja del flujo guarda el suyo en `tipo`. El
  flujo vive en `estado.flujo` mientras dura la sesión y no se guarda en
  ningún lado, así que hoy ningún dato fuera del código depende de que la caja
  lineal se llame `mapear`.
- **Fijar y Alternar ya resuelven "Byte"**: la lista Canal, datos 1 y datos 2,
  con el canal en la posición 0, cómo leerlo (`mensaje.canal`) y cómo ponerlo
  sin cambiar el tipo (`(status & 0xF0) | (canal - 1)`). Cada tipo de nodo
  repite esas líneas a propósito, para poder leerse solo.
- **`campo-secuencia` es lo más parecido al campo nuevo**: una lista de
  números con un solo `ModoNumerico`, filas dibujadas por posición, `esGrupo`,
  botones propios y el foco anotado al avisar y puesto en `updated()`.
- **El panel de configuración mide 220px**, unos 212 útiles. Un campo de 64px
  entra justo para la nota más larga ("D#-1").
- **Un tipo de parámetro dice si un valor le sirve con `validar`**, que
  devuelve un solo texto; el campo lo muestra debajo del control y marca el
  grupo como inválido, sin saber a qué parte del valor se refiere.
- **El test del catálogo** llama a `procesar` de cada tipo con sus valores
  iniciales, y revisa los modos de todo parámetro que trae `modos`: cubre el
  mapa sin cambios.

## Goals / Non-Goals

**Goals:**

- Que el cambio de nombre no cambie nada del comportamiento de la caja lineal:
  sus tests siguen iguales, salvo el nombre.
- Que el `procesar` de Mapear se lea de una vez, sin saber cómo está hecho el
  campo: buscar el par y poner su salida.
- Que el mapa sea un tipo de parámetro como los demás: un archivo, sin
  componentes propios, con su campo en `src/componentes/`.
- Que la forma del valor deje lugar para extender el tipo más adelante (otra
  clase de valores, un límite de filas) sin cambiar lo que ya existe.

**Non-Goals:**

- Llenar el mapa tocando (la idea "Aprender tocando" del roadmap). Encaja bien
  con este campo, pero es otro cambio.
- Rangos como entrada ("de C3 a D3 → C2"), o una salida para los valores que
  no están en el mapa. Lo que no está pasa sin cambios, y lo que haga falta
  descartar se arma con Filtrar.
- Ordenar el mapa solo, o reordenarlo a mano: el orden no cambia el resultado.
- Marcar uno por uno los campos de los valores que nombra un error (ver
  Risks).
- Compartir código entre `campo-secuencia` y `campo-mapa` (ver Decisions).
- Migrar flujos guardados: no hay.

## Decisions

### El renombre cambia el archivo, el nombre y el identificador

`nodos/mapear.ts` pasa a `nodos/interpolar.ts` (y su test), con
`nombre: "Interpolar"` y la clave `interpolar` en el catálogo, en el mismo
lugar de la lista. La caja nueva toma `nodos/mapear.ts` y la clave `mapear`,
justo después. El ícono de Interpolar sigue siendo `AlignCenterHorizontal`.

El renombre va en un commit propio, antes de crear el `mapear.ts` nuevo: si
los dos cambios van juntos, git ve un `mapear.ts` modificado y un
`interpolar.ts` nuevo, y la historia de la caja lineal queda del lado
equivocado.

Alternativa descartada:

- **Dejar la clave `mapear` en la caja lineal** y darle otra a la nueva
  (`mapearConTabla`), cambiando solo el nombre visible: la clave y el nombre
  se contradirían, y el catálogo es lo primero que lee quien crea un tipo de
  nodo. Como nada guardado depende de la clave, reusarla no cuesta nada.
  Cuando llegue "Guardar y cargar workflows", las claves pasan a ser parte del
  formato, y un cambio así ya necesitaría migración.

### El valor del mapa es una lista de pares `{ entrada, salida }`

El valor es `Mapa`, una lista de `Par` (`{ entrada: number; salida: number }`),
los dos tipos exportados por `componentes/campo-mapa.ts`, como `Rango` lo
exporta `campo-rango.ts`. En Mapear se lee así:

```ts
const mapa = parametros.mapa as Mapa;
const par = mapa.find((par) => par.entrada === valor);
```

Alternativas descartadas:

- **Un objeto o un `Map` con la entrada como clave**: un objeto de JavaScript
  ordena las claves numéricas de menor a mayor, así que los pares saltarían de
  lugar mientras se editan. Además no podría guardar una entrada repetida, y
  lo que se lee pero no sirve se guarda y se muestra con su error: con claves,
  la segunda pisaría a la primera sin avisar.
- **Pares como `[entrada, salida]`**: es más corto, pero `par.entrada` se lee
  mejor que `par[0]` para quien recién empieza.

Si más adelante la entrada o la salida tuvieran que ser otra cosa que un
número, `Par` pasa a tener los tipos como parámetros (`Par<E, S>`), y un
límite de filas es un dato más de la declaración. Nada de eso se hace ahora.

### El tipo revisa que no se repita una entrada; Mapear revisa el canal

`mapa.ts` revisa, en este orden, la forma (una lista de pares de enteros),
el rango (el primer valor afuera, recorriendo los pares en orden y la entrada
antes que la salida) y las entradas repetidas. Que una entrada lleve a una
sola salida es lo que hace que algo sea un mapa, sea cual sea la caja que lo
usa: si lo revisara el nodo, cada caja con un mapa lo tendría que repetir, y
el `find` de Mapear tendría que decidir cuál de las repetidas gana.

El `validar` de Mapear revisa solo la regla entre parámetros: con Canal,
entradas y salidas de 1 a 16, con el mismo texto que Alternar ("Con Canal,
los valores tienen que ir de 1 a 16, y hay un 17"). Como `validar` del nodo
corre solo si cada parámetro está bien, un mapa con una entrada repetida
muestra ese error y no el del canal.

### Mapear cambia el valor una sola vez

`procesar` lee el valor del byte elegido (el canal, de 1 a 16, o el byte de
datos), busca el par con esa entrada y, si lo hay, escribe su salida. Si el
mensaje no tiene ese byte, o el valor no está en el mapa, devuelve el mensaje
como llegó. Como busca una sola vez, la salida de un par nunca se vuelve a
buscar como entrada: así se pueden intercambiar dos notas, que es un caso
real al acomodar un mapa de batería.

Los parámetros:

```ts
lista({ clave: "byte", etiqueta: "Byte", inicial: 1, opciones: [Canal, datos 1, datos 2] }),
mapa({
  clave: "mapa",
  etiqueta: "Mapa",
  inicial: [],
  minimo: 0,
  maximo: 127,
  modos: ["nota", "decimal", "hexadecimal"],
  textoDeAyuda: "Sin pares: todo pasa sin cambios.",
}),
```

- La etiqueta es "Mapa" y no "Notas": con Canal o con datos 2, los valores no
  son notas.
- Arranca vacío: un par de ejemplo cambiaría mensajes apenas se conecta la
  caja. Vacío no cambia nada, como Interpolar con sus valores iniciales.
- Arranca en modo nota porque arranca en datos 1, y el caso principal son las
  notas. Los otros dos modos siguen a un clic.

### El texto de ayuda lo declara quien usa el mapa

Qué significa un mapa vacío depende de la caja: en Mapear, que todo pasa sin
cambios, pero otra caja podría usarlo para otra cosa. Por eso el texto no es
del campo ni del tipo: el tipo acepta un `textoDeAyuda` opcional, como
`autocompletar`, y se lo pasa al campo, que lo muestra en lugar de los pares
cuando no hay ninguno.

### El campo del mapa

`campo-mapa` extiende `Campo<Mapa>` y sigue el molde de `campo-secuencia`:

- **Un solo `ModoNumerico`** para todas las entradas y salidas, con su botón
  en la fila de la etiqueta y `formatearValor` en ese modo, así el error
  nombra el valor como se ve en el campo ("La entrada C3 está más de una
  vez"). Lo que conserva en la caja es el modo.
- **`esGrupo = true`**: la etiqueta nombra al grupo, y cada campo y cada botón
  lleva su `aria-label` con la posición ("Entrada 2", "Salida 2", "Quitar el
  par 2"). La flecha (`ArrowRight` de Lucide) es decorativa.
- **Una fila por par, dibujada por posición**: mientras hay una entrada
  repetida no hay una clave estable. Una fila mide unos 165px: dos campos de
  64px, la flecha en 16px y el botón de quitar en 20px.
- **Sin títulos de columna ni botones para mover**: la flecha dice cuál es
  cuál, y el orden no cambia el resultado. Los pares quedan en el orden en que
  se agregaron.
- **Leer lo escrito y las flechas del teclado**, como en `campo-secuencia`:
  al salir del campo, `modo.leer`; si se puede leer, avisa el mapa con ese
  valor cambiado, y si no, vuelve a dibujar para mostrar el que tiene. Las
  flechas suman de a 1, o con Mayúsculas el paso del modo, con `limitar`.
- **El foco después de quitar o agregar**: se anota al avisar y se pone en
  `updated()`, cuando el mapa nuevo ya volvió y está dibujado.
- **Agregar** usa `siguienteEntrada(mapa, minimo, maximo)`, una función pura
  exportada por el mismo archivo para poder probarla sin la interfaz: busca
  desde la entrada del último par más uno hasta el máximo, después desde el
  mínimo, y devuelve la primera que no es entrada de ningún par, o `null` si
  no hay ninguna. Con `null`, el botón se ve deshabilitado. El par nuevo sale
  igual que entra, así no cambia nada hasta que se lo edita.

Alternativas descartadas:

- **Títulos "Entrada" y "Salida" sobre las columnas**: los tenía la primera
  maqueta. Ocupan una fila sin decir más que la flecha, y los lectores de
  pantalla ya anuncian cada campo con su lado.
- **Sacar a un controlador lo que comparte con `campo-secuencia`** (anotar el
  foco y ponerlo después de dibujar): lo común son unas ocho líneas, y a dónde
  va el foco es distinto en cada campo (la secuencia mueve valores). Además
  obligaría a tocar `campo-secuencia` en un cambio que no es suyo. Si aparece
  un tercer campo con filas, se saca entonces.
- **Agregar una copia del último par**, como la secuencia: crearía una entrada
  repetida en cada clic, con su error, antes de que se pueda editar.
- **Que el par nuevo arranque en C4** cuando el mapa está vacío: el tipo
  tendría que saber de notas. Arranca en el mínimo, como la secuencia.

### Documentación

- `README.md`: Interpolar donde estaba Mapear, y Mapear nuevo después, con el
  ejemplo de los pads y el mapa de batería, y que para cambiar solo las notas
  va un Filtrar antes.
- `nodos/LEEME.md`: la lista del catálogo del ejemplo, la regla de `validar`
  que usaba la entrada de Mapear y la nota sobre la velocidad pasan a
  Interpolar.
- `parametros/LEEME.md`: el mapa en "Los que hay" (con `textoDeAyuda`),
  `campo-mapa` en la lista de campos y en "Los modos de los números", y el
  ejemplo del rango invertible pasa a Interpolar.
- `nodos/catalogo.test.ts`: el comentario que dice que los numéricos son "el
  entero y el rango" pasa a nombrar a todos los que llevan modos, sin
  enumerarlos.

## Risks / Trade-offs

- [Quien ya usaba Mapear no lo encuentra con ese nombre] → La caja lineal
  conserva su ícono y su lugar en la barra, y la nueva queda justo al lado. El
  README explica las dos.
- [En un mapa largo, cuesta encontrar la entrada repetida] → El error nombra
  el valor en el modo del campo, y los pares quedan en el orden en que se
  escribieron. Marcar los campos uno por uno, como en la maqueta, obligaría a
  que `validar` diga a qué parte del valor se refiere, un cambio en el
  contrato de todos los tipos de parámetro. Se puede sumar después si hace
  falta.
- [Con Canal, el primer par de un mapa vacío es 0 → 0, que es un error] → Pasa
  lo mismo con Alternar. El error lo explica, y la persona cambia el valor en
  el mismo lugar.
- [Las claves `mapear` e `interpolar` y la forma del valor van a ser parte del
  formato de los flujos guardados] → Es lo que justifica renombrar ahora. El
  cambio de "Guardar y cargar workflows" tiene que tratarlas como un contrato.
- [Muchos pares alargan el panel] → El panel se desplaza hacia abajo, como con
  la secuencia. Un mapa de batería tiene entre diez y veinte pares.

## Migration Plan

No hay datos que migrar: los flujos no se guardan entre sesiones. Al
actualizar la aplicación, la caja lineal aparece como Interpolar. Para volver
atrás alcanza con revertir el cambio.
