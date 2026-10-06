# Cómo crear un tipo de parámetro

Un *parámetro* es algo que la persona usuaria configura en una caja, desde el
panel que aparece a la derecha del lienzo al seleccionarla: el desplazamiento
de Desplazar, por ejemplo. Cada parámetro tiene un *tipo*, que decide qué
control se ve en el panel y qué valores acepta: por ejemplo, `"entero"` (un
campo para escribir un número entero) o `"interruptor"` (una casilla para
prender o apagar algo). Cada tipo es un archivo de esta carpeta, y los que hay
son los que figuran en `catalogo.ts`.

Hace falta un tipo nuevo cuando una caja necesita que se configure algo que
los que hay no expresan bien. Si alcanza con uno de los que hay, usá ese: ver
[cómo se declaran los parámetros](../nodos/LEEME.md#qué-va-en-el-archivo).

Crear un tipo de parámetro es un paso más que crear un tipo de nodo: además de
la lógica, hay que elegir el control que se ve en el panel. Pero los controles
ya están hechos (son los *campos* de `src/componentes/`, con su etiqueta, su
error y sus estilos), y guardar el valor en la caja también está resuelto: tu
archivo solo dice qué campo dibujar y qué valores acepta.

## Los que hay

- `entero`: un número entero, con un rango opcional. Se puede mostrar y
  escribir en decimal, como nota o en hexadecimal (ver
  [Los modos de los números](#los-modos-de-los-números)).
- `interruptor`: una casilla, para prender o apagar algo.
- `lista`: una sola opción de una lista cerrada, con un desplegable. Sirve
  para pocas opciones (en Mapear, qué byte se mapea).
- `opciones`: varias opciones de una lista cerrada, todas a la vista como
  píldoras que se encienden y se apagan. Sirve para pocas opciones de texto
  corto (en Filtrar, los canales).
- `autocompletar`: varias opciones de una lista cerrada, que se buscan
  escribiendo en un campo; las elegidas quedan debajo, cada una con un botón
  para quitarla. Sirve para listas largas (en Filtrar, los tipos de mensaje),
  y puede declarar un `textoDeAyuda` para cuando no hay ninguna elegida.
- `rango`: dos extremos enteros, "desde" y "hasta", entre un `minimo` y un
  `maximo`, con una barra de dos perillas y un campo a cada lado. Con
  `invertible: true`, "desde" puede quedar mayor que "hasta" (en Mapear, para
  dar vuelta un sentido); si no, las perillas se frenan al tocarse (en
  Filtrar). El valor es `{ desde, hasta }`. Como el entero, tiene modos.

En `opciones` y `autocompletar` el valor es una lista con los valores
elegidos, en el orden de las opciones, y no elegir ninguna también vale.

## Los pasos

1. **Creá el archivo** en esta carpeta, con un nombre en minúsculas que diga
   qué se configura: por ejemplo, `real.ts`. Lo más fácil es copiar el de un
   tipo parecido (por ejemplo, `entero.ts`) y cambiarlo.
2. **Registralo en el catálogo.** Abrí `catalogo.ts`, en esta misma carpeta,
   y hacé tres cosas: importá tu archivo arriba, sumá su declaración a la
   lista `Parametro` y su entrada a `TIPOS_DE_PARAMETRO`:

   ```ts
   import real, { type ParametroReal } from "./real";

   export type Parametro =
     | ParametroReal
     // …los que ya estaban

   const TIPOS_DE_PARAMETRO = {
     real,
     // …los que ya estaban
   } satisfies …;
   ```

   El nombre en `TIPOS_DE_PARAMETRO` tiene que ser el mismo que pusiste en
   `tipo` (ver más abajo). A diferencia de los tipos de nodo, si te olvidás de
   alguna de las tres cosas, el chequeo de tipos te avisa: corré
   `npx tsc --noEmit` desde la raíz del proyecto.
3. **Escribí el test** de la función que interpreta lo que se escribe, si tu
   tipo tiene una (ver [Qué va en el archivo](#qué-va-en-el-archivo)). Va al
   lado, terminado en `.test.ts`: para `real.ts`, `real.test.ts`. Lo más fácil
   es copiar el test de un tipo parecido. Después corré `npm test`, que tiene
   que terminar diciendo que pasaron todos.
4. **Usalo desde un tipo de nodo**, declarando un parámetro con tu `tipo`:

   ```ts
   parametros: [{ clave: "factor", etiqueta: "Factor", tipo: "real", inicial: 1.5 }],
   ```

   Levantá la aplicación, agregá esa caja desde la barra, seleccionala y
   probá el control en el panel: que muestre el valor inicial, que guarde lo
   que escribís y que rechace lo que no corresponde.

## Qué va en el archivo

- **La forma de la declaración**: lo que escribe un tipo de nodo para declarar
  un parámetro de tu tipo. Es una `interface` que extiende `ParametroBase`, con
  el tipo del valor entre `<>` (por ejemplo `ParametroBase<number>`) y un
  campo `tipo` con el nombre del tipo. `ParametroBase` ya trae la `clave`, la
  `etiqueta` y el valor `inicial`. Si tu tipo necesita algo más, va acá: la
  lista, por ejemplo, agrega sus opciones, y el entero, un `minimo`
  y un `maximo` opcionales.
- **`interpretar(texto)`**, si lo que se escribe en el control puede no ser un
  valor válido: devuelve el valor, o `null` si no sirve. Es una función común,
  sin nada de la interfaz, y por eso se puede probar con un test. Una casilla
  sí/no no la necesita, porque no hay forma de marcarla mal.
- **El control**: una clase que extiende `CampoDeParametro`, con el nombre de
  su etiqueta HTML en `@customElement("parametro-…")`. Lo único que escribe es
  `render()`, que dibuja uno de los campos de `src/componentes/` (importado
  arriba, como `import "@/componentes/campo-numero";`):
  - `campo-numero` (un número escrito), `campo-interruptor` (una casilla),
    `campo-lista` (un desplegable), `campo-opciones` (píldoras),
    `campo-autocompletar` (buscar y elegir varias) o `campo-rango` (dos
    perillas). Cada uno recibe `etiqueta`, `.valor` y `.error`, más lo
    propio (por ejemplo, `.opciones`);
  - `this.valor` es el valor que tiene la caja, y `this.parametro`, la
    declaración;
  - el campo avisa con el evento `cambio` cuando la persona cambia algo, y
    `evento.detail` trae lo nuevo. Si sirve para guardarlo, llamá a
    `this.avisarCambio(valorNuevo)`. Si no (lo que se escribió no se puede
    interpretar), no llames a nada: el campo vuelve solo a mostrar el valor
    que la caja conserva;
  - si el valor se muestra distinto de como se guarda, armá el texto con una
    función aparte (como `mostrar` en el ejemplo de abajo), que también se
    puede probar;
  - no hace falta escribir estilos, ni ocuparse de la etiqueta o de cómo se
    ve el error: eso es del campo. Así un mismo control se ve igual en todos
    lados;
  - si el valor es una lista o un objeto, avisá siempre uno nuevo, nunca el
    mismo modificado: la caja se da cuenta de que algo cambió porque el valor
    es otro.

  Si ninguno de los campos sirve para tu tipo, hace falta uno nuevo en
  `src/componentes/`: es un paso más grande, y conviene mirar primero cómo
  están hechos los que hay.
- **La entrada para el catálogo** (el `export default`), con dos funciones
  (y una tercera opcional):
  - **`error(parametro, valor, presentacion)`**: si un valor le sirve a este
    parámetro.
    Devuelve `null` si le sirve, o el texto que se muestra debajo del campo si
    no: el entero, por ejemplo, devuelve "Tiene que ir de 0 a 127" para un
    200 cuando el parámetro se declaró con ese rango. El panel lo muestra, el
    lienzo marca la caja en rojo, y el test que revisa todas las cajas
    (`src/workflow/nodos/catalogo.test.ts`) lo usa para comprobar que el valor
    `inicial` de cada parámetro no tenga errores. La `presentacion` solo la
    usan los tipos que la guardan (ver
    [Cómo se muestra el valor](#cómo-se-muestra-el-valor-la-presentación));
    si el tuyo no la usa, no la declares.
  - **`dibujar(parametro, valor, error, presentacion)`**: devuelve tu
    etiqueta HTML con `.parametro`, `.valor` y `.error` (y `.presentacion`,
    si la usa). Es siempre igual: copiala y cambiá el nombre de la etiqueta.
  - **`formatear(parametro, numero, presentacion)`**, opcional: escribe un
    número como lo muestra el parámetro. Lo usan las reglas de los tipos de
    nodo para nombrar un número en un error (ver
    [`validar`](../nodos/LEEME.md#reglas-entre-parámetros-validar)). Sin
    esto, el número va en decimal.

### Lo que no se puede interpretar y lo que no sirve

Son dos cosas distintas, y cada una tiene su lugar:

- **Lo que no se puede interpretar** (un "2.5" en un entero, o el campo vacío)
  no es un valor que se pueda guardar: `interpretar` devuelve `null`, el
  control no avisa nada y la caja conserva el valor que tenía.
- **Lo que se interpreta pero no sirve** (un 200 en un entero de 0 a 127) sí
  se guarda: el control llama a `this.avisarCambio(…)` igual, y `error` dice
  qué está mal. Así la persona ve el problema debajo del campo, y una regla
  que mira dos parámetros (ver
  [`validar`](../nodos/LEEME.md#reglas-entre-parámetros-validar)) puede
  marcar una combinación aunque cada valor, solo, esté bien.

El texto del error lo dibuja el campo debajo del control, con los atributos
que usan los lectores de pantalla para anunciarlo: alcanza con pasarle
`.error=${this.error}`.

No hace falta ocuparse de la etiqueta, de los estilos, ni de guardar el valor
en la caja: de eso se encargan el campo, `CampoDeParametro` y el panel de
configuración.

### Cómo se muestra el valor: la presentación

Algunos tipos dejan elegir cómo se muestra el valor, sin cambiarlo: el entero
muestra el 60 como "60", "C4" o "3C", según el modo elegido. Eso que se
eligió es la *presentación* del parámetro, y la caja la guarda al lado del
valor, para que siga igual al seleccionar otra caja y volver.

Solo tu tipo sabe qué tiene la presentación: el panel, el lienzo, el ejecutor
y los tipos de nodo la guardan y te la pasan sin mirarla. Por eso llega como
`unknown`, y tu tipo tiene que revisar que sea algo que entiende (si no, usar
la de por defecto). En el control:

- `this.presentacion` es la que guardó la caja, o `undefined` si nunca se
  eligió;
- para cambiarla, llamá a `this.avisarCambioDePresentacion(nueva)`, como
  `avisarCambio` con el valor. Si cambian los dos a la vez, avisá primero la
  presentación.

La mayoría de los tipos no la necesitan, como el del ejemplo de abajo.

### Los modos de los números

El entero y el rango usan la presentación para sus **modos**: decimal ("60"),
nota ("C4", con el Do central 60 como C4) y hexadecimal ("3C"). Todo lo de
los modos está en `modos.ts`, y solo lo usan `entero.ts` y `rango.ts`:

- La declaración del parámetro puede decir qué modos ofrece, en orden, con
  `modos` (por ejemplo, `modos: ["nota", "decimal"]`). Si no lo dice, son
  decimal, nota y hexadecimal. El primero es el de una caja nueva, y el botón
  de modo pasa al siguiente en ese orden. Con un solo modo no hay botón.
- Lo escrito se lee probando los modos en el orden en que rotan, empezando por
  el actual (`leer`), y el parámetro pasa al modo en que se leyó: escribir "C4"
  en modo decimal guarda 60 y deja el campo en modo nota.
- El modo nota pide que el parámetro vaya de 0 a 127, y el hexadecimal, que
  no tenga negativos: el test de `nodos/catalogo.test.ts` lo revisa.
- `error` y `formatear` escriben los números en el modo actual ("Tiene que ir
  de C-1 a G9").
- En modo nota, las notas negras van con sostenidos ("C#4"), salvo que la
  última nota escrita haya llevado bemol ("Db4"): entonces van con bemoles,
  hasta que se escriba una con sostenido. Por eso la presentación del entero
  y del rango no es solo el modo, sino `{ modo, bemoles }` (`Presentacion`,
  en `modos.ts`). El log sigue con sostenidos.

## Ejemplo completo: real

Este tipo es para números con decimales, como un factor por el que multiplicar
algo (1,5 para que sea un 50 % más). La caja guarda un número común, así que
para `procesar` no tiene nada especial; lo que cambia es cómo se escribe y
cómo se muestra.

Dos detalles importantes:

- En castellano los decimales se separan con coma, pero mucha gente escribe
  punto, y JavaScript solo entiende el punto. Por eso `interpretar` acepta las
  dos cosas, y cambia la coma por un punto antes de convertir el texto con
  `Number(…)`.
- El campo muestra el valor con coma (`mostrar`), así que después de
  escribir "2.5" se ve "2,5": es el mismo número.

```ts
import { html } from "lit";
import { customElement } from "lit/decorators.js";

import "@/componentes/campo-numero";
import type { Paso } from "@/componentes/campo-numero";
import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

export interface ParametroReal extends ParametroBase<number> {
  tipo: "real";
}

/**
 * El número escrito, con o sin decimales, o `null` si no es un número. Los
 * decimales se pueden separar con coma ("2,5") o con punto ("2.5").
 */
export function interpretar(texto: string): number | null {
  const conPunto = texto.trim().replace(",", ".");
  if (conPunto === "") return null;

  const numero = Number(conPunto);
  return Number.isFinite(numero) ? numero : null;
}

/** El número como se escribe en castellano, con coma: 2.5 se muestra "2,5". */
export function mostrar(numero: number): string {
  return String(numero).replace(".", ",");
}

@customElement("parametro-real")
export class CampoReal extends CampoDeParametro<ParametroReal, number> {
  render() {
    return html`
      <campo-numero
        decimales
        etiqueta=${this.parametro.etiqueta}
        .valor=${mostrar(this.valor)}
        .error=${this.error}
        @cambio=${(evento: CustomEvent<string>) => {
          const numero = interpretar(evento.detail);
          // Si no es un número, el campo vuelve solo al valor que tenía.
          if (numero !== null) {
            this.avisarCambio(numero);
          }
        }}
        @paso=${(evento: CustomEvent<Paso>) => {
          // Las flechas: lo escrito (aunque no se haya confirmado) más el paso.
          const numero = interpretar(evento.detail.texto);
          if (numero !== null) {
            this.avisarCambio(numero + evento.detail.cantidad);
          }
        }}
      ></campo-numero>
    `;
  }
}

export default {
  error: (_parametro: ParametroReal, valor: number) =>
    Number.isFinite(valor) ? null : "Tiene que ser un número",
  dibujar: (parametro: ParametroReal, valor: number, error: string | null) =>
    html`<parametro-real .parametro=${parametro} .valor=${valor} .error=${error}></parametro-real>`,
};
```

Este tipo no usa presentación, así que `error` y `dibujar` no la declaran: el
catálogo se la pasa igual, y simplemente no la leen. `decimales` hace que, en
una pantalla táctil, aparezca el teclado de números con separador.
`campo-numero` avisa el texto tal como se escribió, sin interpretarlo: así
cada tipo decide qué acepta, como acá la coma y el punto. Lo mismo con sus
flechas para subir y bajar (y las del teclado): avisan `paso`, con lo escrito
y cuánto sumarle (1, o 10 con Mayúsculas, con signo), y el tipo decide qué
valor resulta.

Y su test, en `real.test.ts`. Además de los casos normales, prueba las dos
formas de separar los decimales y lo que no es un número.

```ts
import { expect, test } from "vitest";

import { interpretar, mostrar } from "./real";

test("acepta un número con decimales separados por punto", () => {
  expect(interpretar("2.5")).toBe(2.5);
});

test("acepta un número con decimales separados por coma", () => {
  expect(interpretar("2,5")).toBe(2.5);
});

test("acepta un número negativo", () => {
  expect(interpretar("-0,75")).toBe(-0.75);
});

test("acepta un número sin decimales", () => {
  expect(interpretar("3")).toBe(3);
});

test("acepta los decimales sin el cero de adelante", () => {
  expect(interpretar(",5")).toBe(0.5);
});

test("acepta espacios alrededor del número", () => {
  expect(interpretar(" 1,5 ")).toBe(1.5);
});

test("rechaza el campo vacío", () => {
  expect(interpretar("")).toBeNull();
});

test("rechaza un campo con solo espacios", () => {
  expect(interpretar("   ")).toBeNull();
});

test("rechaza un texto que no es un número", () => {
  expect(interpretar("dos")).toBeNull();
});

test("rechaza un número con dos separadores", () => {
  expect(interpretar("1,2,3")).toBeNull();
});

test("rechaza el infinito", () => {
  expect(interpretar("Infinity")).toBeNull();
});

test("muestra los decimales con coma", () => {
  expect(mostrar(2.5)).toBe("2,5");
  expect(mostrar(-0.75)).toBe("-0,75");
  expect(mostrar(3)).toBe("3");
});
```

Para usarlo, una caja declara `tipo: "real"` en uno de sus parámetros, como
en el paso 4.

## Cómo escribir el test

Es igual que el de un tipo de nodo (ver
[Cómo escribir el test](../nodos/LEEME.md#cómo-escribir-el-test)), pero lo
que se prueba es `interpretar`: se le pasa lo que alguien podría escribir y se
revisa qué valor devuelve, o que devuelva `null`. Si tu `error` revisa algo
más que el tipo del valor (como el rango del entero), probalo igual: se le pasa
una declaración y un valor, y se revisa el texto que devuelve, o que devuelva
`null`. Para elegir los casos:

- **El caso normal**: algo que se escribe todos los días.
- **Las variantes que tienen que funcionar**: mayúsculas y minúsculas,
  espacios alrededor, negativos, las distintas formas de escribir lo mismo.
- **Los bordes**: el valor más chico y el más grande que se aceptan, y los
  primeros que ya no.
- **Lo que no sirve**: el campo vacío, texto que no corresponde.

El control en sí no se testea: se prueba en la aplicación, como en el paso 4.
