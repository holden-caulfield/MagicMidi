# Design

## Context

Ver proposal.md (Why). Lo que condiciona el enfoque:

- Hoy cada tipo numérico tiene un componente intermedio (`parametro-entero`,
  `parametro-rango`) que extiende `CampoDeParametro`, recibe la presentación,
  interpreta el texto que avisa `campo-numero` (`cambio` y `paso`), avisa
  `cambio-de-presentacion` y le pasa al campo `formatear`, `leer` y `modo`.
  Los otros cuatro tipos tienen el mismo componente intermedio, que solo
  reenvía `cambio`.
- `campo-rango` dibuja dos `campo-numero` compactos dentro de su raíz y
  resuelve los pasos de sus flechas con `pasarExtremo`, que frena un extremo
  en el otro si el rango no se puede invertir.
- `Campo` dibuja el botón de modo con la propiedad `modo` y avisa
  `siguiente-modo`; qué modos hay lo sabe el tipo.
- El panel de configuración dibuja los parámetros con `map`, así que al pasar
  de una caja a otra Lit reusa los elementos por posición.
- Los errores se calculan con `erroresDeConfiguracion(tipo, parametros,
  presentaciones)`, que usan el panel, el lienzo, el ejecutor y
  `nodos/catalogo.test.ts`. El texto ya viene escrito en el modo del
  parámetro, y el mismo texto va al log.
- Los tipos de nodo no pueden importar módulos de la interfaz (requisito no
  negociable de `tipos-de-nodo`), y Fijar es el único que hoy nombra
  números en un error.
- El flujo vive solo en memoria: no hay cajas guardadas que migrar.
- Los `campo-…` y los `parametro-…` tienen `:host { display: block }`, y el
  panel envuelve cada parámetro en un `div.parametro` con `display:
  contents`, que es donde escucha los eventos.

## Goals / Non-Goals

**Goals:**

- Que el modo viva en un solo lugar, el campo, y que nadie más que el campo
  lo lea.
- Que un tipo de parámetro sea declaración, `validar` y `dibujar`, sin
  componentes propios.
- Que la huella de la interfaz dé igual antes y después, y que el
  comportamiento de los modos (spec `tipos-de-parametro`) no cambie, salvo el
  log, que escribe los valores en decimal.

**Non-Goals:**

- Un campo de texto o un campo real: el ejemplo de la guía usa
  `campo-numero`, y un campo nuevo se hace cuando un tipo lo necesite.
- Context de Lit: lo único que cambia de un parámetro a otro es lo que se le
  pasa a su campo, y el contexto no evita pasarlo (descartado en la
  revisión).
- Cambiar los modos, cómo se leen o el botón: solo cambia de dueño.
- Guardar el flujo entre sesiones.

## Decisions

### `ModoNumerico` es un controlador reactivo, con las funciones puras aparte

`componentes/modos.ts` es el `parametros/modos.ts` de hoy mudado, con sus
tests: `Modo`, `MODOS_POR_DEFECTO`, `DeclaracionNumerica` (los modos y los
límites que recibe un campo numérico), `modosDe`, `siguienteModo`,
`textoDelModo`, `formatear` y `leer`. `Presentacion` pasa a llamarse
`EstadoNumerico` (`{ modo, bemoles }`), y `presentacionActual`,
`estadoRevisado`. Importa `nombreDeNota` y `numeroDeNota` de
`@/midi/notas`.

`componentes/modo-numerico.ts` define `ModoNumerico`, que implementa
`ReactiveController` y lo agregan `campo-numero` y `campo-rango`. Guarda el
`EstadoNumerico` actual y le pide al campo, en cada uso, sus `modos`,
`minimo` y `maximo`. Ofrece:

- `formatear(numero)`, en el modo actual;
- `leer(texto)`: el número, o `null`; si se leyó en otro modo, o cambian los
  bemoles, cambia el estado;
- `siguiente()`, para el botón;
- `boton`: lo que muestra el botón de modo, o `null` con un solo modo;
- `recuperar(guardado)`: adopta un estado guardado, revisado con
  `estadoRevisado` (si falta o su modo no se ofrece, el primero, con
  sostenidos).

