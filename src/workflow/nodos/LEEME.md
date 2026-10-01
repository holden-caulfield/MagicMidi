# Cómo crear un tipo de nodo

Cada caja que aparece en la barra del tab **Workflow** es un *tipo de nodo*, y
cada tipo de nodo vive en un archivo de esta carpeta. Para crear uno nuevo no
hace falta saber nada del editor ni del lienzo: alcanza con escribir un archivo
con la caja, otro con su test, y agregar una línea en el catálogo.

## Los pasos

1. **Creá el archivo** en esta carpeta, con un nombre en minúsculas que diga
   qué hace la caja: por ejemplo, `velocidad-fija.ts`. Lo más fácil es copiar
   `desplazar.ts` y cambiarlo.
2. **Registralo en el catálogo.** Abrí `src/workflow/catalogo.ts`, importá tu
   archivo arriba y agregalo a la lista `tipos`:

   ```ts
   import velocidadFija from "./nodos/velocidad-fija";

   const tipos = {
     filtrar,
     desplazar,
     velocidadFija,
     emitir,
     descartar,
   } satisfies Record<string, TipoDeNodo>;
   ```

   El nombre que uses en la lista (`velocidadFija`) es el identificador del tipo:
   no puede repetirse. El orden de la lista es el orden de la barra.

   Si te olvidás de este paso, no aparece ningún error: la caja simplemente no
   aparece en la barra. Es lo primero que conviene revisar cuando "no anda".
