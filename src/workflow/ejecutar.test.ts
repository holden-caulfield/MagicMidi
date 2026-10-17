import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { actualizar, type Flujo } from "@/estado/estado";
import { MensajeMidi, type TipoDeMensaje } from "@/midi/mensaje";
import { mensajesDePanico } from "@/midi/panico";
import { TIPOS_DE_NODO } from "./nodos/catalogo";
import { procesarMensaje } from "./ejecutar";
import { olvidarLaMemoriaDeLasCajas } from "./memoria-de-las-cajas";
import { olvidarNotasPrendidas } from "./notas-prendidas";

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

// Los parámetros de un Filtrar con solo esos tipos, o solo esos canales,
// elegidos; lo demás, como en una caja nueva.
const FILTRAR_NUEVO = {
  tipos: [],
  canales: [],
  datos1: { desde: 0, hasta: 127 },
  datos2: { desde: 0, hasta: 127 },
};

function soloTipos(...tipos: TipoDeMensaje[]) {
  return { ...FILTRAR_NUEVO, tipos };
}

function soloCanales(...canales: number[]) {
  return { ...FILTRAR_NUEVO, canales };
}

function m(...bytes: number[]): MensajeMidi {
  return new MensajeMidi(bytes);
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  olvidarNotasPrendidas();
  olvidarLaMemoriaDeLasCajas();
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

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [m(0x90, 60, 100)],
    error: null,
    apareado: false,
  });
});

test("con solo el trigger, el mensaje sale tal cual", () => {
  actualizar({ flujo: flujo([], []) });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [m(0x90, 60, 100)],
    error: null,
    apareado: false,
  });
});

test("sin una caja de fin al final, el mensaje sale tal cual", () => {
  actualizar({
    flujo: flujo([subirNota("suelta", 12)], [{ desde: "trigger", hacia: "suelta" }]),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [m(0x90, 60, 100)],
    error: null,
    apareado: false,
  });
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

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [],
    error: null,
    apareado: false,
  });
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

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [m(0x90, 60, 100)],
    error: null,
    apareado: false,
  });
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
    apareado: false,
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
    apareado: false,
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
    apareado: false,
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
  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [m(0x90, 64, 100)],
    error: null,
    apareado: false,
  });
});

// Para probar una caja que devuelve varios mensajes se reemplaza el `procesar`
// de un Convertir: devuelve el mensaje y una copia una octava más arriba.
function conSuOctava(mensaje: MensajeMidi): MensajeMidi[] {
  const [status, nota, velocidad] = mensaje.bytes;
  return [mensaje, m(status, nota + 12, velocidad)];
}

function octavas(id: string): Flujo["nodos"][number] {
  return { id, tipo: "convertir", parametros: { destino: "cambio-de-control" } };
}

