import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { actualizar, type Flujo } from "../estado";
import { TIPOS_DE_NODO } from "./catalogo";
import { procesarMensaje } from "./ejecutar";

// En el test no hay backend: `invoke` es una función falsa que no hace nada.
// Lo que sale del flujo se revisa en lo que devuelve `procesarMensaje`.
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(async () => {}) }));

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

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
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

  expect(procesarMensaje([0x90, 60, 100])).toEqual([[0x90, 60, 100]]);
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

  expect(procesarMensaje([0x90, 60, 100])).toEqual([
    [0x90, 72, 100],
    [0x90, 48, 100],
    [0x90, 60, 100],
  ]);
});

test("una caja que falla no corta las otras ramas", () => {
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

  expect(procesarMensaje([0x90, 60, 100])).toEqual([[0x90, 60, 100]]);
  expect(console.error).toHaveBeenCalled();
});

test("un mensaje inválido no sigue adelante y las otras ramas no se enteran", () => {
  vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar").mockReturnValue([0x90, 300, 100]);
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

  expect(procesarMensaje([0x90, 60, 100])).toEqual([[0x90, 60, 100]]);
  expect(console.warn).toHaveBeenCalled();
});

test("una caja que descarta el mensaje corta solo su rama", () => {
  vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar").mockReturnValue(null);
  actualizar({
    flujo: flujo(
      [
        subirNota("descarta", 12),
        { id: "emitir-descarta", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "descarta" },
        { desde: "descarta", hacia: "emitir-descarta" },
      ],
    ),
  });

  expect(procesarMensaje([0x90, 60, 100])).toEqual([]);
});

test("sin una caja Emitir al final no sale nada", () => {
  actualizar({
    flujo: flujo([subirNota("suelta", 12)], [{ desde: "trigger", hacia: "suelta" }]),
  });

  expect(procesarMensaje([0x90, 60, 100])).toEqual([]);
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

  expect(procesarMensaje([0x90, 60, 100])).toEqual([
    [0x90, 60, 100],
    [0x90, 64, 100],
    [0x90, 67, 100],
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

  expect(procesarMensaje([0x90, 60, 100])).toEqual([
    [0x90, 60, 100],
    [0x90, 60, 100],
  ]);
});

test("lo que se emite para un mensaje no se mezcla con el siguiente", () => {
  actualizar({
    flujo: flujo(
      [{ id: "emitir", tipo: "emitir", parametros: {} }],
      [{ desde: "trigger", hacia: "emitir" }],
    ),
  });

  procesarMensaje([0x90, 60, 100]);

  expect(procesarMensaje([0x80, 60, 0])).toEqual([[0x80, 60, 0]]);
});
