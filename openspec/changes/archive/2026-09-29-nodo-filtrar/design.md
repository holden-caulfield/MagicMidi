# Design

## Context

Ver `proposal.md` (Why) para la motivación, y las specs del cambio para el
comportamiento esperado. Lo que condiciona el diseño:

- **`MensajeMidi` es `number[]`** (`src/workflow/tipos.ts`). Lo usan los tipos
  de nodo, el ejecutor, `salida.ts`, el log y `describir.ts`. El backend manda
  y recibe listas de bytes (evento `mensaje-midi`, comando `enviar_mensaje`).
- **La lectura del status vive dentro de `describirMensaje`**: el `switch` por
  `status & 0xf0`, el canal como `(status & 0x0f) + 1` y la regla de "Nota On
  con velocidad 0 es Nota Off". Filtrar necesita exactamente eso.
- **El ejecutor (`ejecutar.ts`) es puro**: `procesarMensaje` recorre el grafo
  desde el trigger, cada rama con su copia, y junta en `salidas` lo que
  devuelven las cajas sin salida. Hoy lo que no llega a un Emitir no sale.
- **Parámetros disponibles**: entero, sí/no y opciones (una sola). AGENTS.md
  pide no sumar tipos de parámetro hasta que un nodo concreto lo necesite.
- **La etapa de una caja sale de `tieneSalida`** (`etapaDelTipo`): "fin" es
  exactamente "sin salida". No hay que declarar nada nuevo para que Descartar
  sea naranja.
- **El flujo no se guarda**: vive en `estado.flujo` y arranca siempre con
  trigger → Emitir. No hay flujos viejos que migrar.

## Goals / Non-Goals

**Goals:**

- Una única interpretación del status, que usen la descripción del log y los
  nodos, y que no pueda quedar desactualizada si una caja cambia los bytes.
- Que la regla de reenvío por defecto viva entera en el ejecutor: ningún tipo
  de nodo sabe de ella, ni declara nada para cancelarlo.
- Que crear un nodo siga siendo un archivo, un test y una línea en el
  catálogo, con una sola cosa nueva que aprender (el objeto mensaje).

**Non-Goals:**

- Cambiar el backend o el formato del evento `mensaje-midi`.
- Mostrar en el log o en el lienzo *por qué* salió o no salió un mensaje
  (reenvío por defecto, qué caja lo canceló, qué caja falló).
- Un tipo de parámetro "varias opciones".

## Decisions

### `MensajeMidi` pasa a ser una clase con los bytes y getters `tipo` y `canal`

```ts
export class MensajeMidi {
  constructor(public bytes: number[]) {}
  get tipo(): TipoDeMensaje { /* lee bytes[0] y, si es 9n, bytes[2] */ }
  get canal(): number | null { /* 1 a 16, o null si no es de canal */ }
  copiar(): MensajeMidi { return new MensajeMidi([...this.bytes]); }
}
```

Lo único guardado son los bytes; `tipo` y `canal` se calculan en cada lectura.
Así, si Desplazar cambia el status, la caja siguiente lee el tipo nuevo sin
que nadie tenga que "recalcular" nada. Los getters se llaman `tipo` y `canal`
(y no `getTipo()`) por la regla de idioma de AGENTS.md, y porque en TypeScript
un `get` se lee como un campo: `mensaje.tipo === "nota-on"`.

`TipoDeMensaje` es una unión de identificadores en castellano: `"nota-on"`,
`"nota-off"`, `"presion-polifonica"`, `"cambio-de-control"`,
`"cambio-de-programa"`, `"presion-de-canal"`, `"pitch-bend"`, `"sistema"` y
`"desconocido"`. Al lado van la lista de los tipos que se pueden elegir (todos
menos `"desconocido"`, en el orden de la spec de Filtrar) y sus nombres
visibles (`"Nota On"`, `"Cambio de Control"`, …, `"Mensajes de sistema"`), que
usan el panel de Filtrar y `describirMensaje`.

La clase vive en `src/workflow/tipos.ts`, junto al resto del contrato, con su
test en `tipos.test.ts`. Así un tipo de nodo sigue importando solo de
`../tipos` (lo que dice hoy la guía), aunque ahora también importe un valor y
no solo tipos cuando necesita crear un mensaje nuevo.

