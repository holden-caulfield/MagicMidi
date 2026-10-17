---
name: "Sacar versión"
description: "Sacar una versión estable: el tag, los binarios, las notas y la patch siguiente"
disable-model-invocation: true
---

Sacá una versión estable. $ARGUMENTS

Los pasos son los de "Sacar una versión estable" del README: seguilos de
ahí. Esto suma solo lo que le toca a un agente.

1. Antes de crear nada, comprobá:
   - que estás en `main`, sin cambios sin commitear y actualizado con
     `git pull`;
   - que el CI del último commit de `main` está en verde
     (`gh run list --workflow ci.yml --branch main --limit 1`, con el commit
     de `HEAD`);
   - que la versión de `src-tauri/Cargo.toml` todavía no tiene tag
     (`git ls-remote --tags origin v<versión>`).

   Si algo no se cumple, decilo y pará.
2. Mostrale a la persona usuaria la versión y qué entra desde el último
   release (`git describe --tags --match 'v*' --abbrev=0`; si no hay, desde
   el principio): los PRs mergeados y los cambios de OpenSpec archivados en
   ese rango. Esperá su confirmación.
3. Creá y subí el tag. Buscá la corrida de Distribución de ese tag
   (`gh run list --workflow distribucion.yml --branch v<versión>`; puede
   tardar unos segundos en aparecer) y esperala en segundo plano con
   `gh run watch <id> --exit-status`.
4. Si la corrida falla, pasale el link y no sigas: la patch no sube.
   Proponé borrar el tag para volver a crearlo después del arreglo.
5. Si sale bien:
   - Escribí las notas del release en castellano, para quien usa la app: qué
     puede hacer de nuevo y qué cambió, sin detalles internos. Salen de las
     propuestas archivadas en el rango y de los PRs que no pasaron por
     OpenSpec. Mostráselas y, cuando las apruebe, cargalas en el borrador
     (`gh release edit v<versión> --notes-file <archivo>`).
   - Subí la patch en un PR, desde una rama nueva, y activá el auto-merge con
     un commit de merge (`gh pr merge <número> --auto --merge`): pedir la
     versión ya lo aprobó. Después volvé a `main` y borrá la rama local.
6. Publicar el borrador lo decide la persona usuaria: lo hace desde GitHub o
   te lo pide (`gh release edit v<versión> --draft=false`).
