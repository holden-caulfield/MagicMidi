import { expect, test } from "vitest";

import { MensajeMidi } from "@/midi/mensaje";
import emitir from "./emitir";

// Emitir es una caja sin salida: lo que devuelve es lo que sale por el puerto
// MIDI. La caja no envía nada por su cuenta, así que alcanza con mirar qué
// devuelve.
test("devuelve el mensaje tal cual, para que salga por el puerto", () => {
  const resultado = emitir.procesar(new MensajeMidi([0x90, 60, 100]));

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 100]));
});

test("devuelve los mensajes de un solo byte sin cambios", () => {
  const resultado = emitir.procesar(new MensajeMidi([0xfa]));

  expect(resultado).toEqual(new MensajeMidi([0xfa]));
});