Cuando el estado cambia desde el campo (el botón, leer en otro modo, o un
campo hijo del rango), el controlador pide un redibujado y el campo avisa
`cambio-de-estado`. `recuperar` no avisa nada: así, cuando el panel le
devuelve al campo lo que guardó, no se arma un ida y vuelta sin fin.

El campo llama a `recuperar` en `willUpdate` cuando cambian `estado` o
`modos`: la primera vez es al montarse, y después sirve para que el rango
maneje a sus dos campos (ver más abajo).

Alternativas: un mixin (con decoradores *legacy* y la base genérica
`Campo<V>` el tipado se complica y se lee peor; descartado en la revisión);
dejar el estado en el tipo de parámetro (es lo que hay hoy).

### `campo-numero` recibe y avisa números, y maneja sus flechas

Propiedades: `valor: number`, `modos`, `minimo`, `maximo` (opcionales) y
`estado`. Al salir del campo lee lo escrito con el controlador: si se puede
leer, avisa `cambio` con el número (y, antes, `cambio-de-estado` si cambió el
modo o los bemoles, como hoy se avisa primero la presentación); si no, se
vuelve a dibujar con el valor que tiene, sin avisar nada.

Las flechas (las propias y las del teclado) leen lo escrito en ese momento,
le suman el paso y lo frenan en `minimo` y `maximo` con una función pura
`limitar`, que se muda de `entero.ts` a `campo-numero.ts` con su test. Las
flechas propias se deshabilitan solas con el valor en un límite.
Desaparecen el evento `paso`, `Paso`, `puedeSubir`, `puedeBajar` y
`decimales` (este último solo lo usaba el ejemplo `real` de la guía).

### El rango tiene un modo y se lo pasa a sus dos campos

`campo-rango` agrega su propio `ModoNumerico` y recibe `modos`, `minimo`,
`maximo`, `invertible` y `estado`. A cada `campo-numero` compacto le pasa
`.estado` (el estado de su controlador), los mismos `modos` y los límites de
ese extremo, y escucha de cada uno:

- `cambio-de-estado`: lo adopta en su controlador como un cambio propio, así
  el otro extremo pasa a mostrarse igual y el rango lo avisa hacia afuera.
  El evento del campo hijo no sale de la raíz del rango (no es `composed`);
- `cambio`: avisa el rango con ese extremo cambiado.

Los límites de cada extremo hacen que las flechas se frenen como la perilla:
"desde" va de `minimo` a `hasta`, y "hasta", de `desde` a `maximo`, salvo
que el rango se pueda invertir, en cuyo caso los dos van de `minimo` a
`maximo`. Es una función pura, `limitesDelExtremo`, que reemplaza a
`pasarExtremo` en los tests. Lo escrito no se frena: se guarda y, si no
sirve, el panel muestra el error, como hoy.

Se van las propiedades `formatear` y `leer` y la función
`interpretarExtremo`: la perilla anuncia su valor con el controlador.

Alternativa: que el campo hijo avise el paso sin frenar y el rango lo frene
con `moverExtremo`. Para eso el hijo tendría que distinguir un paso de lo
escrito, que es el evento `paso` que este cambio saca.

### `Campo` dibuja el botón con lo que le da el campo, y escribe el error

`Campo` deja la propiedad `modo` y el evento `siguiente-modo`. Un campo que
tiene modo redefine `protected modo()`, que devuelve el texto del botón y
qué hacer al activarlo (o `null`); `Campo` sigue dibujando el botón junto a la
etiqueta, con el mismo `aria-label`.

`error` pasa a ser `string | TextoConValores | null`. `Campo` lo escribe con
`escribir(this.error, (valor) => this.formatearValor(valor))`, y
`formatearValor` es `String` salvo en los numéricos, que escriben un número
en su modo y el resto con `String`.

`Campo` declara también `estado` (lo que el campo guardó en la caja, que los
campos que no conservan nada ignoran) y `avisarEstado`, que avisa
`cambio-de-estado`. `avisar` y `avisarEstado` van con `bubbles: true`, sin
`composed`: llegan al panel, que es de la misma raíz, y no salen de la de un
rango.

Alternativa: declarar `estado` solo en los dos campos numéricos. Se descarta
porque el panel escucha `cambio-de-estado` en cualquier campo, y el
protocolo (valor y estado, cada uno con su aviso) queda escrito en un solo
lugar.

