import { expect, test } from "vitest";

import { error } from "./opciones";

// `error` dice si una lista de elegidas le sirve al parámetro: devuelve el
// texto que se muestra debajo del control, o `null` si está bien. Todos los
// casos usan estos tres canales.

const parametro = {
  clave: "canales",
  etiqueta: "Canales",
  tipo: "opciones" as const,
  inicial: [],
  opciones: [
    { valor: 1, texto: "1" },
    { valor: 2, texto: "2" },
    { valor: 10, texto: "10" },
  ],
};

test("acepta no elegir ninguna", () => {
  expect(error(parametro, [])).toBeNull();
});

test("acepta opciones de la lista", () => {
  expect(error(parametro, [1, 10])).toBeNull();
});

test("marca un valor que no está en la lista", () => {
  expect(error(parametro, [1, 3])).toBe("Tiene que tener solo opciones de la lista, sin repetir");
});

test("marca una opción repetida", () => {
  expect(error(parametro, [1, 1])).toBe("Tiene que tener solo opciones de la lista, sin repetir");
});

test("marca algo que no es una lista", () => {
  // TypeScript no deja escribirlo, pero el valor podría venir de otro lado.
  expect(error(parametro, 1 as unknown as number[])).toBe(
    "Tiene que tener solo opciones de la lista, sin repetir",
  );
});
