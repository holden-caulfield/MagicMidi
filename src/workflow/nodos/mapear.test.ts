import { expect, test } from "vitest";

import { MensajeMidi } from "@/midi/mensaje";
import mapear from "./mapear";

// Cada `test` prueba una sola cosa: le pasa un mensaje y unos parámetros a
// `procesar`, y con `expect` dice qué mensaje tiene que salir.

test("con los valores iniciales, deja el mensaje igual", () => {
  const resultado = mapear.procesar(new MensajeMidi([0x90, 60, 100]), {
    byte: 2,
    entradaDesde: 0,
    entradaHasta: 127,
    salidaDesde: 0,
    salidaHasta: 127,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 100]));
});

test("comprime la velocidad a un rango más chico", () => {
  // De 0–127 a 40–110: 100 queda en 95 (40 + 100 × 70 / 127 = 95,1).
  const resultado = mapear.procesar(new MensajeMidi([0x90, 60, 100]), {
    byte: 2,
    entradaDesde: 0,
    entradaHasta: 127,
    salidaDesde: 40,
    salidaHasta: 110,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 95]));
});

test("al comprimir, los extremos van a los extremos", () => {
  const parametros = {
    byte: 2,
    entradaDesde: 0,
    entradaHasta: 127,
    salidaDesde: 40,
    salidaHasta: 110,
  };

  expect(mapear.procesar(new MensajeMidi([0x90, 60, 127]), parametros)).toEqual(
    new MensajeMidi([0x90, 60, 110]),
  );
  // 1 da 40,55, que se redondea a 41.
  expect(mapear.procesar(new MensajeMidi([0x90, 60, 1]), parametros)).toEqual(
    new MensajeMidi([0x90, 60, 41]),
  );
});

test("con la salida al revés, invierte un pedal de expresión", () => {
  // El controlador 11 es la expresión: 0 pasa a 127, 127 a 0 y 100 a 27.
  const parametros = {
    byte: 2,
    entradaDesde: 0,
    entradaHasta: 127,
    salidaDesde: 127,
    salidaHasta: 0,
  };

  expect(mapear.procesar(new MensajeMidi([0xb0, 11, 0]), parametros)).toEqual(
    new MensajeMidi([0xb0, 11, 127]),
  );
  expect(mapear.procesar(new MensajeMidi([0xb0, 11, 127]), parametros)).toEqual(
    new MensajeMidi([0xb0, 11, 0]),
  );
  expect(mapear.procesar(new MensajeMidi([0xb0, 11, 100]), parametros)).toEqual(
    new MensajeMidi([0xb0, 11, 27]),
  );
});

test("limita la rueda de modulación a la mitad", () => {
  // El controlador 1 es la modulación: 127 pasa a 64, y 64 a 32.
  const parametros = {
    byte: 2,
    entradaDesde: 0,
    entradaHasta: 127,
    salidaDesde: 0,
    salidaHasta: 64,
  };

  expect(mapear.procesar(new MensajeMidi([0xb0, 1, 127]), parametros)).toEqual(
    new MensajeMidi([0xb0, 1, 64]),
  );
  expect(mapear.procesar(new MensajeMidi([0xb0, 1, 64]), parametros)).toEqual(
    new MensajeMidi([0xb0, 1, 32]),
  );
});

test("puede mapear el segundo byte", () => {
  // Las notas de 48 a 72 se reparten de 60 a 72: 60 queda en 66.
  const resultado = mapear.procesar(new MensajeMidi([0x90, 60, 100]), {
    byte: 1,
    entradaDesde: 48,
    entradaHasta: 72,
    salidaDesde: 60,
    salidaHasta: 72,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 66, 100]));
});

test("si el mensaje no tiene el byte elegido, lo deja igual", () => {
  // Una Presión de Canal tiene solo dos bytes: no hay tercero para mapear.
  const resultado = mapear.procesar(new MensajeMidi([0xd0, 64]), {
    byte: 2,
    entradaDesde: 0,
    entradaHasta: 127,
    salidaDesde: 127,
    salidaHasta: 0,
  });

  expect(resultado).toEqual(new MensajeMidi([0xd0, 64]));
});

// Los casos límite: valores fuera del rango de entrada, y rangos al revés.

test("lo que queda por debajo de la entrada va al principio de la salida", () => {
  // Un pedal que no baja de 10: con entrada 10–120, el 5 cuenta como 10.
  const resultado = mapear.procesar(new MensajeMidi([0xb0, 11, 5]), {
    byte: 2,
    entradaDesde: 10,
    entradaHasta: 120,
    salidaDesde: 0,
    salidaHasta: 127,
  });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 11, 0]));
});

test("lo que queda por encima de la entrada va al final de la salida", () => {
  const resultado = mapear.procesar(new MensajeMidi([0xb0, 11, 125]), {
    byte: 2,
    entradaDesde: 10,
    entradaHasta: 120,
    salidaDesde: 0,
    salidaHasta: 127,
  });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 11, 127]));
});

test("la entrada también puede estar al revés", () => {
  // Entrada 127–0 a salida 0–127 es lo mismo que invertir: 100 pasa a 27.
  const resultado = mapear.procesar(new MensajeMidi([0xb0, 11, 100]), {
    byte: 2,
    entradaDesde: 127,
    entradaHasta: 0,
    salidaDesde: 0,
    salidaHasta: 127,
  });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 11, 27]));
});

// `validar` revisa lo que depende de más de un parámetro: la entrada tiene que
// tener dos extremos distintos. Devuelve la lista de errores (vacía si está
// todo bien).

test("una entrada con dos extremos distintos está bien", () => {
  expect(
    mapear.validar({ byte: 2, entradaDesde: 0, entradaHasta: 127, salidaDesde: 0, salidaHasta: 127 }),
  ).toEqual([]);
});

test("una entrada de un solo valor es un error", () => {
  expect(
    mapear.validar({ byte: 2, entradaDesde: 64, entradaHasta: 64, salidaDesde: 0, salidaHasta: 127 }),
  ).toEqual([{ clave: "entradaHasta", mensaje: "Tiene que ser distinto de Entrada desde" }]);
});

test("una salida de un solo valor está bien: siempre da ese valor", () => {
  expect(
    mapear.validar({ byte: 2, entradaDesde: 0, entradaHasta: 127, salidaDesde: 64, salidaHasta: 64 }),
  ).toEqual([]);
});