### `formato` es un módulo propio, `src/formato.ts`

```ts
export interface TextoConValores { partes: string[]; valores: unknown[] }
export function formato(partes: TemplateStringsArray, ...valores: unknown[]): TextoConValores;
export function escribir(texto: string | TextoConValores, escribirValor = String): string;
```

Es un archivo suelto de `src/`, así que es un módulo propio: lo importan
`Campo`, los tipos de parámetro, `workflow/tipos.ts`, Fijar y el ejecutor.
No va en `componentes/`, como decía la revisión, porque los tipos de nodo no
pueden importar módulos de la interfaz; y no va en `workflow/`, porque
`componentes/` no depende de `workflow/`. `formato` copia las partes a un
arreglo común, así un test compara con `toEqual` dos textos escritos en
lugares distintos: `expect(validar(…)).toEqual(formato\`Tiene que ir de ${0} a
${127}\`)`.

Los mensajes sin valores siguen siendo `string`.
`ErrorDeConfiguracion.mensaje` es `string | TextoConValores`.

### Las firmas y el catálogo

- `TipoDeParametro`: `validar(parametro, valor)` y `dibujar(parametro, valor,
  error, estado)`, donde `error` es lo que devolvió `validar`. Se van
  `formatear` y `formatearParametro`. `validarParametro(parametro, valor)` y
  `dibujarParametro(parametro, valor, error, estado)`.
- `erroresDeConfiguracion(tipo, parametros)`; `TipoDeNodo.validar(parametros)`.
- El ejecutor arma su texto con `escribir(primerError.mensaje)`. El lienzo
  llama a `erroresDeConfiguracion(tipo, nodo.parametros)` y solo mira si hay.

### El `error` de los tipos de parámetro se llama `validar`

La función dice si un valor le sirve al parámetro, así que se nombra con un
verbo, como `dibujar` al lado y como el `validar` de los tipos de nodo; el
sustantivo `error` queda para lo que devuelve, que es el nombre que ya tiene el
argumento de `dibujar`. Se renombra en los seis tipos, en `TipoDeParametro`,
en `errorDelParametro` (que pasa a `validarParametro`), en los tests y en la
guía.

Los dos `validar` tienen contratos distintos, y el de cada uno lo dice su
JSDoc: el de un tipo de parámetro revisa un valor solo y devuelve un texto o
`null`; el de un tipo de nodo revisa varios parámetros juntos y devuelve una
lista de errores, cada uno con su `clave`. No se cruzan: uno vive en el
catálogo de parámetros y el otro en la declaración de cada tipo de nodo.

Alternativa: dejar `error`, como decía la revisión. Se descarta porque nombra
el resultado y no lo que hace la función, y obliga a otro nombre para la
variable que lo guarda.

### Un tipo de parámetro dibuja su campo directamente

`dibujar` devuelve el `campo-…` con la etiqueta, el valor, el error y los
datos de la declaración; los numéricos, también `.modos`, `.minimo`,
`.maximo` y `.estado`. Los seis `@customElement("parametro-…")` y
`campo-de-parametro.ts` desaparecen; `ParametroBase` pasa a
`parametros/parametro.ts`. Los campos no tienen estilos de `CampoDeParametro`
que extrañar: los dos son `display: block`, así que el panel tiene que verse
igual.

### `estadoDeLosParametros` en la caja, y el panel atado por caja y parámetro

`NodoDelFlujo.presentaciones` pasa a `estadoDeLosParametros?: Record<string,
unknown>`, con el mismo contenido para los numéricos. `panel-de-configuracion`
reemplaza `cambiarPresentacion` por `cambiarEstado`, que escucha
`cambio-de-estado` en el `div.parametro`, y le pasa a `dibujarParametro` el
de ese parámetro. Los parámetros se dibujan con `repeat` y la clave
`${nodo.id}/${parametro.clave}`, así al pasar de una caja a otra los campos
se crean de nuevo y ninguno arrastra el estado de otra caja (el modo, pero
también, por ejemplo, lo escrito en un autocompletar).

### Las notas en `midi/notas.ts`

