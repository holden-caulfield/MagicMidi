import { expect, test } from "vitest";

import { limitar } from "./campo-numero";

// `limitar` deja un paso de las flechas dentro del mínimo y el máximo.

test("un paso no pasa del máximo ni del mínimo", () => {
  const byte = { minimo: 0, maximo: 127 };

  expect(limitar(byte, 130)).toBe(127);
  expect(limitar(byte, -1)).toBe(0);
  expect(limitar(byte, 64)).toBe(64);
});

test("sin límites, un paso llega a cualquier número", () => {
  expect(limitar({}, -300)).toBe(-300);
  expect(limitar({ minimo: 1 }, 1000)).toBe(1000);
});
