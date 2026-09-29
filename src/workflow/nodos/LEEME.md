# Cómo crear un tipo de nodo

Cada caja que aparece en la barra del tab **Workflow** es un *tipo de nodo*, y
cada tipo de nodo vive en un archivo de esta carpeta. Para crear uno nuevo no
hace falta saber nada del editor ni del lienzo: alcanza con escribir un archivo
con la caja, otro con su test, y agregar una línea en el catálogo.

## Los pasos

1. **Creá el archivo** en esta carpeta, con un nombre en minúsculas que diga
   qué hace la caja: por ejemplo, `sin-nota-off.ts`. Lo más fácil es copiar
   `desplazar.ts` y cambiarlo.
2. **Registralo en el catálogo.** Abrí `src/workflow/catalogo.ts`, importá tu
   archivo arriba y agregalo a la lista `tipos`:

   ```ts
   import sinNotaOff from "./nodos/sin-nota-off";

   const tipos = {
     desplazar,
     sinNotaOff,
     emitir,
   } satisfies Record<string, TipoDeNodo>;
   ```

   El nombre que uses en la lista (`sinNotaOff`) es el identificador del tipo:
   no puede repetirse. El orden de la lista es el orden de la barra.

   Si te olvidás de este paso, no aparece ningún error: la caja simplemente no
   aparece en la barra. Es lo primero que conviene revisar cuando "no anda".
3. **Escribí el test.** Cada caja trae su test al lado, con el mismo nombre y
   terminado en `.test.ts`: para `sin-nota-off.ts`, `sin-nota-off.test.ts`. Lo
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
  *termina* el flujo, como Emitir. Si no lo escribís, la caja tiene salida.
  En una caja sin salida, lo que devuelve `procesar` es lo que sale por el
  puerto MIDI (ver más abajo). Las cajas sin salida se ven naranjas, como
  Emitir, sin que tengas que declarar ningún color.
- **`parametros`**: lo que la persona usuaria puede configurar en la caja. Cada
  parámetro tiene una `clave` (el nombre con que lo vas a leer), una `etiqueta`
  (el texto que se ve en el panel), un `tipo` y un valor `inicial`. Los tipos
  disponibles son:
  - `"entero"`: un número entero (acepta negativos).
  - `"si-no"`: una casilla para marcar o desmarcar.
  - `"opciones"`: una lista cerrada. Cada opción tiene un `valor` y un `texto`.

  Si la caja no se configura, poné `parametros: []`.
- **`procesar(mensaje, parametros)`**: la función donde la caja hace su trabajo.

Terminá el objeto con `satisfies TipoDeNodo`: así el editor de código te avisa
si falta algún campo o si alguno tiene la forma equivocada.

## La función `procesar`

Se llama una vez por cada mensaje MIDI que llega a la caja, y recibe:

- **`mensaje`**: el mensaje como una lista de números, uno por byte. Por
  ejemplo, un *Nota On* en el canal 1, nota 60 (Do central) y velocidad 100 es
  `[0x90, 60, 100]`. La lista es una copia solo para esta caja: la podés
  modificar tranquila, sin afectar a las otras ramas del flujo.
- **`parametros`**: los valores que tiene configurados esta caja, por `clave`.
  Por ejemplo, `parametros.desplazamiento`. Para usarlos como número, envolvelos
  en `Number(...)`.

Lo que devuelve decide qué pasa después:

- **Una lista de bytes**: ese mensaje sigue hacia las cajas conectadas a la
  salida. Puede ser la misma lista que recibiste, modificada. Si la caja no
  tiene salida (`tieneSalida: false`), ese mensaje es el que sale por el
  puerto MIDI: Emitir, por ejemplo, devuelve el mensaje que recibe tal cual.
- **Nada** (`return;` o `return null;`): el mensaje se descarta y esa rama del
  flujo termina ahí. En una caja sin salida, no sale nada por el puerto.

