---
name: "OPSX: Archive"
description: "Archivar un cambio de OpenSpec terminado, actualizar las specs y activar el auto-merge del PR"
allowed-tools: Bash(npx openspec:*)
---

Archivá el cambio de OpenSpec: $ARGUMENTS

1. `npx openspec status --change <nombre>`: verificá que los artefactos estén
   completos y que no queden tareas sin marcar en `tasks.md`. Si queda algo
   pendiente, decilo y esperá confirmación antes de seguir.
2. `npx openspec instructions archive --change <nombre>`: trae el contexto del
   proyecto y la guía de archivado de `openspec/config.yaml`.
3. `npx openspec archive <nombre>`, que mueve el cambio a
   `openspec/changes/archive/` y actualiza las specs principales.
4. Commiteá el archivado, con los cambios aprobados a AGENTS.md si los hay,
   como último commit de la rama del PR, y subilo.
5. Activá el auto-merge del PR, con un commit de merge
   (`gh pr merge <número> --auto --merge`): GitHub lo mergea cuando pasa el
   CI del commit de archivado y borra la rama remota. Después volvé a `main`
   y borrá la rama local (`git branch -D`, porque localmente todavía no está
   mergeada). Este es el único paso en que se activa el auto-merge.

Antes de archivar, aplicá la regla de AGENTS.md: si el cambio implicó decisiones
de arquitectura, convenciones nuevas, cambios de toolchain o del flujo de
verificación, proponé el diff correspondiente para AGENTS.md y esperá aprobación
explícita. No lo edites por iniciativa propia.