test("una caja sin salida que devuelve varios mensajes los emite todos, en orden", () => {
  vi.spyOn(TIPOS_DE_NODO.emitir, "procesar").mockReturnValue([
    m(0xb0, 0x7b, 0x00),
    m(0xb1, 0x7b, 0x00),
  ]);
  actualizar({
    flujo: flujo(
      [{ id: "emitir", tipo: "emitir", parametros: {} }],
      [{ desde: "trigger", hacia: "emitir" }],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [m(0xb0, 0x7b, 0x00), m(0xb1, 0x7b, 0x00)],
    error: null,
    apareado: false,
  });
});

test("una caja sin salida que devuelve una lista vacía no deja salir nada", () => {
  vi.spyOn(TIPOS_DE_NODO.emitir, "procesar").mockReturnValue([]);
  actualizar({
    flujo: flujo(
      [{ id: "emitir", tipo: "emitir", parametros: {} }],
      [{ desde: "trigger", hacia: "emitir" }],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [],
    error: null,
    apareado: false,
  });
});

test("varios mensajes siguen de largo por separado, en orden", () => {
  vi.spyOn(TIPOS_DE_NODO.convertir, "procesar").mockImplementation(conSuOctava);
  actualizar({
    flujo: flujo(
      [
        octavas("octavas"),
        subirNota("arriba", 1),
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "octavas" },
        { desde: "octavas", hacia: "arriba" },
        { desde: "arriba", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([m(0x90, 61, 100), m(0x90, 73, 100)]);
});

test("todo lo que produce el primer mensaje de una lista sale antes que lo del segundo", () => {
  vi.spyOn(TIPOS_DE_NODO.convertir, "procesar").mockImplementation(conSuOctava);
  actualizar({
    flujo: flujo(
      [
        octavas("octavas"),
        { id: "emitir", tipo: "emitir", parametros: {} },
        subirNota("arriba", 1),
        { id: "emitir-arriba", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "octavas" },
        { desde: "octavas", hacia: "emitir" },
        { desde: "octavas", hacia: "arriba" },
        { desde: "arriba", hacia: "emitir-arriba" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([
    m(0x90, 60, 100),
    m(0x90, 61, 100),
    m(0x90, 72, 100),
    m(0x90, 73, 100),
  ]);
});

test("una caja con salida que devuelve una lista vacía corta su rama y el original sale", () => {
  vi.spyOn(TIPOS_DE_NODO.convertir, "procesar").mockReturnValue([]);
  actualizar({
    flujo: flujo(
      [octavas("vacia"), { id: "emitir", tipo: "emitir", parametros: {} }],
      [
        { desde: "trigger", hacia: "vacia" },
        { desde: "vacia", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [m(0x90, 60, 100)],
    error: null,
    apareado: false,
  });
});

test("un mensaje inválido dentro de una lista es un error y no sale nada", () => {
  vi.spyOn(TIPOS_DE_NODO.convertir, "procesar").mockReturnValue([m(0x90, 60, 100), m()]);
  actualizar({
    flujo: flujo(
      [
        octavas("invalida"),
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
    error: 'La caja "Convertir" produjo un mensaje MIDI inválido',
    apareado: false,
  });
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
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on", "nota-off") },
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
        { id: "notas-off", tipo: "filtrar", parametros: soloTipos("nota-off") },
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

test("dos Filtrar en paralelo hacia la misma caja dejan pasar lo de uno o lo del otro", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas-on", tipo: "filtrar", parametros: soloTipos("nota-on") },
        { id: "canal-10", tipo: "filtrar", parametros: soloCanales(10) },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas-on" },
        { desde: "trigger", hacia: "canal-10" },
        { desde: "notas-on", hacia: "emitir" },
        { desde: "canal-10", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([m(0x90, 60, 100)]);
  expect(procesarMensaje(m(0xb9, 7, 100)).salidas).toEqual([m(0xb9, 7, 100)]);
  // No llegó a ninguna caja de fin: se reenvía tal cual.
  expect(procesarMensaje(m(0xb0, 7, 100)).salidas).toEqual([m(0xb0, 7, 100)]);
});

test("lo que pasa los dos Filtrar en paralelo llega dos veces", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas-on", tipo: "filtrar", parametros: soloTipos("nota-on") },
        { id: "canal-10", tipo: "filtrar", parametros: soloCanales(10) },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas-on" },
        { desde: "trigger", hacia: "canal-10" },
        { desde: "notas-on", hacia: "emitir" },
        { desde: "canal-10", hacia: "emitir" },
      ],
    ),
  });

  // Un Nota On en el canal 10.
  expect(procesarMensaje(m(0x99, 36, 100)).salidas).toEqual([m(0x99, 36, 100), m(0x99, 36, 100)]);
});

test("una caja mal configurada falla sin llegar a procesar el mensaje", () => {
  const procesar = vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar");
  actualizar({
    flujo: flujo(
      [
        { id: "mal", tipo: "desplazar", parametros: { byte: 1, desplazamiento: 2.5, overflow: false } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "mal" },
        { desde: "mal", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [],
    error: 'La caja "Desplazar" está mal configurada: Desplazamiento: Tiene que ser un número entero',
    apareado: false,
  });
  expect(procesar).not.toHaveBeenCalled();
});

test("Fijar con el canal fuera de rango hace que no salga nada", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "fijar", tipo: "fijar", parametros: { byte: 0, valor: 17 } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "fijar" },
        { desde: "fijar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [],
    error: 'La caja "Fijar" está mal configurada: Valor: Con Canal, tiene que ir de 1 a 16',
    apareado: false,
  });
});

// El log no tiene un campo que escriba los valores en su modo: van como texto
// común, aunque el panel los muestre en hexadecimal.
test("el error de Fijar en el log escribe los números en decimal", () => {
  actualizar({
    flujo: flujo(
      [
        {
          id: "fijar",
          tipo: "fijar",
          parametros: { byte: 0, valor: 100 },
          estadoDeLosParametros: { valor: { modo: "hexadecimal", bemoles: false } },
        },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "fijar" },
        { desde: "fijar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [],
    error: 'La caja "Fijar" está mal configurada: Valor: Con Canal, tiene que ir de 1 a 16',
    apareado: false,
  });
});

test("al corregir la caja, el mensaje siguiente sale bien", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "fijar", tipo: "fijar", parametros: { byte: 0, valor: 17 } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "fijar" },
        { desde: "fijar", hacia: "emitir" },
      ],
    ),
  });
  procesarMensaje(m(0x90, 60, 100));

  actualizar({
    flujo: flujo(
      [
        { id: "fijar", tipo: "fijar", parametros: { byte: 0, valor: 10 } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "fijar" },
        { desde: "fijar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100))).toEqual({
    salidas: [m(0x99, 60, 100)],
    error: null,
    apareado: false,
  });
});

test("una caja mal configurada a la que no llega el mensaje no afecta", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        {
          id: "mapear",
          tipo: "mapear",
          parametros: { byte: 2, entrada: { desde: 64, hasta: 64 }, salida: { desde: 0, hasta: 127 } },
        },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "mapear" },
        { desde: "mapear", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0xb0, 7, 100))).toEqual({
    salidas: [m(0xb0, 7, 100)],
    error: null,
    apareado: false,
  });
});

test("velocidad fija solo en las notas, con Filtrar y Fijar", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        { id: "fijar", tipo: "fijar", parametros: { byte: 2, valor: 100 } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "fijar" },
        { desde: "fijar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 40)).salidas).toEqual([m(0x90, 60, 100)]);
  // Un Nota On con velocidad 0 es un Nota Off: no pasa el Filtrar y sale igual.
  expect(procesarMensaje(m(0x90, 60, 0)).salidas).toEqual([m(0x90, 60, 0)]);
  expect(procesarMensaje(m(0xb0, 7, 40)).salidas).toEqual([m(0xb0, 7, 40)]);
});

test("comprimir la velocidad solo en las notas no convierte un Nota Off en Nota On", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        {
          id: "mapear",
          tipo: "mapear",
          parametros: { byte: 2, entrada: { desde: 0, hasta: 127 }, salida: { desde: 40, hasta: 110 } },
        },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "mapear" },
        { desde: "mapear", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 0)).salidas).toEqual([m(0x90, 60, 0)]);
  expect(procesarMensaje(m(0x90, 60, 127)).salidas).toEqual([m(0x90, 60, 110)]);
});

test("otro controlador con Convertir y Fijar", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "convertir", tipo: "convertir", parametros: { destino: "cambio-de-control" } },
        { id: "fijar", tipo: "fijar", parametros: { byte: 1, valor: 74 } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "convertir" },
        { desde: "convertir", hacia: "fijar" },
        { desde: "fijar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0xd0, 0x50)).salidas).toEqual([m(0xb0, 0x4a, 0x50)]);
});

test("aftertouch a CC sin tocar las notas", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "presion", tipo: "filtrar", parametros: soloTipos("presion-de-canal") },
        { id: "convertir", tipo: "convertir", parametros: { destino: "cambio-de-control" } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "presion" },
        { desde: "presion", hacia: "convertir" },
        { desde: "convertir", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 0x3c, 0x64)).salidas).toEqual([m(0x90, 0x3c, 0x64)]);
  expect(procesarMensaje(m(0xd0, 0x50)).salidas).toEqual([m(0xb0, 0x01, 0x50)]);
});