No hace falta una función para serializar: `bytes` ya es el formato del
backend. Los bordes son dos: el listener de `mensaje-midi` hace
`new MensajeMidi(evento.payload.datos)`, y `enviarMensaje` manda
`mensaje.bytes`. `EventoMidi.datos` sigue siendo `number[]`.

Alternativas descartadas:

- **Seguir con `number[]` y un módulo auxiliar `leerMensaje(bytes)`**: era la
  opción menos invasiva, pero la persona usuaria prefirió que la lectura sea
  parte del mensaje, para que un nodo la encuentre ahí sin buscar otro módulo.
- **Guardar `tipo` y `canal` como campos**: quedan viejos en cuanto una caja
  modifica el status, y habría que recalcularlos en el ejecutor después de
  cada caja.
- **La clase en un archivo propio** (`mensaje-midi.ts`): más prolijo, pero
  agrega un segundo import que explicar en la guía.

### `describirMensaje` recibe un `MensajeMidi` y usa `tipo` y `canal`

El `switch` pasa a ser sobre `mensaje.tipo`; los nombres salen de la tabla
compartida y el canal de `mensaje.canal`. Los mensajes de sistema siguen
describiéndose por su status (la tabla `MENSAJES_DE_SISTEMA` queda en
`describir.ts`: es presentación, no lectura), y `"desconocido"` cubre el
mensaje vacío y el que no empieza con un status, con los mismos textos de
hoy. Los textos no cambian: `describir.test.ts` solo cambia cómo arma sus
mensajes, y sirve de red para la refactorización.

### El reenvío por defecto y los errores se deciden en el ejecutor

Entre cajas solo viaja la lista `salidas`, como hoy. Lo demás se resuelve con
el valor de retorno y con excepciones:

- **Si se llegó a una caja de fin** vuelve por el retorno. `procesarEn`
  devuelve `true` cuando la caja no tiene salida (llegar es lo que cuenta,
  devuelva lo que devuelva: Descartar no devuelve nada), y si tiene salida
  devuelve lo que devuelva `entregar` para sus conexiones. `entregar`
  devuelve `true` si alguna de sus ramas llegó, pero recorriéndolas todas:
  con `.some()` se saltearía las ramas que siguen a la primera que llega. No
  se deduce de `salidas` porque Descartar no agrega nada.
- **Un error es una excepción.** `procesarEn` ya no atrapa lo que lanza
  `procesar`: lo vuelve a lanzar envuelto,
  `` throw new Error(`La caja "${tipo.nombre}" falló: ${detalle}`, { cause: error }) ``,
  donde `detalle` es el `message` del error original (o el valor lanzado,
  pasado a texto, si no era un `Error`). Un resultado inválido lanza
  `` new Error(`La caja "${tipo.nombre}" produjo un mensaje MIDI inválido`) ``.
  Siempre se lanza un `Error`, nunca un valor suelto, para conservar el stack
  y la causa. La excepción deshace el recorrido de una vez, así que ninguna
  caja procesa ese mensaje después del error. No hay nada que deshacer: el
  envío recién pasa cuando termina el recorrido.

`procesarMensaje` tiene el único `try/catch`, y devuelve un
`ResultadoDelFlujo`:

- sin error: `{ salidas, error: null }`, donde `salidas` es lo que
  devolvieron las cajas de fin si `entregar` dio `true`, y `[mensaje]` si
  no. El original no cambió porque cada rama trabaja sobre una copia
  (`mensaje.copiar()`);
- con error: deja el `Error` completo en la consola (`console.error`, con
  stack y causa), y devuelve `{ salidas: [], error: error.message }`.

La excepción no pasa de `procesarMensaje`: el listener de `mensaje-midi`
envía `salidas` (vacías si hubo error) y le pasa al log la entrada, las
salidas y el texto del error. Así el mensaje de error llega siempre al log, y
los tests revisan lo que se devuelve, sin `toThrow`.

Las cajas no saben nada de esto. Una caja intermedia que devuelve nada
(Filtrar con un tipo no marcado) devuelve `false` por su rama: si ninguna
otra llegó a una caja de fin, el mensaje se reenvía.

La validación de lo que devuelve una caja pasa a pedir que sea un
`MensajeMidi` con bytes válidos (`instanceof` más la revisión de hoy sobre
`bytes`). Una lista suelta, que TypeScript ya rechaza, en ejecución cuenta
como inválida.

