import { expect, test } from "vitest";

import { opcionesQueCoinciden } from "./campo-autocompletar";

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
