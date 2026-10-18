// El identificador del build, que dice de qué build se trata. Este es el único
// lugar que lo calcula: lo importa `vite.config.ts`, que lo deja fijo en el
// frontend para la barra de estado, y lo ejecuta el workflow de distribución
// (`node identificador-del-build.mjs`) para el título del release `dev`. Así
// la app y el release nunca dicen cosas distintas.
//
// Es JavaScript y no TypeScript porque corre en Node, fuera de `src/`: ahí
// `tsc` no lo revisaría, y adentro se mezclaría con el código del navegador.

import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * La versión de un `Cargo.toml`: la primera línea `version = "…"`, que es la
 * de `[package]` porque esa sección va primera. Una dependencia que dice su
 * versión la escribe en la misma línea que su nombre, así que no se confunde.
 */
export function versionDeCargo(texto) {
  const encontrada = texto.match(/^version\s*=\s*"([^"]+)"/m);
  if (!encontrada) {
    throw new Error("src-tauri/Cargo.toml no declara la versión");
  }
  return encontrada[1];
}

/**
 * Arma el identificador con la versión y lo que dice git del commit
 * (`{ hash, tags, merges }`), o `null` si no hay git:
 * - estable, si el commit tiene el tag de su versión: `0.1.0+a897f0c`;
 * - dev, en cualquier otro caso: `0.1.1-dev.5+b83b9c7`, el quinto merge a
 *   `main` desde el último release, camino a la 0.1.1;
 * - sin git: `0.1.1-dev`.
 *
 * Lo que va después de `+` es información del build y no cambia el orden
 * entre versiones; el `-dev` marca una versión previa de la próxima.
 */
export function formatearIdentificador(version, git) {
  if (git === null) {
    return `${version}-dev`;
  }
  // Los 7 primeros caracteres, como los muestran git y GitHub. No
  // `--short`, que se alarga cuando hay ambigüedad.
  const commit = git.hash.slice(0, 7);
  if (git.tags.includes(`v${version}`)) {
    return `${version}+${commit}`;
  }
  return `${version}-dev.${git.merges}+${commit}`;
}

function correrGit(...argumentos) {
  return execFileSync("git", argumentos, {
    cwd: fileURLToPath(new URL(".", import.meta.url)),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/** Lo que dice git del commit actual, o `null` si no hay git o no es un repositorio. */
function leerGit() {
  try {
    const hash = correrGit("rev-parse", "HEAD");
    const tags = correrGit("tag", "--points-at", "HEAD").split("\n").filter(Boolean);
    // Los merges se cuentan siguiendo solo el primer padre: así cuentan los
    // merges a main y no los commits de cada rama.
    let desde = "HEAD";
    try {
      desde = `${correrGit("describe", "--tags", "--match", "v*", "--abbrev=0")}..HEAD`;
    } catch {
      // Todavía no hubo releases: se cuenta desde el principio.
    }
    const merges = Number(correrGit("rev-list", "--count", "--first-parent", desde));
    return { hash, tags, merges };
  } catch {
    return null;
  }
}

/** El identificador del build del código de este repositorio, tal como está ahora. */
export function identificadorDelBuild() {
  const cargo = readFileSync(new URL("src-tauri/Cargo.toml", import.meta.url), "utf8");
  return formatearIdentificador(versionDeCargo(cargo), leerGit());
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(identificadorDelBuild());
}