test("un pad cambia de programa una sola vez", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        { id: "convertir", tipo: "convertir", parametros: { destino: "cambio-de-programa" } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "convertir" },
        { desde: "convertir", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x99, 0x24, 0x64)).salidas).toEqual([m(0xc9, 0x24)]);
  // Al soltar el pad, el Nota Off no pasa el Filtrar, y no sale porque su Nota
  // On no prendió ninguna nota.
  expect(procesarMensaje(m(0x89, 0x24, 0x40)).salidas).toEqual([]);
});

test("cualquier nota elige siempre el mismo programa", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        { id: "convertir", tipo: "convertir", parametros: { destino: "cambio-de-programa" } },
        { id: "fijar", tipo: "fijar", parametros: { byte: 1, valor: 5 } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "convertir" },
        { desde: "convertir", hacia: "fijar" },
        { desde: "fijar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 0x3c, 0x64)).salidas).toEqual([m(0xc0, 0x05)]);
});

test("una fila de botones elige programas", () => {
  actualizar({
    flujo: flujo(
      [
        {
          id: "apretados",
          tipo: "filtrar",
          parametros: { ...soloTipos("cambio-de-control"), datos2: { desde: 64, hasta: 127 } },
        },
        { id: "convertir", tipo: "convertir", parametros: { destino: "cambio-de-programa" } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "apretados" },
        { desde: "apretados", hacia: "convertir" },
        { desde: "convertir", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0xb0, 0x14, 0x7f)).salidas).toEqual([m(0xc0, 0x14)]);
  expect(procesarMensaje(m(0xb0, 0x14, 0x00)).salidas).toEqual([m(0xb0, 0x14, 0x00)]);
});

test("un pedal arranca el secuenciador", () => {
  actualizar({
    flujo: flujo(
      [
        {
          id: "apretado",
          tipo: "filtrar",
          parametros: { ...soloTipos("cambio-de-control"), datos2: { desde: 64, hasta: 127 } },
        },
        { id: "convertir", tipo: "convertir", parametros: { destino: "inicio" } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "apretado" },
        { desde: "apretado", hacia: "convertir" },
        { desde: "convertir", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0xb0, 0x50, 0x7f)).salidas).toEqual([m(0xfa)]);
  expect(procesarMensaje(m(0xb0, 0x50, 0x00)).salidas).toEqual([m(0xb0, 0x50, 0x00)]);
});

test("cualquier mensaje dispara el pánico y el original no sale", () => {
  actualizar({
    flujo: flujo(
      [{ id: "panico", tipo: "panico", parametros: {} }],
      [{ desde: "trigger", hacia: "panico" }],
    ),
  });

  expect(procesarMensaje(m(0x90, 0x3c, 0x64))).toEqual({
    salidas: mensajesDePanico(),
    error: null,
    apareado: false,
  });
});

test("lo que emiten otras ramas sale junto con el pánico", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "emitir", tipo: "emitir", parametros: {} },
        { id: "panico", tipo: "panico", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "emitir" },
        { desde: "trigger", hacia: "panico" },
      ],
    ),
  });

  expect(procesarMensaje(m(0xb0, 0x14, 0x7f)).salidas).toEqual([
    m(0xb0, 0x14, 0x7f),
    ...mensajesDePanico(),
  ]);
});

