import { expect, test } from "vitest";

import {
  type DeclaracionNumerica,
  formatear,
  leer,
  type Presentacion,
  presentacionActual,
  siguienteModo,
  textoDelModo,
} from "./modos";

// Cómo se muestra y se lee un número en cada modo, sin la interfaz.

const porDefecto: DeclaracionNumerica = { minimo: 0, maximo: 127 };
const notaPrimero: DeclaracionNumerica = {
  minimo: 0,
  maximo: 127,
  modos: ["nota", "decimal", "hexadecimal"],
};
const soloDecimal: DeclaracionNumerica = { modos: ["decimal"] };

/** Una presentación en ese modo, con sostenidos (o con bemoles). */
const en = (modo: Presentacion["modo"], bemoles = false): Presentacion => ({ modo, bemoles });

test("formatea en cada modo", () => {
  expect(formatear(100, "decimal")).toBe("100");
  expect(formatear(100, "nota")).toBe("E7");
  expect(formatear(100, "hexadecimal")).toBe("64");
  expect(formatear(61, "nota")).toBe("C#4");
});

test("el hexadecimal va en mayúsculas y con al menos dos cifras", () => {
  expect(formatear(10, "hexadecimal")).toBe("0A");
  expect(formatear(200, "hexadecimal")).toBe("C8");
});

test("un negativo se muestra en decimal en cualquier modo", () => {
  expect(formatear(-3, "nota")).toBe("-3");
  expect(formatear(-3, "hexadecimal")).toBe("-3");
});

test("sin presentación, o con una que no se ofrece, el modo es el primero", () => {
  expect(presentacionActual(porDefecto, undefined).modo).toBe("decimal");
  expect(presentacionActual(porDefecto, { modo: "binario" }).modo).toBe("decimal");
  expect(presentacionActual(notaPrimero, undefined).modo).toBe("nota");
  expect(presentacionActual(soloDecimal, en("nota")).modo).toBe("decimal");
});

test("con una presentación que se ofrece, ese es el modo", () => {
  expect(presentacionActual(porDefecto, en("hexadecimal")).modo).toBe("hexadecimal");
});

test("los modos rotan en el orden declarado", () => {
  expect(siguienteModo(porDefecto, "decimal")).toBe("nota");
  expect(siguienteModo(porDefecto, "nota")).toBe("hexadecimal");
  expect(siguienteModo(porDefecto, "hexadecimal")).toBe("decimal");
  expect(siguienteModo(notaPrimero, "nota")).toBe("decimal");
});

test("con un solo modo no hay botón", () => {
  expect(textoDelModo(soloDecimal, "decimal")).toBeNull();
  expect(textoDelModo(porDefecto, "nota")).toEqual({ abreviatura: "♪", nombre: "nota" });
});

test("lo escrito en el formato del modo actual se queda en ese modo", () => {
  expect(leer("60", en("decimal"), porDefecto)).toEqual({ numero: 60, presentacion: en("decimal") });
  expect(leer("D4", en("nota"), porDefecto)).toEqual({ numero: 62, presentacion: en("nota") });
  expect(leer("0x3C", en("hexadecimal"), porDefecto)).toEqual({ numero: 60, presentacion: en("hexadecimal") });
  expect(leer("3c", en("hexadecimal"), porDefecto)).toEqual({ numero: 60, presentacion: en("hexadecimal") });
});

test("una nota en modo decimal pasa a modo nota", () => {
  expect(leer("C4", en("decimal"), porDefecto)).toEqual({ numero: 60, presentacion: en("nota") });
});

test("hexadecimal en modo decimal pasa a modo hexadecimal", () => {
  expect(leer("3C", en("decimal"), porDefecto)).toEqual({ numero: 60, presentacion: en("hexadecimal") });
});

test("cifras en modo nota se prueban primero como hexadecimal, que sigue a nota", () => {
  expect(leer("60", en("nota"), porDefecto)).toEqual({ numero: 96, presentacion: en("hexadecimal") });
});

test("el modo actual gana: C4 en hexadecimal es hexadecimal", () => {
  expect(leer("C4", en("hexadecimal"), porDefecto)).toEqual({ numero: 196, presentacion: en("hexadecimal") });
});

test("una nota que no es hexadecimal, en modo hexadecimal, pasa a nota", () => {
  expect(leer("C#4", en("hexadecimal"), porDefecto)).toEqual({ numero: 61, presentacion: en("nota") });
});

test("lo que no se lee en ningún modo se rechaza", () => {
  expect(leer("mucho", en("nota"), porDefecto)).toBeNull();
  expect(leer("", en("decimal"), porDefecto)).toBeNull();
  expect(leer("2.5", en("decimal"), porDefecto)).toBeNull();
});

test("con un solo modo, solo se lee ese formato", () => {
  expect(leer("C4", en("decimal"), soloDecimal)).toBeNull();
  expect(leer("0x0C", en("decimal"), soloDecimal)).toBeNull();
  expect(leer("-12", en("decimal"), soloDecimal)).toEqual({ numero: -12, presentacion: en("decimal") });
});

test("una nota escrita con bemol pasa a mostrarse con bemoles", () => {
  expect(leer("Db4", en("nota"), porDefecto)).toEqual({ numero: 61, presentacion: en("nota", true) });
  expect(formatear(61, "nota", true)).toBe("Db4");
});

test("con sostenido vuelve a los sostenidos, y una natural no cambia nada", () => {
  expect(leer("F#4", en("nota", true), porDefecto)).toEqual({
    numero: 66,
    presentacion: en("nota"),
  });
  expect(leer("C4", en("nota", true), porDefecto)).toEqual({
    numero: 60,
    presentacion: en("nota", true),
  });
});

test("los bemoles se conservan al leer en otro modo", () => {
  expect(leer("3C", en("nota", true), porDefecto)).toEqual({
    numero: 60,
    presentacion: en("hexadecimal", true),
  });
});

test("una presentación guardada conserva sus bemoles", () => {
  expect(presentacionActual(porDefecto, en("nota", true))).toEqual(en("nota", true));
  expect(presentacionActual(porDefecto, { modo: "nota", bemoles: "sí" })).toEqual(en("nota"));
});
