import { expect, test } from "vitest";

import { error, formatear, interpretar, limitar } from "./entero";
import type { DeclaracionNumerica, Presentacion } from "./modos";

// Cada `test` prueba una sola cosa: le pasa a `interpretar` lo que se escribió
// en el campo, y con `expect` dice qué número tiene que quedar (`null` si se
// rechaza, y la caja conserva el que tenía). Estos primeros usan un parámetro
// que solo ofrece decimal, como el desplazamiento.

const decimal: DeclaracionNumerica = { modos: ["decimal"] };

/** Una presentación en ese modo, con sostenidos (o con bemoles). */
const en = (modo: Presentacion["modo"], bemoles = false): Presentacion => ({ modo, bemoles });

/** El número que resulta de lo escrito en modo decimal, o `null`. */
function numeroDe(texto: string) {
  return interpretar(texto, decimal, en("decimal"))?.numero ?? null;
}

test("acepta un entero positivo", () => {
  expect(numeroDe("12")).toBe(12);
});

test("acepta un entero negativo", () => {
  expect(numeroDe("-7")).toBe(-7);
});

test("acepta el cero", () => {
  expect(numeroDe("0")).toBe(0);
});

test("acepta espacios alrededor del número", () => {
  expect(numeroDe(" 5 ")).toBe(5);
});

test("rechaza un número con decimales", () => {
  expect(numeroDe("2.5")).toBeNull();
});

test("rechaza el campo vacío", () => {
  expect(numeroDe("")).toBeNull();
});

test("rechaza un campo con solo espacios", () => {
  expect(numeroDe("   ")).toBeNull();
});

test("rechaza un texto que no es un número", () => {
  expect(numeroDe("doce")).toBeNull();
});

// Con los tres modos, lo escrito en otro formato también se lee, y dice en qué
// modo se leyó: el campo pasa a ese modo.

const byte: DeclaracionNumerica = { minimo: 0, maximo: 127 };

test("con los tres modos, una nota escrita en decimal se lee como nota", () => {
  expect(interpretar("C4", byte, en("decimal"))).toEqual({ numero: 60, presentacion: en("nota") });
});

test("con un solo modo, una nota no se lee", () => {
  expect(interpretar("C4", decimal, en("decimal"))).toBeNull();
});

// `limitar` deja un paso de las flechas dentro del mínimo y el máximo.

test("un paso no pasa del máximo ni del mínimo", () => {
  expect(limitar(byte, 130)).toBe(127);
  expect(limitar(byte, -1)).toBe(0);
  expect(limitar(decimal, -300)).toBe(-300);
});

// `error` dice si un número ya interpretado le sirve al parámetro: devuelve el
// texto que se muestra debajo del campo, o `null` si está bien. A diferencia
// de lo que rechaza `interpretar`, un número con error igual se guarda.

test("sin rango, acepta cualquier entero", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 0 };

  expect(error(parametro, 300)).toBeNull();
  expect(error(parametro, -300)).toBeNull();
});

test("con rango, acepta los dos extremos", () => {
  const parametro = {
    clave: "x",
    etiqueta: "X",
    tipo: "entero" as const,
    inicial: 0,
    minimo: 0,
    maximo: 127,
  };

  expect(error(parametro, 0)).toBeNull();
  expect(error(parametro, 127)).toBeNull();
});

test("con rango, marca un número por debajo del mínimo", () => {
  const parametro = {
    clave: "x",
    etiqueta: "X",
    tipo: "entero" as const,
    inicial: 0,
    minimo: 0,
    maximo: 127,
  };

  expect(error(parametro, -1)).toBe("Tiene que ir de 0 a 127");
});

test("con rango, marca un número por encima del máximo", () => {
  const parametro = {
    clave: "x",
    etiqueta: "X",
    tipo: "entero" as const,
    inicial: 0,
    minimo: 0,
    maximo: 127,
  };

  expect(error(parametro, 128)).toBe("Tiene que ir de 0 a 127");
});

test("con solo mínimo, marca lo que queda por debajo", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 1, minimo: 1 };

  expect(error(parametro, 0)).toBe("Tiene que ser 1 o más");
  expect(error(parametro, 1000)).toBeNull();
});

test("con solo máximo, marca lo que queda por encima", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 0, maximo: 16 };

  expect(error(parametro, 17)).toBe("Tiene que ser 16 o menos");
  expect(error(parametro, -1000)).toBeNull();
});

test("marca un número con decimales", () => {
  const parametro = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 0 };

  expect(error(parametro, 2.5)).toBe("Tiene que ser un número entero");
});

// Los números del error van en el modo en que se muestra el parámetro.

test("el error del rango habla en el modo del parámetro", () => {
  const parametro = {
    clave: "x",
    etiqueta: "X",
    tipo: "entero" as const,
    inicial: 0,
    minimo: 0,
    maximo: 127,
  };

  expect(error(parametro, 200, en("nota"))).toBe("Tiene que ir de C-1 a G9");
  expect(error(parametro, 200, en("hexadecimal"))).toBe("Tiene que ir de 00 a 7F");
  expect(error(parametro, 200, undefined)).toBe("Tiene que ir de 0 a 127");
});

test("con solo mínimo o solo máximo, también en el modo", () => {
  const conMinimo = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 1, minimo: 1 };
  const conMaximo = { clave: "x", etiqueta: "X", tipo: "entero" as const, inicial: 0, maximo: 16 };

  expect(error({ ...conMinimo, modos: ["hexadecimal"] }, 0)).toBe("Tiene que ser 01 o más");
  expect(error({ ...conMaximo, modos: ["decimal", "hexadecimal"] }, 17, en("hexadecimal"))).toBe(
    "Tiene que ser 10 o menos",
  );
});

test("una nota con bemol se muestra con bemol", () => {
  const parametro = {
    clave: "x",
    etiqueta: "X",
    tipo: "entero" as const,
    inicial: 0,
    minimo: 0,
    maximo: 127,
  };

  expect(interpretar("Db4", parametro, en("nota"))).toEqual({
    numero: 61,
    presentacion: en("nota", true),
  });
  expect(formatear(parametro, 63, en("nota", true))).toBe("Eb4");
  expect(formatear(parametro, 63, en("nota"))).toBe("D#4");
});
