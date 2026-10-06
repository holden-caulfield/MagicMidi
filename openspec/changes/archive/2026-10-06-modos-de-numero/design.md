# Design

## Context

Hoy un número de un parámetro pasa por estas piezas:

- `campo-numero` (`src/componentes/`) es un `<input type="text">` que avisa el
  texto tal como se escribió. No interpreta nada.
- `parametro-entero` (`parametros/entero.ts`) lo interpreta con
  `interpretar(texto)` y avisa el número. `error(parametro, valor)` arma el
  texto del error con los números en decimal.
- `campo-rango` dibuja dos `campo-numero` compactos y las perillas, y lee lo
  escrito con su propio `interpretarExtremo`. `parametro-rango` le pasa el
  valor y los límites.
- Los errores salen solo de `erroresDeConfiguracion(tipo, parametros)`
  (`validacion.ts`). Lo usan el panel, el lienzo y el ejecutor (para el log).
  Las reglas de un tipo de nodo (`validar(parametros)`) arman su propio texto:
  Fijar dice "Con Canal, tiene que ir de 1 a 16".
- `NodoDelFlujo` guarda `parametros: Record<string, ValorDeParametro>`, y
  `procesar` lee de ahí los números.
- `nombreDeNota(numero)` está en `src/midi/describir.ts`: notación científica,
  con sostenidos.

Los modos, el botón, la lectura en orden y las flechas que pide el cambio
están en `proposal.md`, y su comportamiento, en las specs.

## Goals / Non-Goals

**Goals:**

- Que la palabra "modo" aparezca solo en los tipos de parámetro que lo usan
  (`entero.ts`, `rango.ts` y su módulo `modos.ts`), en la declaración de
  Desplazar y en las guías. El estado, el panel, el lienzo, el ejecutor, la
  validación y los tipos de nodo no se enteran de que existen.
- Que el valor de la caja siga siendo un número: `procesar` y `validar` lo
  leen como hasta ahora.
- Que los componentes de `src/componentes/` sigan sin saber de MIDI: reciben
  textos y funciones, no modos.
- Que la lectura y el formateo se puedan probar sin la interfaz.

**Non-Goals:**

- Elegir la convención de octava (C3 o C4 para el 60): queda en pausa, como
  opción de configuración aparte.
- Repetir el paso mientras se mantiene apretada una flecha.
- Modos en otros tipos de parámetro, o en el log.
- Guardar el flujo entre sesiones: el modo dura lo que dura el flujo.

## Decisions

### El modo es una "presentación" que la caja guarda sin leerla

`NodoDelFlujo` suma `presentaciones?: Record<string, unknown>`, por clave de
parámetro. Para todo lo que no es un tipo de parámetro, es un dato opaco: el
panel lo guarda cuando un parámetro avisa `cambio-de-presentacion` (con
`cambiarPresentacion(nodoId, clave, presentacion)`, al lado de
`cambiarParametro`), y el panel, el lienzo y el ejecutor lo pasan al calcular
errores. Ninguno lo lee. Para el entero y el rango, la presentación es un
`{ modo, bemoles }`: el `Modo` y si las notas negras se escriben con bemoles
(ver "Bemoles o sostenidos"). Si una clave falta, o tiene algo que el
parámetro no ofrece, el modo es el primero que ofrece, con sostenidos. Así una caja nueva no necesita nada especial.

- *Alternativa: un `modos: Record<string, Modo>` en la caja.* Es lo que
  proponía la primera versión. La descartamos porque el estado, el panel y la
  validación tendrían que conocer el tipo `Modo`, y la persona usuaria pidió
  que los modos queden dentro de los tipos que los usan.
- *Alternativa: guardar el modo adentro del valor (`{ numero, modo }`).* No
  tocaría el estado ni el panel, pero `procesar` y `validar` de Desplazar y
  Fijar verían el modo al leer el número, y la guía de nodos tendría que
  explicarlo.

### El contrato de un tipo de parámetro recibe la presentación

En `parametros/catalogo.ts`, `TipoDeParametro` pasa a tener:

- `error(parametro, valor, presentacion)`;
- `dibujar(parametro, valor, error, presentacion)`;
- `formatear?(parametro, numero, presentacion)`: opcional, escribe un número
  como lo muestra el parámetro.

En este nivel, la presentación es `unknown`, y cada tipo la interpreta a su
manera: el entero y el rango con `presentacionActual(declaracion, presentacion)`, que
también la valida. Los tipos que no la usan la ignoran.
`formatearParametro(parametro, numero, presentacion)` usa el `formatear` del
tipo si lo tiene, y si no, `String(numero)`. `CampoDeParametro` suma la
propiedad `presentacion` y `avisarCambioDePresentacion(presentacion)`, que
despacha `cambio-de-presentacion` con `bubbles: true`, como `cambio`.

