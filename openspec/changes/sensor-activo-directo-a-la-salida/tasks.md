# Tasks

Las verificaciones usan la aplicación real (`npm run tauri dev`) y el bus IAC:
Bus 1 como entrada, Bus 2 como salida, con una herramienta que manda bytes al
Bus 1 y escucha el Bus 2.

## 1. Implementación

- [x] 1.1 En `src-tauri/src/lib.rs`, renombrar `es_mensaje_de_reloj` a
      `se_reenvia_directo`, hacer que devuelva verdadero para `F8` y `FE`, y
      actualizar su comentario y los que hablan del reenvío del reloj (el de
      `EstadoMidi` y el de `conectar`) (design.md, "Una sola función que dice
      qué va directo"); verificar con `cargo check`

## 2. Verificación

- [x] 2.1 Verificar "Sensor Activo con el lienzo inicial" y "Sensor Activo con
      otros mensajes": con el flujo por defecto, mandar `FE` intercalados con
      un `FC`; por el Bus 2 sale cada `FE` una sola vez y el `FC`, y el log
      muestra solo la fila del `FC`
- [x] 2.2 Verificar "Sensor Activo sin ningún Emitir" y que el reloj sigue
      igual: con el Emitir borrado del lienzo, mandar `FE`, `F8` y una nota;
      por el Bus 2 salen el `FE` y el `F8`, en orden, y la nota no
- [x] 2.3 Correr la verificación de AGENTS.md: `cargo check` desde
      `src-tauri/` y `npx tsc --noEmit` desde la raíz
- [x] 2.4 Subir la rama, abrir el PR contra `main` y verificar que el PR quedó
      creado
