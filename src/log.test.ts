import { expect, test } from "vitest";

import { clasificarSalidas } from "./log";
import { MensajeMidi } from "./workflow/tipos";

function m(...bytes: number[]): MensajeMidi {
  return new MensajeMidi(bytes);
}

test("si no salió nada, está descartado", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [])).toEqual({ tipo: "descartado" });
});

test("si salió solo el mismo mensaje, pasó sin cambios", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 60, 100)])).toEqual({
    tipo: "sin-cambios",
  });
});

test("si salió un mensaje distinto, está transformado", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 64, 100)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 64, 100)],
  });
});

test("se comparan los bytes, no el significado", () => {
  // Los dos son un Nota Off, pero una caja que convierte uno en el otro sí
  // cambió el mensaje.
  expect(clasificarSalidas(m(0x90, 60, 0), [m(0x80, 60, 64)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x80, 60, 64)],
  });
});

test("un mensaje con otra cantidad de bytes es distinto", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 60)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 60)],
  });
});

test("varios mensajes distintos van en el orden en que salieron", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 64, 100), m(0x90, 67, 100)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 64, 100), m(0x90, 67, 100)],
  });
});

test("un acorde que incluye la nota original se muestra con todas sus notas", () => {
  expect(
    clasificarSalidas(m(0x90, 60, 100), [m(0x90, 60, 100), m(0x90, 64, 100), m(0x90, 67, 100)]),
  ).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 60, 100), m(0x90, 64, 100), m(0x90, 67, 100)],
  });
});

test("si salió igual dos veces, se muestran las dos", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 60, 100), m(0x90, 60, 100)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 60, 100), m(0x90, 60, 100)],
  });
});

test("el mismo mensaje distinto dos veces se muestra dos veces", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 64, 100), m(0x90, 64, 100)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 64, 100), m(0x90, 64, 100)],
  });
});

test("si una caja falló, es un error con su texto", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [], 'La caja "Desplazar" falló: ups')).toEqual({
    tipo: "error",
    texto: 'La caja "Desplazar" falló: ups',
  });
});