`nombreDeNota` y `numeroDeNota` (con `NOMBRES_DE_NOTA`, los bemoles y los
semitonos) pasan a `midi/notas.ts`, y sus tests de `describir.test.ts`, a
`notas.test.ts`. `describir.ts` las importa de ahí.

### Los tests

- `entero.test.ts`: quedan los de `validar`, comparando con `formato`; los de
  interpretar van a `componentes/modos.test.ts` (los que no estén ya), y el
  de `limitar`, a `campo-numero.test.ts`.
- `rango.test.ts`: prueba `validar` y compara con `formato`, y se va el del
  modo. `opciones.test.ts` y `autocompletar.test.ts` pasan a `validar`.
- `validacion.test.ts`: se van los de presentación; quedan los de cómo se
  combinan los errores. Los de escribir un texto con valores van a
  `formato.test.ts`.
- `fijar.test.ts`: `validar` sin `enDecimal`, comparando con `formato`; el
  test de los errores en hexadecimal pasa a revisar que el 1 y el 16 van
  marcados como valores.
- `desplazar.test.ts`: lo que hoy prueba con `interpretar` lo prueba con
  `leer` y la declaración del desplazamiento.
- `campo-rango.test.ts`: `limitesDelExtremo` reemplaza a `pasarExtremo` y a
  `interpretarExtremo`.
- `nodos/catalogo.test.ts` importa `modosDe` de `@/componentes/modos`.

### El orden, para que cada paso compile

1. Una prueba de los modos en `verificacion-para-agentes/` y la huella, sobre
   el código actual, como referencia.
2. `midi/notas.ts` y la mudanza de `modos.ts`.
3. `src/formato.ts`, sin usarlo todavía.
4. Los campos con `ModoNumerico`: `campo-numero`, `campo-rango` y `Campo`, y
   `parametro-entero` y `parametro-rango` pasan a darles modos, límites y
   estado (todavía con la presentación como estado). El panel pasa a
   `repeat`.
5. Los mensajes con valores: `error` pasa a `validar` en los tipos de
   parámetro, `formato` en los del entero y el rango y en Fijar, las firmas
   nuevas, el ejecutor y el lienzo.
6. Sin los `parametro-…`: `dibujar` dibuja el campo, `Campo` avisa con
   `bubbles`, y `presentaciones` pasa a `estadoDeLosParametros`.
7. Las guías, la verificación y el diff de AGENTS.md.

### La verificación

Además de la huella, una prueba nueva, `pruebas/modos.js`, que maneja el
panel solo con lo que se ve (escribir, salir del campo, flechas con
`keydown`, el botón de modo, seleccionar otra caja con un clic) y lee lo que
muestran los campos y los errores. Se corre antes y después del cambio, y
tiene que dar lo mismo. Incluye pasar de una caja con un modo cambiado a otra
que nunca lo cambió: hoy no hay problema, porque el modo sale de la caja, pero
con el modo en el campo es lo que rompería un panel sin `repeat`. Lo que se
dispara con `keydown` en el campo no es la activación de un botón nativo, así
que funciona con las herramientas.

## Risks / Trade-offs

- [El panel devuelve lo guardado y el campo vuelve a avisarlo] → `recuperar`
  no avisa; solo avisan los cambios que nacen en el campo.
- [El rango le pasa a sus campos un objeto de estado nuevo en cada dibujado]
  → el campo lo adopta sin avisar, así que solo cuesta revisarlo.
- [Sin los `parametro-…`, algo del panel se acomoda distinto, por ejemplo lo
  que flota sobre los parámetros siguientes] → la huella antes y después, y
  la prueba de configuración.
- [TypeScript no comprueba que los valores de `formato` sean de la clase del
  campo, porque el error se asocia por `clave` en tiempo de ejecución] → el
  campo escribe con `String` lo que no reconoce (decidido en la revisión).
- [El log deja de escribir los valores como el panel] → es el comportamiento
  buscado, y queda en las specs `ejecucion-de-workflow` y `tipos-de-nodo`.
- [Los límites de las flechas del rango dependen del otro extremo] → una
  función pura con su test, y la prueba de los modos aprieta las flechas en
  los campos del rango.

## Migration Plan

No hay datos que migrar: el flujo vive en memoria. Se vuelve atrás
revirtiendo la rama.
