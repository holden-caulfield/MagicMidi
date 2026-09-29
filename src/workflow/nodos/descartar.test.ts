import { expect, test } from "vitest";

import descartar from "./descartar";

// Descartar es una caja sin salida que no devuelve nada: el mensaje que llega
// hasta ella no sale por el puerto MIDI. Ni siquiera mira el mensaje, por eso
// `procesar` se llama sin nada.
test("no devuelve nada, así que no sale nada", () => {
  expect(descartar.procesar()).toBeUndefined();
});
