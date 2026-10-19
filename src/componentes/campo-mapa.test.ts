import { expect, test } from "vitest";

import { siguienteEntrada } from "./campo-mapa";

// Qué entrada suma el botón de agregar, sin la interfaz. Salvo el último caso,
// todos usan un mapa de 0 a 127, como un byte de datos.

test("suma la que sigue a la entrada del último par", () => {
  const mapa = [
    { entrada: 48, salida: 36 },
    { entrada: 49, salida: 38 },
  ];
  expect(siguienteEntrada(mapa, 0, 127)).toBe(50);
});

test("saltea las que ya son entradas", () => {
  const mapa = [
    { entrada: 50, salida: 42 },
    { entrada: 48, salida: 36 },
    { entrada: 49, salida: 38 },
  ];
  expect(siguienteEntrada(mapa, 0, 127)).toBe(51);
});

test("después del máximo, sigue desde el mínimo", () => {
  const mapa = [
    { entrada: 0, salida: 10 },
    { entrada: 127, salida: 20 },
  ];
  expect(siguienteEntrada(mapa, 0, 127)).toBe(1);
});

test("con el mapa vacío, suma el mínimo", () => {
  expect(siguienteEntrada([], 0, 127)).toBe(0);
});

test("si la entrada del último par está fuera de los límites, empieza por el mínimo", () => {
  expect(siguienteEntrada([{ entrada: 200, salida: 0 }], 0, 127)).toBe(0);
});

test("sin entradas libres, no hay ninguna", () => {
  const mapa = [
    { entrada: 1, salida: 1 },
    { entrada: 2, salida: 2 },
    { entrada: 3, salida: 3 },
  ];
  expect(siguienteEntrada(mapa, 1, 3)).toBeNull();
});
