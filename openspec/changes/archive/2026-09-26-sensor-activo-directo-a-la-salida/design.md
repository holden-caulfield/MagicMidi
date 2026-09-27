# Design

## Context

Ver proposal.md (Why). En `src-tauri/src/lib.rs`, el callback de la conexión de
entrada pregunta `es_mensaje_de_reloj(mensaje)`: si es `F8`, lo manda directo a
la conexión de salida compartida y termina; si no, emite `mensaje-midi` al
frontend, que lo muestra en el log y lo pasa por el workflow.

## Goals / Non-Goals

**Goals:**
- Que el Sensor Activo siga exactamente el mismo camino que el reloj.

**Non-Goals:**
- Usar el Sensor Activo para detectar una conexión perdida.
- Ofrecer un filtro del log o una forma de que el workflow vea estos mensajes.

## Decisions

### Reenviarlo, no descartarlo

El Sensor Activo tiene que llegar al dispositivo de salida: según el protocolo,
un receptor que ya recibió uno espera otro cada 300 ms como máximo y, si deja de
llegar, da la conexión por perdida y apaga las notas que estaban sonando. Si se
descartara, o si pudiera quedar filtrado por un flujo que no lo emite, el
dispositivo de salida podría cortar el sonido. Pasarlo directo, como el reloj,
lo garantiza y además le evita el ida y vuelta al frontend.

### Una sola función que dice qué va directo

`es_mensaje_de_reloj` pasa a llamarse `se_reenvia_directo` y devuelve verdadero
para `F8` y `FE`. El callback no cambia de forma: sigue siendo una sola
pregunta. Se prefirió un nombre por lo que hace con el mensaje, y no una lista
de tipos, porque la próxima excepción (si llega) se agrega en la misma función
sin volver a renombrar. El comentario de la función explica por qué va cada uno.

La rama de `FE` en `describir_mensaje` se deja, igual que la de `F8`: ya no se
usa para el log, pero borrarla no simplifica nada y la función sigue
describiendo el protocolo completo.

## Risks / Trade-offs

- [Quien quiera ver el Sensor Activo en el log para diagnosticar un
  dispositivo ya no puede] → es la misma limitación que ya tiene el reloj; si
  hace falta, se resuelve con un filtro del log en un cambio aparte.