// El botón 20 de un controlador manda CC 20 con 127 al apretarlo y con 0 al
// soltarlo.
const SOLO_EL_BOTON = { ...soloTipos("cambio-de-control"), datos1: { desde: 20, hasta: 20 } };

test("un botón que llega entero al pánico lo dispara al apretar y al soltar", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "boton", tipo: "filtrar", parametros: SOLO_EL_BOTON },
        { id: "panico", tipo: "panico", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "boton" },
        { desde: "boton", hacia: "panico" },
      ],
    ),
  });

  expect(procesarMensaje(m(0xb0, 0x14, 0x7f)).salidas).toEqual(mensajesDePanico());
  expect(procesarMensaje(m(0xb0, 0x14, 0x00)).salidas).toEqual(mensajesDePanico());
});

function botonDePanico(): Flujo {
  return flujo(
    [
      { id: "boton", tipo: "filtrar", parametros: SOLO_EL_BOTON },
      { id: "descartar", tipo: "descartar", parametros: {} },
      {
        id: "apretado",
        tipo: "filtrar",
        parametros: { ...FILTRAR_NUEVO, datos2: { desde: 64, hasta: 127 } },
      },
      { id: "panico", tipo: "panico", parametros: {} },
    ],
    [
      { desde: "trigger", hacia: "boton" },
      { desde: "boton", hacia: "descartar" },
      { desde: "boton", hacia: "apretado" },
      { desde: "apretado", hacia: "panico" },
    ],
  );
}

test("un botón filtrado por valor dispara el pánico una vez y no llega al sinte", () => {
  actualizar({ flujo: botonDePanico() });

  expect(procesarMensaje(m(0xb0, 0x14, 0x7f)).salidas).toEqual(mensajesDePanico());
  expect(procesarMensaje(m(0xb0, 0x14, 0x00)).salidas).toEqual([]);
});

test("con el botón de pánico armado, el resto de los mensajes sigue de largo", () => {
  actualizar({ flujo: botonDePanico() });

  expect(procesarMensaje(m(0x90, 0x3c, 0x64)).salidas).toEqual([m(0x90, 0x3c, 0x64)]);
});

// Apareo de Nota Off: un Nota Off que no llega a ninguna caja de fin apaga lo
// que prendió su Nota On, aunque el flujo haya cambiado en el medio.

const NOTA_ON = m(0x90, 60, 100);
const NOTA_OFF = m(0x80, 60, 64);

// Filtrar (solo Nota On) → Desplazar (datos 1, `cuanto`) → Emitir: el Nota Off
// no pasa el Filtrar, así que no llega a ninguna caja de fin.
function transponerLosNotaOn(cuanto: number): Flujo {
  return flujo(
    [
      { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
      subirNota("desplazar", cuanto),
      { id: "emitir", tipo: "emitir", parametros: {} },
    ],
    [
      { desde: "trigger", hacia: "notas" },
      { desde: "notas", hacia: "desplazar" },
      { desde: "desplazar", hacia: "emitir" },
    ],
  );
}

test("un Nota Off sin caja de fin apaga la nota que prendió su Nota On", () => {
  actualizar({ flujo: transponerLosNotaOn(12) });

  expect(procesarMensaje(NOTA_ON).salidas).toEqual([m(0x90, 72, 100)]);
  expect(procesarMensaje(NOTA_OFF)).toEqual({
    salidas: [m(0x80, 72, 64)],
    error: null,
    apareado: true,
  });
});

test("cambiar la caja con la tecla apretada no deja la nota colgada", () => {
  actualizar({ flujo: transponerLosNotaOn(12) });
  procesarMensaje(NOTA_ON);

  actualizar({ flujo: transponerLosNotaOn(7) });

  expect(procesarMensaje(NOTA_OFF).salidas).toEqual([m(0x80, 72, 64)]);
});

test("un acorde se apaga entero, en el orden en que salió", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        subirNota("tonica", 0),
        subirNota("tercera", 4),
        subirNota("quinta", 7),
        { id: "emitir-tonica", tipo: "emitir", parametros: {} },
        { id: "emitir-tercera", tipo: "emitir", parametros: {} },
        { id: "emitir-quinta", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "tonica" },
        { desde: "notas", hacia: "tercera" },
        { desde: "notas", hacia: "quinta" },
        { desde: "tonica", hacia: "emitir-tonica" },
        { desde: "tercera", hacia: "emitir-tercera" },
        { desde: "quinta", hacia: "emitir-quinta" },
      ],
    ),
  });

  expect(procesarMensaje(NOTA_ON).salidas).toEqual([
    m(0x90, 60, 100),
    m(0x90, 64, 100),
    m(0x90, 67, 100),
  ]);
  expect(procesarMensaje(NOTA_OFF).salidas).toEqual([
    m(0x80, 60, 64),
    m(0x80, 64, 64),
    m(0x80, 67, 64),
  ]);
});

