import { expect, test } from "vitest";

import { nombreDeNota, numeroDeNota } from "./notas";

test("nombra las notas con letra y octava, con el Do central como C4", () => {
  expect(nombreDeNota(0)).toBe("C-1");
  expect(nombreDeNota(60)).toBe("C4");
  expect(nombreDeNota(61)).toBe("C#4");
  expect(nombreDeNota(64)).toBe("E4");
  expect(nombreDeNota(127)).toBe("G9");
});

test("con bemoles, nombra las notas negras con bemol", () => {
  expect(nombreDeNota(61, true)).toBe("Db4");
  expect(nombreDeNota(70, true)).toBe("Bb4");
  expect(nombreDeNota(60, true)).toBe("C4");
});

test("leer un nombre con bemoles es la inversa de nombrarla así", () => {
  for (let numero = 0; numero <= 127; numero++) {
    expect(numeroDeNota(nombreDeNota(numero, true))).toBe(numero);
  }
});

test("lee el nombre de una nota", () => {
  expect(numeroDeNota("C4")).toBe(60);
  expect(numeroDeNota("C-1")).toBe(0);
  expect(numeroDeNota("G9")).toBe(127);
  expect(numeroDeNota(" e4 ")).toBe(64);
});

test("lee sostenidos y bemoles, también de una octava a otra", () => {
  expect(numeroDeNota("c#4")).toBe(61);
  expect(numeroDeNota("Db4")).toBe(61);
  expect(numeroDeNota("bb3")).toBe(58);
  expect(numeroDeNota("B#3")).toBe(60);
});

test("no lee lo que no es una nota", () => {
  expect(numeroDeNota("H4")).toBeNull();
  expect(numeroDeNota("C")).toBeNull();
  expect(numeroDeNota("60")).toBeNull();
  expect(numeroDeNota("C#")).toBeNull();
  expect(numeroDeNota("C-2")).toBeNull();
});

test("leer un nombre de nota es la inversa de nombrarla", () => {
  for (let numero = 0; numero <= 127; numero++) {
    expect(numeroDeNota(nombreDeNota(numero))).toBe(numero);
  }
});
