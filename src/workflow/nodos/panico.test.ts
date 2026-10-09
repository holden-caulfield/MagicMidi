import { expect, test } from "vitest";

import { MensajeMidi } from "@/midi/mensaje";
import panico from "./panico";

// Pánico es una caja sin salida que no mira el mensaje que le llega: por cada
// uno devuelve una lista con los mensajes que apagan todo, y esos son los que
// salen por el puerto MIDI. Por eso `procesar` se llama sin nada.

test("devuelve 64 mensajes, del canal 1 al 16", () => {
  const resultado = panico.procesar();

  expect(resultado).toHaveLength(64);
  expect(resultado[0]).toEqual(new MensajeMidi([0xb0, 0x40, 0x00]));
  expect(resultado[63]).toEqual(new MensajeMidi([0xbf, 0x7b, 0x00]));
});

test("en cada canal suelta el pedal, corta el sonido, resetea controles y apaga notas", () => {
  const resultado = panico.procesar();

  // Los cuatro del canal 2 (status B1).
  expect(resultado.slice(4, 8)).toEqual([
    new MensajeMidi([0xb1, 0x40, 0x00]), // Pedal de sustain
    new MensajeMidi([0xb1, 0x78, 0x00]), // All Sound Off
    new MensajeMidi([0xb1, 0x79, 0x00]), // Reset All Controllers
    new MensajeMidi([0xb1, 0x7b, 0x00]), // All Notes Off
  ]);
});