3. **Escribí el test.** Cada caja trae su test al lado, con el mismo nombre y
   terminado en `.test.ts`: para `velocidad-fija.ts`, `velocidad-fija.test.ts`. Lo
   más fácil es copiar `desplazar.test.ts` y cambiar los casos. Después corré,
   desde la raíz del proyecto:

   ```bash
   npm test
   ```

   Tiene que terminar diciendo que pasaron todos. Cómo pensar los casos está
   en [Cómo escribir el test](#cómo-escribir-el-test).
4. **Probalo en la aplicación.** Levantá la aplicación, andá al tab Workflow y
   usá tu caja como cualquier otra.

## Qué va en el archivo

Un tipo de nodo es un objeto con estos campos:

- **`nombre`**: el texto que aparece en un globo al pasar el puntero por la
  caja, en la barra o en el lienzo, y como título en el panel de configuración.
- **`icono`**: lo único que se ve dentro de la caja, así que conviene uno que
  se reconozca solo, sin leer el nombre. Es un ícono de
  [Lucide](https://lucide.dev/icons/). Buscá uno en
  esa página, copiá su nombre tal como aparece en el código de ejemplo (en
  *PascalCase*, por ejemplo `ArrowUpDown` o `Filter`) e importalo arriba del
  archivo: `import { Filter } from "lucide";`. Si escribís mal el nombre, el
  editor de código te lo marca.
- **`tieneSalida`**: solo hace falta escribirlo, con `false`, si la caja
  *termina* el flujo, como Emitir o Descartar. Si no lo escribís, la caja
  tiene salida. En una caja sin salida, lo que devuelve `procesar` es lo que
  sale por el puerto MIDI (ver más abajo). Las cajas sin salida se ven
  naranjas, como Emitir, sin que tengas que declarar ningún color.
- **`parametros`**: lo que la persona usuaria puede configurar en la caja. Cada
  parámetro tiene una `clave` (el nombre con que lo vas a leer), una `etiqueta`
  (el texto que se ve en el panel), un `tipo` y un valor `inicial`. Los tipos
  disponibles son los de la carpeta `src/workflow/parametros/`. Por ejemplo:
  - `"entero"`: un número entero (acepta negativos).
  - `"si-no"`: una casilla para marcar o desmarcar.
  - `"opciones"`: una lista cerrada. Cada opción tiene un `valor` y un `texto`.

  Los que hay están en `parametros/catalogo.ts`. Si ninguno te sirve, se puede
  crear uno nuevo: la guía está en
  [`parametros/LEEME.md`](../parametros/LEEME.md). Si la caja no se configura,
  poné `parametros: []`.
- **`procesar(mensaje, parametros)`**: la función donde la caja hace su trabajo.

Terminá el objeto con `satisfies TipoDeNodo`: así el editor de código te avisa
si falta algún campo o si alguno tiene la forma equivocada.

## La función `procesar`

Se llama una vez por cada mensaje MIDI que llega a la caja, y recibe:

- **`mensaje`**: el mensaje MIDI. Tiene tres cosas que te van a servir:
  - **`mensaje.bytes`**: la lista de sus bytes, uno por número. Por ejemplo,
    un *Nota On* en el canal 1, nota 60 (Do central) y velocidad 100 tiene
    los bytes `[0x90, 60, 100]`. Los podés leer (`mensaje.bytes[1]` es la
    nota) y cambiar (`mensaje.bytes[2] = 64`).
  - **`mensaje.tipo`**: qué clase de mensaje es, sin que tengas que hacer
    cuentas con los bits del primer byte. Vale uno de estos textos:
    `"nota-on"`, `"nota-off"`, `"presion-polifonica"`, `"cambio-de-control"`,
    `"cambio-de-programa"`, `"presion-de-canal"`, `"pitch-bend"`, `"sistema"`
    o `"desconocido"`. Un Nota On con velocidad 0 cuenta como `"nota-off"`,
    porque en MIDI es otra forma de soltar la tecla.
  - **`mensaje.canal`**: el canal, de 1 a 16, en los mensajes de canal (notas,
    controles, etc.). En los mensajes de sistema vale `null`, porque no tienen
    canal.

  El tipo y el canal se calculan con los bytes que el mensaje tiene en ese
  momento: si cambiás el primer byte, `mensaje.tipo` ya dice el tipo nuevo. El
  mensaje es una copia solo para esta caja: lo podés modificar tranquila, sin
  afectar a las otras ramas del flujo.
- **`parametros`**: los valores que tiene configurados esta caja, por `clave`.
  Por ejemplo, `parametros.desplazamiento`. Para usarlos como número, envolvelos
  en `Number(...)`.

Lo que devuelve decide qué pasa después:

- **Un mensaje**: sigue hacia las cajas conectadas a la salida. Puede ser el
  mismo que recibiste, modificado. Si la caja no tiene salida
  (`tieneSalida: false`), ese mensaje es el que sale por el puerto MIDI:
  Emitir, por ejemplo, devuelve el mensaje que recibe tal cual.
- **Nada** (`return;` o `return null;`): esa rama del flujo termina ahí. En una
  caja sin salida, no agrega nada a lo que sale por el puerto: Descartar hace
  exactamente eso.

Si necesitás devolver un mensaje distinto, en vez de modificar el que
recibiste, creá uno nuevo con sus bytes: `new MensajeMidi([0xb0, 7, 100])`.
Para eso importá `MensajeMidi` de `@/midi/mensaje`. El `@/` es la carpeta
`src/` del proyecto: lo que no es del workflow se importa así, igual desde
cualquier archivo.

`procesar` nunca envía mensajes por su cuenta: devuelve lo que corresponde, y
la aplicación se encarga de mandarlo al puerto y de mostrarlo en el log. Por
eso se puede probar solo mirando qué devuelve.

Tené en cuenta que la aplicación no verifica que el mensaje tenga sentido MIDI.
Por ejemplo, si desplazás el status de un *Nota On* (tres bytes) hasta un
*Program Change* (que usa dos), queda un byte de más, y el mensaje sale igual.
Si tu caja puede generar casos así, conviene que los revise y los descarte.

## Qué sale por el puerto

Tu caja no tiene que ocuparse de esto, pero ayuda a entender qué va a pasar
cuando la uses en un flujo:

- **Si el mensaje no llega a ninguna caja sin salida**, sale tal como llegó.
  Por eso una caja que no devuelve nada no "borra" el mensaje: solo corta su
  rama. Si llega a una caja que no está conectada a nada, también sale tal
  cual.
- **Si llega a al menos una caja sin salida** (Emitir, Descartar o una tuya),
  el original ya no sale por su cuenta: sale solo lo que devuelvan esas cajas.
  Para sacar los Nota Off, por ejemplo, no hace falta escribir una caja: se
  conecta un **Filtrar** con solo "Nota Off" marcado a un **Descartar**.
- **Si una caja tira un error, o devuelve algo que no es un mensaje válido**
  (algún byte que no sea un entero entre 0 y 255, o ningún byte), no sale
  nada de ese mensaje, ni por las otras ramas. En el log aparece en rojo, y al
  pasar el puntero por el ícono se ve qué caja falló y por qué. Los mensajes
  que llegan después se siguen procesando normalmente.

## Ejemplo completo: velocidad fija

Esta caja les pone a todos los *Nota On* la misma velocidad, sin importar qué
tan fuerte se tocó la tecla. Sirve, por ejemplo, para un teclado que no tiene
sensibilidad, o para que todas las notas suenen parejas. Los demás mensajes
pasan sin cambios.

Hay dos detalles importantes, y los dos tienen que ver con que en MIDI un Nota
On con velocidad 0 es un Nota Off:

- Si la caja le cambiara la velocidad a un Nota On con velocidad 0, lo
  convertiría en un Nota On de verdad, y la nota quedaría sonando para
  siempre. Por eso solo se tocan los mensajes cuyo `tipo` es `"nota-on"`: un
  Nota On con velocidad 0 tiene tipo `"nota-off"`, así que pasa sin cambios.
- La velocidad configurada tiene que quedar entre 1 y 127: con 0, la caja
  convertiría las notas en Nota Off, y con más de 127 el byte dejaría de ser
  un byte de datos.

```ts
import { Gauge } from "lucide";

import type { TipoDeNodo } from "../tipos";

export default {
  nombre: "Velocidad fija",
  icono: Gauge,
  parametros: [{ clave: "velocidad", etiqueta: "Velocidad", tipo: "entero", inicial: 100 }],
  procesar(mensaje, parametros) {
    if (mensaje.tipo !== "nota-on") {
      return mensaje;
    }
    // Entre 1 y 127: con 0 sería un Nota Off, y más de 127 no es un byte de datos.
    const velocidad = Math.min(Math.max(Number(parametros.velocidad), 1), 127);
    mensaje.bytes[2] = velocidad;
    return mensaje;
  },
} satisfies TipoDeNodo;
```

No escribe `tieneSalida` porque la caja deja pasar los mensajes hacia las
siguientes. Para usarla, se la pone entre el trigger y un Emitir.

Y su test, en `velocidad-fija.test.ts`. Además del caso normal, prueba los
bordes: el Nota On con velocidad 0, las velocidades configuradas fuera de
rango, y un mensaje que no es un Nota On.

```ts
import { expect, test } from "vitest";

import { MensajeMidi } from "@/midi/mensaje";
import velocidadFija from "./velocidad-fija";

test("les pone la velocidad elegida a los Nota On", () => {
  const resultado = velocidadFija.procesar(new MensajeMidi([0x90, 60, 30]), { velocidad: 100 });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 100]));
});

test("no toca un Nota On con velocidad 0, porque es un Nota Off", () => {
  const resultado = velocidadFija.procesar(new MensajeMidi([0x90, 60, 0]), { velocidad: 100 });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 0]));
});

test("no toca los Nota Off", () => {
  const resultado = velocidadFija.procesar(new MensajeMidi([0x80, 60, 64]), { velocidad: 100 });

  expect(resultado).toEqual(new MensajeMidi([0x80, 60, 64]));
});

test("con velocidad 0 configurada, usa 1 para no convertir la nota en Nota Off", () => {
  const resultado = velocidadFija.procesar(new MensajeMidi([0x90, 60, 30]), { velocidad: 0 });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 1]));
});

test("con más de 127 configurado, usa 127", () => {
  const resultado = velocidadFija.procesar(new MensajeMidi([0x90, 60, 30]), { velocidad: 200 });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 127]));
});

test("deja pasar sin cambios los mensajes que no son notas", () => {
  const resultado = velocidadFija.procesar(new MensajeMidi([0xb0, 7, 30]), { velocidad: 100 });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 7, 30]));
});
```

## Cómo escribir el test

Un test es un programa chiquito que usa tu caja y revisa que haga lo que tiene
que hacer. Sirve para darte cuenta enseguida si algo se rompe, ahora o cuando
alguien cambie el código dentro de un año. Como `procesar` recibe un mensaje y
devuelve otro, probarla es fácil: se la llama con un mensaje conocido y se mira
qué devuelve.

- **`test("qué se espera", () => { ... })`** define un caso. El texto es lo que
  vas a leer si falla, así que escribilo como una frase que diga qué tiene que
  pasar: "sin overflow, pasarse de 127 se queda en 127".
- **`expect(resultado).toEqual(new MensajeMidi([0x90, 72, 100]))`** es la
  revisión: si `resultado` no es un mensaje con esos bytes, el test falla y te
  muestra los dos, el que esperabas y el que salió. Para "no devuelve nada" se
  usa `.toBeUndefined()`.

Un `test` por comportamiento, aunque se repita un poco: es más fácil de leer y,
cuando falla uno, el nombre ya te dice qué se rompió. Para elegir los casos:

- **El caso normal**: un mensaje típico con parámetros típicos.
- **Los bordes**: qué pasa cerca de 0 y de 127, con números negativos, o con la
  opción marcada y desmarcada. Es donde más fácil se equivoca uno.
- **Los mensajes que no son para tu caja**: si tu caja trabaja con notas, qué
  hace con un Cambio de Control, o con un mensaje de un solo byte.

Además de tu test, hay uno que revisa **todas** las cajas del catálogo
(`src/workflow/catalogo.test.ts`). Si falla con el nombre de tu caja, quiere
decir que algo no cumple lo que toda caja tiene que cumplir: un valor `inicial`
que no le sirve a su `tipo` (un entero con decimales, o uno que no está entre
las `opciones`), dos
parámetros con la misma `clave`, o un `procesar` que tira un error o devuelve
bytes fuera de 0 a 255 con un mensaje común.

## Si necesitás código compartido

Si varias cajas usan la misma función auxiliar, ponela en un archivo **fuera**
de esta carpeta (por ejemplo, en `src/midi/` si calcula algo sobre los
mensajes, o en `src/workflow/`) e importala desde tus nodos.
Esta carpeta es solo para los tipos de nodo, así queda claro qué hay.

Tampoco importes nada del editor, del lienzo ni de la interfaz: un tipo de nodo
solo usa `../tipos` (el contrato), `@/midi/mensaje` (`MensajeMidi` y los tipos
de mensaje), su ícono de `lucide` y, si le hace falta, funciones auxiliares para
MIDI que calculen algo sin efectos. Tampoco importes `../salida`: para que un
mensaje salga por el puerto, alcanza con que una caja sin salida lo devuelva.
