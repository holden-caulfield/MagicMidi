import { expect, test } from "vitest";

import { MensajeMidi } from "@/midi/mensaje";
import { interpretar } from "../parametros/entero";
import desplazar from "./desplazar";

// Cada `test` prueba una sola cosa: le pasa un mensaje y unos parámetros a
// `procesar`, y con `expect` dice qué mensaje tiene que salir.

test("suma el desplazamiento al byte elegido", () => {
  const resultado = desplazar.procesar(new MensajeMidi([0x90, 60, 100]), {
    byte: 1,
    desplazamiento: 12,
    overflow: false,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 72, 100]));
});

test("con un desplazamiento negativo, resta", () => {
  const resultado = desplazar.procesar(new MensajeMidi([0x90, 60, 100]), {
    byte: 1,
    desplazamiento: -12,
    overflow: false,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 48, 100]));
});

test("puede desplazar el tercer byte", () => {
  const resultado = desplazar.procesar(new MensajeMidi([0x90, 60, 100]), {
    byte: 2,
    desplazamiento: 10,
    overflow: false,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 110]));
});

test("si el mensaje no tiene el byte elegido, lo deja igual", () => {
  // Un Cambio de Programa tiene solo dos bytes: no hay tercero para desplazar.
  const resultado = desplazar.procesar(new MensajeMidi([0xc0, 5]), {
    byte: 2,
    desplazamiento: 10,
    overflow: false,
  });

  expect(resultado).toEqual(new MensajeMidi([0xc0, 5]));
});

// Los casos límite: qué pasa al llegar a los bordes (0 y 127). Es donde más
// fácil se rompe un nodo, así que vale la pena probarlos siempre.

test("sin overflow, pasarse de 127 se queda en 127", () => {
  const resultado = desplazar.procesar(new MensajeMidi([0x90, 120, 100]), {
    byte: 1,
    desplazamiento: 20,
    overflow: false,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 127, 100]));
});

test("sin overflow, bajar de 0 se queda en 0", () => {
  const resultado = desplazar.procesar(new MensajeMidi([0x90, 5, 100]), {
    byte: 1,
    desplazamiento: -20,
    overflow: false,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 0, 100]));
});

test("con overflow, pasarse de 127 vuelve a empezar desde 0", () => {
  // 120 + 20 = 140, y 140 - 128 = 12.
  const resultado = desplazar.procesar(new MensajeMidi([0x90, 120, 100]), {
    byte: 1,
    desplazamiento: 20,
    overflow: true,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 12, 100]));
});

test("con overflow, bajar de 0 vuelve a empezar desde 127", () => {
  // 5 - 20 = -15, y -15 + 128 = 113.
  const resultado = desplazar.procesar(new MensajeMidi([0x90, 5, 100]), {
    byte: 1,
    desplazamiento: -20,
    overflow: true,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 113, 100]));
});

// El canal: se desplaza entre 1 y 16, sin tocar el tipo de mensaje.

test("con Canal, cambia el canal", () => {
  // 0x90 es Nota On en el canal 1: sumarle 1 lo pasa al canal 2 (0x91).
  const resultado = desplazar.procesar(new MensajeMidi([0x90, 60, 100]), {
    byte: 0,
    desplazamiento: 1,
    overflow: false,
  });

  expect(resultado).toEqual(new MensajeMidi([0x91, 60, 100]));
});

test("con Canal y sin overflow, pasarse del canal 16 se queda en 16", () => {
  // 0x9F es Nota On en el canal 16. Si se sumara al byte entero daría 0xA0,
  // que ya no es un Nota On sino una Presión Polifónica.
  const resultado = desplazar.procesar(new MensajeMidi([0x9f, 60, 100]), {
    byte: 0,
    desplazamiento: 1,
    overflow: false,
  });

  expect(resultado).toEqual(new MensajeMidi([0x9f, 60, 100]));
});

test("con Canal y con overflow, después del canal 16 viene el 1", () => {
  const resultado = desplazar.procesar(new MensajeMidi([0x9f, 60, 100]), {
    byte: 0,
    desplazamiento: 1,
    overflow: true,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 100]));
});

test("con Canal y con overflow, antes del canal 1 viene el 16", () => {
  // 0xB0 es Cambio de Control en el canal 1; 0xBF, en el canal 16.
  const resultado = desplazar.procesar(new MensajeMidi([0xb0, 7, 100]), {
    byte: 0,
    desplazamiento: -1,
    overflow: true,
  });

  expect(resultado).toEqual(new MensajeMidi([0xbf, 7, 100]));
});

test("con Canal, un mensaje de sistema pasa sin cambios", () => {
  // 0xF8 (reloj) no tiene canal.
  const resultado = desplazar.procesar(new MensajeMidi([0xf8]), {
    byte: 0,
    desplazamiento: 1,
    overflow: true,
  });

  expect(resultado).toEqual(new MensajeMidi([0xf8]));
});

test("en un byte de datos, nunca se prende el bit alto", () => {
  // Con overflow, 127 + 1 da 0 y no 128: un byte de datos que llegara a 128
  // se confundiría con un status.
  const resultado = desplazar.procesar(new MensajeMidi([0x90, 127, 100]), {
    byte: 1,
    desplazamiento: 1,
    overflow: true,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 0, 100]));
});

test("el desplazamiento se escribe solo en decimal", () => {
  const parametro = desplazar.parametros.find(({ clave }) => clave === "desplazamiento")!;
  if (parametro.tipo !== "entero") throw new Error("el desplazamiento es un entero");

  expect(interpretar("E4", parametro, { modo: "decimal", bemoles: false })).toBeNull();
  expect(interpretar("0x0C", parametro, { modo: "decimal", bemoles: false })).toBeNull();
  expect(interpretar("-12", parametro, { modo: "decimal", bemoles: false })).toEqual({ numero: -12, presentacion: { modo: "decimal", bemoles: false } });
});
