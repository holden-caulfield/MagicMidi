import { expect, test } from "vitest";

import { formato } from "@/formato";
import { validar } from "./rango";

// `validar` dice si un rango le sirve al parámetro: devuelve el texto que se
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
  expect(validar(fijo, { desde: 0, hasta: 127 })).toBeNull();
});

test("acepta un solo valor", () => {
  expect(validar(fijo, { desde: 64, hasta: 64 })).toBeNull();
});

test("si se puede invertir, acepta el rango al revés", () => {
  expect(validar(invertible, { desde: 127, hasta: 0 })).toBeNull();
});

test("si no se puede invertir, marca el rango al revés", () => {
  expect(validar(fijo, { desde: 72, hasta: 60 })).toBe(
    "Desde tiene que ser igual o menor que hasta",
  );
});

test("marca un extremo fuera de rango", () => {
  expect(validar(fijo, { desde: 0, hasta: 200 })).toEqual(formato`Tiene que ir de ${0} a ${127}`);
  expect(validar(invertible, { desde: -1, hasta: 127 })).toEqual(formato`Tiene que ir de ${0} a ${127}`);
});

test("fuera de rango se marca antes que al revés", () => {
  expect(validar(fijo, { desde: 200, hasta: 10 })).toEqual(formato`Tiene que ir de ${0} a ${127}`);
});

test("marca un extremo con decimales", () => {
  expect(validar(fijo, { desde: 2.5, hasta: 127 })).toBe("Tiene que ser un número entero");
});

test("marca algo que no es un rango", () => {
  // TypeScript no deja escribirlo, pero el valor podría venir de otro lado.
  expect(validar(fijo, 64 as unknown as { desde: number; hasta: number })).toBe(
    "Tiene que ser un número entero",
  );
});
