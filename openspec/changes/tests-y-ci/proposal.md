# Proposal

## Why

Hoy lo único que protege el código es correr `cargo check` y `npx tsc --noEmit` a
mano antes de abrir un PR, y nada lo hace cumplir. La lógica con más riesgo de
romperse sin que nadie lo note es la pura: la traducción de bytes a texto, qué
mensajes se reenvían directo, la ejecución del flujo y los tipos de nodo. Ahora
que el roadmap es sumar tipos de nodo de a uno (y que los escriba gente que recién
empieza a programar), conviene tener una red antes de que el catálogo crezca.

## What Changes

- **Backend**: tests unitarios de Rust (`#[cfg(test)]` dentro de `lib.rs`, con
  `cargo test`, sin dependencias nuevas) para las funciones puras:
  `describir_mensaje` y `se_reenvia_directo`. Lo que toca `midir`, hilos o el
  `AppHandle` (conectar, el vigilante) queda afuera: necesita hardware o puertos
  virtuales y el costo no se justifica hoy.
- **Frontend**: Vitest como única dependencia nueva, en entorno `node` (sin DOM
  simulado), para la lógica pura: `procesarMensaje` y la validación de
  `ejecutar.ts`, cada tipo de nodo de `nodos/`, `tieneSalida` y
  `conNombresAMostrar`. Se agrega el script `npm test`. No se testea la vista
  (plantillas, lienzo de Rete, tabs): cambia seguido, su verificación ya está
  documentada con el navegador y un test ahí sería frágil y de poco valor.
- **Tipos de nodo**: es donde está el mayor valor. Cada nodo es una función pura
  de mensaje y parámetros a mensaje, y Desplazar ya tiene lógica fácil de romper
  (clamp u overflow, desplazamientos negativos, preservar el bit alto). Nueva
  convención: **cada nodo trae su `.test.ts`** al lado (`desplazar.test.ts`,
  `emitir.test.ts`), escrito para leerse como ejemplo por alguien que recién
  empieza a programar. `nodos/LEEME.md` suma el paso "escribí el test" a la
  receta de crear un nodo.
- **Contrato del catálogo**: además, un test genérico recorre `TIPOS_DE_NODO` y
  verifica lo que todo nodo tiene que cumplir (parámetros con `inicial` del tipo
  correcto, `procesar` no tira con mensajes típicos y devuelve bytes válidos).
  Es una red de seguridad, no reemplaza el test propio de cada nodo.
- **CI**: un workflow de GitHub Actions que corre en cada PR contra `main` (y en
  push a `main`): `cargo fmt --check`, `cargo clippy`, `cargo test`,
  `tsc --noEmit` y `npm test`, en `ubuntu-latest`. El repositorio es público, así
  que los minutos de Actions son gratis e ilimitados; no hace falta nada pago.
- **Fuera de alcance**: tests end-to-end de la ventana real (WebDriver de Tauri no
  soporta macOS), build de la app completa en CI y matriz de sistemas operativos.
  Se evalúan si aparece un bug que los hubiera atrapado.

## Capabilities

### New Capabilities

Ninguna: el cambio es de tooling y no altera el comportamiento de la aplicación.
Se marca `skip_specs: true`.

### Modified Capabilities

Ninguna.

## Impact

- `src-tauri/src/lib.rs`: módulo `#[cfg(test)]` al final.
- `package.json`: `vitest` en `devDependencies` y script `test`.
- Archivos `*.test.ts` junto a los módulos que prueban.
- `conNombresAMostrar` se exporta (hoy es privada de `conexion.ts`).
- `.github/workflows/ci.yml` nuevo.
- `AGENTS.md` y `nodos/LEEME.md`: la verificación pasa a incluir `cargo test` y
  `npm test` (se propone el diff antes de archivar, según la regla del proyecto).
