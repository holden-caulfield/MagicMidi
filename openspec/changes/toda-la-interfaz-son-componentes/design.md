# Design

## Context

Ver proposal.md (Why). Lo que condiciona el enfoque:

- Los componentes extienden `LitElement` directamente, y los que suman
  `compartidos` lo hacen a mano en `static styles` (los campos, a través de
  `estilosBase` de `componentes/estilos.ts`).
- Lit arma los estilos de cada clase con `static finalizeStyles(styles)`: aplana
  la lista, saca los repetidos (se queda con la última aparición de cada uno) y
  devuelve los que se aplican. Lo llama una vez por clase al registrarla, y una
  subclase sin `styles` propios hereda los de su base.
- `barraDeTabs()` es una función porque los `aria-controls` de los tabs apuntan
  por `id` a las secciones de los paneles, y eso solo se resuelve dentro de una
  misma raíz. Esa restricción sigue: por eso la barra vuelve a
  `ventana-principal` y no pasa a ser un componente.
- La huella de `verificacion-para-agentes/` identifica cada elemento por su
  etiqueta, su texto, su posición, su tamaño y algunos estilos computados, no
  por su ruta en el árbol: un host nuevo alrededor de la barra de estado no
  aparece como diferencia mientras lo de adentro quede igual.

## Goals / Non-Goals

**Goals:**

- Que no haya forma de escribir un componente sin `compartidos`: lo pone la
  clase de la que extiende.
- Que cada pieza de interfaz que se dibuja desde otro archivo traiga sus
  estilos y su suscripción al store, sin que quien la dibuja tenga que saberlo.
- Que la interfaz se vea y se comporte exactamente igual.

**Non-Goals:**

- Mover estado entre el store y los componentes (`panelActivo` sigue en el
  store): es el cambio D.
- Tocar los campos, los parámetros o sus modos más allá de la clase de la que
  extienden: es el cambio E.
- Un control segmentado reusable: queda para la primera vez que haga falta
  (criterio de la nota 5 en la revisión).
- Cambiar los `dibujar` del catálogo de parámetros o `dibujarIcono`: no son
  piezas de interfaz con estilos o estado propios.

## Decisions

### La clase base es `Componente`, en `src/componentes/componente.ts`

```ts
export class Componente extends LitElement {
  protected static override finalizeStyles(styles?: CSSResultGroup) {
    return super.finalizeStyles([compartidos, styles ?? []]);
  }
}
```

Va en `componentes/` porque es lo que comparten todos los componentes, como los
controles. `compartidos` se queda en `estilos/compartidos.ts`, con lo global,
y su JSDoc pasa a decir que lo suma `Componente`; ningún otro archivo lo
importa.

Se le pasa la lista entera a `super.finalizeStyles` en lugar de anteponer
`compartidos` al resultado, para que Lit saque el repetido si alguna subclase
lo sigue sumando, y para que vaya primero: los estilos propios de cada
componente le ganan, como hoy.

Alternativas: un mixin (con decoradores *legacy* y bases genéricas como
`Campo<V>`, el tipado se complica y no agrega nada a una sola clase); que
`compartidos` lo siga sumando cada componente con una prueba que lo revise
(la prueba no ve el error hasta que alguien la corre, y la regla sigue
dependiendo de acordarse).

### Todos extienden `Componente`, incluidas las bases

`Campo` y `CampoDeParametro` extienden `Componente`, así sus subclases lo
heredan sin cambios. Los componentes de área, la barra de herramientas, el
panel de configuración, el lienzo, la caja y el cable también. `estilosBase`
de `componentes/estilos.ts` deja de incluir `compartidos`, y los
`static styles` que lo nombraban lo pierden.

Ganan `box-sizing: border-box` y `[hidden]` los cinco que no lo sumaban
(`panel-workflow`, `lienzo-workflow`, `caja-del-flujo`, `cable-del-flujo` y la
base de los `parametro-…`). La caja ya declaraba `box-sizing: border-box`, y
esa línea se va; en el resto, lo que mida distinto lo muestra la huella.

### `<barra-de-estado>` en `conexion/barra-de-estado.ts`

Un componente con su `ControladorDeEstado`, sus estilos (los de
`estilosDeLaBarraDeEstado`, más `:host { display: block; }`) y la plantilla de
`barraDeEstado()` con `contenidoDeLaBarra`, que pasa con ella como ayuda
interna. Sigue dibujando un `<footer role="status">` adentro, así el anuncio a
los lectores de pantalla y la clase `.barra-de-estado` no cambian.

`puertoElegido` se queda en `conexion.ts` y se exporta, porque la usan
`conectar` y la barra. `conexion.ts` deja de importar `css`, `html` y los
íconos: queda solo con lógica.

Alternativa: dejar la barra en `ventana-principal` como método privado. Se
descarta porque no se enlaza por `id` con nada, y es de la conexión, no de la
ventana: con el criterio de la nota 5, se dibuja desde otro archivo y es un
componente.

### La barra de tabs y las secciones, como métodos de `ventana-principal`

`ventana-principal` tiene dos métodos privados, `barraDeTabs()` y
`paneles()`, cada uno con su constante de estilos al lado
(`estilosDeLaBarraDeTabs`, `estilosDeLosPaneles`, sin exportar), y
`static styles` las junta con las del `:host`. `render()` queda en tres
líneas: la barra, los paneles y `<barra-de-estado>`. La interfaz `Panel` y
`PANELES` siguen en el mismo archivo.

Los métodos leen `estado.panelActivo` y llaman a `actualizar` directamente,
como el resto de `ventana-principal`, en lugar de recibirlos por parámetro:
dejan de ser una función que otro archivo llama.

Alternativa: un componente propio para tabs y paneles. Deja
`ventana-principal` casi vacía y suma una pieza sin otro uso.

### La prueba de tabs busca la barra con `uno()`

`pruebas/tabs.js` cambia `raiz.querySelector('.barra-de-estado')` por
`uno('.barra-de-estado')`, que entra en los shadow roots, como ya hace
`pruebas/conexion.js`. Las demás pruebas no buscan nada que se mueva.

## Risks / Trade-offs

- [Un componente que ganó `box-sizing: border-box` cambia de tamaño, por
  ejemplo el lienzo, que tiene borde] → La huella, antes y después, en WebKit:
  tiene que dar igual. Si algo cambia, se corrige el estilo de ese componente
  para que mida lo mismo, no se le saca `compartidos`.
- [El SVG de 9999px del cable, o el lienzo de Rete, se comportan distinto con
  `[hidden]` o `box-sizing`] → Ninguno usa `hidden` ni tiene padding; la
  prueba del editor (`pruebas/editor.js`) revisa cajas, cables y selección.
- [Con el host nuevo, la barra de estado pierde su lugar en el layout de
  `ventana-principal`, que es un flex en columna] → `:host { display: block; }`
  en el componente; la prueba de tabs revisa que la sección del panel mida lo
  mismo en cada tab.
- [Un componente nuevo que extienda `LitElement` por costumbre] → La regla va
  a AGENTS.md; no hay chequeo automático.
- [La activación de los tabs con Enter y la barra espaciadora no se puede
  probar con las herramientas] → Se prueba en la ventana real
  (`npm run tauri dev`), como pide la revisión.
