import { expect, test } from "vitest";

import {
  extremoMasCercano,
  interpretarExtremo,
  moverExtremo,
  pasarExtremo,
  proporcionDe,
  valorEnProporcion,
} from "./campo-rango";

// Las cuentas del control de rango, sin la interfaz. Todos los casos usan un
// rango de 0 a 127, como un byte de datos.

const fijo = { minimo: 0, maximo: 127, invertible: false };
const invertible = { minimo: 0, maximo: 127, invertible: true };

test("la mitad de la barra es el valor del medio, redondeado", () => {
  expect(valorEnProporcion(0.5, fijo)).toBe(64);
});

test("fuera de la barra, el valor queda en el extremo", () => {
  expect(valorEnProporcion(-0.2, fijo)).toBe(0);
  expect(valorEnProporcion(1.3, fijo)).toBe(127);
});

test("un valor fuera de los límites se dibuja en el borde", () => {
  expect(proporcionDe(200, fijo)).toBe(1);
  expect(proporcionDe(-5, fijo)).toBe(0);
  expect(proporcionDe(127, fijo)).toBe(1);
});

test("mover un extremo cambia solo ese", () => {
  expect(moverExtremo({ desde: 0, hasta: 127 }, "desde", 40, fijo)).toEqual({
    desde: 40,
    hasta: 127,
  });
});

test("ningún extremo se pasa de los límites", () => {
  expect(moverExtremo({ desde: 0, hasta: 127 }, "hasta", 140, fijo)).toEqual({
    desde: 0,
    hasta: 127,
  });
  expect(moverExtremo({ desde: 10, hasta: 127 }, "desde", -3, invertible)).toEqual({
    desde: 0,
    hasta: 127,
  });
});

test("si no se puede invertir, una perilla se frena en la otra", () => {
  expect(moverExtremo({ desde: 60, hasta: 72 }, "desde", 100, fijo)).toEqual({
    desde: 72,
    hasta: 72,
  });
  expect(moverExtremo({ desde: 60, hasta: 72 }, "hasta", 10, fijo)).toEqual({
    desde: 60,
    hasta: 60,
  });
});

test("si se puede invertir, una perilla pasa a la otra", () => {
  expect(moverExtremo({ desde: 0, hasta: 127 }, "desde", 127, invertible)).toEqual({
    desde: 127,
    hasta: 127,
  });
  expect(moverExtremo({ desde: 127, hasta: 127 }, "hasta", 0, invertible)).toEqual({
    desde: 127,
    hasta: 0,
  });
});

test("un clic en la barra mueve la perilla más cercana", () => {
  expect(extremoMasCercano({ desde: 20, hasta: 100 }, 30)).toBe("desde");
  expect(extremoMasCercano({ desde: 20, hasta: 100 }, 90)).toBe("hasta");
  expect(extremoMasCercano({ desde: 100, hasta: 20 }, 30)).toBe("hasta");
});

test("con las dos perillas juntas, se mueve la que puede ir hacia el clic", () => {
  expect(extremoMasCercano({ desde: 72, hasta: 72 }, 100)).toBe("hasta");
  expect(extremoMasCercano({ desde: 72, hasta: 72 }, 10)).toBe("desde");
});

test("los campos aceptan solo enteros", () => {
  expect(interpretarExtremo("100")).toBe(100);
  expect(interpretarExtremo(" 7 ")).toBe(7);
  expect(interpretarExtremo("2.5")).toBeNull();
  expect(interpretarExtremo("")).toBeNull();
  expect(interpretarExtremo("mucho")).toBeNull();
});

test("un paso en el campo de un extremo se frena como la perilla", () => {
  expect(pasarExtremo({ desde: 72, hasta: 72 }, "desde", 72, 1, fijo)).toEqual({
    desde: 72,
    hasta: 72,
  });
  expect(pasarExtremo({ desde: 60, hasta: 72 }, "desde", 60, 1, fijo)).toEqual({
    desde: 61,
    hasta: 72,
  });
});

test("un paso usa lo escrito, aunque no se haya confirmado", () => {
  expect(pasarExtremo({ desde: 0, hasta: 127 }, "desde", 100, -10, fijo)).toEqual({
    desde: 90,
    hasta: 127,
  });
});
