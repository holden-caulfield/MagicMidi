# Tasks

## 1. Renombre en el código

- [x] 1.1 Cambiar `productName` a `MagicMidi`, el título de la ventana a `MagicMidi` y el `identifier` a `com.jpsaraceno.magicmidi` en `src-tauri/tauri.conf.json`, y el `<title>` de `index.html`; verificar con `git grep -i "tauri midi"` que no quedan apariciones fuera de `openspec/changes/archive/`
- [x] 1.2 Renombrar el crate a `magicmidi` y la lib a `magicmidi_lib` en `src-tauri/Cargo.toml`, actualizar `src-tauri/src/main.rs` y regenerar `Cargo.lock`; verificar con `cargo check` desde `src-tauri/`
- [x] 1.3 Cambiar los nombres de cliente de `midir` de `tauri-midi-…` a `magicmidi-…` en `src-tauri/src/lib.rs`; verificar con `git grep tauri-midi` (solo pueden quedar el remoto y `openspec/changes/archive/`) y `cargo test`
- [x] 1.4 Cambiar `name` a `magicmidi` en `package.json` y regenerar `package-lock.json` con `npm install`; verificar que en el lockfile solo cambió el nombre
- [x] 1.5 Actualizar el README: título "MagicMidi", una primera línea que lo presente como herramienta para aprender MIDI, Tauri en la parte técnica, y la convención de octava (60 = C4); verificar leyéndolo entero

## 2. Nombre de las notas y descripción por partes

- [x] 2.1 Agregar el getter `nota` a `MensajeMidi` (`src/midi/mensaje.ts`): el segundo byte en Nota On, Nota Off y Presión Polifónica (0 si falta), y `null` en los demás; verificar con casos nuevos en `mensaje.test.ts`, incluido que siga a una caja que cambia el segundo byte
- [x] 2.2 Agregar `nombreDeNota(numero)` en `src/midi/describir.ts` (sostenidos, 60 = C4); verificar en `describir.test.ts` con 0 → C-1, 60 → C4, 61 → C#4, 64 → E4 y 127 → G9
- [x] 2.3 Agregar `partesDeLaDescripcion(mensaje)` y reescribir `describirMensaje()` como la unión de las partes con " · ", con la nota como "nota C4 (60)"; verificar que `describir.test.ts` cubre los escenarios de "Las notas se nombran con letra y octava" y "Descripción de los mensajes de canal", y que `npm test` pasa

## 3. Log

- [x] 3.1 En `src/log/panel-log.ts`, sacar el `<h2>` y agregar la fila de encabezados ("Hora", "Bytes", "Descripción") con `position: sticky` dentro del contenedor que se desplaza; verificar con `javascript_tool` que al desplazar la lista la fila sigue arriba
- [x] 3.2 Convertir "Limpiar" en un botón con ícono (`Trash2`) al final de la fila de encabezados, con `aria-label` y `title` "Limpiar"; verificar con `javascript_tool` el nombre accesible y que vacía el log
- [x] 3.3 Dibujar cada parte de la descripción en su sub-columna de ancho fijo en `ch` (y una sola parte con `grid-column: span 4`), con la misma grilla en entradas, sub-filas y encabezados, sin tope de ancho y con desplazamiento a lo ancho como red; verificar con `javascript_tool` que las sub-columnas de `90 3C 64`, `B9 07 64` y `A0 3D 22` empiezan en la misma `x`, que `FC` no se corta, y que a 800 px de ancho no hay desplazamiento horizontal

## 4. Barra de estado

- [x] 4.1 Agregar en `src/conexion/conexion.ts` la función pura `estadoDeLaConexion(estado)` (`conectado`, `desconectado` o `error`); verificar con casos nuevos en `conexion.test.ts`
- [x] 4.2 Reemplazar `indicadorDeEstado()` y `estilosDelIndicador` por `barraDeEstado()` y `estilosDeLaBarraDeEstado`: ícono por estado, nombres de los puertos con `puertoElegido()`, mensaje de error, `role="status"`, una sola línea con puntos suspensivos y `title`; verificar manejando el estado a mano desde la consola (`actualizar({ conectado: true })`, `actualizar({ mensajeConexion: "…" })`) y mirando la barra con `javascript_tool`
- [x] 4.3 Agregar en `src/estilos/global.css` las variables de color de la barra de estado para los dos modos; verificar con capturas en modo claro y oscuro (`resize_window` con `colorScheme`) que los tres estados se leen

## 5. Ventana y navegación

- [x] 5.1 Sacar el encabezado con el `<h1>` de `src/ventana/ventana-principal.ts` y dibujar la barra de estado al pie; verificar con `javascript_tool` que no hay `h1` y que la barra queda pegada al borde inferior
- [x] 5.2 Sumar `icono` a `Panel` y a cada entrada de `PANELES` (`Plug`, `List`, `Workflow`), mover `barraDeTabs()` a lo primero de la raíz y darle el estilo de selector segmentado centrado; verificar con `javascript_tool` los atributos ARIA, que el ícono es `aria-hidden` y que el orden de tabulación empieza por los tabs
- [x] 5.3 Sacarle a `.panel` el borde, las esquinas redondeadas y el fondo, sacarle el `padding` a `.contenedor` y ponérselo a `<panel-conexion>` y `<panel-workflow>`, con la lista del log a ras del panel; verificar con capturas de los tres tabs que los paneles tienen el mismo tamaño y posición y que el contenido de Conexión sigue centrado con el mismo ancho

## 6. Verificación

- [x] 6.1 Actualizar `verificacion-para-agentes/pruebas/` (el indicador `.estado` y el botón "Limpiar" buscado por texto) y regenerar la huella, que cambia a propósito; verificar que las pruebas pasan en WebKit
- [x] 6.2 Correr la verificación completa de AGENTS.md: `cargo check`, `cargo test`, `cargo fmt --check` y `cargo clippy --all-targets -- -D warnings` desde `src-tauri/`, y `npx tsc --noEmit`, `npm test` y `npm run build` desde la raíz; todo tiene que pasar
- [x] 6.3 Pedirle a la persona usuaria que pruebe en `npm run tauri dev`: el título de la ventana, la activación de los tabs con Enter y barra espaciadora, los tres estados de la barra con IAC Driver (incluido desenchufar un puerto) y el log con notas, entrar y salir de pantalla completa

## 7. Cierre

- [x] 7.1 Proponerle a la persona usuaria el diff de AGENTS.md (nombre, barra de tabs primera, barra de estado, log sin tope de ancho y con descripción por partes, getter `nota`) y aplicarlo solo con su aprobación explícita
- [ ] 7.2 Después del merge, y con confirmación explícita de la persona usuaria, renombrar el repositorio con `gh repo rename MagicMidi` y actualizar el `origin` local; verificar con `gh repo view` y `git remote -v`, y que la URL vieja redirige
- [ ] 7.3 Como último paso, con todo mergeado y `main` actualizado, renombrar la carpeta local de `~/personal-ws/Tauri-MIDI` a `~/personal-ws/MagicMidi` (`mv`), fuera de cualquier sesión que tenga esa carpeta abierta (la de Claude Code, `tauri dev`, el editor), y reabrir la sesión desde la carpeta nueva; verificar con `git status` y `git remote -v` en la carpeta nueva, y con `npm run tauri dev` que compila (la carpeta `src-tauri/target/` se regenera si hace falta)
