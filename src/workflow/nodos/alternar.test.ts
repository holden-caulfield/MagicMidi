import { expect, test } from "vitest";

import { formato } from "@/formato";
import { MensajeMidi } from "@/midi/mensaje";
import alternar from "./alternar";

// Cada `test` prueba una sola cosa. Alternar recuerda por dónde va, así que
// cada `test` le pasa a `procesar` varios mensajes seguidos, con los mismos
// parámetros y la misma memoria: una memoria nueva (`new Map()`) es una caja
// que todavía no recibió nada.

test("cada mensaje toma el siguiente valor, y después del último vuelve al primero", () => {
  // Un pedal momentáneo como interruptor: una pisada lo baja, la otra lo sube.
  const parametros = { byte: 2, valores: [127, 0], cicloPor: [] };
  const memoria = new Map();

  const primero = alternar.procesar(new MensajeMidi([0xb0, 64, 127]), parametros, memoria);
  const segundo = alternar.procesar(new MensajeMidi([0xb0, 64, 127]), parametros, memoria);
  const tercero = alternar.procesar(new MensajeMidi([0xb0, 64, 127]), parametros, memoria);

  expect(primero).toEqual(new MensajeMidi([0xb0, 64, 127]));
  expect(segundo).toEqual(new MensajeMidi([0xb0, 64, 0]));
  expect(tercero).toEqual(new MensajeMidi([0xb0, 64, 127]));
});

test("con Canal, reparte las notas entre canales", () => {
  // 0x90 es Nota On en el canal 1; 0x91, en el 2; 0x92, en el 3.
  const parametros = { byte: 0, valores: [1, 2, 3], cicloPor: [] };
  const memoria = new Map();

  const primera = alternar.procesar(new MensajeMidi([0x90, 60, 100]), parametros, memoria);
  const segunda = alternar.procesar(new MensajeMidi([0x90, 62, 100]), parametros, memoria);
  const tercera = alternar.procesar(new MensajeMidi([0x90, 64, 100]), parametros, memoria);
  const cuarta = alternar.procesar(new MensajeMidi([0x90, 65, 100]), parametros, memoria);

  expect(primera).toEqual(new MensajeMidi([0x90, 60, 100]));
  expect(segunda).toEqual(new MensajeMidi([0x91, 62, 100]));
  expect(tercera).toEqual(new MensajeMidi([0x92, 64, 100]));
  expect(cuarta).toEqual(new MensajeMidi([0x90, 65, 100]));
});

test("recuerda la posición, no el valor: recorre los valores repetidos", () => {
  // Un acento cada cuatro notas. Si recordara el valor, después del primer 80
  // no sabría cuál de los tres le toca, y se quedaría en el 80.
  const parametros = { byte: 2, valores: [127, 80, 80, 80], cicloPor: [] };
  const memoria = new Map();

  const resultados = [
    alternar.procesar(new MensajeMidi([0x90, 60, 100]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0x90, 60, 100]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0x90, 60, 100]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0x90, 60, 100]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0x90, 60, 100]), parametros, memoria),
  ];

  expect(resultados).toEqual([
    new MensajeMidi([0x90, 60, 127]),
    new MensajeMidi([0x90, 60, 80]),
    new MensajeMidi([0x90, 60, 80]),
    new MensajeMidi([0x90, 60, 80]),
    new MensajeMidi([0x90, 60, 127]),
  ]);
});

test("si la lista se acorta y su posición queda afuera, vuelve al primero", () => {
  const memoria = new Map();
  const antes = { byte: 2, valores: [127, 80, 80, 80], cicloPor: [] };
  alternar.procesar(new MensajeMidi([0x90, 60, 100]), antes, memoria);
  alternar.procesar(new MensajeMidi([0x90, 60, 100]), antes, memoria);
  alternar.procesar(new MensajeMidi([0x90, 60, 100]), antes, memoria);

  // Le tocaba el cuarto valor, que ya no está.
  const despues = { byte: 2, valores: [127, 80], cicloPor: [] };
  const resultado = alternar.procesar(new MensajeMidi([0x90, 60, 100]), despues, memoria);

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 127]));
});

test("si la lista cambia sin acortarse, sigue desde la misma posición", () => {
  const memoria = new Map();
  alternar.procesar(
    new MensajeMidi([0x90, 60, 100]),
    { byte: 0, valores: [1, 2, 3], cicloPor: [] },
    memoria,
  );

  // Le toca el segundo valor de la lista nueva: el canal 6, que va como 5.
  const resultado = alternar.procesar(
    new MensajeMidi([0x90, 60, 100]),
    { byte: 0, valores: [5, 6, 7], cicloPor: [] },
    memoria,
  );

  expect(resultado).toEqual(new MensajeMidi([0x95, 60, 100]));
});

// "Un ciclo por" separa los ciclos: uno por cada valor de lo elegido, tal
// como llega el mensaje.

test("un ciclo por Datos 1: cada pedal de una pedalera es un interruptor aparte", () => {
  // El CC 64 y el CC 66 llevan cada uno su ciclo.
  const parametros = { byte: 2, valores: [127, 0], cicloPor: [1] };
  const memoria = new Map();

  const resultados = [
    alternar.procesar(new MensajeMidi([0xb0, 64, 127]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0xb0, 66, 127]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0xb0, 64, 127]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0xb0, 66, 127]), parametros, memoria),
  ];

  expect(resultados).toEqual([
    new MensajeMidi([0xb0, 64, 127]),
    new MensajeMidi([0xb0, 66, 127]),
    new MensajeMidi([0xb0, 64, 0]),
    new MensajeMidi([0xb0, 66, 0]),
  ]);
});

