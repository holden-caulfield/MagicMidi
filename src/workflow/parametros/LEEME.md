# Cómo crear un tipo de parámetro

Un *parámetro* es algo que la persona usuaria configura en una caja, desde el
panel que aparece a la derecha del lienzo al seleccionarla: el desplazamiento
de Desplazar, por ejemplo. Cada parámetro tiene un *tipo*, que decide qué
control se ve en el panel y qué valores acepta. Hoy hay tres: `"entero"`,
`"si-no"` y `"opciones"`, cada uno en un archivo de esta carpeta.

Hace falta un tipo nuevo cuando una caja necesita que se configure algo que
esos tres no expresan bien. Por ejemplo, elegir una nota escribiendo "C4" en
vez de su número. Si alcanza con uno de los que hay, usá ese: ver
[cómo se declaran los parámetros](../nodos/LEEME.md#qué-va-en-el-archivo).

Crear un tipo de parámetro es un paso más que crear un tipo de nodo: además de
la lógica, hay que escribir el control que se ve en el panel. Pero lo común
(la etiqueta, los estilos, guardar el valor en la caja) ya está resuelto, y
tu archivo solo dice qué control dibujar y qué valores acepta.

## Los pasos

1. **Creá el archivo** en esta carpeta, con un nombre en minúsculas que diga
   qué se configura: por ejemplo, `nota.ts`. Lo más fácil es copiar
   `entero.ts` y cambiarlo.
2. **Registralo en el catálogo.** Abrí `catalogo.ts`, en esta misma carpeta,
   y hacé tres cosas: importá tu archivo arriba, sumá su declaración a la
   lista `Parametro` y su entrada a `TIPOS_DE_PARAMETRO`:

   ```ts
   import nota, { type ParametroNota } from "./nota";

   export type Parametro =
     | ParametroEntero
     | ParametroNota
     // …

   const TIPOS_DE_PARAMETRO = {
     entero,
     nota,
     // …
   } satisfies …;
   ```

   El nombre en `TIPOS_DE_PARAMETRO` tiene que ser el mismo que pusiste en
   `tipo` (ver más abajo). A diferencia de los tipos de nodo, si te olvidás de
   alguna de las tres cosas, el chequeo de tipos te avisa: corré
   `npx tsc --noEmit` desde la raíz del proyecto.
3. **Escribí el test** de la función que interpreta lo que se escribe, si tu
   tipo tiene una (ver [Qué va en el archivo](#qué-va-en-el-archivo)). Va al
   lado, terminado en `.test.ts`: para `nota.ts`, `nota.test.ts`. Lo más fácil
   es copiar `entero.test.ts`. Después corré `npm test`, que tiene que
   terminar diciendo que pasaron todos.
4. **Usalo desde un tipo de nodo**, declarando un parámetro con tu `tipo`:

   ```ts
   parametros: [{ clave: "nota", etiqueta: "Nota", tipo: "nota", inicial: 60 }],
   ```

   Levantá la aplicación, agregá esa caja desde la barra, seleccionala y
   probá el control en el panel: que muestre el valor inicial, que guarde lo
   que escribís y que rechace lo que no corresponde.

## Qué va en el archivo

- **La forma de la declaración**: lo que escribe un tipo de nodo para declarar
  un parámetro de tu tipo. Es una `interface` que extiende `ParametroBase`, con
  el tipo del valor entre `<>` (por ejemplo `ParametroBase<number>`) y un
  campo `tipo` con el nombre del tipo. `ParametroBase` ya trae la `clave`, la
  `etiqueta` y el valor `inicial`. Si tu tipo necesita algo más, va acá: el de
  opciones, por ejemplo, agrega la lista de opciones.
- **`interpretar(texto)`**, si lo que se escribe en el control puede no ser un
  valor válido: devuelve el valor, o `null` si no sirve. Es una función común,
  sin nada de la interfaz, y por eso se puede probar con un test. Una casilla
  sí/no no la necesita, porque no hay forma de marcarla mal.
- **El control**: una clase que extiende `CampoDeParametro`, con el nombre de
  su etiqueta HTML en `@customElement("parametro-…")`. Lo único que escribe es
  `control()`, que devuelve el control que se ve en el panel:
  - el control lleva `id="control"`, así la etiqueta queda enlazada a él (al
    hacer clic en la etiqueta, el foco va al control);
  - `this.valor` es el valor que tiene la caja, y `this.parametro`, la
    declaración;
  - cuando la persona usuaria cambia el valor, llamá a
    `this.avisarCambio(valorNuevo)`. Si lo que escribió no sirve, llamá a
    `this.requestUpdate()` en su lugar: eso vuelve a dibujar el control con el
    valor que la caja conserva;
  - el valor se muestra envuelto en `live(…)`, para que vuelva a aparecer
    aunque la persona haya escrito otra cosa en el control;
  - si el control va antes de la etiqueta y en la misma línea, como una
    casilla, poné `protected enLinea = true;` (ver `si-no.ts`).
- **La entrada para el catálogo** (el `export default`), con dos funciones:
  - **`valido(parametro, valor)`**: si un valor le sirve a este parámetro. El
    test que revisa todas las cajas (`src/workflow/catalogo.test.ts`) la usa
    para comprobar que el valor `inicial` de cada parámetro tenga sentido.
  - **`dibujar(parametro, valor)`**: devuelve tu etiqueta HTML con
    `.parametro` y `.valor`. Es siempre igual: copiala y cambiá el nombre de
    la etiqueta.

No hace falta ocuparse de la etiqueta, de los estilos del campo, ni de
guardar el valor en la caja: de eso se encargan `CampoDeParametro` y el panel
de configuración.

## Ejemplo completo: nota

Este tipo deja elegir una nota escribiendo su nombre, como "C4" o "F#2", en
lugar de su número MIDI. La caja guarda el número (C4 es el 60, el Do
central), así que para `procesar` es un entero como cualquier otro; lo que
cambia es cómo se escribe y cómo se muestra.

Dos detalles importantes:

- MIDI tiene notas del 0 al 127, que van de C-1 a G9. Lo que quede fuera de
  ese rango no es una nota válida, aunque el nombre esté bien escrito.
- El control muestra el valor como nombre (`nombreDeNota`), así que después
  de escribir "Db4" se ve "C#4": es la misma nota.

```ts
import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

export interface ParametroNota extends ParametroBase<number> {
  tipo: "nota";
}

// El lugar de cada nota dentro de la octava, contando desde Do (C).
const SEMITONOS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOMBRES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** El nombre de una nota, como "C4" o "F#2", a partir de su número MIDI. */
export function nombreDeNota(numero: number): string {
  const octava = Math.floor(numero / 12) - 1;
  return `${NOMBRES[numero % 12]}${octava}`;
}

/**
 * El número MIDI de una nota escrita por su nombre (como "C4", "f#2" o
 * "Bb-1"), o `null` si no es una nota que exista en MIDI. Se usa la
 * convención en la que C4 es el Do central, el 60.
 */
export function interpretar(texto: string): number | null {
  const partes = /^([A-G])([#b]?)(-?\d+)$/i.exec(texto.trim());
  if (!partes) return null;

  const [, letra, alteracion, octava] = partes;
  let numero = (Number(octava) + 1) * 12 + SEMITONOS[letra.toUpperCase()];
  if (alteracion === "#") numero += 1;
  if (alteracion === "b") numero -= 1;

  return numero >= 0 && numero <= 127 ? numero : null;
}

@customElement("parametro-nota")
export class CampoNota extends CampoDeParametro<ParametroNota, number> {
  protected control() {
    return html`
      <input
        id="control"
        type="text"
        .value=${live(nombreDeNota(this.valor))}
        @change=${(evento: Event) => {
          const numero = interpretar((evento.target as HTMLInputElement).value);
          if (numero === null) {
            // Redibujar vuelve a mostrar el valor que la caja conserva.
            this.requestUpdate();
          } else {
            this.avisarCambio(numero);
          }
        }}
      />
    `;
  }
}

export default {
  valido: (_parametro: ParametroNota, valor: number) =>
    Number.isInteger(valor) && valor >= 0 && valor <= 127,
  dibujar: (parametro: ParametroNota, valor: number) =>
    html`<parametro-nota .parametro=${parametro} .valor=${valor}></parametro-nota>`,
};
```

Y su test, en `nota.test.ts`. Además de los casos normales, prueba los bordes
del rango y lo que no es una nota.

```ts
import { expect, test } from "vitest";

import { interpretar, nombreDeNota } from "./nota";

test("C4 es el Do central, el 60", () => {
  expect(interpretar("C4")).toBe(60);
});

test("acepta las letras en minúscula", () => {
  expect(interpretar("a4")).toBe(69);
});

test("un sostenido sube un semitono", () => {
  expect(interpretar("C#4")).toBe(61);
});

test("un bemol baja un semitono", () => {
  expect(interpretar("Db4")).toBe(61);
});

test("acepta la octava -1, donde están las notas más graves", () => {
  expect(interpretar("C-1")).toBe(0);
});

test("acepta la nota más aguda de MIDI, G9", () => {
  expect(interpretar("G9")).toBe(127);
});

test("rechaza una nota más aguda que G9", () => {
  expect(interpretar("G#9")).toBeNull();
});

test("rechaza una nota más grave que C-1", () => {
  expect(interpretar("Cb-1")).toBeNull();
});

test("rechaza una letra que no es una nota", () => {
  expect(interpretar("H4")).toBeNull();
});

test("rechaza un número suelto", () => {
  expect(interpretar("60")).toBeNull();
});

test("rechaza el campo vacío", () => {
  expect(interpretar("")).toBeNull();
});

test("muestra el número como el nombre de la nota", () => {
  expect(nombreDeNota(60)).toBe("C4");
  expect(nombreDeNota(61)).toBe("C#4");
  expect(nombreDeNota(0)).toBe("C-1");
});
```

Para usarlo, una caja declara `tipo: "nota"` en uno de sus parámetros, como
en el paso 4.

## Cómo escribir el test

Es igual que el de un tipo de nodo (ver
[Cómo escribir el test](../nodos/LEEME.md#cómo-escribir-el-test)), pero lo
que se prueba es `interpretar`: se le pasa lo que alguien podría escribir y se
revisa qué valor devuelve, o que devuelva `null`. Para elegir los casos:

- **El caso normal**: algo que se escribe todos los días.
- **Las variantes que tienen que funcionar**: mayúsculas y minúsculas,
  espacios alrededor, negativos.
- **Los bordes**: el valor más chico y el más grande que se aceptan, y los
  primeros que ya no.
- **Lo que no sirve**: el campo vacío, texto que no corresponde, un número con
  decimales.

El control en sí no se testea: se prueba en la aplicación, como en el paso 4.
