import { expect, test } from "vitest";

import { opciones } from "./opciones";

// `validar` dice si una lista de elegidas le sirve al parámetro: devuelve el
// texto que se muestra debajo del control, o `null` si está bien. Todos los
// casos usan estos tres canales. `<number>` dice que los valores son números:
// sin eso, TypeScript solo aceptaría el 1, el 2 y el 10, y no se podría probar
// uno que no está en la lista.

const parametro = opciones<number>({
  clave: "canales",
  etiqueta: "Canales",
  inicial: [],
  opciones: [
    { valor: 1, texto: "1" },
    { valor: 2, texto: "2" },
    { valor: 10, texto: "10" },
  ],
});

test("acepta no elegir ninguna", () => {
  expect(parametro.validar([])).toBeNull();
});

test("acepta opciones de la lista", () => {
  expect(parametro.validar([1, 10])).toBeNull();
});

test("marca un valor que no está en la lista", () => {
  expect(parametro.validar([1, 3])).toBe("Tiene que tener solo opciones de la lista, sin repetir");
});

test("marca una opción repetida", () => {
  expect(parametro.validar([1, 1])).toBe("Tiene que tener solo opciones de la lista, sin repetir");
});

test("marca algo que no es una lista", () => {
  // TypeScript no deja escribirlo, pero el valor podría venir de otro lado.
  expect(parametro.validar(1 as unknown as number[])).toBe(
    "Tiene que tener solo opciones de la lista, sin repetir",
  );
});
