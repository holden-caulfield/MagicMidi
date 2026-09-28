import { expect, test, vi } from "vitest";

import { enviarMensaje } from "../salida";
import emitir from "./emitir";

// Emitir no devuelve nada: manda el mensaje a la salida. En el test no hay
// salida MIDI de verdad, así que se reemplaza `enviarMensaje` por una función
// falsa (`vi.fn()`) que solo anota con qué la llamaron.
vi.mock("../salida", () => ({ enviarMensaje: vi.fn() }));

test("manda el mensaje a la salida tal cual", () => {
  emitir.procesar([0x90, 60, 100]);

  expect(enviarMensaje).toHaveBeenCalledExactlyOnceWith([0x90, 60, 100]);
});

test("no devuelve nada, porque no tiene salida hacia otras cajas", () => {
  const resultado = emitir.procesar([0x90, 60, 100]);

  expect(resultado).toBeUndefined();
});
