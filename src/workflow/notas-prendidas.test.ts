import { beforeEach, expect, test } from "vitest";

import { MensajeMidi } from "@/midi/mensaje";
import { anotarNotasPrendidas, olvidarNotasPrendidas, soltarNota } from "./notas-prendidas";

function m(...bytes: number[]): MensajeMidi {
  return new MensajeMidi(bytes);
}

beforeEach(() => {
  olvidarNotasPrendidas();
});

test("un Nota On transpuesto se suelta con la nota que salió", () => {
  anotarNotasPrendidas(m(0x90, 60, 100), [m(0x90, 72, 100)]);

  expect(soltarNota(m(0x80, 60, 64))).toEqual([m(0x80, 72, 64)]);
});

test("un acorde suelta todas sus notas, en el orden en que salieron", () => {
  anotarNotasPrendidas(m(0x90, 60, 100), [m(0x90, 60, 100), m(0x90, 64, 100), m(0x90, 67, 100)]);

  expect(soltarNota(m(0x80, 60, 64))).toEqual([m(0x80, 60, 64), m(0x80, 64, 64), m(0x80, 67, 64)]);
});

test("se suelta en el canal por el que salió", () => {
  anotarNotasPrendidas(m(0x90, 60, 100), [m(0x91, 60, 100)]);

  expect(soltarNota(m(0x80, 60, 64))).toEqual([m(0x81, 60, 64)]);
});

test("un Nota On con velocidad 0 conserva su forma", () => {
  anotarNotasPrendidas(m(0x90, 60, 100), [m(0x90, 72, 100)]);

  expect(soltarNota(m(0x90, 60, 0))).toEqual([m(0x90, 72, 0)]);
});

test("un Nota Off conserva su velocidad de soltar", () => {
  anotarNotasPrendidas(m(0x90, 60, 100), [m(0x90, 72, 100)]);

  expect(soltarNota(m(0x80, 60, 20))).toEqual([m(0x80, 72, 20)]);
});

test("la misma nota dos veces se suelta de la más vieja a la más nueva", () => {
  anotarNotasPrendidas(m(0x90, 60, 100), [m(0x90, 72, 100)]);
  anotarNotasPrendidas(m(0x90, 60, 100), [m(0x90, 67, 100)]);

  expect(soltarNota(m(0x80, 60, 64))).toEqual([m(0x80, 72, 64)]);
  expect(soltarNota(m(0x80, 60, 64))).toEqual([m(0x80, 67, 64)]);
  expect(soltarNota(m(0x80, 60, 64))).toBeNull();
});

test("si el Nota On no prendió ninguna nota, no hay nada que apagar", () => {
  anotarNotasPrendidas(m(0x90, 60, 100), []);

  expect(soltarNota(m(0x80, 60, 64))).toEqual([]);
});

test("sin nada anotado, devuelve null", () => {
  expect(soltarNota(m(0x80, 60, 64))).toBeNull();
});

test("un Nota Off de otra nota o de otro canal no la suelta", () => {
  anotarNotasPrendidas(m(0x90, 60, 100), [m(0x90, 72, 100)]);

  expect(soltarNota(m(0x80, 61, 64))).toBeNull();
  expect(soltarNota(m(0x81, 60, 64))).toBeNull();
});

test("lo que salió y no es un Nota On no cuenta como prendido", () => {
  // Un Cambio de Control y un Nota On con velocidad 0, que es un Nota Off.
  anotarNotasPrendidas(m(0x90, 60, 100), [m(0xb0, 60, 100), m(0x90, 72, 0)]);

  expect(soltarNota(m(0x80, 60, 64))).toEqual([]);
});

test("olvidar borra todo lo anotado", () => {
  anotarNotasPrendidas(m(0x90, 60, 100), [m(0x90, 72, 100)]);

  olvidarNotasPrendidas();

  expect(soltarNota(m(0x80, 60, 64))).toBeNull();
});
