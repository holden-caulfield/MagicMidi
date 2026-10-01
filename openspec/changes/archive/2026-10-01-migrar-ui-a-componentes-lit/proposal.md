# Proposal

## Why

La interfaz se arma con funciones de `lit-html` sin estado propio ni ciclo de
vida, y eso obliga a varios rodeos: `main.ts` monta el lienzo cuando su panel
se ve por primera vez, el log y el lienzo buscan su contenedor en el DOM, la
selección de una caja se marca a mano con `classList` porque Rete no vuelve a
dibujar una plantilla, un campo numérico inválido se corrige con un
`actualizar({})` vacío, y todos los estilos viven en un único `styles.css` de
más de 500 líneas. `lit` ya está instalado (lo pide el plugin de Rete), y sus
componentes resuelven esos rodeos sin sumar una dependencia ni un framework con
una curva de aprendizaje grande. Conviene hacerlo ahora, antes de que lleguen
más tipos de nodo y de parámetro y cada uno sume otro caso al `switch` del
panel de configuración.

## What Changes

- Toda la interfaz pasa a ser componentes `LitElement` con Shadow DOM: cada
  componente trae sus estilos encapsulados (`static styles`), y lo común
  (variables de color, botones, campos, foco) sale de `src/estilos/`.
- El código se organiza por área: `ventana/`, `conexion/`, `log/` y
  `workflow/` tienen cada uno su lógica y sus componentes juntos, y la vista
  del editor de flujos va en `workflow/editor/`. `estado/` y `estilos/` son
  módulos propios. Cada componente es un archivo con el nombre de su etiqueta.
- El estado tiene dos niveles: el store global de hoy, para lo que necesita
  más de un componente o la lógica, y estado local del componente (`@state`)
  para lo que solo le importa a él. Los componentes se enganchan al store con
  un `ReactiveController` propio; no se suman `@lit/context` ni signals.
- La lógica que no dibuja (acciones que llaman al backend, listeners de
  `listen`, ejecución del flujo, tipos de nodo) queda fuera de los componentes.
- `lienzo.ts` pasa a ser el componente `<lienzo-workflow>`, con la caja del
  flujo (`<caja-del-flujo>`, un componente Lit que Rete sí puede volver a
  dibujar) en el mismo archivo. Sigue siendo el único que importa Rete.
- Nueva carpeta `workflow/parametros/`: un archivo por tipo de parámetro
  (entero, sí/no, opciones), cada uno con su forma, su control y, si hace
  falta, su validación; un catálogo de tipos de parámetro del que se derivan
  `Parametro` y `ValorDeParametro`, y una guía (`LEEME.md`) para sumar uno.
  El panel de configuración deja de tener un `switch` por tipo.
- El log pasa a ser declarativo (lista de mensajes como estado local, dibujada
  con `repeat`), siempre que una medición en WebKit confirme que aguanta una
  ráfaga de mensajes. Si no, conserva el DOM a mano, encapsulado en el
  componente.
- Los componentes usan decoradores estándar con `accessor`, siempre que el
  build de Vite 8 los soporte; si no, `static properties`.
- `lit-html` deja de ser una dependencia directa: todo se importa de `lit`.

## Capabilities

### New Capabilities

- `tipos-de-parametro`: el contrato para sumar un tipo de parámetro nuevo a
  los tipos de nodo: un archivo en una carpeta dedicada más una entrada en su
  catálogo, con una guía para quien recién empieza a programar.

### Modified Capabilities

- `tipos-de-nodo`: los tipos de parámetro que puede declarar un tipo de nodo
  dejan de ser una lista fija (entero, sí/no, opciones) y pasan a ser los
  registrados en el catálogo de tipos de parámetro.

## Impact

- Código: todo `src/` salvo `midi/`, `workflow/nodos/`, `workflow/ejecutar.ts`
  y `workflow/salida.ts`. `index.html` y `styles.css` quedan reducidos a lo
  global (o reemplazados por `estilos/global.css`).
- Comportamiento visible: ninguno buscado. Las specs de la interfaz
  (`navegacion-por-tabs`, `estado-de-la-interfaz`, `log-de-mensajes`,
  `editor-de-workflow`) se tienen que seguir cumpliendo tal cual, incluidos
  los atributos ARIA de los tabs y que los paneles ocultos sigan activos.
- Dependencias: se quita `lit-html` de `package.json` (ya viene con `lit`).
  Posible ajuste de `tsconfig.json` para los decoradores.
- Tests: no cambia qué se testea (solo lógica pura). Se suman tests para la
  validación de los tipos de parámetro que la tengan.
- Documentación: `nodos/LEEME.md` (solo si cambia cómo se declara un
  parámetro), el nuevo `parametros/LEEME.md`, y `AGENTS.md`, cuyas secciones
  de frontend, estado, componentes, layout, excepción del log, Workflow y
  verificación por consola hay que reescribir. Ese diff se le propone a la
  persona usuaria antes de archivar, como pide `AGENTS.md`.
