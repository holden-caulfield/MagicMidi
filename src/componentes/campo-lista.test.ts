import { expect, test } from "vitest";

import { proximaConLetra } from "./campo-lista";

// `proximaConLetra` decide adónde va la lista al escribir una letra: recibe
// las opciones, la letra y la posición de la opción actual, y devuelve la
// posición de la próxima que empieza con esa letra.

const opciones = [
  { valor: "a", texto: "IAC Driver Bus 1" },
  { valor: "b", texto: "IAC Driver Bus 2" },
  { valor: "c", texto: "Órgano" },
  { valor: "d", texto: "Teclado" },
];

test("va a la próxima opción que empieza con la letra", () => {
  expect(proximaConLetra(opciones, "t", 0)).toBe(3);
});

test("con la misma letra, pasa a la siguiente que empieza igual", () => {
  expect(proximaConLetra(opciones, "i", 0)).toBe(1);
});

test("al llegar al final, da la vuelta", () => {
  expect(proximaConLetra(opciones, "i", 1)).toBe(0);
});

test("sin ninguna elegida, empieza por la primera", () => {
  expect(proximaConLetra(opciones, "i", -1)).toBe(0);
});

test("no distingue mayúsculas ni tildes", () => {
  expect(proximaConLetra(opciones, "O", 0)).toBe(2);
});

test("si ninguna empieza con la letra, no va a ninguna", () => {
  expect(proximaConLetra(opciones, "x", 0)).toBeNull();
});
