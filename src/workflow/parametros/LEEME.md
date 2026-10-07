# Cómo crear un tipo de parámetro

Un *parámetro* es algo que la persona usuaria configura en una caja, desde el
panel que aparece a la derecha del lienzo al seleccionarla: el desplazamiento
de Desplazar, por ejemplo. Cada parámetro tiene un *tipo*, que decide qué
campo se ve en el panel y qué valores acepta: por ejemplo, `"entero"` (un
campo para escribir un número entero) o `"interruptor"` (una casilla para
prender o apagar algo). Cada tipo es un archivo de esta carpeta, y los que hay
son los que figuran en `catalogo.ts`.

Hace falta un tipo nuevo cuando una caja necesita que se configure algo que
los que hay no expresan bien. Si alcanza con uno de los que hay, usá ese: ver
[cómo se declaran los parámetros](../nodos/LEEME.md#qué-va-en-el-archivo).

Crear un tipo de parámetro es un paso más que crear un tipo de nodo: además de
la lógica, hay que elegir el campo que se ve en el panel. Pero los campos ya
están hechos (son los componentes de `src/componentes/`, con su etiqueta, su
error y sus estilos, y ellos leen lo que se escribe), y guardar el valor en la
caja también está resuelto: tu archivo solo dice qué valores sirven y qué
campo dibujar, con qué datos.

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
   qué se configura: por ejemplo, `nota.ts`. Lo más fácil es copiar el de un
   tipo parecido (por ejemplo, `entero.ts`) y cambiarlo.
2. **Registralo en el catálogo.** Abrí `catalogo.ts`, en esta misma carpeta,
   y hacé tres cosas: importá tu archivo arriba, sumá su declaración a la
   lista `Parametro` y su entrada a `TIPOS_DE_PARAMETRO`:

   ```ts
   import nota, { type ParametroNota } from "./nota";

   export type Parametro =
     | ParametroNota
     // …los que ya estaban

   const TIPOS_DE_PARAMETRO = {
     nota,
     // …los que ya estaban
   } satisfies …;
   ```

   El nombre en `TIPOS_DE_PARAMETRO` tiene que ser el mismo que pusiste en
   `tipo` (ver más abajo). A diferencia de los tipos de nodo, si te olvidás de
   alguna de las tres cosas, el chequeo de tipos te avisa: corré
   `npx tsc --noEmit` desde la raíz del proyecto.
3. **Escribí el test** de `validar` (ver
   [Qué va en el archivo](#qué-va-en-el-archivo)). Va al lado, terminado en
   `.test.ts`: para `nota.ts`, `nota.test.ts`. Lo más fácil es copiar el test
   de un tipo parecido. Después corré `npm test`, que tiene que terminar
   diciendo que pasaron todos.
4. **Usalo desde un tipo de nodo**, declarando un parámetro con tu `tipo`:

   ```ts
   parametros: [{ clave: "nota", etiqueta: "Nota", tipo: "nota", inicial: 60 }],
   ```

   Levantá la aplicación, agregá esa caja desde la barra, seleccionala y
   probá el campo en el panel: que muestre el valor inicial, que guarde lo que
   escribís, que rechace lo que no corresponde y que muestre el error de lo
   que no sirve.

## Qué va en el archivo

- **La forma de la declaración**: lo que escribe un tipo de nodo para declarar
  un parámetro de tu tipo. Es una `interface` que extiende `ParametroBase`
  (de `./parametro`), con el tipo del valor entre `<>` (por ejemplo
  `ParametroBase<number>`) y un campo `tipo` con el nombre del tipo.
  `ParametroBase` ya trae la `clave`, la `etiqueta` y el valor `inicial`. Si
  tu tipo necesita algo más, va acá: la lista, por ejemplo, agrega sus
  opciones, y el entero, un `minimo` y un `maximo` opcionales.
- **La entrada para el catálogo** (el `export default`), con dos funciones:
  - **`validar(parametro, valor)`**: si un valor le sirve a este parámetro.
    Devuelve `null` si le sirve, o el texto que se muestra debajo del campo si
    no: el entero, por ejemplo, devuelve que tiene que ir de 0 a 127 para un
    200 cuando el parámetro se declaró con ese rango. Si el texto nombra
    valores, como ese 0 y ese 127, se escriben con `formato` (ver
    [Nombrar valores en un error](#nombrar-valores-en-un-error-formato)). El
    panel lo muestra, el lienzo marca la caja en rojo, y el test que revisa
    todas las cajas (`src/workflow/nodos/catalogo.test.ts`) lo usa para
    comprobar que el valor `inicial` de cada parámetro no tenga errores.
  - **`dibujar(parametro, valor, error, estado)`**: devuelve el campo que
    muestra el parámetro, uno de los de `src/componentes/` (importado arriba,
    como `import "@/componentes/campo-numero";`):
    - `campo-numero` (un número entero escrito), `campo-interruptor` (una
      casilla), `campo-lista` (un desplegable), `campo-opciones` (píldoras),
      `campo-autocompletar` (buscar y elegir varias) o `campo-rango` (dos
      perillas). Cada uno recibe `etiqueta`, `.valor` y `.error`, más lo
      propio, que sale de la declaración: por ejemplo, `.opciones`, o los
      `.modos`, el `.minimo` y el `.maximo` de los numéricos;
    - `error` es lo que devolvió `validar` (o una regla del tipo de nodo): se
      lo pasás tal cual;
    - `estado` es lo que el campo conserva en la caja para volver a mostrarse
      igual, como el modo de un campo numérico. No hace falta saber qué tiene:
      se lo pasás con `.estado=${estado}`. Si tu campo no conserva nada (una
      lista, una casilla), no lo declares;
    - no hace falta escribir estilos, ni ocuparse de la etiqueta, de cómo se
      ve el error o de guardar el valor: cuando la persona cambia algo, el
      campo lo avisa y el panel lo guarda en la caja. Así un mismo campo se
      ve igual en todos lados.

  Si ninguno de los campos sirve para tu tipo, hace falta uno nuevo en
  `src/componentes/`, y ahí va también leer lo que se escribe (como hace
  `campo-numero` con los modos). Es un paso más grande, y conviene mirar
  primero cómo están hechos los que hay.

### Lo que no se puede leer y lo que no sirve

Son dos cosas distintas, y cada una tiene su lugar:

- **Lo que no se puede leer** (un "2.5" en un entero, o el campo vacío) no es
  un valor que se pueda guardar, y lo resuelve el campo: no avisa nada, vuelve
  a mostrar el valor que tenía y la caja lo conserva.
- **Lo que se lee pero no sirve** (un 200 en un entero de 0 a 127) sí se
  guarda, y `validar` dice qué está mal. Así la persona ve el problema debajo
  del campo, y una regla que mira dos parámetros (ver
  [`validar` de los nodos](../nodos/LEEME.md#reglas-entre-parámetros-validar))
  puede marcar una combinación aunque cada valor, solo, esté bien.

### Nombrar valores en un error: `formato`

El error del entero nombra sus límites: "Tiene que ir de 0 a 127". Pero si la
persona eligió ver ese parámetro como nota, el error tiene que decir "de C-1 a
G9", y tu archivo no sabe cómo se está mostrando. Por eso los valores no se
escriben en el texto: se marcan, y los escribe el campo, igual que el valor.

Para marcarlos, el texto se arma con `formato` (de `@/formato`) en lugar de
comillas, y cada valor va entre `${` y `}`:

```ts
return formato`Tiene que ir de ${minimo} a ${maximo}`;
```

Cada `${…}` queda marcado como un valor: el campo lo escribe con su formato
(un número, en su modo), y el log, donde no hay campo, como texto común ("de
0 a 127"). Un texto que no nombra valores ("Tiene que ser un número entero")
va con comillas, como siempre.

### Los modos de los números

`campo-numero` y `campo-rango` muestran sus números en **modos**: decimal
("60"), nota ("C4", con el Do central 60 como C4) y hexadecimal ("3C"). Todo
lo de los modos lo hace el campo (está en `src/componentes/modos.ts`): un tipo
numérico solo le pasa qué modos ofrece, sus límites y su `estado`.

- La declaración del parámetro puede decir qué modos ofrece, en orden, con
  `modos` (por ejemplo, `modos: ["nota", "decimal"]`). Si no lo dice, son
  decimal, nota y hexadecimal. El primero es el de una caja nueva, y el botón
  de modo pasa al siguiente en ese orden. Con un solo modo no hay botón.
- Lo escrito se lee probando los modos en el orden en que rotan, empezando por
  el actual, y el campo pasa al modo en que se leyó: escribir "C4" en modo
  decimal guarda 60 y deja el campo en modo nota.
- El modo nota pide que el parámetro vaya de 0 a 127, y el hexadecimal, que
  no tenga negativos: el test de `nodos/catalogo.test.ts` lo revisa.
- En modo nota, las notas negras van con sostenidos ("C#4"), salvo que la
  última nota escrita haya llevado bemol ("Db4"): entonces van con bemoles,
  hasta que se escriba una con sostenido. El log sigue con sostenidos.
- El modo, y si van bemoles, es lo que el campo conserva en `estado`: así
  sigue igual al seleccionar otra caja y volver.

## Ejemplo completo: nota

Este tipo es para una nota MIDI, como la que toca una caja. El valor es un
número de 0 a 127 (60 es el Do central), así que para `procesar` es un número
común; lo que cambia es que se escribe y se muestra solo como nota: "C4",
"F#3", "Db5". No hay botón de modo, y escribir "60" no sirve: el campo no lo
puede leer como nota y vuelve a mostrar la que tenía.

```ts
import { html } from "lit";

import "@/componentes/campo-numero";
import { formato, type Texto } from "@/formato";
import type { ParametroBase } from "./parametro";

/** Una nota MIDI, de C-1 (0) a G9 (127), que se escribe y se muestra como nota. */
export interface ParametroNota extends ParametroBase<number> {
  tipo: "nota";
}

/** Si el valor le sirve al parámetro: `null`, o el texto del error. */
export function validar(_parametro: ParametroNota, valor: number): Texto | null {
  if (!Number.isInteger(valor) || valor < 0 || valor > 127) {
    return formato`Tiene que ser una nota, de ${0} a ${127}`;
  }
  return null;
}

export default {
  validar,
  dibujar: (parametro: ParametroNota, valor: number, error: Texto | null, estado: unknown) =>
    html`<campo-numero
      etiqueta=${parametro.etiqueta}
      .valor=${valor}
      .error=${error}
      .modos=${["nota"]}
      .minimo=${0}
      .maximo=${127}
      .estado=${estado}
    ></campo-numero>`,
};
```

Lo que hace cada parte:

- `.modos=${["nota"]}`: el campo ofrece un solo modo, así que no tiene botón y
  solo lee notas.
- `.minimo` y `.maximo`: las flechas del campo se frenan en C-1 y en G9. Lo
  que se escribe más allá (como "A9", que es 129) se guarda igual, y `validar`
  lo marca.
- El 0 y el 127 del error van marcados con `formato`, así que en el panel se
  lee "Tiene que ser una nota, de C-1 a G9".
- `estado`: aunque haya un solo modo, el campo conserva si las notas van con
  bemoles.
- `_parametro` empieza con guion bajo porque `validar` no lo usa: siempre va
  de 0 a 127.

Y su test, en `nota.test.ts`. Como el error nombra valores, se compara con el
mismo texto armado con `formato`: el test no necesita saber cómo los muestra
el campo.

```ts
import { expect, test } from "vitest";

import { formato } from "@/formato";
import { validar } from "./nota";

const parametro = { clave: "nota", etiqueta: "Nota", tipo: "nota" as const, inicial: 60 };

test("acepta el Do central", () => {
  expect(validar(parametro, 60)).toBeNull();
});

test("acepta la nota más grave y la más aguda", () => {
  expect(validar(parametro, 0)).toBeNull();
  expect(validar(parametro, 127)).toBeNull();
});

test("marca una nota por encima de G9", () => {
  expect(validar(parametro, 128)).toEqual(formato`Tiene que ser una nota, de ${0} a ${127}`);
});

test("marca un número negativo", () => {
  expect(validar(parametro, -1)).toEqual(formato`Tiene que ser una nota, de ${0} a ${127}`);
});

test("marca un número con decimales", () => {
  expect(validar(parametro, 60.5)).toEqual(formato`Tiene que ser una nota, de ${0} a ${127}`);
});
```

Para usarlo, una caja declara `tipo: "nota"` en uno de sus parámetros, como
en el paso 4.

## Cómo escribir el test

Es igual que el de un tipo de nodo (ver
[Cómo escribir el test](../nodos/LEEME.md#cómo-escribir-el-test)), pero lo
que se prueba es `validar`: se le pasa una declaración y un valor, y se revisa
el texto que devuelve, o que devuelva `null`. Si el texto nombra valores, se
compara con `formato`, como en el ejemplo. Para elegir los casos:

- **El caso normal**: un valor que se usa todos los días.
- **Los bordes**: el valor más chico y el más grande que se aceptan, y los
  primeros que ya no.
- **Lo que no sirve**: un valor del tipo correcto que no corresponde (con
  decimales, fuera de rango, una opción que no está en la lista).

Lo que se escribe en el campo lo lee el campo, y eso se prueba al lado del
campo, en `src/componentes/`. El campo en sí no se testea: se prueba en la
aplicación, como en el paso 4.
