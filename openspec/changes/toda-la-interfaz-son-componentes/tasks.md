# Tasks

Antes de empezar, tomar la huella de la interfaz actual con
`verificacion-para-agentes/huella/comparar.sh antes` (ver su `LEEME.md`) para
comparar al final. Es un cambio sin efectos visibles: la huella tiene que dar
igual.

## 1. La clase base

- [ ] 1.1 Crear `src/componentes/componente.ts` con `Componente`, que extiende
      `LitElement` y suma `compartidos` en `finalizeStyles`, como dice
      design.md, "La clase base es `Componente`". Actualizar el JSDoc de
      `estilos/compartidos.ts` para decir que lo suma `Componente`. Verificar
      con `npx tsc --noEmit`
- [ ] 1.2 Hacer que `Campo` (`componentes/campo.ts`) y `CampoDeParametro`
      (`workflow/parametros/campo-de-parametro.ts`) extiendan `Componente`, y
      sacar `compartidos` de `estilosBase` en `componentes/estilos.ts`.
      Verificar con `npx tsc --noEmit` y `npm test`
- [ ] 1.3 Hacer que extiendan `Componente` el resto de los componentes
      (`boton-de-accion`, `panel-conexion`, `panel-log`, `ventana-principal`,
      `panel-workflow`, `barra-de-herramientas`, `panel-de-configuracion`, y
      `lienzo-workflow`, `caja-del-flujo` y `cable-del-flujo` en `lienzo.ts`),
      sacando `compartidos` de sus `static styles` y el
      `box-sizing: border-box` propio de `.caja`. Verificar que
      `grep -rn "extends LitElement" src` solo muestre `componente.ts` y que
      `grep -rn "compartidos" src` solo muestre `compartidos.ts` y
      `componente.ts`

## 2. La barra de estado

- [ ] 2.1 Crear `src/conexion/barra-de-estado.ts` con `<barra-de-estado>`:
      extiende `Componente`, tiene su `ControladorDeEstado`, sus estilos (los
      de `estilosDeLaBarraDeEstado` más `:host { display: block; }`) y dibuja
      el mismo `<footer role="status">` que hoy, con `contenidoDeLaBarra` como
      ayuda interna. Exportar `puertoElegido` de `conexion.ts` y sacar de ahí
      `barraDeEstado`, `contenidoDeLaBarra`, `estilosDeLaBarraDeEstado` y los
      imports que dejan de usarse. Verificar con `npx tsc --noEmit` y que
      `conexion.test.ts` siga pasando con `npm test`
- [ ] 2.2 En `ventana-principal.ts`, importar `@/conexion/barra-de-estado` y
      dibujar `<barra-de-estado></barra-de-estado>` en lugar de
      `barraDeEstado()`, sin sumar estilos de `conexion/`. Verificar con
      `npx tsc --noEmit`

## 3. La barra de tabs vuelve a la ventana

- [ ] 3.1 Mover a `ventana-principal.ts` la interfaz `Panel`, la plantilla de
      la barra de tabs y sus estilos, como dice design.md, "La barra de tabs y
      las secciones": métodos privados `barraDeTabs()` y `paneles()`, cada uno
      con su constante de estilos sin exportar al lado, y `render()` con la
      barra, los paneles y `<barra-de-estado>`. Borrar
      `src/ventana/barra-de-tabs.ts`. Verificar con `npx tsc --noEmit` y que
      `ventana-principal.ts` no importe estilos de otro módulo

## 4. Verificación para agentes

- [ ] 4.1 En `verificacion-para-agentes/pruebas/tabs.js`, buscar la barra de
      estado con `uno('.barra-de-estado')` en lugar de
      `raiz.querySelector('.barra-de-estado')`. Verificar corriendo las
      pruebas `tabs` y `conexion`: la barra se ve en los tres tabs y muestra
      los mismos textos que antes del cambio
- [ ] 4.2 Correr el resto de las pruebas de `verificacion-para-agentes/`
      (`editor`, `configuracion`, `log`, `cuadros`, `ventana-oculta`) en
      WebKit y verificar que den lo mismo que antes del cambio
- [ ] 4.3 Tomar la huella con `comparar.sh despues` (reiniciando el servidor
      antes) y verificar que `diferencias.py antes despues` termine en 0. Si
      algo cambió de tamaño por `box-sizing`, corregir el estilo de ese
      componente y volver a comparar

## 5. Cierre

- [ ] 5.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`, y verificar
      que pasen sin errores
- [ ] 5.2 Proponerle a la persona usuaria el diff de AGENTS.md ("Frontend",
      "Estilos y Shadow DOM", "Componentes" y "Paneles y tabs", con el
      criterio de "Cómo se escribe este archivo") y aplicarlo solo con su
      aprobación explícita: todos los componentes usan Shadow DOM y extienden
      `Componente`, que trae `compartidos`; lo que se enlaza por `id` lo
      dibuja un mismo componente; toda pieza de interfaz que se dibuja desde
      otro archivo es un componente, y las funciones que devuelven plantillas
      son ayudas internas de su archivo, salvo `dibujarIcono`; la barra de
      tabs y las secciones las dibuja `ventana-principal`, porque se enlazan
      por `id`
- [ ] 5.3 Pedirle a la persona usuaria que pruebe en la ventana real
      (`npm run tauri dev`) la activación de los tabs con Enter y la barra
      espaciadora, y que la barra de estado cambie al conectar y desconectar
