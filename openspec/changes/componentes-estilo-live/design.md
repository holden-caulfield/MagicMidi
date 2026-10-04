# Design

## Context

Ver `proposal.md` (Why) para la motivación. La referencia visual son los
mockups aprobados (propuesta "A · Live", rango "barra con chevrones", ícono
"Grafito"). Lo que condiciona el diseño:

- **Los estilos viven en cada componente** (Shadow DOM). Lo común a los
  controles está hoy en `estilos/compartidos.ts`, que estiliza `button`,
  `select` e `input` nativos con un look grande (padding de 0.6em, radio de
  8px, 16px de letra). Cada lugar después lo pisa a su manera: la barra de
  tabs, las píldoras (`.pildoras .pildora`), los chips del autocompletar o la
  barra de herramientas. Por eso un mismo control se ve distinto según dónde
  esté.
- **Lo que se enlaza por `id` tiene que estar en una misma raíz**
  (`<label for>`, `aria-describedby`, `aria-labelledby`). Hoy
  `CampoDeParametro` pone la etiqueta, el error y los atributos ARIA sobre el
  `#control` que dibuja cada tipo, todo en la raíz del `parametro-…`. Si el
  control nativo pasa a vivir dentro de otro componente, la etiqueta queda
  afuera y el enlace se rompe.
- **`:root` tiene `font-size: 16px`**, y una docena de componentes miden en
  `rem`. Bajar la letra base cambia todas esas medidas a la vez.
- **El lienzo es de Rete**, pero la caja ya es nuestra (`<caja-del-flujo>`).
  Los conectores y las conexiones los dibuja hoy el preset clásico de
  `@retejs/lit-plugin` con sus estilos (conector de 24px más margen, cable
  `steelblue` de 5px). El preset acepta `customize.socket` y
  `customize.connection` para dibujarlos con plantillas propias. Rete ubica
  conectores y cables con `offsetLeft`/`offsetTop`, sin tener en cuenta
  `transform`.
- **El flujo no se guarda** entre sesiones: cambiar las claves de los
  parámetros de Filtrar y Mapear no necesita migración.

## Goals / Non-Goals

**Goals:**

- Un solo lugar por control: cambiar cómo se ve una lista es tocar un
  archivo, y se ve igual en Conexión y en un parámetro.
- Que crear un tipo de parámetro siga siendo una tarea chica: el archivo del
  tipo elige un componente y le pasa la declaración, sin estilos propios.
- Mantener la accesibilidad que hoy hay: etiquetas enlazadas, errores
  anunciados, grupos con nombre, foco visible.

**Non-Goals:**

- Reemplazar los desplegables nativos por listas propias: el `<select>` se
  estiliza (sin `appearance`, con la flecha de Lucide), pero la lista que se
  abre sigue siendo la del sistema.
- Un tema configurable o un modo de alto contraste: se definen los colores
  de claro y oscuro, como hoy.
- Cambiar el log más allá de su botón y su escala de letra: las columnas en
  `ch` y la letra monoespaciada quedan como están.
- Redibujar el ícono: cambian solo los colores del SVG actual.

## Decisions

### Cada componente es un campo completo: etiqueta, control y error

Los componentes de `src/componentes/` que editan un valor (`campo-lista`,
`campo-numero`, `campo-interruptor`, `campo-opciones`, `campo-autocompletar`,
`campo-rango`) reciben `etiqueta`, el valor, lo propio del control y
`error`, y dibujan en su propia raíz la etiqueta, el control nativo y el
error, con los `id` y los atributos ARIA enlazados ahí adentro. Avisan con el
evento `cambio`. No conocen el store ni los parámetros.

La base común (lo que hoy hace `CampoDeParametro`: etiqueta o nombre de
grupo, error debajo, `aria-invalid` y `aria-describedby`) pasa a una clase de
`src/componentes/` que extienden todos los campos. `CampoDeParametro` queda
como el adaptador del workflow: tiene `parametro`, `valor` y `error`, y cada
`parametro-…` dibuja el campo que le corresponde con lo que dice la
declaración y convierte su `cambio` en `avisarCambio`. El `selector-de-puerto`
pasa a ser un `campo-lista` (o desaparece, si no le queda nada propio).

