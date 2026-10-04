# Tasks

La verificación visual se hace con `npm run dev` y las herramientas de
navegador, o con `verificacion-para-agentes/` (ver AGENTS.md, "Verificación
antes de dar por terminada una tarea"), comparando con los mockups aprobados.
Antes de empezar, tomar la huella de la interfaz actual para comparar al
final.

## 1. Variables y escala

- [x] 1.1 En `estilos/global.css`: letra del sistema a 12px con
      `line-height` de 16px; quitar `--acento` y sumar `--ambar`,
      `--ambar-claro` y `--letra-sobre-ambar` (claro y oscuro);
      `--fondo-control` y `--fondo-control-hover` como rellenos grises;
      colores fijos de caja para los dos modos (`--fondo-caja`,
      `--borde-caja`, inicio y fin) y quitar las `--fondo-boton-*` y
      `--borde-boton-*`; verificar con `grep -rn "acento\|boton-inicio\|boton-fin" src`
      sin resultados al terminar el grupo 4
- [x] 1.2 Revisar cada medida en `rem` de los componentes (lista en
      design.md, "Variables y escala") y pasar a px las de espaciado que la
      escala nueva deja desproporcionadas; verificar con capturas de los tres
      tabs en claro y oscuro que nada quedó superpuesto ni cortado

## 2. Componentes compartidos (`src/componentes/`)

- [x] 2.1 Crear los estilos comunes de los componentes (control de 20px,
      radio de 2px, relleno sin borde, hover, deshabilitado, foco ámbar de
      1.5px separado, etiqueta de 11px, error) y la clase base de campo con
      lo que hoy hace `CampoDeParametro` (etiqueta o nombre de grupo, error
      debajo, `aria-invalid` y `aria-describedby` en la misma raíz);
      reducir `estilos/compartidos.ts` a `box-sizing` y `[hidden]`; verificar
      con `npx tsc --noEmit`
- [x] 2.2 Crear `boton-de-accion` (texto por slot, ícono opcional de Lucide,
      `activo`, `deshabilitado`, `etiqueta` para solo ícono), con el hover
      de lo activo en `--ambar-claro` y letra oscura; verificar en el
      navegador los cuatro estados en claro y oscuro, y que un lector de
      pantalla lo anuncia por su texto
- [x] 2.3 Crear `campo-lista` (`<select>` nativo sin `appearance`, flecha
      `ChevronDown`, opciones `{ valor, texto }`, texto para cuando no hay
      opciones, `deshabilitado`); verificar que hacer clic en la etiqueta
      enfoca la lista y que se ve igual en WebKit y en Chromium
- [x] 2.4 Crear `campo-numero` que avisa `cambio` con el texto escrito y se
      resincroniza solo (design.md, "Los campos numéricos se resincronizan
      solos"); verificar en el navegador que, si quien lo usa no acepta el
      valor, el campo vuelve a mostrar el anterior
- [x] 2.5 Crear `campo-interruptor` (casilla de 14px, ámbar encendida, con la
      etiqueta después); verificar con clic en el texto y con barra
      espaciadora en la ventana real
- [x] 2.6 Crear `campo-opciones` (píldoras de 18px, separadas 1px, ámbar las
      elegidas, grupo con nombre), moviendo el comportamiento de
      `parametros/opciones.ts`; verificar que el lector anuncia el grupo y
      el estado de cada píldora
- [x] 2.7 Crear `campo-autocompletar` (búsqueda, lista flotante, chips ámbar
      con quitar), moviendo el comportamiento de
      `parametros/autocompletar.ts` y `opcionesQueCoinciden` con su test al
      lado; verificar con `npm test` y los escenarios del autocompletar de la
      spec `tipos-de-parametro` en el navegador
- [x] 2.8 Crear `campo-rango` según design.md ("El rango es un tipo de
      parámetro…"): barra con tramo y chevrones por máscara que se dan
      vuelta, perillas `role="slider"`, arrastre, clic en la barra, flechas
      con paso 1 y 10, freno o cruce según `invertible`, un `campo-numero` a
      cada lado; con las cuentas puras exportadas y su test al lado;
      verificar con `npm test` y los escenarios de "El control de rango" en
      el navegador, en claro y oscuro

## 3. Tipo de parámetro rango y nodos

- [x] 3.1 Hacer que `CampoDeParametro` sea solo el adaptador (parámetro,
      valor, error, `avisarCambio`) y que `entero`, `interruptor`, `lista`,
      `opciones` y `autocompletar` dibujen su `campo-…`; verificar con
      `npx tsc --noEmit`, `npm test` y la prueba `configuracion.js` de
      `verificacion-para-agentes/`
- [x] 3.2 Crear `parametros/rango.ts` (declaración con `minimo`, `maximo`,
      `invertible`; valor `{ desde, hasta }`; `error` en el orden de la spec;
      dibuja `campo-rango`) y registrarlo en `parametros/catalogo.ts`, con
      `rango.test.ts` para cada caso de "El parámetro rango"; verificar con
      `npm test`
- [x] 3.3 Pasar Filtrar a `datos1` y `datos2` (rangos no invertibles), sin
      `validar`, y actualizar `filtrar.test.ts`; verificar con `npm test`
- [x] 3.4 Pasar Mapear a `entrada` y `salida` (rangos invertibles), con
      `validar` solo para "Desde tiene que ser distinto de hasta" en
      `entrada`, y actualizar `mapear.test.ts`; verificar con `npm test`
- [x] 3.5 Actualizar `ejecutar.test.ts` y `nodos/catalogo.test.ts` donde
      nombran los parámetros viejos; verificar con `npm test`
- [x] 3.6 Actualizar `parametros/LEEME.md` (los campos de
      `src/componentes/`, el tipo rango, que el archivo del tipo no lleva
      estilos) y `nodos/LEEME.md` (ejemplos con los parámetros nuevos);
      verificar releyéndolas como alguien que recién empieza y que los
      ejemplos compilan si se copian

## 4. Paneles

- [x] 4.1 Panel de conexión: los selectores pasan a `campo-lista` (quitar
      `selector-de-puerto` si no le queda nada propio) y los botones a
      `boton-de-accion`; verificar los escenarios de
      `estado-de-la-interfaz` (con y sin conexión) en el navegador y con
      `conexion.js`
- [x] 4.2 Log: el botón Limpiar pasa a `boton-de-accion` con solo ícono y la
      escala nueva en la fila de encabezados; verificar con `log.js` que
      sigue limpiando y que las columnas siguen alineadas
- [x] 4.3 Barra de tabs y barra de estado a la escala y los colores nuevos
      (tira plana, tab activo con el fondo de la ventana, sin azul);
      verificar con `tabs.js` y capturas en claro y oscuro
- [x] 4.4 En `ventana/ventana-principal.ts`, ordenar `PANELES` como
      Conexión, Workflow, Log; verificar con `tabs.js` el orden de la barra
      y el de tabulación
- [x] 4.5 Barra de herramientas: controles cuadrados chicos con el fondo y
      el borde de su caja (blanco o naranja claro en los dos modos, mismo
      borde fino), hover y foco ámbar; panel de configuración y globo a la
      escala nueva; verificar con capturas en claro y oscuro y que el globo
      aparece con el teclado

## 5. Lienzo

- [x] 5.1 En `lienzo.ts`: `LADO_CAJA` 48, `LADO_ICONO` 24, radio de 4px,
      borde de 1.5px, colores fijos de caja, selección con anillo de dos
      `box-shadow` sin desenfoque, error con `outline` más afuera, y
      `SEPARACION_INICIAL` ajustada; verificar con capturas de una caja de
      fin seleccionada y de una caja con error seleccionada, en claro y
      oscuro
- [x] 5.2 Conectores con `customize.socket` (área de 16px, cuadrado ámbar de
      10px) y `.conector` reubicado con `top`/`left`; conexiones con
      `customize.connection` (trazo ámbar de 2px); verificar en el navegador
      que se puede conectar arrastrando desde un conector, que el cable sale
      del centro del cuadrado y que la prueba `editor.js` pasa

## 6. Ícono

- [x] 6.1 Cambiar los colores de `src-tauri/icons/icono.svg` (fondo grafito
      plano, puerto gris claro, destellos ámbar) y regenerar con
      `npx tauri icon src-tauri/icons/icono.svg`; verificar mirando los PNG
      de 32px y 128px y el ícono en el Dock con `npm run tauri dev`

## 7. Verificación final

- [x] 7.1 Correr `npx tsc --noEmit`, `npm test` y `npm run build`; verificar
      que pasan
- [x] 7.2 Comparar la huella con la del principio y revisar que las
      diferencias son solo las esperadas; actualizar `huella.js` donde nombra
      parámetros de Filtrar; verificar que no hay paneles con desplazamiento
      nuevo ni controles que faltan
- [x] 7.3 Buscar azul que haya quedado (`grep -rni "396cd8\|steelblue\|--acento" src`)
      y recorrer los tres tabs en claro y oscuro con foco de teclado y una
      caja seleccionada; verificar el escenario "Sin azul" de
      `estilo-de-la-interfaz`
- [ ] 7.4 Probar en la ventana real (`npm run tauri dev`): activación con
      Enter y barra espaciadora de botones, píldoras, interruptor y perillas,
      arrastre del rango, el `<select>` en WebKit, y el flujo MIDI con dos
      buses del IAC Driver usando un Filtrar y un Mapear con rangos
- [ ] 7.5 Al archivar, proponer a la persona usuaria el diff de AGENTS.md
      (componentes en `src/componentes/`, `compartidos` solo para
      `box-sizing` y `[hidden]`, ámbar como único acento, el tipo rango) y
      esperar su aprobación antes de aplicarlo
