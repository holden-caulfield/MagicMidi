import { expect, test } from "vitest";

import emitir from "./emitir";

// Emitir es una caja sin salida: lo que devuelve es lo que sale por el puerto
// MIDI. La caja no envía nada por su cuenta, así que alcanza con mirar qué
// devuelve.
test("devuelve el mensaje tal cual, para que salga por el puerto", () => {
  expect(emitir.procesar([0x90, 60, 100])).toEqual([0x90, 60, 100]);
});

test("devuelve los mensajes de un solo byte sin cambios", () => {
  expect(emitir.procesar([0xfa])).toEqual([0xfa]);
});
