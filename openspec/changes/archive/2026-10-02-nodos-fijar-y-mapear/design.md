# Design

## Context

Ver `proposal.md` (Why) para la motivación, y las specs del cambio para el
comportamiento. Lo que condiciona el diseño:

- **Desplazar ya resuelve el problema del leading bit** (`nodos/desplazar.ts`):
  separa el bit alto (`LEADING_BIT`), opera sobre los 7 de abajo (`RESTO`) y lo
  vuelve a poner. Pero con el byte de status opera sobre tipo y canal juntos, y
  por eso `9F` + 1 da `A0`.
- **`MensajeMidi` ya sabe el canal** (`midi/mensaje.ts`): `canal` es 1 a 16 en
  los mensajes de canal y `null` en los de sistema.
- **Los parámetros se validan de a uno, y casi nadie lo usa.** Cada tipo de
  parámetro tiene `valido(parametro, valor): boolean`, que hoy solo llama
  `catalogo.test.ts` (por `esValorValido`). Lo que de verdad frena un valor
  malo es el control: el entero no avisa el cambio si lo escrito no es un
  entero, y las opciones no pueden dar un valor que no esté en la lista.
- **El panel guarda lo que le avisa el control** (`cambiarParametro` en
  `panel-de-configuracion.ts`), sin revisar nada.
- **El lienzo no escucha la configuración**: crea las cajas desde
  `estado.flujo` y después solo sincroniza la selección (`caja.selected` más
  `area.update`). La caja seleccionada se marca con el color del borde
  (`--acento`), y las de inicio y fin también usan el borde (verde y naranja).
- **Un error en una caja ya tiene dónde mostrarse**: una caja que lanza un
  `Error` corta el mensaje, `procesarEn` le suma el nombre de la caja, y el log
  marca la fila en rojo con ese texto. El rojo del log son variables globales
  (`--letra-error`, `--fondo-error`), con su versión para modo oscuro.
- **La guía de nodos usa "Velocidad fija" como ejemplo completo**, y la spec
  `tipos-de-nodo` pide que el ejemplo no sea algo que ya se arma con las cajas
  existentes. Con Fijar, deja de cumplirlo.

## Goals / Non-Goals

**Goals:**

- Que Fijar y Mapear se lean como Desplazar: mismo parámetro "Byte", misma
  forma de proteger el leading bit, mismo trato a un mensaje sin el byte
  elegido, y un test en el estilo de `desplazar.test.ts`.
- Una sola fuente de los errores de configuración de una caja, pura y con test,
  que usen igual el panel, el lienzo, el ejecutor y `catalogo.test.ts`.
- Que validar siga siendo opcional y chico para quien crea un nodo: una
  función que recibe los valores y devuelve una lista, sin tocar la interfaz.
- Que los nodos sean genéricos sobre bytes: no saben de tipos de mensaje.
  Elegir a qué mensajes se aplican es trabajo de Filtrar.

**Non-Goals:**

- Mapear valores de 14 bits (Pitch Bend completo, o los pares de CC de 14
  bits): Mapear trabaja sobre un solo byte, así que en un Pitch Bend mueve solo
  la parte gruesa.
- Curvas que no sean lineales (exponencial, logarítmica) para la velocidad.
- Mapear el canal, o cambiar el tipo de mensaje con algún nodo.
- Ocultar o deshabilitar parámetros según el valor de otro.
- Avisos que no sean errores (algo "raro pero válido").

## Decisions

### El rango de salida de Mapear se configura

De los tres usos del pedido, **los tres necesitan elegir la salida** (invertir
es salida 127–0, comprimir es salida 40–110, limitar es salida 0–64), y
**ninguno necesita elegir la entrada**, que en los tres es 0–127. El rango de
entrada sirve para otra cosa, igual de real: calibrar un controlador que no
llega a los extremos (un pedal gastado que manda de 10 a 120) y estirarlo a
0–127. Por eso se configuran los dos, con 0–127 → 0–127 como valor inicial.

Alternativas descartadas:

- *Solo rango de entrada, salida siempre 0–127*: no resuelve ninguno de los
  tres ejemplos del pedido.
- *Solo rango de salida*: deja afuera la calibración, y agregar la entrada
  después cambiaría la caja de alguien que ya la usa.
- *Una casilla "Invertir"* en lugar de permitir `desde > hasta`: es un
  parámetro más para algo que el rango ya expresa.

### El cálculo de Mapear

```
x' = limitar(x, min(a, b), max(a, b))
y  = redondear(c + (x' - a) · (d - c) / (b - a))
```