Cualquier excepción que llegue a `procesarMensaje` se trata como error de ese
mensaje, incluido un bug del propio ejecutor: el mensaje no se procesó como
correspondía, y mostrarlo en rojo es más honesto que reenviarlo. Si hiciera
falta distinguirlos, se puede sumar una clase `ErrorDeCaja`; por ahora no.

Alternativas descartadas:

- **Que las cajas de fin declaren si cancelan** (un campo nuevo en
  `TipoDeNodo`): todas las de fin cancelan, así que sería un campo que siempre
  vale lo mismo.
- **Que Emitir o Descartar devuelvan una señal especial**: mete la regla del
  ejecutor en el contrato de las cajas, y quien crea una caja de fin tendría
  que acordarse de devolverla.
- **Que un error solo cancele su rama** (lo de hoy): un flujo roto sale a
  medias (un acorde con una nota de menos) y no se nota. Cancelar todo hace
  que el problema se vea en el log en cuanto pasa.
- **Un registro `{ salidas, llegoAUnFin, fallo }` pasado entre cajas**, con
  `procesarEn` y `entregar` revisando `fallo` al entrar: funciona, pero cada
  camino nuevo del recorrido tiene que acordarse de revisar la marca, y lo
  que viaja entre cajas deja de ser solo la lista de salidas.
- **Seguir recorriendo después del error y solo descartar las salidas**: el
  resultado es el mismo, pero procesa un mensaje que ya se sabe que no sale, y
  puede llenar la consola con avisos de cajas que fallan por la misma causa.

### El log suma un estado "error", con el texto del error

`agregarAlLog` recibe también el texto del error (o `null`), y
`clasificarSalidas` suma el caso `{ tipo: "error", texto }`, que se evalúa
antes que los demás: con error, las salidas vienen vacías, y sin ese caso el
mensaje se vería como descartado. La fila de entrada lleva la clase `error` y
la marca con el ícono `TriangleAlert` de Lucide; el texto de la marca (el
globo al pasar el puntero y lo que anuncia un lector de pantalla) es
"Error: " seguido del texto del error, por ejemplo `Error: La caja
"Desplazar" falló: …`. Es el mismo mecanismo de las otras marcas, así que no
cambia el layout de las filas ni lo que cuenta para el máximo de 500. Los
colores van en `styles.css` como los demás estados: un rojo para la letra y
uno suave para el fondo, definidos para modo claro y oscuro. El stack y la
causa completa quedan en la consola.

Alternativa descartada: **una sub-fila con el texto del error**, siempre a la
vista. Se lee sin pasar el puntero, pero es un tipo de fila nuevo que no es
un mensaje MIDI, con columnas propias, y un texto largo rompe la alineación
de la lista. El rojo ya alcanza para que el error se note; el detalle está a
un paso.

## Risks / Trade-offs

- [Un cambio de modelo mental: "borrar el Emitir" ya no silencia la salida]
  → La spec lo deja explícito, la guía y el README lo explican, y Descartar
  está en la barra para eso. Como el flujo no se guarda, no hay flujos viejos
  que empiecen a comportarse distinto sin aviso.
- [Un Filtrar sin nada conectado, o sin casillas marcadas, parece no hacer
  nada, porque todo se reenvía] → Es consecuencia directa de la regla y es
  consistente con "un camino sin caja de fin no cancela". Si confunde en el
  uso, se puede señalar en el lienzo más adelante (fuera de este cambio).
- [Una caja que falla solo con algunos mensajes corta la salida de todo el
  flujo para esos mensajes, incluidas las ramas que andaban bien] → Es lo que
  pide el cambio: un flujo roto no sale a medias. El log marca en rojo cada
  mensaje afectado, con qué caja falló y por qué, y la consola trae el stack.
- [El contrato de nodos cambia para quien ya escribió uno] → Los únicos nodos
  son los del repositorio; se adaptan en este mismo cambio.
- [Calcular `tipo` en cada lectura] → Son un par de operaciones de bits por
  lectura y por caja; no se nota frente al ida y vuelta al backend.

## Migration Plan

No hay datos que migrar (el flujo no se guarda). El cambio sale entero en un
PR: contrato, ejecutor, nodos nuevos, guía y README. Volver atrás es revertir
el PR.
