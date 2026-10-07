import { expect, test } from "vitest";

import { formato } from "@/formato";
import { validar } from "./entero";

// `validar` dice si un número le sirve al parámetro: devuelve el texto que se
// muestra debajo del campo, o `null` si está bien. A diferencia de lo que el
// campo no puede leer, un número con error igual se guarda. Los números del
// texto van marcados con `formato`, porque los escribe el campo, en su modo.

test("sin rango, acepta cualquier entero", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 0 };

  expect(validar(parametro, 300)).toBeNull();
  expect(validar(parametro, -300)).toBeNull();
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

  expect(validar(parametro, 0)).toBeNull();
  expect(validar(parametro, 127)).toBeNull();
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

  expect(validar(parametro, -1)).toEqual(formato`Tiene que ir de ${0} a ${127}`);
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

  expect(validar(parametro, 128)).toEqual(formato`Tiene que ir de ${0} a ${127}`);
});

test("con solo mínimo, marca lo que queda por debajo", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 1, minimo: 1 };

  expect(validar(parametro, 0)).toEqual(formato`Tiene que ser ${1} o más`);
  expect(validar(parametro, 1000)).toBeNull();
});

test("con solo máximo, marca lo que queda por encima", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 0, maximo: 16 };

  expect(validar(parametro, 17)).toEqual(formato`Tiene que ser ${16} o menos`);
  expect(validar(parametro, -1000)).toBeNull();
});

test("marca un número con decimales", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 0 };

  expect(validar(parametro, 2.5)).toBe("Tiene que ser un número entero");
});