test("un ciclo por Canal se elige con el canal con que llega, no con el que sale", () => {
  // Dos teclados, en los canales 1 y 2, se reparten cada uno entre los
  // canales 3 y 4.
  const parametros = { byte: 0, valores: [3, 4], cicloPor: [0] };
  const memoria = new Map();

  const resultados = [
    alternar.procesar(new MensajeMidi([0x90, 60, 100]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0x91, 60, 100]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0x90, 62, 100]), parametros, memoria),
  ];

  expect(resultados).toEqual([
    new MensajeMidi([0x92, 60, 100]),
    new MensajeMidi([0x92, 60, 100]),
    new MensajeMidi([0x93, 62, 100]),
  ]);
});

test("con varias opciones, hay un ciclo por cada combinación", () => {
  // El CC 64 del canal 1 y el CC 64 del canal 2 son ciclos distintos.
  const parametros = { byte: 2, valores: [127, 0], cicloPor: [0, 1] };
  const memoria = new Map();

  const resultados = [
    alternar.procesar(new MensajeMidi([0xb0, 64, 127]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0xb1, 64, 127]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0xb0, 64, 127]), parametros, memoria),
  ];

  expect(resultados).toEqual([
    new MensajeMidi([0xb0, 64, 127]),
    new MensajeMidi([0xb1, 64, 127]),
    new MensajeMidi([0xb0, 64, 0]),
  ]);
});

test("los mensajes a los que les falta lo mismo comparten el ciclo", () => {
  // Un Cambio de Programa no tiene datos 2: los dos van al ciclo "sin datos
  // 2", y el Cambio de Control, que sí lo tiene, arranca el suyo.
  const parametros = { byte: 1, valores: [10, 20], cicloPor: [2] };
  const memoria = new Map();

  const resultados = [
    alternar.procesar(new MensajeMidi([0xc0, 5]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0xc0, 7]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0xb0, 7, 100]), parametros, memoria),
  ];

  expect(resultados).toEqual([
    new MensajeMidi([0xc0, 10]),
    new MensajeMidi([0xc0, 20]),
    new MensajeMidi([0xb0, 10, 100]),
  ]);
});

// Un mensaje que no tiene el byte elegido pasa igual, y no avanza el ciclo.

test("si el mensaje no tiene el byte elegido, lo deja igual y no avanza", () => {
  // Un Cambio de Programa tiene solo dos bytes: no hay tercero para cambiar.
  // El Cambio de Control que sigue recibe el primer valor.
  const parametros = { byte: 2, valores: [127, 0], cicloPor: [] };
  const memoria = new Map();

  const programa = alternar.procesar(new MensajeMidi([0xc0, 5]), parametros, memoria);
  const control = alternar.procesar(new MensajeMidi([0xb0, 64, 100]), parametros, memoria);

  expect(programa).toEqual(new MensajeMidi([0xc0, 5]));
  expect(control).toEqual(new MensajeMidi([0xb0, 64, 127]));
});

test("con Canal, un mensaje de sistema pasa sin cambios y no avanza", () => {
  // 0xFA (Inicio) no tiene canal.
  const parametros = { byte: 0, valores: [1, 2], cicloPor: [] };
  const memoria = new Map();

  const resultados = [
    alternar.procesar(new MensajeMidi([0x90, 60, 100]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0xfa]), parametros, memoria),
    alternar.procesar(new MensajeMidi([0x90, 62, 100]), parametros, memoria),
  ];

  expect(resultados).toEqual([
    new MensajeMidi([0x90, 60, 100]),
    new MensajeMidi([0xfa]),
    new MensajeMidi([0x91, 62, 100]),
  ]);
});

// `validar` revisa lo que depende de más de un parámetro: con Canal, cada
// valor tiene que ser un canal. El error nombra el primero que no lo es, y los
// números van marcados con `formato`, porque los escribe el campo de los
// valores, como los muestra (en hexadecimal, por ejemplo, "01" y "10").

test("con Canal, valores de 1 a 16 están bien", () => {
  expect(alternar.validar({ byte: 0, valores: [1, 16], cicloPor: [] })).toEqual([]);
});

test("con Canal, el 0 es un error", () => {
  expect(alternar.validar({ byte: 0, valores: [1, 0], cicloPor: [] })).toEqual([
    {
      clave: "valores",
      mensaje: formato`Con Canal, los valores tienen que ir de ${1} a ${16}, y hay un ${0}`,
    },
  ]);
});

test("con Canal, el error nombra el primer valor que no es un canal", () => {
  expect(alternar.validar({ byte: 0, valores: [127, 17, 0], cicloPor: [] })).toEqual([
    {
      clave: "valores",
      mensaje: formato`Con Canal, los valores tienen que ir de ${1} a ${16}, y hay un ${127}`,
    },
  ]);
});

test("con Canal, el 17 es un error", () => {
  expect(alternar.validar({ byte: 0, valores: [17], cicloPor: [] })).toEqual([
    {
      clave: "valores",
      mensaje: formato`Con Canal, los valores tienen que ir de ${1} a ${16}, y hay un ${17}`,
    },
  ]);
});

test("en un byte de datos, el 127 está bien", () => {
  expect(alternar.validar({ byte: 2, valores: [127, 0], cicloPor: [] })).toEqual([]);
});
