import { expect, test } from "vitest";

import { MensajeMidi } from "./mensaje";
import { mensajesDePanico } from "./panico";

test("empieza por el canal 1: pedal, All Sound Off, Reset All Controllers y All Notes Off", () => {
  expect(mensajesDePanico().slice(0, 4)).toEqual([
    new MensajeMidi([0xb0, 0x40, 0x00]),
    new MensajeMidi([0xb0, 0x78, 0x00]),
    new MensajeMidi([0xb0, 0x79, 0x00]),
    new MensajeMidi([0xb0, 0x7b, 0x00]),
  ]);
});

test("termina por el canal 16, y son 64 mensajes", () => {
  const mensajes = mensajesDePanico();

  expect(mensajes).toHaveLength(64);
  expect(mensajes.slice(-4)).toEqual([
    new MensajeMidi([0xbf, 0x40, 0x00]),
    new MensajeMidi([0xbf, 0x78, 0x00]),
    new MensajeMidi([0xbf, 0x79, 0x00]),
    new MensajeMidi([0xbf, 0x7b, 0x00]),
  ]);
});

test("recorre los canales en orden, cuatro mensajes por canal", () => {
  const canales = mensajesDePanico().map((mensaje) => mensaje.canal);

  expect(canales).toEqual(Array.from({ length: 64 }, (_, indice) => Math.floor(indice / 4) + 1));
});

test("son todos Cambios de Control con valor 0", () => {
  for (const mensaje of mensajesDePanico()) {
    expect(mensaje.tipo).toBe("cambio-de-control");
    expect(mensaje.bytes[2]).toBe(0);
  }
});

test("cada llamada devuelve mensajes nuevos", () => {
  const primera = mensajesDePanico();
  const segunda = mensajesDePanico();

  primera[0].bytes[1] = 7;

  expect(segunda[0]).toEqual(new MensajeMidi([0xb0, 0x40, 0x00]));
});