Alternativas descartadas:

- **Componentes solo para el control, con la etiqueta afuera.** Rompe
  `<label for>` y `aria-describedby` entre raíces. Se podría resolver con
  custom elements asociados a formularios (`ElementInternals`) y
  `delegatesFocus`, pero el nombre accesible no siempre llega al control
  interno y el soporte de WebKit para reflejar ARIA en `ElementInternals` es
  reciente. No vale la complejidad.
- **Solo estilos compartidos, sin componentes.** Es lo que hay hoy con
  `compartidos.ts`, y es justamente lo que se desarmó: cada lugar lo pisa.
  Además el rango, las píldoras y el autocompletar tienen comportamiento, no
  solo estilos.

Los botones van como `boton-de-accion`: un componente con un `<button>`
nativo adentro, el texto por slot (el nombre accesible se calcula con el
contenido asignado), un ícono opcional de Lucide, `activo` y `deshabilitado`.
Si solo tiene ícono, recibe `etiqueta` como nombre accesible (el botón
Limpiar del log). El `click` nativo es `composed`, así que quien lo usa lo
escucha como siempre.

La barra de tabs y la barra de estado siguen siendo funciones (tienen que
estar en la raíz de `<ventana-principal>` por los `aria-controls`); solo se
ajustan a la escala y los colores nuevos. Los controles de la barra de
herramientas tampoco pasan a `boton-de-accion`: representan cajas y llevan
sus colores, no los de un botón.

### Los campos numéricos se resincronizan solos

Hoy el `parametro-entero` rechaza lo que no se puede interpretar llamando a su
propio `requestUpdate()` para que `live()` vuelva a mostrar el valor de la
caja. Con el campo adentro de otro componente, el padre que rechaza no le
pasa ningún valor nuevo y Lit no lo redibuja. Por eso `campo-numero` (y los
dos campos del rango) avisan `cambio` con el texto escrito y, después de
avisar, se piden un redibujado a sí mismos: si el padre aceptó, llega el
valor nuevo; si no, el campo vuelve a mostrar el que tenía. La interpretación
(`interpretar` de `entero.ts`) sigue en el tipo de parámetro, con su test.

### El rango es un tipo de parámetro con valor `{ desde, hasta }`

`parametros/rango.ts` declara `minimo`, `maximo` e `invertible`, y su `error`
revisa, en este orden, enteros, límites y sentido (ver la spec
`tipos-de-parametro`). Un solo parámetro por rango, y no dos enteros con una
marca que los una, porque el control es uno y su error es uno: el error se
muestra debajo del rango entero.

El control (`campo-rango`) tiene:

- una barra con el tramo resaltado entre las perillas, con chevrones como
  máscara (`mask-image` con un SVG en línea) pintada con el color de la
  letra, así se ven en los dos modos; con `desde > hasta` la máscara se da
  vuelta;
- dos perillas finas (4px × 18px), "desde" en gris y "hasta" en ámbar, cada
  una un `<button role="slider">` con `aria-valuenow/min/max` y un nombre
  que combina la etiqueta del grupo con "desde" o "hasta";
- arrastre con `pointer` events y `setPointerCapture` sobre la barra (un
  clic en la barra mueve la perilla más cercana), y flechas con paso 1 o 10
  con Mayúsculas;
- un `campo-numero` chico a cada lado.

Las cuentas puras (de posición a valor, el freno entre perillas, el límite)
van como funciones exportadas del mismo archivo, con su test al lado, como
`opcionesQueCoinciden` del autocompletar.

Filtrar pasa a `datos1` y `datos2` (no invertibles) y pierde su `validar`,
porque el error de sentido ahora es del tipo. Mapear pasa a `entrada` y
`salida` (invertibles) y su `validar` queda solo para "entrada de un solo
valor", asociado a `entrada`. Los `procesar` leen `parametros.datos1` como
`{ desde, hasta }`, con un cast igual al que ya usan las listas.

### Variables y escala en `global.css`

