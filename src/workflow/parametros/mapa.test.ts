import { expect, test } from "vitest";

import type { Mapa } from "@/componentes/campo-mapa";
import { formato } from "@/formato";
import { mapa } from "./mapa";

// `validar` dice si un mapa le sirve al parámetro: devuelve el texto que se
// muestra debajo del control, o `null` si está bien. Los casos usan un mapa de
// 0 a 127.

const notas = mapa({ clave: "mapa", etiqueta: "Mapa", inicial: [], minimo: 0, maximo: 127 });

test("acepta varias entradas que llevan a la misma salida", () => {
  expect(
    notas.validar([
      { entrada: 48, salida: 36 },
      { entrada: 49, salida: 36 },
    ]),
  ).toBeNull();
});

test("acepta el mapa vacío", () => {
  expect(notas.validar([])).toBeNull();
});

test("acepta los extremos", () => {
  expect(notas.validar([{ entrada: 0, salida: 127 }])).toBeNull();
});

test("marca el primer valor fuera de rango, y lo nombra", () => {
  expect(
    notas.validar([
      { entrada: 48, salida: 200 },
      { entrada: 300, salida: 36 },
    ]),
  ).toEqual(formato`Los valores tienen que ir de ${0} a ${127}, y hay un ${200}`);
});

test("en cada par, la entrada se revisa antes que la salida", () => {
  expect(notas.validar([{ entrada: 300, salida: 200 }])).toEqual(
    formato`Los valores tienen que ir de ${0} a ${127}, y hay un ${300}`,
  );
});

test("marca la primera entrada repetida, y la nombra", () => {
  expect(
    notas.validar([
      { entrada: 48, salida: 36 },
      { entrada: 49, salida: 38 },
      { entrada: 48, salida: 42 },
    ]),
  ).toEqual(formato`La entrada ${48} está más de una vez`);
});

test("un valor fuera de rango se marca antes que una entrada repetida", () => {
  expect(
    notas.validar([
      { entrada: 48, salida: 200 },
      { entrada: 48, salida: 36 },
    ]),
  ).toEqual(formato`Los valores tienen que ir de ${0} a ${127}, y hay un ${200}`);
});

test("marca un valor con decimales", () => {
  expect(notas.validar([{ entrada: 48, salida: 36.5 }])).toBe(
    "Tiene que ser una lista de pares de números enteros",
  );
});

test("marca un par al que le falta la salida", () => {
  expect(notas.validar([{ entrada: 48 }] as unknown as Mapa)).toBe(
    "Tiene que ser una lista de pares de números enteros",
  );
});

test("marca algo que no es una lista", () => {
  expect(notas.validar(48 as unknown as Mapa)).toBe(
    "Tiene que ser una lista de pares de números enteros",
  );
});

test("sin modos declarados, ofrece los tres", () => {
  expect(notas.modos).toEqual(["decimal", "nota", "hexadecimal"]);
});
