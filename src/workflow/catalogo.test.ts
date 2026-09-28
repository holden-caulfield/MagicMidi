import { describe, expect, test, vi } from "vitest";

import { papelDelTipo, tieneSalida, TIPOS_DE_NODO } from "./catalogo";
import type { ValorDeParametro } from "./tipos";

// Lo que todo tipo de nodo tiene que cumplir, sea cual sea. No reemplaza el
// test propio de cada nodo: atrapa errores de forma que ese test puede no mirar.

vi.mock("./salida", () => ({ enviarMensaje: vi.fn() }));

const MENSAJES_TIPICOS = [
  [0x90, 60, 100],
  [0x80, 60, 64],
  [0xb0, 7, 127],
  [0xc0, 5],
  [0xe0, 0x00, 0x40],
  [0xfa],
];

describe.each(Object.entries(TIPOS_DE_NODO))("el tipo de nodo %s", (_, tipo) => {
  test("tiene valores iniciales coherentes con sus parámetros", () => {
    for (const parametro of tipo.parametros) {
      if (parametro.tipo === "entero") {
        expect(Number.isInteger(parametro.inicial), parametro.clave).toBe(true);
      } else if (parametro.tipo === "opciones") {
        const valores: ValorDeParametro[] = parametro.opciones.map((opcion) => opcion.valor);
        expect(valores, parametro.clave).toContain(parametro.inicial);
      } else {
        expect(typeof parametro.inicial, parametro.clave).toBe("boolean");
      }
    }
  });

  test("no repite claves de parámetro", () => {
    const claves = tipo.parametros.map((parametro) => parametro.clave);
    expect(new Set(claves).size).toBe(claves.length);
  });

  test.each(MENSAJES_TIPICOS.map((mensaje) => ({ mensaje })))(
    "con los valores iniciales, procesa $mensaje sin fallar",
    ({ mensaje }) => {
      const iniciales = Object.fromEntries(
        tipo.parametros.map((parametro) => [parametro.clave, parametro.inicial]),
      );

      const resultado = tipo.procesar([...mensaje], iniciales);

      if (resultado != null) {
        expect(resultado.length).toBeGreaterThan(0);
        for (const byte of resultado) {
          expect(Number.isInteger(byte) && byte >= 0 && byte <= 255, `byte ${byte}`).toBe(true);
        }
      }
    },
  );
});

test("Emitir cierra el flujo y Desplazar queda en el medio", () => {
  expect(papelDelTipo(TIPOS_DE_NODO.emitir)).toBe("fin");
  expect(papelDelTipo(TIPOS_DE_NODO.desplazar)).toBe("intermedia");
});

test.each(Object.entries(TIPOS_DE_NODO))("el papel de %s coincide con su salida", (_, tipo) => {
  expect(papelDelTipo(tipo)).toBe(tieneSalida(tipo) ? "intermedia" : "fin");
});