### Un módulo puro para los modos

Un archivo nuevo, `parametros/modos.ts`, sin componentes y con su test, que
importan solo `entero.ts` y `rango.ts`:

- `type Modo = "decimal" | "nota" | "hexadecimal"` y
  `MODOS_POR_DEFECTO = ["decimal", "nota", "hexadecimal"]`;
- `DeclaracionNumerica` (`modos?: Modo[]`, más el mínimo y el máximo que ya
  declaran los dos tipos) y `modosDe(declaracion)`;
- `Presentacion` (`{ modo, bemoles }`), `presentacionActual(declaracion, presentacion)`
  y `siguienteModo(declaracion, modo)`;
- `formatear(numero, modo)`: nota con `nombreDeNota`, hexadecimal en
  mayúsculas con al menos dos cifras, y decimal para un negativo en cualquier
  modo;
- `leer(texto, presentacion, declaracion)`: `{ numero, presentacion }` o
  `null`. Prueba los
  modos que se ofrecen empezando por el actual y siguiendo el orden de
  rotación, y devuelve el primero que lo lee, junto con el modo en que lo
  leyó;
- el texto del botón de cada modo, abreviado y completo.

Leer el nombre de una nota (`numeroDeNota(texto)`) va en `midi/describir.ts`,
al lado de `nombreDeNota`, así los nombres de las notas se escriben y se leen
en un solo lugar. Cuando se retome la convención de octava, ese par de
funciones es lo único que va a recibirla.

Se empieza por el modo actual, y no por el primero de la lista, porque si no,
en modo hexadecimal "10" o "C4" se leerían siempre como decimal o como nota,
y no habría forma de escribir esos valores.

### Bemoles o sostenidos

Se agregó después de la primera prueba en la ventana real: la persona usuaria
escribía "Db4" y el campo lo cambiaba por "C#4". Por eso `bemoles` es parte
de la presentación, y no un modo más: no rota con el botón, y se mantiene al
pasar por los otros modos. `leer` devuelve la presentación nueva: con
`bemoles: true` si la nota escrita tenía bemol, con `false` si tenía
sostenido, y la anterior si era natural o no era una nota. `nombreDeNota`
(`midi/describir.ts`) recibe un `bemoles` opcional, que el log no usa.

- *Alternativa: un cuarto modo, "nota con bemoles".* Lo descartamos porque
  el botón rotaría entre dos formas de escribir lo mismo.

### Escribir puede cambiar el valor y el modo a la vez

Cuando `leer` devuelve otra presentación (otro modo, o pasar de sostenidos a
bemoles), el `parametro-…` avisa primero `cambio-de-presentacion` y después
`cambio`, en el mismo manejador. Las dos
llamadas a `actualizar()` son sincrónicas y el dibujado es asíncrono, así que
el panel se vuelve a dibujar una sola vez, ya con los dos cambios.

- *Alternativa: un solo evento con valor y presentación.* Obligaría al panel a
  distinguir dos formas de `cambio` para todos los tipos, por algo que solo
  usan dos.

### `validar` recibe un `formatear` sin modos

La firma pasa a ser `erroresDeConfiguracion(tipo, parametros, presentaciones)`.
Le pasa a cada `error` la presentación de su parámetro, y a `validar` un
segundo argumento, `formatear(clave, numero) => string`, que escribe el número
como lo muestra el parámetro de esa clave (con `formatearParametro`). Fijar
escribe
`` `Con Canal, tiene que ir de ${formatear("valor", 1)} a ${formatear("valor", 16)}` ``,
sin saber en qué modo está. Mapear no nombra números y no cambia. El panel, el
lienzo y el ejecutor pasan `nodo.presentaciones ?? {}`, así el log muestra el
mismo texto que el panel.

- *Alternativa: que las reglas del tipo sigan escribiendo en decimal.* Es más
  simple, pero un error en decimal debajo de un campo en hexadecimal
  contradice lo que pidió la persona usuaria.

### Los componentes reciben textos y funciones, no modos

`campo-numero` sigue avisando texto. Lo nuevo:

- **Botón de modo**: va en `Campo`, la base, en la fila de la etiqueta. Se
  dibuja si recibe la propiedad `modo: { abreviatura, nombre } | null`, y al
  activarse despacha `siguiente-modo`. Qué modo sigue lo decide el
  `parametro-…`. Así el entero y el rango lo comparten, y en el rango hay un
  solo botón porque es un solo `Campo`. Es un `<button>` con `.control` y un
  selector más específico para hacerlo chico, con `aria-label` "Modo de
  <etiqueta>: <nombre>".