test("el Nota Off se apaga en el canal por el que salió su Nota On", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        { id: "fijar", tipo: "fijar", parametros: { byte: 0, valor: 2 } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "fijar" },
        { desde: "fijar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(NOTA_ON).salidas).toEqual([m(0x91, 60, 100)]);
  expect(procesarMensaje(NOTA_OFF).salidas).toEqual([m(0x81, 60, 64)]);
});

test("un Nota On con velocidad 0 conserva su forma al aparearse", () => {
  actualizar({ flujo: transponerLosNotaOn(12) });
  procesarMensaje(NOTA_ON);

  expect(procesarMensaje(m(0x90, 60, 0)).salidas).toEqual([m(0x90, 72, 0)]);
});

test("un Nota Off que llega a un Emitir sale como lo devuelve el flujo", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        subirNota("desplazar", 12),
        { id: "emitir", tipo: "emitir", parametros: {} },
        { id: "sueltas", tipo: "filtrar", parametros: soloTipos("nota-off") },
        { id: "emitir-sueltas", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "desplazar" },
        { desde: "desplazar", hacia: "emitir" },
        { desde: "trigger", hacia: "sueltas" },
        { desde: "sueltas", hacia: "emitir-sueltas" },
      ],
    ),
  });

  expect(procesarMensaje(NOTA_ON).salidas).toEqual([m(0x90, 72, 100)]);
  expect(procesarMensaje(NOTA_OFF)).toEqual({
    salidas: [m(0x80, 60, 64)],
    error: null,
    apareado: false,
  });
});

test("alcanza con que otra rama lleve el Nota Off a un Emitir para que no se aparee", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "emitir-original", tipo: "emitir", parametros: {} },
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        subirNota("octava", 12),
        { id: "emitir-octava", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "emitir-original" },
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "octava" },
        { desde: "octava", hacia: "emitir-octava" },
      ],
    ),
  });

  expect(procesarMensaje(NOTA_ON).salidas).toEqual([m(0x90, 60, 100), m(0x90, 72, 100)]);
  // La octava queda sonando: es el caso que explica nodos/LEEME.md.
  expect(procesarMensaje(NOTA_OFF).salidas).toEqual([m(0x80, 60, 64)]);
});

test("un Nota Off que llega a Descartar no sale", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "sueltas", tipo: "filtrar", parametros: soloTipos("nota-off") },
        { id: "descartar", tipo: "descartar", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "sueltas" },
        { desde: "sueltas", hacia: "descartar" },
      ],
    ),
  });

  expect(procesarMensaje(NOTA_ON).salidas).toEqual([m(0x90, 60, 100)]);
  expect(procesarMensaje(NOTA_OFF)).toEqual({ salidas: [], error: null, apareado: false });
});

test("un Nota On que salió tal cual también se anota", () => {
  actualizar({ flujo: flujo([], []) });
  expect(procesarMensaje(NOTA_ON).salidas).toEqual([m(0x90, 60, 100)]);

  actualizar({ flujo: transponerLosNotaOn(12) });

  expect(procesarMensaje(NOTA_OFF)).toEqual({
    salidas: [m(0x80, 60, 64)],
    error: null,
    apareado: true,
  });
});

test("la misma nota dos veces se apaga de la más vieja a la más nueva", () => {
  actualizar({ flujo: transponerLosNotaOn(12) });
  expect(procesarMensaje(NOTA_ON).salidas).toEqual([m(0x90, 72, 100)]);
  actualizar({ flujo: transponerLosNotaOn(7) });
  expect(procesarMensaje(NOTA_ON).salidas).toEqual([m(0x90, 67, 100)]);

  expect(procesarMensaje(NOTA_OFF).salidas).toEqual([m(0x80, 72, 64)]);
  expect(procesarMensaje(NOTA_OFF).salidas).toEqual([m(0x80, 67, 64)]);
});

