import { expect, test } from "vitest";

import { formato } from "@/formato";
import { MensajeMidi } from "@/midi/mensaje";
import mapear from "./mapear";

// Cada `test` prueba una sola cosa: le pasa un mensaje y unos parámetros a
// `procesar`, y con `expect` dice qué mensaje tiene que salir. El mapa es una
// lista de pares: si el byte elegido vale lo mismo que la entrada de un par,
// pasa a valer su salida.

test("lleva los pads de un controlador al mapa de batería GM", () => {
  // 0x99 es Nota On en el canal 10, el de la batería. Los pads mandan C3, C#3
  // y D3 (48, 49 y 50), y el mapa GM los quiere en C2 (bombo), D2
  // (redoblante) y F#2 (hi-hat cerrado): 36, 38 y 42.
  const parametros = {
    byte: 1,
    mapa: [
      { entrada: 48, salida: 36 },
      { entrada: 49, salida: 38 },
      { entrada: 50, salida: 42 },
    ],
  };

  expect(mapear.procesar(new MensajeMidi([0x99, 48, 100]), parametros)).toEqual(
    new MensajeMidi([0x99, 36, 100]),
  );
  expect(mapear.procesar(new MensajeMidi([0x99, 49, 80]), parametros)).toEqual(
    new MensajeMidi([0x99, 38, 80]),
  );
  expect(mapear.procesar(new MensajeMidi([0x99, 50, 127]), parametros)).toEqual(
    new MensajeMidi([0x99, 42, 127]),
  );
});

test("con Canal, cambia el canal sin cambiar el tipo de mensaje", () => {
  // 0x90 es Nota On en el canal 1; 0x99, en el 10; 0x91, en el 2.
  const parametros = { byte: 0, mapa: [{ entrada: 1, salida: 10 }] };

  expect(mapear.procesar(new MensajeMidi([0x90, 60, 100]), parametros)).toEqual(
    new MensajeMidi([0x99, 60, 100]),
  );
  expect(mapear.procesar(new MensajeMidi([0x91, 60, 100]), parametros)).toEqual(
    new MensajeMidi([0x91, 60, 100]),
  );
});

test("cada valor se cambia una sola vez, así se pueden intercambiar dos", () => {
  // C2 (36) va a D2 (38), y D2 a C2. Si la salida se volviera a buscar como
  // entrada, C2 iría a D2 y de vuelta a C2.
  const parametros = {
    byte: 1,
    mapa: [
      { entrada: 36, salida: 38 },
      { entrada: 38, salida: 36 },
    ],
  };

  expect(mapear.procesar(new MensajeMidi([0x99, 36, 100]), parametros)).toEqual(
    new MensajeMidi([0x99, 38, 100]),
  );
  expect(mapear.procesar(new MensajeMidi([0x99, 38, 100]), parametros)).toEqual(
    new MensajeMidi([0x99, 36, 100]),
  );
});

test("puede mapear el tercer byte", () => {
  const resultado = mapear.procesar(new MensajeMidi([0xb0, 7, 64]), {
    byte: 2,
    mapa: [{ entrada: 64, salida: 0 }],
  });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 7, 0]));
});

test("un valor que no está en el mapa pasa sin cambios", () => {
  // C4 (60) no está en el mapa: solo C3 (48) cambia.
  const resultado = mapear.procesar(new MensajeMidi([0x90, 60, 100]), {
    byte: 1,
    mapa: [{ entrada: 48, salida: 36 }],
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 100]));
});

test("con el mapa vacío, nada cambia", () => {
  const resultado = mapear.procesar(new MensajeMidi([0x90, 60, 100]), { byte: 1, mapa: [] });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 100]));
});

test("si el mensaje no tiene el byte elegido, lo deja igual", () => {
  // Una Presión de Canal tiene solo dos bytes: no hay tercero para mapear.
  const resultado = mapear.procesar(new MensajeMidi([0xd0, 64]), {
    byte: 2,
    mapa: [{ entrada: 64, salida: 0 }],
  });

  expect(resultado).toEqual(new MensajeMidi([0xd0, 64]));
});

test("con Canal, un mensaje de sistema pasa sin cambios", () => {
  // 0xF2 es Posición de Canción: un mensaje de sistema, sin canal.
  const resultado = mapear.procesar(new MensajeMidi([0xf2, 0x00, 0x10]), {
    byte: 0,
    mapa: [{ entrada: 1, salida: 10 }],
  });

  expect(resultado).toEqual(new MensajeMidi([0xf2, 0x00, 0x10]));
});

// `validar` revisa lo que depende de más de un parámetro: con Canal, cada
// entrada y cada salida tiene que ser un canal. El error nombra el primer
// valor que no lo es, y los números van marcados con `formato`, porque los
// escribe el campo del mapa, como los muestra (en nota, por ejemplo).

test("con Canal, valores de 1 a 16 están bien", () => {
  expect(mapear.validar({ byte: 0, mapa: [{ entrada: 1, salida: 16 }] })).toEqual([]);
});

test("con Canal, el 0 es un error", () => {
  expect(mapear.validar({ byte: 0, mapa: [{ entrada: 0, salida: 10 }] })).toEqual([
    {
      clave: "mapa",
      mensaje: formato`Con Canal, los valores tienen que ir de ${1} a ${16}, y hay un ${0}`,
    },
  ]);
});

test("con Canal, el 17 es un error", () => {
  expect(mapear.validar({ byte: 0, mapa: [{ entrada: 1, salida: 17 }] })).toEqual([
    {
      clave: "mapa",
      mensaje: formato`Con Canal, los valores tienen que ir de ${1} a ${16}, y hay un ${17}`,
    },
  ]);
});

test("con Canal, el error nombra el primer valor que no es un canal", () => {
  const parametros = {
    byte: 0,
    mapa: [
      { entrada: 1, salida: 10 },
      { entrada: 20, salida: 0 },
    ],
  };

  expect(mapear.validar(parametros)).toEqual([
    {
      clave: "mapa",
      mensaje: formato`Con Canal, los valores tienen que ir de ${1} a ${16}, y hay un ${20}`,
    },
  ]);
});

test("en un byte de datos, el 0 está bien", () => {
  expect(mapear.validar({ byte: 1, mapa: [{ entrada: 0, salida: 100 }] })).toEqual([]);
});
