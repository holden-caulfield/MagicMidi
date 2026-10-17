import { expect, test } from "vitest";

import { formato } from "@/formato";
import { secuencia } from "./secuencia";

// `validar` dice si una lista le sirve al parámetro: devuelve el texto que se
// muestra debajo del control, o `null` si está bien. Los casos usan una
// secuencia de 0 a 127.

const valores = secuencia({
  clave: "valores",
  etiqueta: "Valores",
  inicial: [127, 0],
  minimo: 0,
  maximo: 127,
});

test("acepta valores repetidos", () => {
  expect(valores.validar([127, 80, 80, 80])).toBeNull();
});

test("acepta un solo valor", () => {
  expect(valores.validar([64])).toBeNull();
});

test("acepta los extremos", () => {
  expect(valores.validar([0, 127])).toBeNull();
});

test("marca la lista vacía", () => {
  expect(valores.validar([])).toBe("Tiene que tener al menos un valor");
});

test("marca el primer valor fuera de rango, y lo nombra", () => {
  expect(valores.validar([60, 200, 300])).toEqual(
    formato`Los valores tienen que ir de ${0} a ${127}, y hay un ${200}`,
  );
});

test("un valor negativo también queda afuera", () => {
  expect(valores.validar([60, -1])).toEqual(
    formato`Los valores tienen que ir de ${0} a ${127}, y hay un ${-1}`,
  );
});

test("marca un valor con decimales", () => {
  expect(valores.validar([60, 2.5])).toBe("Tiene que ser una lista de números enteros");
});

test("marca algo que no es una lista", () => {
  expect(valores.validar(60 as unknown as number[])).toBe(
    "Tiene que ser una lista de números enteros",
  );
});

test("sin modos declarados, ofrece los tres", () => {
  expect(valores.modos).toEqual(["decimal", "nota", "hexadecimal"]);
});
