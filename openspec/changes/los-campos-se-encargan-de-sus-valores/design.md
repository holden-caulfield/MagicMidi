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

### `ModoNumerico`: un controlador, único dueño del modo

`componentes/modo-numerico.ts` reemplaza al `parametros/modos.ts` de hoy.
Tiene el tipo `Modo`, `MODOS_POR_DEFECTO`, una tabla `MODOS` con lo único
que cambia de un modo a otro (la abreviatura, el nombre, cómo se escribe y
cómo se lee un número) y la clase `ModoNumerico`, un `ReactiveController`
que agregan `campo-numero` y `campo-rango`. La clase guarda el modo y si las
notas van con bemoles, y ofrece:

- `formatear(numero)`, en el modo actual;
- `leer(texto)`: el número, o `null`; si se leyó en otro modo, o una nota
  cambió los bemoles, el campo pasa a ese estado;
- `boton`: lo que muestra el botón de modo y qué hacer al activarlo, o `null`
  con un solo modo.

Cada cambio pide un redibujado y se avisa con `cambio-de-estado`. Del campo,
el controlador lee solo `modos` y `estado`.

El modo es solo del campo. La primera vez que el campo se dibuja
(`hostUpdate`), el controlador recupera lo que conservó la caja, revisado (si
falta o su modo no se ofrece, el primero, con sostenidos), y después no
vuelve a leer `estado`. Alcanza con eso porque el panel crea un campo por caja
y parámetro (ver más abajo): un campo nunca pasa a mostrar otra caja.

Se prueba sin la interfaz, con un campo de prueba (un objeto con `modos`,
`estado` y los métodos de `ReactiveControllerHost`), mirando lo que escribe,
lo que lee, el botón y lo que avisa.

Alternativas:

- Funciones puras en un `modos.ts` aparte, con la clase envolviéndolas (la
  primera versión de este cambio): la clase era un pasamanos, y cada cambio de
  estado pasaba de una capa a la otra. Descartado al revisar el PR.
- Que el campo adopte `estado` cada vez que cambia: hace falta solo si el
  modo le vuelve de afuera mientras vive (del panel, o de un rango que maneja
  campos adentro), y obliga a reconciliar dos dueños (recordar lo recibido y
  descartar los ecos de lo que el campo avisó). Descartado al revisar el PR,
  junto con los campos compuestos.
- Una clase base `ModoBase`: hay un solo tipo de campo con modos, y lo que
  varía entre decimal, nota y hexadecimal son datos, que van en la tabla.
- Un mixin (con decoradores *legacy* y la base genérica `Campo<V>` el tipado
  se complica y se lee peor; descartado en la revisión de arquitectura).

### `campo-numero` recibe y avisa números, y maneja sus flechas

Propiedades: `valor: number`, y `modos`, `minimo` y `maximo`, opcionales
(más el `estado` de `Campo`). Al salir del campo lee lo escrito con el controlador: si se puede
leer, avisa `cambio` con el número (y, antes, `cambio-de-estado` si cambió el
modo o los bemoles, como hoy se avisa primero la presentación); si no, se
vuelve a dibujar con el valor que tiene, sin avisar nada.

Las flechas (las propias y las del teclado) leen lo escrito en ese momento,
le suman el paso y lo frenan en `minimo` y `maximo` con una función pura
`limitar`, que se muda de `entero.ts` a `campo-numero.ts` con su test. Las
flechas propias se deshabilitan solas con el valor en un límite.
Desaparecen el evento `paso`, `Paso`, `puedeSubir`, `puedeBajar`,
`decimales` (que solo usaba el ejemplo `real` de la guía) y `compacto` (que
solo usaba el rango).

### El rango dibuja sus dos campos de texto, sin campos adentro

`campo-rango` agrega su propio `ModoNumerico` y recibe `modos`, `minimo`,
`maximo` e `invertible`. En lugar de dos `campo-numero` compactos, dibuja en
su raíz sus dos campos de texto, cada uno con su etiqueta solo para lectores
de pantalla, y los dos usan su controlador: un solo modo, con un solo dueño.
Lo escrito se lee como en `campo-numero`, y las flechas del teclado en un
campo mueven ese extremo con `moverExtremo`, igual que la perilla, así que se
frenan en el otro extremo si el rango no se puede invertir. Lo escrito no se
frena: se guarda y, si no sirve, el panel muestra el error, como hoy.

Se van las propiedades `formatear` y `leer` y las funciones `pasarExtremo` e
`interpretarExtremo`: la perilla anuncia su valor con el controlador.

Ningún campo dibuja otro campo adentro: lo que dos campos comparten va en un
controlador, como `ModoNumerico`. Un campo compuesto obliga a sincronizar su
estado con el de los campos de adentro, y esa sincronización era la que
complicaba el controlador. El costo es que el rango repite unas líneas del
manejo de un campo de texto (leer al salir, volver al valor y las flechas del
teclado), que además no son iguales: sus flechas se mueven como la perilla.

Alternativa: los `campo-numero` compactos, con el rango pasándoles su modo y
adoptando el que avisaran, y los límites de cada extremo calculados aparte
para las flechas (la primera versión de este cambio). Descartado al revisar el
PR.

### `Campo` dibuja el botón con lo que le da el campo, y escribe el error