`procesar` nunca envía mensajes por su cuenta: devuelve lo que corresponde, y
la aplicación se encarga de mandarlo al puerto y de mostrarlo en el log. Por
eso se puede probar solo mirando qué devuelve.

Cada byte tiene que ser un entero entre 0 y 255. Si la función devuelve otra
cosa, o si tira un error, el mensaje se descarta, aparece un aviso en la
consola de desarrollo y el resto del flujo sigue funcionando.

Tené en cuenta que la aplicación no verifica que el mensaje tenga sentido MIDI.
Por ejemplo, si desplazás el status de un *Nota On* (tres bytes) hasta un
*Program Change* (que usa dos), queda un byte de más, y el mensaje sale igual.
Si tu caja puede generar casos así, conviene que los revise y los descarte.

## Ejemplo completo: descartar los Nota Off

Esta caja deja pasar todo salvo los *Nota Off*. En MIDI, un Nota Off puede
llegar de dos maneras: con status `0x80` a `0x8F`, o como un *Nota On*
(`0x90` a `0x9F`) con velocidad 0.

```ts
import { Filter } from "lucide";

import type { TipoDeNodo } from "../tipos";

export default {
  nombre: "Sin Nota Off",
  icono: Filter,
  parametros: [],
  procesar(mensaje) {
    const tipo = mensaje[0] & 0xf0; // los 4 bits de arriba del status dicen el tipo
    const esNotaOff = tipo === 0x80 || (tipo === 0x90 && mensaje[2] === 0);
    if (esNotaOff) {
      return;
    }
    return mensaje;
  },
} satisfies TipoDeNodo;
```

No escribe `tieneSalida` porque la caja deja pasar los mensajes hacia las
siguientes.

Y su test, en `sin-nota-off.test.ts`. Los dos casos del Nota Off van por
separado, y también se prueba el borde: un Nota On con velocidad 1 no es un Nota
Off.

```ts
import { expect, test } from "vitest";

import sinNotaOff from "./sin-nota-off";

test("deja pasar los Nota On", () => {
  expect(sinNotaOff.procesar([0x90, 60, 100])).toEqual([0x90, 60, 100]);
});

test("descarta los Nota Off", () => {
  expect(sinNotaOff.procesar([0x80, 60, 64])).toBeUndefined();
});

test("descarta los Nota On con velocidad 0, que también son Nota Off", () => {
  expect(sinNotaOff.procesar([0x90, 60, 0])).toBeUndefined();
});

test("deja pasar un Nota On con velocidad 1", () => {
  expect(sinNotaOff.procesar([0x90, 60, 1])).toEqual([0x90, 60, 1]);
});

test("deja pasar los mensajes que no son de notas", () => {
  expect(sinNotaOff.procesar([0xb0, 7, 127])).toEqual([0xb0, 7, 127]);
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
- **`expect(resultado).toEqual([0x90, 72, 100])`** es la revisión: si
  `resultado` no es esa lista, el test falla y te muestra las dos, la que
  esperabas y la que salió. Para "no devuelve nada" se usa `.toBeUndefined()`.

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
que no coincide con su `tipo` (o que no está entre las `opciones`), dos
parámetros con la misma `clave`, o un `procesar` que tira un error o devuelve
bytes fuera de 0 a 255 con un mensaje común.

## Si necesitás código compartido

Si varias cajas usan la misma función auxiliar, ponela en un archivo **fuera**
de esta carpeta (por ejemplo, en `src/workflow/`) e importala desde tus nodos.
Esta carpeta es solo para los tipos de nodo, así queda claro qué hay.

Tampoco importes nada del editor, del lienzo ni de la interfaz: un tipo de nodo
solo usa `../tipos`, su ícono de `lucide` y, si le hace falta, funciones
auxiliares para MIDI que calculen algo sin efectos. Tampoco importes
`../salida`: para que un mensaje salga por el puerto, alcanza con que una caja
sin salida lo devuelva.
