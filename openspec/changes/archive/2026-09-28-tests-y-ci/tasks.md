# Tasks

## 1. Backend

- [x] 1.1 Agregar `mod tests` al final de `src-tauri/src/lib.rs` con casos de tabla para `describir_mensaje` (cada tipo de mensaje de canal, Nota On con velocidad 0, Pitch Bend, cada status de sistema, status desconocido, mensaje vacío y mensajes truncados) y verificar que `cargo test` pasa
- [x] 1.2 Agregar casos para `se_reenvia_directo` (`F8` y `FE` sí; `FA`, `90`, vacío no) y verificar que `cargo test` pasa
- [x] 1.3 Correr `cargo fmt --check` y `cargo clippy -- -D warnings`, corregir lo que marquen y verificar que ambos terminan sin errores

## 2. Frontend

- [x] 2.1 Instalar `vitest` en `devDependencies` (revisar compatibilidad con Vite 8), agregar el script `"test": "vitest run"` con entorno `node`, y verificar que `npm test` corre sin tests y termina bien
- [x] 2.2 Exportar `conNombresAMostrar` y escribir `src/conexion.test.ts` (nombres únicos, repetidos con " (2)" y " (3)", `id` conservado) y verificar que `npm test` pasa
- [x] 2.3 Escribir `src/workflow/ejecutar.test.ts` con `salida.ts` mockeado: flujo por defecto, ramas paralelas que no comparten el arreglo, caja que tira o devuelve bytes inválidos sin cortar las otras ramas, caja sin conexión de salida; verificar que `npm test` pasa
- [x] 2.4 Escribir `src/workflow/nodos/desplazar.test.ts` con el estilo didáctico de `design.md` (un `test` por comportamiento, bytes literales, sin helpers): byte fuera de rango, límites 0 y 127 con y sin overflow, desplazamientos negativos, bit alto preservado; verificar que `npm test` pasa y que falla si se cambia a propósito el clamp por overflow
- [x] 2.5 Escribir `src/workflow/nodos/emitir.test.ts` con `salida.ts` mockeado (envía el mensaje tal cual, no devuelve nada) y verificar que `npm test` pasa
- [x] 2.6 Escribir `src/workflow/catalogo.test.ts` con el test de contrato que recorre `TIPOS_DE_NODO` (parámetros iniciales coherentes, `procesar` no tira y devuelve bytes válidos) y verificar que pasa, y que falla si se rompe a propósito un `inicial` de Desplazar

## 3. CI

- [x] 3.1 Crear `.github/workflows/ci.yml` con los jobs `frontend` y `backend` descritos en `design.md`, disparados en `pull_request` y `push` a `main`, y verificar la sintaxis abriendo el PR de este cambio
- [x] 3.2 Verificar en el PR que los dos jobs quedan en verde y anotar cuánto tardan con y sin caché (sin caché: backend 3m57s, frontend 20s; con caché: backend 2m33s, frontend 16s)
- [x] 3.3 Verificar que el CI falla de verdad: empujar un commit temporal que rompa un test, confirmar el rojo y revertirlo

## 4. Documentación

- [x] 4.1 En `src/workflow/nodos/LEEME.md`, sumar a "Los pasos" uno nuevo antes de "Probalo": crear `<nodo>.test.ts` copiando `desplazar.test.ts`, y correr `npm test`
- [x] 4.2 Sumar a `LEEME.md` una sección corta "Cómo escribir el test" (qué es un `test` y un `expect`, cómo pensar los casos límite, qué significa que el test de contrato falle), y verificar que se entiende sin conocer Vitest; sumar el test al "Ejemplo completo" de Nota Off
- [x] 4.3 Proponerle a la persona usuaria el diff de `AGENTS.md` (verificación con `cargo test` y `npm test`, convención de un `.test.ts` por nodo, qué corre el CI, dónde van los tests y qué queda afuera a propósito) y aplicarlo solo con su aprobación
- [x] 4.4 Mencionar en el PR que se puede marcar el check como requerido en `main` desde la configuración del repositorio
