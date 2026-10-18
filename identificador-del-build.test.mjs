import { expect, test } from "vitest";

import { formatearIdentificador, versionDeCargo } from "./identificador-del-build.mjs";

// `formatearIdentificador` arma el texto con la versión y lo que dice git del
// commit; `versionDeCargo` lee la versión del texto de un Cargo.toml.

test("un commit con el tag de su versión es estable", () => {
  const git = { hash: "a897f0c3d1e2b4a5f6e7d8c9b0a1f2e3d4c5b6a7", tags: ["v0.1.0"], merges: 0 };

  expect(formatearIdentificador("0.1.0", git)).toBe("0.1.0+a897f0c");
});

test("un commit sin tag es dev, con los merges desde el último release", () => {
  const git = { hash: "b83b9c7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c", tags: [], merges: 5 };

  expect(formatearIdentificador("0.1.1", git)).toBe("0.1.1-dev.5+b83b9c7");
});

test("antes del primer release, los merges son todos los de main", () => {
  const git = { hash: "2eb4ccac64ae466e355cfa973b2d0d25b0cb67a7", tags: [], merges: 51 };

  expect(formatearIdentificador("0.1.0", git)).toBe("0.1.0-dev.51+2eb4cca");
});

test("un commit con el tag de otra versión es dev, no estable", () => {
  const git = { hash: "c0ffee1234567890abcdef1234567890abcdef12", tags: ["v0.3.0"], merges: 0 };

  expect(formatearIdentificador("0.2.0", git)).toBe("0.2.0-dev.0+c0ffee1");
});

test("sin git, es la versión con -dev y sin commit", () => {
  expect(formatearIdentificador("0.1.1", null)).toBe("0.1.1-dev");
});

test("la versión de Cargo.toml es la de [package], no la de las dependencias", () => {
  const cargo = `[package]
name = "magicmidi"
version = "0.1.1"

[dependencies]
tauri = { version = "2", features = [] }
midir = "0.11.0"
`;

  expect(versionDeCargo(cargo)).toBe("0.1.1");
});

test("un Cargo.toml sin versión es un error", () => {
  expect(() => versionDeCargo(`[package]\nname = "magicmidi"\n`)).toThrow(
    "src-tauri/Cargo.toml no declara la versión",
  );
});
