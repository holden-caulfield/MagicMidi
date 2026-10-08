import { expect, test } from "vitest";

import { type Modo, ModoNumerico } from "./modo-numerico";

// Cómo se muestra y se lee un número en cada modo, sin la interfaz: el
// controlador se prueba con un campo de prueba, recién dibujado.

/**
 * El modo de un campo que ofrece esos modos (si se omiten, los tres) y que
 * conservó `guardado` en la caja. `avisos` junta lo que el campo avisa para que
 * la caja lo conserve.
 */
function campoCon(modos?: Modo[], guardado?: unknown) {
  const avisos: unknown[] = [];
  const campo = {
    modos,
    estado: guardado,
    addController() {},
    removeController() {},
    requestUpdate() {},
    updateComplete: Promise.resolve(true),
  };
  const modo = new ModoNumerico(campo, (estado) => avisos.push(estado));
  modo.hostUpdate();
  return { modo, avisos };
}

const notaPrimero: Modo[] = ["nota", "decimal", "hexadecimal"];

test("escribe un número en cada modo", () => {
  expect(campoCon().modo.formatear(100)).toBe("100");
  expect(campoCon(undefined, { modo: "nota" }).modo.formatear(100)).toBe("E7");
  expect(campoCon(undefined, { modo: "nota" }).modo.formatear(61)).toBe("C#4");
  expect(campoCon(undefined, { modo: "hexadecimal" }).modo.formatear(100)).toBe("64");
});

test("el hexadecimal va en mayúsculas y con al menos dos cifras", () => {
  const { modo } = campoCon(undefined, { modo: "hexadecimal" });

  expect(modo.formatear(10)).toBe("0A");
  expect(modo.formatear(200)).toBe("C8");
});

test("un negativo se muestra en decimal en cualquier modo", () => {
  expect(campoCon(undefined, { modo: "nota" }).modo.formatear(-3)).toBe("-3");
  expect(campoCon(undefined, { modo: "hexadecimal" }).modo.formatear(-3)).toBe("-3");
});

test("sin nada guardado, o con un modo que no se ofrece, arranca en el primero", () => {
  expect(campoCon().modo.boton?.abreviatura).toBe("DEC");
  expect(campoCon(notaPrimero).modo.boton?.abreviatura).toBe("♪");
  expect(campoCon(undefined, { modo: "binario" }).modo.boton?.abreviatura).toBe("DEC");
  expect(campoCon(["decimal"], { modo: "nota" }).modo.formatear(60)).toBe("60");
});

test("recupera el modo y los bemoles guardados, sin avisar nada", () => {
  const { modo, avisos } = campoCon(undefined, { modo: "nota", bemoles: true });

  expect(modo.formatear(61)).toBe("Db4");
  expect(avisos).toEqual([]);
});

test("unos bemoles guardados que no son sí o no cuentan como sostenidos", () => {
  expect(campoCon(undefined, { modo: "nota", bemoles: "sí" }).modo.formatear(61)).toBe("C#4");
});

test("el botón pasa al modo siguiente, en el orden en que se ofrecen, y lo avisa", () => {
  const { modo, avisos } = campoCon();

  modo.boton?.siguiente();
  expect(modo.boton).toMatchObject({ abreviatura: "♪", nombre: "nota" });
  modo.boton?.siguiente();
  expect(modo.boton?.abreviatura).toBe("HEX");
  modo.boton?.siguiente();
  expect(modo.boton?.abreviatura).toBe("DEC");
  expect(avisos).toEqual([
    { modo: "nota", bemoles: false },
    { modo: "hexadecimal", bemoles: false },
    { modo: "decimal", bemoles: false },
  ]);
});

test("con otro orden, rota en ese orden", () => {
  const { modo } = campoCon(notaPrimero);

  modo.boton?.siguiente();
  expect(modo.boton?.abreviatura).toBe("DEC");
});

test("con un solo modo no hay botón", () => {
  expect(campoCon(["decimal"]).modo.boton).toBeNull();
});

