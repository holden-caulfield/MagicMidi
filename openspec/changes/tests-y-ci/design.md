# Design

## Context

- El backend es un solo archivo (`src-tauri/src/lib.rs`). Casi todo depende de
  `midir`, de hilos o del `AppHandle`; lo puro son `describir_mensaje` y
  `se_reenvia_directo`.
- En el frontend, lo que tiene reglas de verdad está en `src/workflow/`
  (`ejecutar.ts`, `catalogo.ts`, `nodos/`) y en `conNombresAMostrar`
  (`conexion.ts`). `ejecutar.ts` lee el flujo de `estado.flujo`, que se puede
  armar con `actualizar()` desde un test sin tocar el DOM.
- `tauri::generate_context!` exige que exista `frontendDist` (`../dist`), que
  está en `.gitignore`: en una máquina limpia, compilar el crate sin haber hecho
  antes `npm run build` falla.
- En Linux, compilar Tauri y `midir` necesita paquetes del sistema (WebKitGTK,
  ALSA).
- El repositorio es público: GitHub Actions no cobra minutos, tampoco en macOS.

## Goals / Non-Goals

**Goals:**
- Que un PR que rompe la lógica de mensajes o del flujo quede en rojo sin
  intervención de nadie.
- Que el CI tarde pocos minutos con caché, para que no dé ganas de saltearlo.
- Que cada tipo de nodo tenga su test, y que ese test sea el ejemplo a copiar
  cuando se crea uno nuevo, igual que hoy se copia `desplazar.ts`.

**Non-Goals:**
- Cobertura mínima como número a cumplir.
- Tests de la vista, del lienzo de Rete ni del IPC.
- Generar instaladores o releases desde CI.

## Decisions

**Tests de Rust en el mismo archivo, sin crates nuevos.** Un `mod tests` al final
de `lib.rs` con casos de tabla (bytes → descripción esperada). Es lo idiomático
en Rust, `cargo test` ya viene incluido y las funciones privadas quedan
alcanzables sin cambiar su visibilidad. Alternativa: extraer un módulo `mensajes`
para separar lo puro; se descarta por ahora (un archivo de 300 líneas no lo pide),
queda como opción si el backend crece.

**Nada de mocks de `midir` ni de puertos virtuales.** Abstraer `midir` detrás de un
trait solo para testear `conectar` y el vigilante agrega una capa que el código no
necesita. Esa parte se sigue verificando a mano con el IAC Driver, como indica
`AGENTS.md`.

**Vitest en entorno `node`.** Usa la misma configuración de Vite, entiende
TypeScript sin paso extra y no suma más que una dependencia. Sin `jsdom`: lo que se
testea no toca el DOM. Alternativa: `node:test` con `tsx`; se descarta porque
suma igual una dependencia y no reutiliza la resolución de módulos de Vite
(por ejemplo, los imports de `lucide`). Los tests viven junto al módulo que
prueban (`ejecutar.test.ts`, `nodos/desplazar.test.ts`).

**Cada nodo trae su `.test.ts`, y ese test es material didáctico.** El nodo se
testea llamando a `procesar` directo, sin pasar por el ejecutor ni el catálogo: es
una función pura y el test tiene que poder leerse sin saber nada más del
proyecto. Por eso el estilo es deliberadamente simple: un `test` por
comportamiento, con nombre en castellano que diga qué se espera (por ejemplo,
"sin overflow, pasarse de 127 se queda en 127"), mensajes escritos como bytes
literales (`[0x90, 60, 100]`), y nada de tablas parametrizadas ni helpers propios
que haya que ir a buscar. Un poco de repetición es preferible a una abstracción
que quien empieza no entiende. `desplazar.test.ts` es la referencia y cubre: byte
fuera de rango, límites 0 y 127 con y sin overflow, desplazamientos negativos y
bit alto preservado (status sigue siendo status). `emitir.test.ts` muestra el
otro caso: un nodo sin salida, que se verifica mockeando `salida.ts`.

La convención se hace cumplir en el `LEEME.md` (paso de la receta) y en la
revisión del PR, no con una herramienta: un check que exija un `.test.ts` por
archivo sería configuración para un problema que todavía no apareció.

**Test de contrato sobre el catálogo, como red de seguridad.** Un solo test itera
`TIPOS_DE_NODO` y, para cada tipo, verifica: `inicial` coherente con el `tipo` de
cada parámetro (y que esté entre las `opciones` si las tiene), y que `procesar`
con los valores iniciales y un puñado de mensajes típicos (Nota On, CC, Pitch
Bend, un mensaje de un byte) no tire y devuelva `null`/`undefined` o bytes 0–255.
Atrapa errores de forma que el test propio del nodo puede no mirar. Como Emitir
llama a `enviarMensaje`, este test también mockea `salida.ts`.

**`ejecutar.ts` se testea por `procesarMensaje`, espiando `enviarMensaje`.** Se arma un
flujo en `estado.flujo` y se verifica qué llega a la salida con `vi.mock` de
`salida.ts`. Casos: flujo por defecto (trigger → Emitir), ramas en paralelo que no
comparten el arreglo, una caja que tira o devuelve bytes inválidos no corta el
resto, y ciclos si el ejecutor los permite.

**Un workflow, dos jobs en paralelo, en `ubuntu-latest`.**
- `frontend`: `npm ci`, `npx tsc --noEmit`, `npm test`, `npm run build`.
- `backend`: instala `libwebkit2gtk-4.1-dev`, `libasound2-dev` y el resto de
  dependencias que pide la guía de Tauri para Linux; `npm ci && npm run build`
  para generar `dist`; después `cargo fmt --check`, `cargo clippy -- -D warnings`
  y `cargo test`, con `Swatinem/rust-cache`.

Se dispara en `pull_request` contra `main` y en `push` a `main`. Alternativa:
correr en `macos-latest` para evitar los paquetes de Linux y parecerse a la
máquina de desarrollo; se descarta como default porque las colas de macOS son más
lentas, y lo que se testea no depende del sistema operativo. `cargo fmt` y
`clippy` entran porque no tienen costo de mantenimiento y atrapan cosas reales;
no se suma ESLint ni Prettier en este cambio, para no reformatear todo el
frontend de una vez.

**Protección de rama opcional.** Con el repo público se puede marcar el check como
requerido en `main` desde la configuración del repositorio. Lo hace la persona
usuaria; el cambio solo lo documenta.

## Risks / Trade-offs

- [Vitest puede no declarar todavía compatibilidad con Vite 8] → Verificarlo al
  instalar; si hay conflicto de peer dependencies, usar la última versión que lo
  soporte o la beta, y dejarlo anotado.
- [Importar `conexion.ts` desde un test arrastra `lit-html` y la API de Tauri] →
  Ninguno de los dos toca el DOM ni el puente al importarse; si alguno lo hiciera,
  mover `conNombresAMostrar` a un módulo sin dependencias.
- [`clippy -D warnings` puede fallar el primer día por avisos existentes] →
  Corregirlos en este mismo cambio; si alguno es discutible, permitirlo con
  `#[allow]` puntual y un comentario.
- [Los tests de strings de `describir_mensaje` fallan con cualquier cambio de
  redacción] → Es a propósito: ese texto es lo que lee el usuario. Actualizar el
  test es parte de cambiar el texto.
- [El CI en Linux no ve problemas específicos de macOS] → Aceptado. Si aparece
  uno, sumar `macos-latest` a una matriz es una línea.