test("un Nota Off que llega a un Emitir también saca su anotación", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on", "nota-off") },
        subirNota("desplazar", 12),
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "desplazar" },
        { desde: "desplazar", hacia: "emitir" },
      ],
    ),
  });
  procesarMensaje(NOTA_ON);
  expect(procesarMensaje(NOTA_OFF).salidas).toEqual([m(0x80, 72, 64)]);

  actualizar({ flujo: transponerLosNotaOn(7) });
  procesarMensaje(NOTA_ON);

  expect(procesarMensaje(NOTA_OFF).salidas).toEqual([m(0x80, 67, 64)]);
});

test("las notas que salen de un Cambio de Control no se aparean", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "controles", tipo: "filtrar", parametros: soloTipos("cambio-de-control") },
        { id: "convertir", tipo: "convertir", parametros: { destino: "nota-on" } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "controles" },
        { desde: "controles", hacia: "convertir" },
        { desde: "convertir", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0xb0, 64, 127)).salidas).toEqual([m(0x90, 64, 127)]);
  expect(procesarMensaje(m(0xb0, 64, 0)).salidas).toEqual([m(0x90, 64, 0)]);
});

test("el Nota Off de un pad convertido en Cambio de Control no sale", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        { id: "convertir", tipo: "convertir", parametros: { destino: "cambio-de-control" } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "convertir" },
        { desde: "convertir", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 36, 127)).salidas).toEqual([m(0xb0, 36, 127)]);
  expect(procesarMensaje(m(0x80, 36, 64))).toEqual({ salidas: [], error: null, apareado: true });
});

test("si el Nota On se descartó, su Nota Off tampoco sale", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        { id: "descartar", tipo: "descartar", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "descartar" },
      ],
    ),
  });

  expect(procesarMensaje(NOTA_ON).salidas).toEqual([]);
  expect(procesarMensaje(NOTA_OFF)).toEqual({ salidas: [], error: null, apareado: true });
});

test("un Nota Off sin su Nota On sale tal cual", () => {
  actualizar({ flujo: transponerLosNotaOn(12) });

  expect(procesarMensaje(NOTA_OFF)).toEqual({
    salidas: [m(0x80, 60, 64)],
    error: null,
    apareado: false,
  });
});

test("la caja Pánico no olvida lo anotado", () => {
  const conPanico = transponerLosNotaOn(12);
  conPanico.nodos.push(
    { id: "controles", tipo: "filtrar", parametros: soloTipos("cambio-de-control") },
    { id: "panico", tipo: "panico", parametros: {} },
  );
  conPanico.conexiones.push(
    { desde: "trigger", hacia: "controles" },
    { desde: "controles", hacia: "panico" },
  );
  actualizar({ flujo: conPanico });

  procesarMensaje(NOTA_ON);
  expect(procesarMensaje(m(0xb0, 20, 127)).salidas).toEqual(mensajesDePanico());

  expect(procesarMensaje(NOTA_OFF).salidas).toEqual([m(0x80, 72, 64)]);
});

test("borrar todas las cajas no olvida lo anotado", () => {
  actualizar({ flujo: transponerLosNotaOn(12) });
  procesarMensaje(NOTA_ON);

  actualizar({ flujo: flujo([], []) });

  expect(procesarMensaje(NOTA_OFF).salidas).toEqual([m(0x80, 72, 64)]);
});