test("lo escrito en el formato del modo actual se queda en ese modo", () => {
  const decimal = campoCon();
  const nota = campoCon(undefined, { modo: "nota" });
  const hexadecimal = campoCon(undefined, { modo: "hexadecimal" });

  expect(decimal.modo.leer("60")).toBe(60);
  expect(nota.modo.leer("D4")).toBe(62);
  expect(hexadecimal.modo.leer("0x3C")).toBe(60);
  expect(hexadecimal.modo.leer("3c")).toBe(60);
  expect([...decimal.avisos, ...nota.avisos, ...hexadecimal.avisos]).toEqual([]);
});

test("una nota en modo decimal pasa a modo nota, y lo avisa", () => {
  const { modo, avisos } = campoCon();

  expect(modo.leer("C4")).toBe(60);
  expect(modo.formatear(60)).toBe("C4");
  expect(avisos).toEqual([{ modo: "nota", bemoles: false }]);
});

test("hexadecimal en modo decimal pasa a modo hexadecimal", () => {
  const { modo } = campoCon();

  expect(modo.leer("3C")).toBe(60);
  expect(modo.formatear(60)).toBe("3C");
});

test("cifras en modo nota se prueban primero como hexadecimal, que sigue a nota", () => {
  const { modo } = campoCon(undefined, { modo: "nota" });

  expect(modo.leer("60")).toBe(96);
  expect(modo.boton?.abreviatura).toBe("HEX");
});

test("el modo actual gana: C4 en hexadecimal es hexadecimal", () => {
  const { modo } = campoCon(undefined, { modo: "hexadecimal" });

  expect(modo.leer("C4")).toBe(196);
  expect(modo.boton?.abreviatura).toBe("HEX");
});

test("una nota que no es hexadecimal, en modo hexadecimal, pasa a nota", () => {
  const { modo } = campoCon(undefined, { modo: "hexadecimal" });

  expect(modo.leer("C#4")).toBe(61);
  expect(modo.boton?.abreviatura).toBe("♪");
});

test("en decimal se lee un entero, con o sin signo y con espacios alrededor", () => {
  const { modo } = campoCon(["decimal"]);

  expect(modo.leer("12")).toBe(12);
  expect(modo.leer("-7")).toBe(-7);
  expect(modo.leer("0")).toBe(0);
  expect(modo.leer(" 5 ")).toBe(5);
});

test("lo que no se lee en ningún modo se rechaza, sin cambiar el modo ni avisar", () => {
  const { modo, avisos } = campoCon(undefined, { modo: "nota" });

  expect(modo.leer("mucho")).toBeNull();
  expect(modo.leer("")).toBeNull();
  expect(modo.leer("   ")).toBeNull();
  expect(modo.leer("2.5")).toBeNull();
  expect(modo.boton?.abreviatura).toBe("♪");
  expect(avisos).toEqual([]);
});

test("con un solo modo, solo se lee ese formato", () => {
  const { modo } = campoCon(["decimal"]);

  expect(modo.leer("C4")).toBeNull();
  expect(modo.leer("0x0C")).toBeNull();
  expect(modo.leer("-12")).toBe(-12);
});

test("una nota escrita con bemol pasa a mostrarse con bemoles", () => {
  const { modo, avisos } = campoCon(undefined, { modo: "nota" });

  expect(modo.leer("Db4")).toBe(61);
  expect(modo.formatear(63)).toBe("Eb4");
  expect(avisos).toEqual([{ modo: "nota", bemoles: true }]);
});

test("con sostenido vuelve a los sostenidos, y una natural no cambia nada", () => {
  const { modo } = campoCon(undefined, { modo: "nota", bemoles: true });

  expect(modo.leer("C4")).toBe(60);
  expect(modo.formatear(61)).toBe("Db4");
  expect(modo.leer("F#4")).toBe(66);
  expect(modo.formatear(61)).toBe("C#4");
});

test("los bemoles se conservan al leer en otro modo y volver", () => {
  const { modo, avisos } = campoCon(undefined, { modo: "nota", bemoles: true });

  expect(modo.leer("3C")).toBe(60);
  expect(avisos).toEqual([{ modo: "hexadecimal", bemoles: true }]);
  modo.boton?.siguiente();
  modo.boton?.siguiente();
  expect(modo.formatear(61)).toBe("Db4");
});
