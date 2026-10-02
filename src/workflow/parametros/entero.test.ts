import { expect, test } from "vitest";

import { error, interpretar } from "./entero";

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

// `error` dice si un número ya interpretado le sirve al parámetro: devuelve el
// texto que se muestra debajo del campo, o `null` si está bien. A diferencia
// de lo que rechaza `interpretar`, un número con error igual se guarda.

test("sin rango, acepta cualquier entero", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 0 };

  expect(error(parametro, 300)).toBeNull();
  expect(error(parametro, -300)).toBeNull();
});

test("con rango, acepta los dos extremos", () => {
  const parametro = {
    clave: "x",
    etiqueta: "X",
    tipo: "entero" as const,
    inicial: 0,
    minimo: 0,
    maximo: 127,
  };

  expect(error(parametro, 0)).toBeNull();
  expect(error(parametro, 127)).toBeNull();
});

test("con rango, marca un número por debajo del mínimo", () => {
  const parametro = {
    clave: "x",
    etiqueta: "X",
    tipo: "entero" as const,
    inicial: 0,
    minimo: 0,
    maximo: 127,
  };

  expect(error(parametro, -1)).toBe("Tiene que ir de 0 a 127");
});

test("con rango, marca un número por encima del máximo", () => {
  const parametro = {
    clave: "x",
    etiqueta: "X",
    tipo: "entero" as const,
    inicial: 0,
    minimo: 0,
    maximo: 127,
  };

  expect(error(parametro, 128)).toBe("Tiene que ir de 0 a 127");
});

test("con solo mínimo, marca lo que queda por debajo", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 1, minimo: 1 };

  expect(error(parametro, 0)).toBe("Tiene que ser 1 o más");
  expect(error(parametro, 1000)).toBeNull();
});

test("con solo máximo, marca lo que queda por encima", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 0, maximo: 16 };

  expect(error(parametro, 17)).toBe("Tiene que ser 16 o menos");
  expect(error(parametro, -1000)).toBeNull();
});

test("marca un número con decimales", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 0 };

  expect(error(parametro, 2.5)).toBe("Tiene que ser un número entero");
});