- **Afuera del rango de entrada, el extremo más cercano.** Es lo que hace falta
  para calibrar, y garantiza que el resultado quede entre `c` y `d`, que ya son
  bytes de datos válidos: no hace falta `& RESTO` ni volver a limitar.
  *Alternativa descartada*: dejar pasar sin cambios lo que está afuera; un
  pedal calibrado de 10 a 120 mandaría un 5 tal cual, más bajo que su "cero".
- **`Math.round`**, el entero más cercano. Con el redondeo hacia abajo, una
  compresión a 40–110 casi nunca llegaría a 110.
- **`a = b` es un error de configuración** (dividiría por cero), asociado a
  "Entrada hasta". `procesar` puede suponer que no pasa: el ejecutor no llama a
  `procesar` en una caja con errores.
- **Solo bytes de datos.** El status mezcla tipo y canal; mapear el canal no
  tiene un uso pedido.

Mapear conserva el 0 solo si `a = 0` y `c = 0`. Comprimir la velocidad a 40–110
lleva un `9n kk 00` a `9n kk 28`, que es un Nota On: por eso los escenarios
ponen un Filtrar (Nota On) antes (ver "Los nodos no protegen el Nota On con
velocidad 0").

### "Canal" en lugar de "1.º (status)", en Fijar y en Desplazar

Los 7 bits libres del status son, juntos, el **tipo** de mensaje y el
**canal**. Operar sobre ellos como un número cambia el tipo: fijarlos convierte
todo lo que entra en un mismo tipo, y desplazarlos pasa de `9F` a `A0`. El
único uso real, en los dos nodos, es el canal. Por eso la opción es **"Canal"**:

- en un mensaje de canal se opera sobre `mensaje.canal` (1 a 16) y se escribe
  `bytes[0] = (bytes[0] & 0xF0) | (canal - 1)`, que mantiene el tipo y con él
  el leading bit;
- en uno de sistema (`mensaje.canal === null`) la caja no hace nada, igual que
  con un mensaje que no tiene el byte elegido.

En Desplazar, con overflow, el canal pega la vuelta dentro de 16 valores
(`((canal - 1 + desplazamiento) mod 16 + 16) mod 16 + 1`, o `& 0x0F` sobre
`canal - 1`, que da lo mismo por el complemento a dos); sin overflow, se limita
a 1–16. Los valores de los parámetros se guardan por posición (0, 1, 2), así
que la opción "Canal" puede quedarse con el valor 0 que tenía "1.º (status)":
cambian el texto y lo que hace `procesar`, no el valor guardado. El flujo no se
guarda entre sesiones, así que no hay cajas viejas con el comportamiento
anterior.

El canal se escribe de **1 a 16**, como lo muestra el log, no de 0 a 15 como va
en el byte.

*Alternativa descartada*: sacar la opción del status de Desplazar sin
reemplazarla. Desplazar el canal sirve (duplicar lo que se toca en otro canal,
en una rama paralela) y Fijar no lo cubre: fija un canal, no lo corre.

### Validación: errores por parámetro, de los parámetros y del tipo

```ts
// src/workflow/tipos.ts
export interface ErrorDeConfiguracion {
  /** La clave del parámetro al que se le muestra el error. */
  clave: string;
  mensaje: string;
}

export interface TipoDeNodo {
  // …
  /** Reglas que miran varios parámetros juntos. Opcional. */
  validar?(parametros: Record<string, ValorDeParametro>): ErrorDeConfiguracion[];
}
```

```ts
// src/workflow/parametros/catalogo.ts
interface TipoDeParametro<P extends Parametro> {
  /** El texto del error si el valor no le sirve a esta declaración, o `null`. */
  error(parametro: P, valor: P["inicial"]): string | null;
  dibujar(parametro: P, valor: P["inicial"], error: string | null): TemplateResult;
}
```

- **`valido` pasa a ser `error`** y devuelve el texto en vez de un sí/no: el
  panel necesita qué mostrar, y un sí/no obligaría a escribir el texto en otro
  lado. `esValorValido` pasa a ser `errorDelParametro`. Los tres tipos actuales
  lo adaptan: el entero dice el rango ("Tiene que ir de 0 a 127", "Tiene que
  ser 0 o más", "Tiene que ser 127 o menos") o que tiene que ser un entero; las
  opciones y el sí/no, que el valor no es una de las opciones o no es sí/no
  (no puede pasar desde el panel, pero protege de un error de programación).
- **Una única función junta los errores de una caja**:
  `erroresDeConfiguracion(tipo, parametros)` en un módulo nuevo,
  `src/workflow/validacion.ts`, con su test. Primero revisa cada parámetro con
  `errorDelParametro`; si alguno tiene error, devuelve esos y **no** llama a
  `tipo.validar`. Así las reglas del tipo pueden suponer que cada valor ya está
  en su rango (Fijar no tiene que revisar que el valor sea un entero de 0 a 127
  antes de mirar si es un canal), y nunca se muestran dos errores
  contradictorios en un campo.
- **La regla vive en el archivo del nodo**, al lado de `procesar`, y se prueba
  en el mismo `.test.ts`, llamando a `validar` con valores literales.

Alternativas descartadas:

- *`validar` devuelve un solo texto, sin parámetro*: el panel no sabría dónde
  mostrarlo, y el pedido es que cada error quede asociado a un parámetro.
- *`validar` devuelve un objeto `{ [clave]: mensaje }`*: no permite dos errores
  en un mismo parámetro y es menos claro de armar en un nodo; una lista se
  arma con `push` o con un literal.
- *Que las reglas del tipo corran siempre*: obliga a cada nodo a defenderse de
  valores fuera de rango que el parámetro ya marcó.

### Un valor que no sirve se guarda, y la caja muestra el error

Con reglas que miran dos parámetros, rechazar el valor no tiene sentido: si se
elige "Canal" con valor 100, el problema no es de ninguno de los dos solos, y
rechazar el cambio de byte dejaría a la persona sin forma de llegar a "Canal,
10" sin pasar por un estado inválido. Por eso todo valor que se puede
interpretar se guarda, y el error se calcula a partir de lo guardado. Lo que no
se puede interpretar (un "2.5" o un campo vacío en un entero) se sigue
rechazando en el control, porque no hay un número que guardar.

- **Panel**: calcula `erroresDeConfiguracion` de la caja seleccionada en cada
  dibujado (el `ControladorDeEstado` ya lo vuelve a dibujar con cada cambio), y
  le pasa a cada campo su error (el primero, si tiene varios).
- **Campo** (`CampoDeParametro`): recibe la propiedad `error` y dibuja el texto
  debajo del control, en `--letra-error`, con `id="error"`. Para no tocar cada
  tipo de parámetro, la base le pone al elemento `#control` de su propio shadow
  root `aria-invalid` y `aria-describedby="error"` en `updated()`. El
  `aria-describedby` queda dentro de la misma raíz, como pide AGENTS.md.
- **Lienzo**: `Caja` suma `conErrores`. `<lienzo-workflow>` se engancha con
  `ControladorDeEstado` y, en cada cambio, recalcula `conErrores` de cada caja y
  llama a `area.update` solo en las que cambiaron, igual que hace hoy con la
  selección.
- **Ejecutor**: `procesarEn`, antes de llamar a `procesar`, calcula los errores
  de la caja; si hay alguno, lanza `new Error('La caja "<nombre>" está mal
  configurada: <etiqueta>: <mensaje>')`, que sigue el camino de cualquier caja
  que falla (no sale nada, el log lo marca en rojo). Calcularlo en cada mensaje
  cuesta unas pocas comparaciones por caja; no vale la pena guardarlo en
  `estado.flujo`, donde habría que mantenerlo sincronizado con los parámetros
  (AGENTS.md: "No agregar campos derivados que haya que mantener
  sincronizados").

*Alternativa descartada para el ejecutor*: saltear la caja mal configurada y
dejar pasar el mensaje. Mandaría algo que nadie configuró, sin ningún aviso en
el log.

### El borde rojo no pelea con la selección ni con la etapa

El borde de la caja ya dice dos cosas: la etapa (verde, naranja, neutro) y la
selección (`--acento`). El error se dibuja con un `outline` de 2 px en
`--letra-error`, separado de la caja por un `outline-offset` chico: se ve rojo
alrededor de cualquier borde, no reemplaza al de la selección, y el rojo oscuro
(`#a32d2d`; en modo oscuro `#f7c1c1`) se distingue del naranja de fin
(`#dd6b20`). El `outline` no mueve nada de lugar, así que no afecta a cómo
Rete ubica las conexiones (que suma `offsetLeft`/`offsetTop`). Se confirma en
la verificación visual, en los dos modos y con una caja de fin, aunque hoy
ninguna caja de fin tenga parámetros.

### Los valores iniciales

- **Fijar**: byte "3.º (datos 2)", valor 100. No hay un valor que deje todo
  igual, así que se elige el uso más común (velocidad fija).
- **Mapear**: byte "3.º (datos 2)", 0–127 → 0–127, que deja todo igual. Los
  tres ejemplos del pedido trabajan sobre el tercer byte.
- **Desplazar**: sin cambios.

`catalogo.test.ts` pasa de "valores iniciales coherentes con sus parámetros" a
"los valores iniciales no tienen errores de configuración", con
`erroresDeConfiguracion`, así también revisa las reglas de cada tipo.

### El entero suma `minimo` y `maximo` opcionales

```ts
export interface ParametroEntero extends ParametroBase<number> {
  tipo: "entero";
  minimo?: number;
  maximo?: number;
}
```

Fijar y Mapear los declaran con `minimo: 0, maximo: 127`; Desplazar no los
declara y sigue igual. `interpretar(texto)` no cambia: sigue diciendo solo si
lo escrito es un entero, con la misma firma que el ejemplo de
`parametros/LEEME.md`. El rango lo revisa `error`. El `<input type="number">`
lleva además `min` y `max`, para que las flechas del campo no se pasen; si se
escribe a mano un número fuera de rango, se guarda y se muestra el error.

*Alternativa descartada*: un tipo de parámetro nuevo, "byte de datos". Es el
mismo control y la misma interpretación que el entero con un rango fijo.

### Los nodos no protegen el Nota On con velocidad 0

En MIDI, `9n kk 00` es un Nota Off. Fijar o Mapear la velocidad de un mensaje
así puede convertirlo en un Nota On, y la nota queda sonando. Desplazar tiene
hoy el mismo problema, y se resuelve igual: poniendo antes un Filtrar con solo
"Nota On", que no deja pasar un `9n kk 00` porque su tipo es Nota Off. Las
specs lo muestran en un escenario de cada nodo, y la guía de nodos lo menciona.

*Alternativas descartadas*: que Fijar y Mapear ignoren los Nota On con
velocidad 0 cuando el byte es el tercero (dos cajas genéricas sobre bytes
sabrían de un tipo de mensaje), o un sí/no "Conservar el 0" en Mapear (se puede
sumar si el Filtrar resulta molesto en la práctica).

### El ejemplo de la guía pasa a ser "Nota Off real"

La caja del ejemplo convierte un `9n kk 00` en `8n kk 40`. Cumple lo que pide
la spec: ninguna combinación de cajas lo hace. Fijar no cambia el tipo, y
Desplazar ya no toca el status entero; y aunque lo hiciera, Filtrar no puede
separar un `9n kk 00` de un `8n` (los dos son "Nota Off"). Además, enseña lo
mismo que el ejemplo anterior y algo más: leer `mensaje.tipo` y ver que no
alcanza (hay que mirar el status), leer `mensaje.canal`, y cambiar más de un
byte. El test prueba el caso normal, un `8n` que ya era Nota Off, un Nota On
con velocidad y un mensaje de otro tipo.

La guía suma una sección corta sobre `validar`, con la regla de Mapear como
ejemplo, y su test.

### Íconos

`Pin` para Fijar y `AlignCenterHorizontal` para Mapear, los dos de Lucide,
elegidos por la persona usuaria entre varias opciones.

## Risks / Trade-offs

- [Fijar o Mapear la velocidad sin un Filtrar antes deja notas sonando] → los
  escenarios de las specs y la guía muestran el Filtrar (Nota On) antes;
  Desplazar ya tiene el mismo comportamiento.
- [Una caja mal configurada en medio de un flujo corta todos los mensajes que
  le llegan] → es lo que se busca (no mandar algo que nadie configuró), y el
  borde rojo y el log muestran dónde está el problema.
- [Mientras se edita, la caja pasa por estados con error (por ejemplo, elegir
  "Canal" antes de cambiar el valor), y los mensajes que llegan en ese momento
  no salen] → es breve, se ve en el log, y es preferible a mandar un canal que
  no se eligió.
- [Poner `aria-invalid` y `aria-describedby` desde la base sobre `#control`
  depende de que cada tipo de parámetro siga usando ese `id`] → ya es una
  condición de la base (la etiqueta se enlaza igual), y `parametros/LEEME.md`
  lo dice.
- [Cambiar "1.º (status)" por "Canal" rompe el comportamiento de una caja
  Desplazar armada en la sesión] → el flujo no se guarda, y el escenario de la
  spec que lo usaba ("Cambiar de canal") sigue dando el mismo resultado.
- [Mapear sobre el tercer byte de un Pitch Bend mueve solo la parte gruesa] →
  queda como non-goal.
