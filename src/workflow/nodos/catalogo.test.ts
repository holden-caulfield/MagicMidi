import { describe, expect, test } from "vitest";

import { MensajeMidi } from "@/midi/mensaje";
import { etapaDelTipo, type IdDeTipo, tieneSalida, TIPOS_DE_NODO } from "./catalogo";
import { erroresDeConfiguracion } from "../validacion";
import type { Modo } from "@/componentes/modo-numerico";

// Lo que todo tipo de nodo tiene que cumplir, sea cual sea. No reemplaza el
// test propio de cada nodo: atrapa errores de forma que ese test puede no mirar.

const MENSAJES_TIPICOS = [
  [0x90, 60, 100],
  [0x80, 60, 64],
  [0xb0, 7, 127],
  [0xc0, 5],
  [0xe0, 0x00, 0x40],
  [0xfa],
];

describe.each(Object.entries(TIPOS_DE_NODO))("el tipo de nodo %s", (id, tipo) => {
  test("sus valores iniciales no tienen errores de configuración", () => {
    const iniciales = Object.fromEntries(
      tipo.parametros.map((parametro) => [parametro.clave, parametro.inicial]),
    );
    expect(erroresDeConfiguracion({ tipo: id as IdDeTipo, parametros: iniciales })).toEqual([]);
  });

  // Una nota va de 0 a 127, y el hexadecimal no tiene negativos: un parámetro
  // numérico solo puede ofrecer esos modos si sus límites entran ahí. Los
  // numéricos (el entero y el rango) son los que llevan sus modos.
  test("sus parámetros numéricos ofrecen solo modos que les entran", () => {
    for (const parametro of tipo.parametros) {
      if (!("modos" in parametro)) continue;
      const { modos, minimo, maximo } = parametro as {
        modos: Modo[];
        minimo?: number;
        maximo?: number;
      };
      if (modos.includes("nota")) {
        expect(
          minimo !== undefined && maximo !== undefined && minimo >= 0 && maximo <= 127,
          `"${parametro.clave}" ofrece nota sin ir de 0 a 127`,
        ).toBe(true);
      }
      if (modos.includes("hexadecimal")) {
        expect(
          minimo !== undefined && minimo >= 0,
          `"${parametro.clave}" ofrece hexadecimal con negativos`,
        ).toBe(true);
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

      const resultado = tipo.procesar(new MensajeMidi([...mensaje]), iniciales);

      for (const salida of [resultado ?? []].flat()) {
        expect(salida.bytes.length).toBeGreaterThan(0);
        for (const byte of salida.bytes) {
          expect(Number.isInteger(byte) && byte >= 0 && byte <= 255, `byte ${byte}`).toBe(true);
        }
      }
    },
  );
});

test("Emitir, Descartar y Pánico cierran el flujo; las demás cajas quedan en el medio", () => {
  expect(etapaDelTipo(TIPOS_DE_NODO.emitir)).toBe("fin");
  expect(etapaDelTipo(TIPOS_DE_NODO.descartar)).toBe("fin");
  expect(etapaDelTipo(TIPOS_DE_NODO.panico)).toBe("fin");
  expect(etapaDelTipo(TIPOS_DE_NODO.filtrar)).toBe("intermedia");
  expect(etapaDelTipo(TIPOS_DE_NODO.desplazar)).toBe("intermedia");
  expect(etapaDelTipo(TIPOS_DE_NODO.fijar)).toBe("intermedia");
  expect(etapaDelTipo(TIPOS_DE_NODO.mapear)).toBe("intermedia");
});

test.each(Object.entries(TIPOS_DE_NODO))("la etapa de %s coincide con su salida", (_, tipo) => {
  expect(etapaDelTipo(tipo)).toBe(tieneSalida(tipo) ? "intermedia" : "fin");
});
