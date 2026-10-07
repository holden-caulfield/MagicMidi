import { expect, test } from "vitest";

import {
  type DeclaracionNumerica,
  formatear,
  leer,
  type EstadoNumerico,
  estadoRevisado,
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

/** Un estado en ese modo, con sostenidos (o con bemoles). */
const en = (modo: EstadoNumerico["modo"], bemoles = false): EstadoNumerico => ({ modo, bemoles });

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

test("sin estado guardado, o con un modo que no se ofrece, el modo es el primero", () => {
  expect(estadoRevisado(porDefecto, undefined).modo).toBe("decimal");
  expect(estadoRevisado(porDefecto, { modo: "binario" }).modo).toBe("decimal");
  expect(estadoRevisado(notaPrimero, undefined).modo).toBe("nota");
  expect(estadoRevisado(soloDecimal, en("nota")).modo).toBe("decimal");
});

test("con un modo guardado que se ofrece, ese es el modo", () => {
  expect(estadoRevisado(porDefecto, en("hexadecimal")).modo).toBe("hexadecimal");
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
  expect(leer("60", en("decimal"), porDefecto)).toEqual({ numero: 60, estado: en("decimal") });
  expect(leer("D4", en("nota"), porDefecto)).toEqual({ numero: 62, estado: en("nota") });
  expect(leer("0x3C", en("hexadecimal"), porDefecto)).toEqual({ numero: 60, estado: en("hexadecimal") });
  expect(leer("3c", en("hexadecimal"), porDefecto)).toEqual({ numero: 60, estado: en("hexadecimal") });
});

test("una nota en modo decimal pasa a modo nota", () => {
  expect(leer("C4", en("decimal"), porDefecto)).toEqual({ numero: 60, estado: en("nota") });
});

test("hexadecimal en modo decimal pasa a modo hexadecimal", () => {
  expect(leer("3C", en("decimal"), porDefecto)).toEqual({ numero: 60, estado: en("hexadecimal") });
});

test("cifras en modo nota se prueban primero como hexadecimal, que sigue a nota", () => {
  expect(leer("60", en("nota"), porDefecto)).toEqual({ numero: 96, estado: en("hexadecimal") });
});

test("el modo actual gana: C4 en hexadecimal es hexadecimal", () => {
  expect(leer("C4", en("hexadecimal"), porDefecto)).toEqual({ numero: 196, estado: en("hexadecimal") });
});

test("una nota que no es hexadecimal, en modo hexadecimal, pasa a nota", () => {
  expect(leer("C#4", en("hexadecimal"), porDefecto)).toEqual({ numero: 61, estado: en("nota") });
});

test("en decimal se lee un entero, con o sin signo y con espacios alrededor", () => {
  expect(leer("12", en("decimal"), soloDecimal)?.numero).toBe(12);
  expect(leer("-7", en("decimal"), soloDecimal)?.numero).toBe(-7);
  expect(leer("0", en("decimal"), soloDecimal)?.numero).toBe(0);
  expect(leer(" 5 ", en("decimal"), soloDecimal)?.numero).toBe(5);
});

test("en decimal no se lee un campo con solo espacios, ni una palabra", () => {
  expect(leer("   ", en("decimal"), soloDecimal)).toBeNull();
  expect(leer("doce", en("decimal"), soloDecimal)).toBeNull();
});

test("lo que no se lee en ningún modo se rechaza", () => {
  expect(leer("mucho", en("nota"), porDefecto)).toBeNull();
  expect(leer("", en("decimal"), porDefecto)).toBeNull();
  expect(leer("2.5", en("decimal"), porDefecto)).toBeNull();
});

test("con un solo modo, solo se lee ese formato", () => {
  expect(leer("C4", en("decimal"), soloDecimal)).toBeNull();
  expect(leer("0x0C", en("decimal"), soloDecimal)).toBeNull();
  expect(leer("-12", en("decimal"), soloDecimal)).toEqual({ numero: -12, estado: en("decimal") });
});

test("una nota escrita con bemol pasa a mostrarse con bemoles", () => {
  expect(leer("Db4", en("nota"), porDefecto)).toEqual({ numero: 61, estado: en("nota", true) });
  expect(formatear(61, "nota", true)).toBe("Db4");
});

test("con sostenido vuelve a los sostenidos, y una natural no cambia nada", () => {
  expect(leer("F#4", en("nota", true), porDefecto)).toEqual({
    numero: 66,
    estado: en("nota"),
  });
  expect(leer("C4", en("nota", true), porDefecto)).toEqual({
    numero: 60,
    estado: en("nota", true),
  });
});

test("los bemoles se conservan al leer en otro modo", () => {
  expect(leer("3C", en("nota", true), porDefecto)).toEqual({
    numero: 60,
    estado: en("hexadecimal", true),
  });
});

test("un estado guardado conserva sus bemoles", () => {
  expect(estadoRevisado(porDefecto, en("nota", true))).toEqual(en("nota", true));
  expect(estadoRevisado(porDefecto, { modo: "nota", bemoles: "sí" })).toEqual(en("nota"));
});
