import { expect, test } from "vitest";

import { MensajeMidi } from "@/midi/mensaje";
import { erroresDeConfiguracion } from "../validacion";
import fijar from "./fijar";

// Cada `test` prueba una sola cosa: le pasa un mensaje y unos parámetros a
// `procesar`, y con `expect` dice qué mensaje tiene que salir.

test("pone el valor en el tercer byte", () => {
  // Velocidad fija: la nota se tocó con 40 y sale con 100.
  const resultado = fijar.procesar(new MensajeMidi([0x90, 60, 40]), { byte: 2, valor: 100 });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 100]));
});

test("pone el valor en el segundo byte", () => {
  // Siempre la misma nota: la 36, toque la que toque.
  const resultado = fijar.procesar(new MensajeMidi([0x90, 60, 100]), { byte: 1, valor: 36 });

  expect(resultado).toEqual(new MensajeMidi([0x90, 36, 100]));
});

test("si el mensaje no tiene el byte elegido, lo deja igual", () => {
  // Un Cambio de Programa tiene solo dos bytes: no hay tercero para fijar.
  const resultado = fijar.procesar(new MensajeMidi([0xc0, 5]), { byte: 2, valor: 100 });

  expect(resultado).toEqual(new MensajeMidi([0xc0, 5]));
});

// Los casos límite: los extremos del valor.

test("puede poner 0", () => {
  const resultado = fijar.procesar(new MensajeMidi([0xb0, 7, 100]), { byte: 2, valor: 0 });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 7, 0]));
});

test("puede poner 127, y el byte sigue siendo de datos", () => {
  // 127 es 0x7F: el bit alto sigue en 0.
  const resultado = fijar.procesar(new MensajeMidi([0xb0, 7, 100]), { byte: 2, valor: 127 });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 7, 0x7f]));
});

// El canal: cambia solo el canal, nunca el tipo de mensaje.

test("con Canal, manda una nota por el canal elegido", () => {
  // 0x90 es Nota On en el canal 1; 0x99, en el canal 10.
  const resultado = fijar.procesar(new MensajeMidi([0x90, 60, 100]), { byte: 0, valor: 10 });

  expect(resultado).toEqual(new MensajeMidi([0x99, 60, 100]));
});

test("con Canal, no cambia el tipo de mensaje", () => {
  // 0xB3 es Cambio de Control en el canal 4; sigue siendo un Cambio de Control.
  const resultado = fijar.procesar(new MensajeMidi([0xb3, 7, 100]), { byte: 0, valor: 10 });

  expect(resultado).toEqual(new MensajeMidi([0xb9, 7, 100]));
});

test("con Canal, puede poner el 1 y el 16", () => {
  expect(fijar.procesar(new MensajeMidi([0x95, 60, 100]), { byte: 0, valor: 1 })).toEqual(
    new MensajeMidi([0x90, 60, 100]),
  );
  expect(fijar.procesar(new MensajeMidi([0x95, 60, 100]), { byte: 0, valor: 16 })).toEqual(
    new MensajeMidi([0x9f, 60, 100]),
  );
});

test("con Canal, un mensaje de sistema pasa sin cambios", () => {
  // 0xFA (Inicio) no tiene canal.
  const resultado = fijar.procesar(new MensajeMidi([0xfa]), { byte: 0, valor: 10 });

  expect(resultado).toEqual(new MensajeMidi([0xfa]));
});

// `validar` revisa lo que depende de más de un parámetro: con Canal, el valor
// tiene que ser un canal. Devuelve la lista de errores (vacía si está todo bien).
// El segundo argumento escribe un número como se muestra el parámetro: acá, en
// decimal.

const enDecimal = (_clave: string, numero: number) => String(numero);

test("con Canal, un valor de 1 a 16 está bien", () => {
  expect(fijar.validar({ byte: 0, valor: 10 }, enDecimal)).toEqual([]);
});

test("con Canal, el 0 es un error", () => {
  expect(fijar.validar({ byte: 0, valor: 0 }, enDecimal)).toEqual([
    { clave: "valor", mensaje: "Con Canal, tiene que ir de 1 a 16" },
  ]);
});

test("con Canal, el 17 es un error", () => {
  expect(fijar.validar({ byte: 0, valor: 17 }, enDecimal)).toEqual([
    { clave: "valor", mensaje: "Con Canal, tiene que ir de 1 a 16" },
  ]);
});

test("en un byte de datos, el 100 está bien", () => {
  expect(fijar.validar({ byte: 2, valor: 100 }, enDecimal)).toEqual([]);
});

test("con Canal, el error escribe los números como se muestra el valor", () => {
  // La caja guarda que el valor se muestra en hexadecimal.
  expect(erroresDeConfiguracion(fijar, { byte: 0, valor: 100 }, { valor: { modo: "hexadecimal" } })).toEqual(
    [{ clave: "valor", mensaje: "Con Canal, tiene que ir de 01 a 10" }],
  );
});
