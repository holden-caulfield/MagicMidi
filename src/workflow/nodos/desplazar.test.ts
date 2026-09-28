import { expect, test } from "vitest";

import desplazar from "./desplazar";

// Cada `test` prueba una sola cosa: le pasa un mensaje y unos parámetros a
// `procesar`, y con `expect` dice qué mensaje tiene que salir.

test("suma el desplazamiento al byte elegido", () => {
  const resultado = desplazar.procesar([0x90, 60, 100], {
    byte: 1,
    desplazamiento: 12,
    overflow: false,
  });

  expect(resultado).toEqual([0x90, 73, 100]);
});

test("con un desplazamiento negativo, resta", () => {
  const resultado = desplazar.procesar([0x90, 60, 100], {
    byte: 1,
    desplazamiento: -12,
    overflow: false,
  });

  expect(resultado).toEqual([0x90, 48, 100]);
});

test("puede desplazar el tercer byte", () => {
  const resultado = desplazar.procesar([0x90, 60, 100], {
    byte: 2,
    desplazamiento: 10,
    overflow: false,
  });

  expect(resultado).toEqual([0x90, 60, 110]);
});

test("si el mensaje no tiene el byte elegido, lo deja igual", () => {
  // Un Cambio de Programa tiene solo dos bytes: no hay tercero para desplazar.
  const resultado = desplazar.procesar([0xc0, 5], {
    byte: 2,
    desplazamiento: 10,
    overflow: false,
  });

  expect(resultado).toEqual([0xc0, 5]);
});

// Los casos límite: qué pasa al llegar a los bordes (0 y 127). Es donde más
// fácil se rompe un nodo, así que vale la pena probarlos siempre.

test("sin overflow, pasarse de 127 se queda en 127", () => {
  const resultado = desplazar.procesar([0x90, 120, 100], {
    byte: 1,
    desplazamiento: 20,
    overflow: false,
  });

  expect(resultado).toEqual([0x90, 127, 100]);
});

test("sin overflow, bajar de 0 se queda en 0", () => {
  const resultado = desplazar.procesar([0x90, 5, 100], {
    byte: 1,
    desplazamiento: -20,
    overflow: false,
  });

  expect(resultado).toEqual([0x90, 0, 100]);
});

test("con overflow, pasarse de 127 vuelve a empezar desde 0", () => {
  // 120 + 20 = 140, y 140 - 128 = 12.
  const resultado = desplazar.procesar([0x90, 120, 100], {
    byte: 1,
    desplazamiento: 20,
    overflow: true,
  });

  expect(resultado).toEqual([0x90, 12, 100]);
});

test("con overflow, bajar de 0 vuelve a empezar desde 127", () => {
  // 5 - 20 = -15, y -15 + 128 = 113.
  const resultado = desplazar.procesar([0x90, 5, 100], {
    byte: 1,
    desplazamiento: -20,
    overflow: true,
  });

  expect(resultado).toEqual([0x90, 113, 100]);
});

test("en el status, cambia el canal pero sigue siendo un status", () => {
  // 0x90 es Nota On en el canal 1: sumarle 1 lo pasa al canal 2 (0x91).
  const resultado = desplazar.procesar([0x90, 60, 100], {
    byte: 0,
    desplazamiento: 1,
    overflow: false,
  });

  expect(resultado).toEqual([0x91, 60, 100]);
});

test("en el status, nunca se pierde el bit alto", () => {
  // Sin overflow, 0xFF se queda en 0xFF; si el bit alto se perdiera, el
  // mensaje dejaría de empezar con un status.
  const resultado = desplazar.procesar([0xff], {
    byte: 0,
    desplazamiento: 10,
    overflow: false,
  });

  expect(resultado).toEqual([0xff]);
});

test("en un byte de datos, nunca se prende el bit alto", () => {
  // Con overflow, 127 + 1 da 0 y no 128: un byte de datos que llegara a 128
  // se confundiría con un status.
  const resultado = desplazar.procesar([0x90, 127, 100], {
    byte: 1,
    desplazamiento: 1,
    overflow: true,
  });

  expect(resultado).toEqual([0x90, 0, 100]);
});
