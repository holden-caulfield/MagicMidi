import { expect, test } from "vitest";

import { error } from "./rango";

// `error` dice si un rango le sirve al parámetro: devuelve el texto que se
// muestra debajo del control, o `null` si está bien. Los casos usan un rango
// de 0 a 127, que se puede invertir o no.

const fijo = {
  clave: "datos1",
  etiqueta: "Datos 1",
  tipo: "rango" as const,
  inicial: { desde: 0, hasta: 127 },
  minimo: 0,
  maximo: 127,
  invertible: false,
};

const invertible = { ...fijo, invertible: true };

test("acepta el rango completo", () => {
  expect(error(fijo, { desde: 0, hasta: 127 })).toBeNull();
});

test("acepta un solo valor", () => {
  expect(error(fijo, { desde: 64, hasta: 64 })).toBeNull();
});

test("si se puede invertir, acepta el rango al revés", () => {
  expect(error(invertible, { desde: 127, hasta: 0 })).toBeNull();
});

test("si no se puede invertir, marca el rango al revés", () => {
  expect(error(fijo, { desde: 72, hasta: 60 })).toBe(
    "Desde tiene que ser igual o menor que hasta",
  );
});

test("marca un extremo fuera de rango", () => {
  expect(error(fijo, { desde: 0, hasta: 200 })).toBe("Tiene que ir de 0 a 127");
  expect(error(invertible, { desde: -1, hasta: 127 })).toBe("Tiene que ir de 0 a 127");
});

test("fuera de rango se marca antes que al revés", () => {
  expect(error(fijo, { desde: 200, hasta: 10 })).toBe("Tiene que ir de 0 a 127");
});

test("marca un extremo con decimales", () => {
  expect(error(fijo, { desde: 2.5, hasta: 127 })).toBe("Tiene que ser un número entero");
});

test("marca algo que no es un rango", () => {
  // TypeScript no deja escribirlo, pero el valor podría venir de otro lado.
  expect(error(fijo, 64 as unknown as { desde: number; hasta: number })).toBe(
    "Tiene que ser un número entero",
  );
});

test("el extremo fuera de rango se dice en el modo del parámetro", () => {
  expect(error(fijo, { desde: 0, hasta: 200 }, { modo: "nota" })).toBe("Tiene que ir de C-1 a G9");
  expect(error(fijo, { desde: 0, hasta: 200 }, { modo: "hexadecimal" })).toBe("Tiene que ir de 00 a 7F");
});
