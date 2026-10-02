import { expect, test } from "vitest";

import { conNombresAMostrar, estadoDeLaConexion } from "./conexion";

test("los nombres que no se repiten quedan igual", () => {
  const puertos = [
    { id: "1", nombre: "Teclado" },
    { id: "2", nombre: "Sintetizador" },
  ];

  expect(conNombresAMostrar(puertos)).toEqual(puertos);
});

test("a los nombres repetidos se les suma el número de aparición", () => {
  const puertos = [
    { id: "1", nombre: "IAC Bus" },
    { id: "2", nombre: "Teclado" },
    { id: "3", nombre: "IAC Bus" },
    { id: "4", nombre: "IAC Bus" },
  ];

  expect(conNombresAMostrar(puertos)).toEqual([
    { id: "1", nombre: "IAC Bus" },
    { id: "2", nombre: "Teclado" },
    { id: "3", nombre: "IAC Bus (2)" },
    { id: "4", nombre: "IAC Bus (3)" },
  ]);
});

test("no modifica la lista que recibe", () => {
  const puertos = [
    { id: "1", nombre: "IAC Bus" },
    { id: "2", nombre: "IAC Bus" },
  ];

  conNombresAMostrar(puertos);

  expect(puertos[1].nombre).toBe("IAC Bus");
});

test("sin conexión ni mensaje, el estado es desconectado", () => {
  expect(estadoDeLaConexion({ conectado: false, mensajeConexion: "" })).toBe("desconectado");
});

test("sin conexión y con un mensaje en el panel, el estado es error", () => {
  expect(
    estadoDeLaConexion({ conectado: false, mensajeConexion: "Error al conectar: x" }),
  ).toBe("error");
});

test("con conexión, el estado es conectado", () => {
  expect(estadoDeLaConexion({ conectado: true, mensajeConexion: "" })).toBe("conectado");
});
