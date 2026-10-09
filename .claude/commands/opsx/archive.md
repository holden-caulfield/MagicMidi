---
name: "OPSX: Archive"
description: "Archivar un cambio de OpenSpec terminado, actualizar las specs y mergear el PR"
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
5. Mirá una vez el CI del PR, que el ruleset de `main` exige también sobre
   el commit de archivado. Si ya pasó, mergeá el PR con un commit de merge
   (`gh pr merge <número> --merge --delete-branch`), volvé a `main`,
   actualizá con `git pull` y borrá la rama local y la remota si quedaron.
   Si todavía corre, avisá y no te quedes esperando: cuando la persona
   usuaria vuelva a escribir, miralo de nuevo y mergeá si pasó. Si un check
   falla, avisá y esperá.

Antes de archivar, aplicá la regla de AGENTS.md: si el cambio implicó decisiones
de arquitectura, convenciones nuevas, cambios de toolchain o del flujo de
verificación, proponé el diff correspondiente para AGENTS.md y esperá aprobación
explícita. No lo edites por iniciativa propia.
