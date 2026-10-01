import { expect, test } from "vitest";

import { interpretar } from "./entero";

// Cada `test` prueba una sola cosa: le pasa a `interpretar` lo que se escribió
// en el campo, y con `expect` dice qué valor tiene que quedar (`null` si se
// rechaza, y la caja conserva el que tenía).

test("acepta un entero positivo", () => {
  expect(interpretar("12")).toBe(12);
});

test("acepta un entero negativo", () => {
  expect(interpretar("-7")).toBe(-7);
});

test("acepta el cero", () => {
  expect(interpretar("0")).toBe(0);
});

test("acepta espacios alrededor del número", () => {
  expect(interpretar(" 5 ")).toBe(5);
});

test("rechaza un número con decimales", () => {
  expect(interpretar("2.5")).toBeNull();
});

test("rechaza el campo vacío", () => {
  expect(interpretar("")).toBeNull();
});

test("rechaza un campo con solo espacios", () => {
  expect(interpretar("   ")).toBeNull();
});

test("rechaza un texto que no es un número", () => {
  expect(interpretar("doce")).toBeNull();
});
