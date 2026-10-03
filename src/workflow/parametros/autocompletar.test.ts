import { expect, test } from "vitest";

import { error, opcionesQueCoinciden } from "./autocompletar";

// Todos los casos usan estas cuatro opciones.

const opciones = [
  { valor: "nota-on", texto: "Nota On" },
  { valor: "nota-off", texto: "Nota Off" },
  { valor: "presion-polifonica", texto: "Presión Polifónica" },
  { valor: "presion-de-canal", texto: "Presión de Canal" },
];

// `opcionesQueCoinciden` decide qué se ve en la lista desplegada: recibe las
// opciones, las que ya están elegidas y lo que se escribió en el campo.

test("sin nada escrito, muestra todas menos las elegidas", () => {
  expect(opcionesQueCoinciden(opciones, ["nota-on"], "")).toEqual([
    { valor: "nota-off", texto: "Nota Off" },
    { valor: "presion-polifonica", texto: "Presión Polifónica" },
    { valor: "presion-de-canal", texto: "Presión de Canal" },
  ]);
});

test("no distingue mayúsculas de minúsculas", () => {
  expect(opcionesQueCoinciden(opciones, [], "NOTA OFF")).toEqual([
    { valor: "nota-off", texto: "Nota Off" },
  ]);
});

test("no distingue letras con o sin tilde", () => {
  expect(opcionesQueCoinciden(opciones, [], "presion")).toEqual([
    { valor: "presion-polifonica", texto: "Presión Polifónica" },
    { valor: "presion-de-canal", texto: "Presión de Canal" },
  ]);
});

test("encuentra una parte del medio del texto", () => {
  expect(opcionesQueCoinciden(opciones, [], "canal")).toEqual([
    { valor: "presion-de-canal", texto: "Presión de Canal" },
  ]);
});

test("si nada coincide, no muestra ninguna", () => {
  expect(opcionesQueCoinciden(opciones, [], "xyz")).toEqual([]);
});

// `error` dice si una lista de elegidas le sirve al parámetro: devuelve el
// texto que se muestra debajo del control, o `null` si está bien.

const parametro = {
  clave: "tipos",
  etiqueta: "Tipos de mensaje",
  tipo: "autocompletar" as const,
  inicial: [],
  opciones,
};

test("acepta no elegir ninguna", () => {
  expect(error(parametro, [])).toBeNull();
});

test("acepta opciones de la lista", () => {
  expect(error(parametro, ["nota-on", "presion-de-canal"])).toBeNull();
});

test("marca un valor que no está en la lista", () => {
  expect(error(parametro, ["nota-on", "sysex"])).toBe(
    "Tiene que tener solo opciones de la lista, sin repetir",
  );
});

test("marca una opción repetida", () => {
  expect(error(parametro, ["nota-on", "nota-on"])).toBe(
    "Tiene que tener solo opciones de la lista, sin repetir",
  );
});

test("marca algo que no es una lista", () => {
  // TypeScript no deja escribirlo, pero el valor podría venir de otro lado.
  expect(error(parametro, "nota-on" as unknown as string[])).toBe(
    "Tiene que tener solo opciones de la lista, sin repetir",
  );
});
