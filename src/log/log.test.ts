import { beforeEach, expect, test } from "vitest";

import { type EventoMidi, MensajeMidi } from "@/midi/mensaje";
import { agregarAlLog, clasificarSalidas, entradasDelLog, limpiarLog, suscribirAlLog } from "./log";

function m(...bytes: number[]): MensajeMidi {
  return new MensajeMidi(bytes);
}

test("si no salió nada, está descartado", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [])).toEqual({ tipo: "descartado" });
});

test("si salió solo el mismo mensaje, pasó sin cambios", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 60, 100)])).toEqual({
    tipo: "sin-cambios",
  });
});

test("si salió un mensaje distinto, está transformado", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 64, 100)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 64, 100)],
  });
});

test("se comparan los bytes, no el significado", () => {
  // Los dos son un Nota Off, pero una caja que convierte uno en el otro sí
  // cambió el mensaje.
  expect(clasificarSalidas(m(0x90, 60, 0), [m(0x80, 60, 64)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x80, 60, 64)],
  });
});

test("un mensaje con otra cantidad de bytes es distinto", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 60)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 60)],
  });
});

test("varios mensajes distintos van en el orden en que salieron", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 64, 100), m(0x90, 67, 100)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 64, 100), m(0x90, 67, 100)],
  });
});

test("un acorde que incluye la nota original se muestra con todas sus notas", () => {
  expect(
    clasificarSalidas(m(0x90, 60, 100), [m(0x90, 60, 100), m(0x90, 64, 100), m(0x90, 67, 100)]),
  ).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 60, 100), m(0x90, 64, 100), m(0x90, 67, 100)],
  });
});

test("si salió igual dos veces, se muestran las dos", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 60, 100), m(0x90, 60, 100)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 60, 100), m(0x90, 60, 100)],
  });
});

test("el mismo mensaje distinto dos veces se muestra dos veces", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [m(0x90, 64, 100), m(0x90, 64, 100)])).toEqual({
    tipo: "transformado",
    salidas: [m(0x90, 64, 100), m(0x90, 64, 100)],
  });
});

test("si una caja falló, es un error con su texto", () => {
  expect(clasificarSalidas(m(0x90, 60, 100), [], 'La caja "Desplazar" falló: ups')).toEqual({
    tipo: "error",
    texto: 'La caja "Desplazar" falló: ups',
  });
});

function evento(marca: number, ...datos: number[]): EventoMidi {
  return { puerto: "entrada", marca_temporal_ms: marca, datos };
}

beforeEach(() => {
  limpiarLog();
});

test("cada entrada guarda el mensaje y lo que pasó con él", () => {
  agregarAlLog(evento(1000, 0x90, 60, 100), [], null);

  const [entrada] = entradasDelLog();
  expect(entrada.marcaTemporalMs).toBe(1000);
  expect(entrada.mensaje).toEqual(m(0x90, 60, 100));
  expect(entrada.resultado).toEqual({ tipo: "descartado" });
});

test("la entrada más nueva va primero", () => {
  agregarAlLog(evento(1, 0x90, 60, 100), [], null);
  agregarAlLog(evento(2, 0x80, 60, 0), [], null);

  expect(entradasDelLog().map((entrada) => entrada.marcaTemporalMs)).toEqual([2, 1]);
});

test("conserva las últimas 500 entradas y descarta las más viejas", () => {
  for (let marca = 1; marca <= 501; marca++) {
    agregarAlLog(evento(marca, 0x90, 60, 100), [], null);
  }

  const entradas = entradasDelLog();
  expect(entradas).toHaveLength(500);
  expect(entradas[0].marcaTemporalMs).toBe(501);
  expect(entradas[499].marcaTemporalMs).toBe(2);
});

test("cada entrada tiene un id distinto", () => {
  agregarAlLog(evento(1, 0x90, 60, 100), [], null);
  agregarAlLog(evento(1, 0x90, 60, 100), [], null);

  const [primera, segunda] = entradasDelLog();
  expect(primera.id).not.toBe(segunda.id);
});

test("limpiar vacía el log", () => {
  agregarAlLog(evento(1, 0x90, 60, 100), [], null);

  limpiarLog();

  expect(entradasDelLog()).toHaveLength(0);
});

test("avisa a quien se suscribió, hasta que se desuscribe", () => {
  let avisos = 0;
  const desuscribir = suscribirAlLog(() => avisos++);

  agregarAlLog(evento(1, 0x90, 60, 100), [], null);
  limpiarLog();
  desuscribir();
  agregarAlLog(evento(2, 0x90, 60, 100), [], null);

  expect(avisos).toBe(2);
});