- **Flechas**: `campo-numero` suma el evento `paso`, con
  `{ texto, cantidad }` (±1, o ±10 con Mayúsculas). Lo despachan las flechas
  propias y las teclas arriba y abajo. El `texto` es lo que hay en el input en
  ese momento: quien lo recibe lo lee (lo que puede cambiar el modo) y le
  aplica el paso de una vez, así "escrito sin confirmar y después una flecha"
  no depende del orden en que se redibujan las cosas. `paso` se avisa en
  lugar de `cambio`, no además. Las propiedades `puedeSubir` y `puedeBajar`
  deshabilitan cada flecha. Las flechas propias (dos chevrones de Lucide,
  apilados a la derecha del input, del alto del control) tienen
  `tabindex="-1"` y `aria-hidden`: con el teclado se usa el campo. Con
  `compacto` no se dibujan, pero las teclas funcionan igual.
- **Rango**: `campo-rango` recibe `formatear(numero) => string` y
  `leer(texto) => number | null` como propiedades, y reemplaza su
  `interpretarExtremo`. Con `formatear` llena cada campo y el
  `aria-valuetext` de las perillas. `leer` es una clausura del
  `parametro-rango` que, si el texto se lee en otro modo, avisa también el
  modo nuevo. Un `paso` en el campo de un extremo pasa por el mismo
  `mover(extremo, nuevo)` que las teclas de la perilla, así se frena o se
  cruza igual.

- *Alternativa: que el clic en el campo cambie el modo y el doble clic
  edite (la idea inicial).* La descartamos porque el doble clic empieza con
  un clic: o cambia el modo antes de editar, o hay que esperar unos 300 ms
  para distinguir los dos gestos. Además, no hay cómo hacerlo con el teclado.
- *Alternativa: menú contextual con clic derecho.* No se ve, y la persona
  usuaria prefirió el botón.

### Qué ofrece cada nodo

- Desplazar: `modos: ["decimal"]`. Con un solo modo no hay botón y solo se lee
  decimal.
- Fijar, Filtrar y Mapear: no declaran nada, así que ofrecen los tres modos en
  el orden por defecto.
- `nodos/catalogo.test.ts` revisa que todo parámetro que ofrece `nota` tenga
  mínimo y máximo dentro de 0 a 127, y que todo el que ofrece `hexadecimal`
  tenga un mínimo de 0 o más. Es el único lugar fuera de los tipos de
  parámetro que nombra modos, y lo hace a través de `modosDe`.

## Risks / Trade-offs

- **Cifras escritas en modo nota se leen como hexadecimal.** Con el orden
  por defecto, después de nota viene hexadecimal, así que "60" en modo nota
  da 96 en hexadecimal, no 60 en decimal. → Queda a la vista, porque el botón
  pasa a "HEX" y el campo muestra "60" en hexadecimal. Si molesta, se puede
  cambiar el orden por defecto, o exigir el `0x` fuera del modo hexadecimal.
  Las dos opciones cambian la spec, y se consultan con la persona usuaria.
- **El botón de modo ocupa lugar en un panel de 220 px.** → Va en la fila de
  la etiqueta, que hoy tiene lugar de sobra, y no al lado del control: el
  rango no pierde ancho. Se verifica con la huella y una captura del panel de
  Filtrar.
- **El "♪" depende de la letra.** En la monoespaciada puede verse distinto,
  o no estar. → Si se ve mal en WebKit, se usa el ícono `Music` de Lucide
  para ese modo, con el mismo `aria-label`.
- **"G#9" (128) entra justo en un campo de rango compacto de 36 px.** → Se
  revisa con una captura en modo nota. Si no entra, se agranda el campo
  compacto a lo que mida "G#9" en `ch`, sin alturas ni anchos mínimos para
  el resto.
- **La presentación es `unknown` fuera de los tipos.** Un error de tipos ahí
  no lo marca el compilador. → `presentacionActual` valida lo que recibe y, si no es
  un modo ofrecido, usa el primero. Un test lo cubre.
- **Cambia la firma de `error`, `dibujar`, `validar` y
  `erroresDeConfiguracion`.** → El chequeo de tipos señala cada lugar que
  falta. Las guías (`parametros/LEEME.md`, con su ejemplo de decimales, y
  `nodos/LEEME.md`, con el `validar` de ejemplo) se actualizan en el mismo
  cambio, porque tienen que seguir sirviendo a quien recién empieza.
- **Un valor con error mostrado en otro modo puede confundir** (por ejemplo,
  200 en modo nota es "G#15"). → Igual se muestra, junto con el error en el
  mismo modo, que dice el rango que sirve.

## Migration Plan

No hay nada que migrar: el flujo no se guarda entre sesiones, y una caja sin
`presentaciones` muestra cada parámetro en su primer modo (decimal), como
hasta ahora.