`Campo` deja la propiedad `modo` y el evento `siguiente-modo`. Un campo que
tiene modo redefine `protected botonDeModo()`, que devuelve el texto del botón
y qué hacer al activarlo (o `null`); `Campo` sigue dibujando el botón junto a
la etiqueta, con el mismo `aria-label`.

`error` pasa a ser `Texto | null`. `Campo` lo escribe con
`escribir(this.error, (valor) => this.formatearValor(valor))`, y
`formatearValor` es `String` salvo en los numéricos, que escriben un número
en su modo y el resto con `String`.

`Campo` declara también `estado` (lo que el campo conservó en la caja, que
lee una sola vez, al dibujarse por primera vez; los campos que no conservan
nada lo ignoran) y `avisarEstado`, que avisa `cambio-de-estado`. `avisar` y
`avisarEstado` van con `bubbles: true`, sin `composed`: llegan al panel, que
los escucha en el elemento que envuelve al campo, en su misma raíz.

Alternativa: declarar `estado` solo en los dos campos numéricos. Se descarta
porque el panel escucha `cambio-de-estado` en cualquier campo, y el
protocolo (valor y estado, cada uno con su aviso) queda escrito en un solo
lugar.

### `formato` es un módulo propio, `src/formato.ts`

```ts
export interface TextoConValores { partes: string[]; valores: unknown[] }
export type Texto = string | TextoConValores;
export function formato(partes: TemplateStringsArray, ...valores: unknown[]): TextoConValores;
export function escribir(texto: Texto, escribirValor = String): string;
```

Es un archivo suelto de `src/`, así que es un módulo propio: lo importan
`Campo`, los tipos de parámetro, `workflow/tipos.ts`, Fijar y el ejecutor.
No va en `componentes/`, como decía la revisión, porque los tipos de nodo no
pueden importar módulos de la interfaz; y no va en `workflow/`, porque
`componentes/` no depende de `workflow/`. `formato` copia las partes a un
arreglo común, así un test compara con `toEqual` dos textos escritos en
lugares distintos: `expect(validar(…)).toEqual(formato\`Tiene que ir de ${0} a
${127}\`)`.

Los mensajes sin valores siguen siendo `string`. `Texto` evita repetir la
unión en cada tipo de parámetro: `ErrorDeConfiguracion.mensaje` es `Texto`,
`validar` devuelve `Texto | null` y `dibujar` recibe `error: Texto | null`.

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

- `modos.test.ts` pasa a `componentes/modo-numerico.test.ts`, y prueba la
  clase con un campo de prueba.
- `entero.test.ts`: quedan los de `validar`, comparando con `formato`; los de
  interpretar van a `modo-numerico.test.ts` (los que no estén ya), y el de
  `limitar`, a `campo-numero.test.ts`.
- `rango.test.ts`: prueba `validar` y compara con `formato`, y se va el del
  modo. `opciones.test.ts` y `autocompletar.test.ts` pasan a `validar`.
- `validacion.test.ts`: se van los de presentación; quedan los de cómo se
  combinan los errores. Los de escribir un texto con valores van a
  `formato.test.ts`.
- `fijar.test.ts`: `validar` sin `enDecimal`, comparando con `formato`, que
  ya revisa que el 1 y el 16 van marcados como valores; el test de los
  errores en hexadecimal se va.
- `ejecutar.test.ts`: el error de una caja Fijar en hexadecimal llega al log
  en decimal.
- `desplazar.test.ts`: el de que el desplazamiento es solo decimal revisa lo
  que declara el parámetro (`modos: ["decimal"]`), sin importar nada de la
  interfaz: leer lo escrito se prueba al lado del campo.
- `campo-rango.test.ts`: se van los de `pasarExtremo` e `interpretarExtremo`;
  las flechas de sus campos usan `moverExtremo`, que ya tiene los suyos.
- `nodos/catalogo.test.ts` toma los modos de cada parámetro con
  `parametro.modos ?? MODOS_POR_DEFECTO`.

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
8. Después de la revisión del PR: `modos.ts` entra en `ModoNumerico`, el
   campo lee su estado una sola vez y el rango deja de usar `campo-numero`.

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

- [El campo no sigue lo que cambie en `estadoDeLosParametros` mientras está
  montado] → nadie más lo cambia: solo el panel, con lo que el campo mismo
  avisó, y la próxima vez que el campo se crea lo lee.
- [Sin los `parametro-…` y con los campos del rango en su propia raíz, algo
  del panel se acomoda distinto, por ejemplo lo que flota sobre los
  parámetros siguientes] → la huella antes y después, y la prueba de
  configuración.
- [TypeScript no comprueba que los valores de `formato` sean de la clase del
  campo, porque el error se asocia por `clave` en tiempo de ejecución] → el
  campo escribe con `String` lo que no reconoce (decidido en la revisión).
- [El log deja de escribir los valores como el panel] → es el comportamiento
  buscado, y queda en las specs `ejecucion-de-workflow` y `tipos-de-nodo`.
- [El rango repite el manejo de un campo de texto] → son pocas líneas, y sus
  flechas son otras (las de la perilla); la prueba de los modos las aprieta en
  los dos campos.

## Migration Plan

No hay datos que migrar: el flujo vive en memoria. Se vuelve atrás
revirtiendo la rama.