test("un Nota Off con el que falla una caja no sale, pero saca su anotación", () => {
  actualizar({ flujo: transponerLosNotaOn(12) });
  procesarMensaje(NOTA_ON);
  const falla = vi.spyOn(TIPOS_DE_NODO.desplazar, "procesar").mockImplementation(() => {
    throw new Error("falla a propósito");
  });
  actualizar({
    flujo: flujo(
      [subirNota("rota", 12), { id: "emitir", tipo: "emitir", parametros: {} }],
      [
        { desde: "trigger", hacia: "rota" },
        { desde: "rota", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(NOTA_OFF)).toEqual({
    salidas: [],
    error: 'La caja "Desplazar" falló: falla a propósito',
    apareado: false,
  });

  falla.mockRestore();
  actualizar({ flujo: transponerLosNotaOn(12) });
  // Ya no queda nada anotado: el siguiente sale tal cual.
  expect(procesarMensaje(NOTA_OFF).salidas).toEqual([m(0x80, 60, 64)]);
});

// Alternar y la memoria de las cajas. Una caja Alternar recuerda por dónde va
// en su lista entre un mensaje y el siguiente.

// Alternar el tercer byte entre 127 y 0, con un solo ciclo, salvo que se
// pasen otros parámetros.
function alternarDatos2(
  id: string,
  parametros: Record<string, unknown> = { byte: 2, valores: [127, 0], cicloPor: [] },
): Flujo["nodos"][number] {
  return { id, tipo: "alternar", parametros };
}

// Trigger → Alternar → Emitir.
function soloAlternar(caja: Flujo["nodos"][number]): Flujo {
  return flujo(
    [caja, { id: "emitir", tipo: "emitir", parametros: {} }],
    [
      { desde: "trigger", hacia: caja.id },
      { desde: caja.id, hacia: "emitir" },
    ],
  );
}

const PEDAL_ABAJO = m(0xb0, 64, 127);

test("el latch de pedal alterna con cada pisada y descarta las soltadas", () => {
  const pedal = { ...soloTipos("cambio-de-control"), datos1: { desde: 64, hasta: 64 } };
  const pisadas = { ...pedal, datos2: { desde: 64, hasta: 127 } };
  const soltadas = { ...pedal, datos2: { desde: 0, hasta: 63 } };
  actualizar({
    flujo: flujo(
      [
        { id: "pisadas", tipo: "filtrar", parametros: pisadas },
        alternarDatos2("alternar"),
        { id: "emitir", tipo: "emitir", parametros: {} },
        { id: "soltadas", tipo: "filtrar", parametros: soltadas },
        { id: "descartar", tipo: "descartar", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "pisadas" },
        { desde: "pisadas", hacia: "alternar" },
        { desde: "alternar", hacia: "emitir" },
        { desde: "trigger", hacia: "soltadas" },
        { desde: "soltadas", hacia: "descartar" },
      ],
    ),
  });

  expect(procesarMensaje(m(0xb0, 64, 127)).salidas).toEqual([m(0xb0, 64, 127)]);
  expect(procesarMensaje(m(0xb0, 64, 0)).salidas).toEqual([]);
  expect(procesarMensaje(m(0xb0, 64, 127)).salidas).toEqual([m(0xb0, 64, 0)]);
  expect(procesarMensaje(m(0xb0, 64, 0)).salidas).toEqual([]);
});

test("un pad como interruptor: cada Nota On alterna, y los Nota Off no salen", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        { id: "convertir", tipo: "convertir", parametros: { destino: "cambio-de-control" } },
        alternarDatos2("alternar"),
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "convertir" },
        { desde: "convertir", hacia: "alternar" },
        { desde: "alternar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 36, 100)).salidas).toEqual([m(0xb0, 36, 127)]);
  expect(procesarMensaje(m(0x80, 36, 64)).salidas).toEqual([]);
  expect(procesarMensaje(m(0x90, 36, 100)).salidas).toEqual([m(0xb0, 36, 0)]);
  expect(procesarMensaje(m(0x80, 36, 64)).salidas).toEqual([]);
});

test("el ciclo avanza aunque falle una caja siguiente", () => {
  const conFijar = (valor: number) =>
    flujo(
      [
        alternarDatos2("alternar"),
        { id: "fijar", tipo: "fijar", parametros: { byte: 0, valor } },
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "alternar" },
        { desde: "alternar", hacia: "fijar" },
        { desde: "fijar", hacia: "emitir" },
      ],
    );
  actualizar({ flujo: conFijar(100) });

  expect(procesarMensaje(PEDAL_ABAJO).salidas).toEqual([]);

  actualizar({ flujo: conFijar(1) });

  expect(procesarMensaje(PEDAL_ABAJO).salidas).toEqual([m(0xb0, 64, 0)]);
});

test("un mensaje que llega a Alternar por dos caminos avanza el ciclo dos veces", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "uno", tipo: "filtrar", parametros: FILTRAR_NUEVO },
        { id: "otro", tipo: "filtrar", parametros: FILTRAR_NUEVO },
        alternarDatos2("alternar"),
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "uno" },
        { desde: "trigger", hacia: "otro" },
        { desde: "uno", hacia: "alternar" },
        { desde: "otro", hacia: "alternar" },
        { desde: "alternar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(PEDAL_ABAJO).salidas).toEqual([m(0xb0, 64, 127), m(0xb0, 64, 0)]);
});

test("el round-robin de canales apaga cada nota en el canal donde se prendió", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        alternarDatos2("alternar", { byte: 0, valores: [1, 2, 3], cicloPor: [] }),
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "alternar" },
        { desde: "alternar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([m(0x90, 60, 100)]);
  expect(procesarMensaje(m(0x90, 62, 100)).salidas).toEqual([m(0x91, 62, 100)]);
  expect(procesarMensaje(m(0x80, 60, 64)).salidas).toEqual([m(0x80, 60, 64)]);
  expect(procesarMensaje(m(0x80, 62, 64)).salidas).toEqual([m(0x81, 62, 64)]);
});

