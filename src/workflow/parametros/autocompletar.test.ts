import { expect, test } from "vitest";

import { validar } from "./autocompletar";

// Todos los casos usan estas cuatro opciones.

const opciones = [
  { valor: "nota-on", texto: "Nota On" },
  { valor: "nota-off", texto: "Nota Off" },
  { valor: "presion-polifonica", texto: "Presión Polifónica" },
  { valor: "presion-de-canal", texto: "Presión de Canal" },
];

// `validar` dice si una lista de elegidas le sirve al parámetro: devuelve el
// texto que se muestra debajo del control, o `null` si está bien.

const parametro = {
  clave: "tipos",
  etiqueta: "Tipos de mensaje",
  tipo: "autocompletar" as const,
  inicial: [],
  opciones,
};

test("acepta no elegir ninguna", () => {
  expect(validar(parametro, [])).toBeNull();
});

test("acepta opciones de la lista", () => {
  expect(validar(parametro, ["nota-on", "presion-de-canal"])).toBeNull();
});

test("marca un valor que no está en la lista", () => {
  expect(validar(parametro, ["nota-on", "sysex"])).toBe(
    "Tiene que tener solo opciones de la lista, sin repetir",
  );
});

test("marca una opción repetida", () => {
  expect(validar(parametro, ["nota-on", "nota-on"])).toBe(
    "Tiene que tener solo opciones de la lista, sin repetir",
  );
});

test("marca algo que no es una lista", () => {
  // TypeScript no deja escribirlo, pero el valor podría venir de otro lado.
  expect(validar(parametro, "nota-on" as unknown as string[])).toBe(
    "Tiene que tener solo opciones de la lista, sin repetir",
  );
});