- `:root` pasa a `font-size: 12px; line-height: 16px` y a la letra del
  sistema (`system-ui, -apple-system, "Segoe UI", …`), que a 12px se lee
  mejor que Avenir, el que hoy termina usando macOS porque Inter no viene
  instalada. Los `rem` existentes se revisan uno por uno: los que medían
  texto bajan con la escala, y los de espaciado se pasan a px donde la
  escala nueva los dejaría desproporcionados.
- Se quita `--acento` (azul) y se suman `--ambar`, `--ambar-claro` (hover de
  lo encendido) y `--letra-sobre-ambar`, con valores para claro y oscuro.
  Los controles usan `--fondo-control` y `--fondo-control-hover` (rellenos
  grises, sin borde).
- Las cajas usan colores fijos para los dos modos (`--fondo-caja`,
  `--borde-caja` y los de inicio y fin): desaparecen las variables
  `--fondo-boton-*` que oscurecían la barra en modo oscuro.
- `compartidos.ts` queda solo con `box-sizing` y `[hidden]`, para los
  componentes que no dibujan controles.

### Lienzo

- `LADO_CAJA` pasa a 48 y `LADO_ICONO` a 24; el radio, a 4px, y el borde, a
  1.5px.
- La selección pasa de borde azul con halo a un anillo plano hecho con dos
  `box-shadow` sin desenfoque (uno del color del lienzo, para separarlo, y
  otro ámbar). El error sigue siendo `outline`, con un `outline-offset` mayor
  que el anillo para que los dos se vean a la vez.
- Los conectores se dibujan con `customize.socket`: un área de 16px
  transparente (lo que se agarra con el puntero) con un cuadrado ámbar de
  10px en el centro. El `.conector` de la caja se reubica con `top`/`left`
  según ese tamaño nuevo.
- Las conexiones se dibujan con `customize.connection`: un `<svg>` con el
  `path` que da el preset, trazo ámbar de 2px.
- El globo pasa a la escala nueva (11px, radio de 2px).

Todo sigue en `lienzo.ts`, que es el único que importa Rete.

### Ícono

Se editan los colores de `src-tauri/icons/icono.svg`: fondo gris grafito
plano (sin el degradé), puerto gris claro y destellos ámbar, y se regeneran
los PNG, `.icns` e `.ico` con `npx tauri icon src-tauri/icons/icono.svg`
(sale en `src-tauri/icons/`). Se revisa que a 32px se reconozca.

## Risks / Trade-offs

- [La huella de la interfaz cambia entera] → Es un cambio visual a propósito.
  Se toma la huella antes y después igual, para revisar que no aparezcan
  diferencias fuera de lo esperado (por ejemplo, un panel que se desplaza o
  un control que desaparece), y se revisan las capturas en claro y oscuro.
- [Las pruebas de `verificacion-para-agentes/` buscan `select` e `input`
  dentro del shadow root de cada `parametro-…`, y ahora quedan un nivel más
  adentro] → `todos()` de `ayudas/comun.js` ya busca en profundidad; se
  actualizan las pruebas que bajan a mano por un `shadowRoot` y las que
  nombran los parámetros de Filtrar y Mapear.
- [12px puede quedar chico en pantallas sin Retina] → Es la escala de Live,
  que la persona usuaria pidió. Si hace falta, subir la letra base es cambiar
  una variable.
- [El ámbar de lo encendido y el naranja de las cajas de fin son parecidos]
  → La selección no cambia el borde de la caja (anillo por fuera), y en los
  controles el ámbar nunca se usa como fondo de una caja.
- [Con 48px, los conectores y el globo quedan más cerca de la caja vecina]
  → La separación inicial entre cajas (`SEPARACION_INICIAL`) se ajusta a la
  caja nueva, y se revisa que el globo siga quedando encima.
- [WebKit y Chromium dibujan distinto un `<select>` sin `appearance`] → Se
  revisa en el WebKit del sistema con las herramientas de verificación, y en
  la ventana real antes de terminar.

## Migration Plan

No hay datos que migrar (el flujo vive solo durante la sesión). El cambio se
puede hacer por partes en la misma rama: primero variables y componentes,
después cada panel, después el rango y los nodos, y al final el lienzo y el
ícono. Volver atrás es revertir la rama.