test("si el Nota Off también pasa por Alternar, toma otro canal y no apaga su nota", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on", "nota-off") },
        alternarDatos2("alternar", { byte: 0, valores: [1, 2], cicloPor: [] }),
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "alternar" },
        { desde: "alternar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([m(0x90, 60, 100)]);
  expect(procesarMensaje(m(0x80, 60, 64)).salidas).toEqual([m(0x81, 60, 64)]);
});

test("cada caja Alternar recuerda lo suyo", () => {
  actualizar({
    flujo: flujo(
      [
        { id: "controles", tipo: "filtrar", parametros: soloTipos("cambio-de-control") },
        alternarDatos2("alternar-controles"),
        { id: "notas", tipo: "filtrar", parametros: soloTipos("nota-on") },
        alternarDatos2("alternar-notas"),
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "controles" },
        { desde: "controles", hacia: "alternar-controles" },
        { desde: "alternar-controles", hacia: "emitir" },
        { desde: "trigger", hacia: "notas" },
        { desde: "notas", hacia: "alternar-notas" },
        { desde: "alternar-notas", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(PEDAL_ABAJO).salidas).toEqual([m(0xb0, 64, 127)]);
  expect(procesarMensaje(m(0x90, 60, 100)).salidas).toEqual([m(0x90, 60, 127)]);
  expect(procesarMensaje(PEDAL_ABAJO).salidas).toEqual([m(0xb0, 64, 0)]);
});

test("editar el flujo no borra la memoria de una caja", () => {
  actualizar({ flujo: soloAlternar(alternarDatos2("alternar")) });
  procesarMensaje(PEDAL_ABAJO);

  actualizar({
    flujo: flujo(
      [
        alternarDatos2("alternar"),
        subirNota("desplazar", 12),
        { id: "emitir", tipo: "emitir", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "alternar" },
        { desde: "alternar", hacia: "desplazar" },
        { desde: "desplazar", hacia: "emitir" },
      ],
    ),
  });

  expect(procesarMensaje(PEDAL_ABAJO).salidas).toEqual([m(0xb0, 76, 0)]);
});

test("una caja Alternar nueva arranca con la memoria vacía", () => {
  actualizar({ flujo: soloAlternar(alternarDatos2("alternar")) });
  procesarMensaje(PEDAL_ABAJO);

  // Borrar la caja y agregar otra igual: la nueva tiene otro `id`.
  actualizar({ flujo: soloAlternar(alternarDatos2("alternar-nueva")) });

  expect(procesarMensaje(PEDAL_ABAJO).salidas).toEqual([m(0xb0, 64, 127)]);
});

test("la caja Pánico no borra la memoria de las cajas", () => {
  const pedal = { ...soloTipos("cambio-de-control"), datos1: { desde: 64, hasta: 64 } };
  const boton = { ...soloTipos("cambio-de-control"), datos1: { desde: 20, hasta: 20 } };
  actualizar({
    flujo: flujo(
      [
        { id: "pedal", tipo: "filtrar", parametros: pedal },
        alternarDatos2("alternar"),
        { id: "emitir", tipo: "emitir", parametros: {} },
        { id: "boton", tipo: "filtrar", parametros: boton },
        { id: "panico", tipo: "panico", parametros: {} },
      ],
      [
        { desde: "trigger", hacia: "pedal" },
        { desde: "pedal", hacia: "alternar" },
        { desde: "alternar", hacia: "emitir" },
        { desde: "trigger", hacia: "boton" },
        { desde: "boton", hacia: "panico" },
      ],
    ),
  });

  expect(procesarMensaje(PEDAL_ABAJO).salidas).toEqual([m(0xb0, 64, 127)]);
  expect(procesarMensaje(m(0xb0, 20, 127)).salidas).toEqual(mensajesDePanico());
  expect(procesarMensaje(PEDAL_ABAJO).salidas).toEqual([m(0xb0, 64, 0)]);
});

test("una caja Alternar mal configurada no avanza su ciclo", () => {
  actualizar({ flujo: soloAlternar(alternarDatos2("alternar")) });
  expect(procesarMensaje(PEDAL_ABAJO).salidas).toEqual([m(0xb0, 64, 127)]);

  // Con Canal, el 127 no es un canal: la caja tiene un error.
  actualizar({
    flujo: soloAlternar(alternarDatos2("alternar", { byte: 0, valores: [127, 0], cicloPor: [] })),
  });
  const conError = procesarMensaje(PEDAL_ABAJO);
  expect(conError.salidas).toEqual([]);
  expect(conError.error).toContain('La caja "Alternar" está mal configurada');

  // Sigue en la segunda posición: el canal 2.
  actualizar({
    flujo: soloAlternar(alternarDatos2("alternar", { byte: 0, valores: [1, 2], cicloPor: [] })),
  });
  expect(procesarMensaje(PEDAL_ABAJO).salidas).toEqual([m(0xb1, 64, 127)]);
});
