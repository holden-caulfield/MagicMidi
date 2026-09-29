import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { actualizar, type Flujo } from "../estado";
import { TIPOS_DE_NODO } from "./catalogo";
import { procesarMensaje } from "./ejecutar";
import { MensajeMidi } from "./tipos";

// `procesarMensaje` no envía nada: devuelve lo que tiene que salir por el
// puerto, así que no hace falta ningún backend falso.

function flujo(nodos: Flujo["nodos"], conexiones: Flujo["conexiones"]): Flujo {
  return {
    nodos: [{ id: "trigger", tipo: "trigger", parametros: {} }, ...nodos],
    conexiones,
  };
}

function subirNota(id: string, cuanto: number): Flujo["nodos"][number] {
  return {
    id,
    tipo: "desplazar",
    parametros: { byte: 1, desplazamiento: cuanto, overflow: false },
  };
}

function m(...bytes: number[]): MensajeMidi {
  return new MensajeMidi(bytes);
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("el flujo por defecto emite el mensaje tal cual", () => {
  actualizar({
    flujo: flujo(
      [{ id: "emitir", tipo: "emitir", parametros: {} }],
      [{ desde: "trigger", hacia: "emitir" }],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({ salidas: [m(0x90, 60, 100)], error: null });
});

test("con solo el trigger, el mensaje sale tal cual", () => {
  actualizar({ flujo: flujo([], []) });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({ salidas: [m(0x90, 60, 100)], error: null });
});

test("sin una caja de fin al final, el mensaje sale tal cual", () => {
  actualizar({
    flujo: flujo([subirNota("suelta", 12)], [{ desde: "trigger", hacia: "suelta" }]),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({ salidas: [m(0x90, 60, 100)], error: null });
});

test("llegar a una caja de fin cancela el original", () => {
  actualizar({
    flujo: flujo(
      [subirNota("arriba", 4), { id: "emitir", tipo: "emitir", parametros: {} }],
      [
        { desde: "trigger", hacia: "arriba" },
        { desde: "arriba", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([m(0x90, 64, 100)]);
});

test("llegar a Descartar cancela el original sin emitir nada", () => {
  actualizar({
    flujo: flujo(
      [{ id: "descartar", tipo: "descartar", parametros: {} }],
      [{ desde: "trigger", hacia: "descartar" }],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({ salidas: [], error: null });
});

test("Emitir y Descartar en ramas distintas: sale una sola vez", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "emitir", tipo: "emitir", parametros: {} },
        { id: "descartar", tipo: "descartar", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "emitir" },
        { desde: "trigger", hacia: "descartar" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([m(0x90, 60, 100)]);
});

test("las ramas en paralelo reciben cada una su propia copia", () => {
  actualizar({
    flujo: flujo(
      [
        subirNota("arriba", 12),
        subirNota("abajo", -12),
        { id: "emitir-arriba", tipo: "emitir", parametros: {} },
        { id: "emitir-abajo", tipo: "emitir", parametros: {} },
        { id: "emitir-original", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "arriba" },
        { desde: "trigger", hacia: "abajo" },
        { desde: "trigger", hacia: "emitir-original" },
        { desde: "arriba", hacia: "emitir-arriba" },
        { desde: "abajo", hacia: "emitir-abajo" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([
    m(0x90, 72, 100),
    m(0x90, 48, 100),
    m(0x90, 60, 100),
  ]);
});

test("el original que se reenvía no tiene los cambios de una rama", () => {
  actualizar({
    flujo: flujo([subirNota("suelta", 12)], [{ desde: "trigger", hacia: "suelta" }]),
  });
  const entrada = m(0x90, 60, 100);

  expect(procesarMensaje(entrada).salidas).toEqual([m(0x90, 60, 100)]);
  expect(entrada).toEqual(m(0x90, 60, 100));
});

test("una caja que descarta el mensaje corta solo su rama y el original sale", () => {
  vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar").mockReturnValue(null);
  actualizar({
    flujo: flujo(
      [subirNota("descarta", 12), { id: "emitir-descarta", tipo: "emitir", parametros: {} }],
      [
        { desde: "trigger", hacia: "descarta" },
        { desde: "descarta", hacia: "emitir-descarta" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({ salidas: [m(0x90, 60, 100)], error: null });
});

test("una caja que falla hace que no salga nada, tampoco por las otras ramas", () => {
  vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar").mockImplementation(() => {
    throw new Error("falla a propósito");
  });
  actualizar({
    flujo: flujo(
      [
        subirNota("rota", 12),
        { id: "emitir-rota", tipo: "emitir", parametros: {} },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "rota" },
        { desde: "rota", hacia: "emitir-rota" },
        { desde: "trigger", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [],
    error: 'La caja "Desplazar" falló: falla a propósito',
  });
  expect(console.error).toHaveBeenCalled();
});

test("un error descarta lo que un Emitir ya había devuelto", () => {
  vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar").mockImplementation(() => {
    throw new Error("falla a propósito");
  });
  actualizar({
    flujo: flujo(
      [{ id: "emitir", tipo: "emitir", parametros: {} }, subirNota("rota", 12)],
      [
        { desde: "trigger", hacia: "emitir" },
        { desde: "trigger", hacia: "rota" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([]);
});

test("un error sin ninguna caja de fin tampoco deja salir el original", () => {
  vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar").mockImplementation(() => {
    throw new Error("falla a propósito");
  });
  actualizar({
    flujo: flujo([subirNota("rota", 12)], [{ desde: "trigger", hacia: "rota" }]),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([]);
});

test("después de un error, ninguna caja vuelve a procesar ese mensaje", () => {
  const procesar = vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar").mockImplementation(() => {
    throw new Error("falla a propósito");
  });
  actualizar({
    flujo: flujo(
      [subirNota("primera", 12), subirNota("segunda", 12)],
      [
        { desde: "trigger", hacia: "primera" },
        { desde: "trigger", hacia: "segunda" },
      ],
    ),
  });

  procesarMensaje(m(0x90, 60, 100));

  expect(procesar).toHaveBeenCalledTimes(1);
});

test("si lo que se lanza no es un Error, el texto llega igual", () => {
  vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar").mockImplementation(() => {
    throw "algo salió mal";
  });
  actualizar({
    flujo: flujo([subirNota("rota", 12)], [{ desde: "trigger", hacia: "rota" }]),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).error).toBe(
    'La caja "Desplazar" falló: algo salió mal',
  );
});

test("un mensaje inválido es un error y no sale nada", () => {
  vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar").mockReturnValue(m(0x90, 300, 100));
  actualizar({
    flujo: flujo(
      [
        subirNota("invalida", 12),
        { id: "emitir-invalida", tipo: "emitir", parametros: {} },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "invalida" },
        { desde: "invalida", hacia: "emitir-invalida" },
        { desde: "trigger", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [],
    error: 'La caja "Desplazar" produjo un mensaje MIDI inválido',
  });
});

test("lo inválido que devuelve una caja sin salida es un error", () => {
  vi.spyOn(TIPOS_DE_NODO.emitir, "procesar").mockReturnValue(m(0x90, 300, 100));
  actualizar({
    flujo: flujo(
      [{ id: "emitir", tipo: "emitir", parametros: {} }],
      [{ desde: "trigger", hacia: "emitir" }],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [],
    error: 'La caja "Emitir" produjo un mensaje MIDI inválido',
  });
});

test("después de un error, el mensaje siguiente se procesa normalmente", () => {
  vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar").mockImplementationOnce(() => {
    throw new Error("falla a propósito");
  });
  actualizar({
    flujo: flujo(
      [subirNota("arriba", 4), { id: "emitir", tipo: "emitir", parametros: {} }],
      [
        { desde: "trigger", hacia: "arriba" },
        { desde: "arriba", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([]);
  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({ salidas: [m(0x90, 64, 100)], error: null });
});

test("un acorde que incluye la nota original devuelve las tres notas", () => {
  actualizar({
    flujo: flujo(
      [
        subirNota("tercera", 4),
        subirNota("quinta", 7),
        { id: "emitir-original", tipo: "emitir", parametros: {} },
        { id: "emitir-tercera", tipo: "emitir", parametros: {} },
        { id: "emitir-quinta", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "emitir-original" },
        { desde: "trigger", hacia: "tercera" },
        { desde: "trigger", hacia: "quinta" },
        { desde: "tercera", hacia: "emitir-tercera" },
        { desde: "quinta", hacia: "emitir-quinta" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([
    m(0x90, 60, 100),
    m(0x90, 64, 100),
    m(0x90, 67, 100),
  ]);
});

test("un mensaje que llega a dos Emitir sale dos veces", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "emitir-1", tipo: "emitir", parametros: {} },
        { id: "emitir-2", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "emitir-1" },
        { desde: "trigger", hacia: "emitir-2" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([m(0x90, 60, 100), m(0x90, 60, 100)]);
});

test("lo que se emite para un mensaje no se mezcla con el siguiente", () => {
  actualizar({
    flujo: flujo(
      [{ id: "emitir", tipo: "emitir", parametros: {} }],
      [{ desde: "trigger", hacia: "emitir" }],
    ),
  });

  procesarMensaje(m(0x90, 60, 100));

  expect(procesarMensaje(m(0x80, 60, 0)).salidas).toEqual([m(0x80, 60, 0)]);
});

test("Filtrar deja pasar el resto sin tener que ocuparse de él", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: { "nota-on": true, "nota-off": true } },
        subirNota("fundamental", 0),
        subirNota("tercera", 4),
        subirNota("quinta", 7),
        { id: "emitir-fundamental", tipo: "emitir", parametros: {} },
        { id: "emitir-tercera", tipo: "emitir", parametros: {} },
        { id: "emitir-quinta", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "fundamental" },
        { desde: "notas", hacia: "tercera" },
        { desde: "notas", hacia: "quinta" },
        { desde: "fundamental", hacia: "emitir-fundamental" },
        { desde: "tercera", hacia: "emitir-tercera" },
        { desde: "quinta", hacia: "emitir-quinta" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([
    m(0x90, 60, 100),
    m(0x90, 64, 100),
    m(0x90, 67, 100),
  ]);
  expect(procesarMensaje(m(0xb0, 7, 100)).salidas).toEqual([m(0xb0, 7, 100)]);
});

test("Filtrar con Nota Off y Descartar saca los Nota Off", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas-off", tipo: "filtrar", parametros: { "nota-off": true } },
        { id: "descartar", tipo: "descartar", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas-off" },
        { desde: "notas-off", hacia: "descartar" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([m(0x90, 60, 100)]);
  expect(procesarMensaje(m(0x80, 60, 64)).salidas).toEqual([]);
});
