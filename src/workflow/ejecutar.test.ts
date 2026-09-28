import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { actualizar, type Flujo } from "../estado";
import { TIPOS_DE_NODO } from "./catalogo";
import { procesarMensaje } from "./ejecutar";
import { enviarMensaje } from "./salida";

vi.mock("./salida", () => ({ enviarMensaje: vi.fn() }));

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
  vi.mocked(enviarMensaje).mockClear();
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

  procesarMensaje([0x90, 60, 100]);

  expect(enviarMensaje).toHaveBeenCalledExactlyOnceWith([0x90, 60, 100]);
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

  procesarMensaje([0x90, 60, 100]);

  expect(vi.mocked(enviarMensaje).mock.calls).toEqual([
    [[0x90, 72, 100]],
    [[0x90, 48, 100]],
    [[0x90, 60, 100]],
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

  procesarMensaje([0x90, 60, 100]);

  expect(enviarMensaje).toHaveBeenCalledExactlyOnceWith([0x90, 60, 100]);
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

  procesarMensaje([0x90, 60, 100]);

  expect(enviarMensaje).toHaveBeenCalledExactlyOnceWith([0x90, 60, 100]);
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

  procesarMensaje([0x90, 60, 100]);

  expect(enviarMensaje).not.toHaveBeenCalled();
});

test("sin una caja Emitir al final no sale nada", () => {
  actualizar({
    flujo: flujo([subirNota("suelta", 12)], [{ desde: "trigger", hacia: "suelta" }]),
  });

  procesarMensaje([0x90, 60, 100]);

  expect(enviarMensaje).not.toHaveBeenCalled();
});
