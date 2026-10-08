import { expect, test } from "vitest";

import { formato } from "@/formato";
import { entero } from "./entero";

// `validar` dice si un número le sirve al parámetro: devuelve el texto que se
// muestra debajo del campo, o `null` si está bien. A diferencia de lo que el
// campo no puede leer, un número con error igual se guarda. Los números del
// texto van marcados con `formato`, porque los escribe el campo, en su modo.

const sinRango = entero({ clave: "x", etiqueta: "X", inicial: 0 });
const byte = entero({ clave: "x", etiqueta: "X", inicial: 0, minimo: 0, maximo: 127 });

test("sin rango, acepta cualquier entero", () => {
  expect(sinRango.validar(300)).toBeNull();
  expect(sinRango.validar(-300)).toBeNull();
});

test("con rango, acepta los dos extremos", () => {
  expect(byte.validar(0)).toBeNull();
  expect(byte.validar(127)).toBeNull();
});

test("con rango, marca un número por debajo del mínimo", () => {
  expect(byte.validar(-1)).toEqual(formato`Tiene que ir de ${0} a ${127}`);
});

test("con rango, marca un número por encima del máximo", () => {
  expect(byte.validar(128)).toEqual(formato`Tiene que ir de ${0} a ${127}`);
});

test("con solo mínimo, marca lo que queda por debajo", () => {
  const parametro = entero({ clave: "x", etiqueta: "X", inicial: 1, minimo: 1 });

  expect(parametro.validar(0)).toEqual(formato`Tiene que ser ${1} o más`);
  expect(parametro.validar(1000)).toBeNull();
});

test("con solo máximo, marca lo que queda por encima", () => {
  const parametro = entero({ clave: "x", etiqueta: "X", inicial: 0, maximo: 16 });

  expect(parametro.validar(17)).toEqual(formato`Tiene que ser ${16} o menos`);
  expect(parametro.validar(-1000)).toBeNull();
});

test("marca un número con decimales", () => {
  expect(sinRango.validar(2.5)).toBe("Tiene que ser un número entero");
});

test("sin modos declarados, ofrece los tres", () => {
  expect(sinRango.modos).toEqual(["decimal", "nota", "hexadecimal"]);
});
