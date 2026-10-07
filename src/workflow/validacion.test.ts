import { Box } from "lucide";
import { expect, test, vi } from "vitest";

import { formato } from "@/formato";
import type { TipoDeNodo } from "./tipos";
import { erroresDeConfiguracion } from "./validacion";

// Un tipo de prueba, con una regla que mira dos parámetros juntos.
const rango = {
  nombre: "Rango",
  icono: Box,
  parametros: [
    { clave: "desde", etiqueta: "Desde", tipo: "entero", inicial: 0, minimo: 0, maximo: 127 },
    { clave: "hasta", etiqueta: "Hasta", tipo: "entero", inicial: 127, minimo: 0, maximo: 127 },
  ],
  validar(parametros) {
    if (Number(parametros.hasta) <= Number(parametros.desde)) {
      return [{ clave: "hasta", mensaje: "Tiene que ser mayor que Desde" }];
    }
    return [];
  },
  procesar: (mensaje) => mensaje,
} satisfies TipoDeNodo;

test("una configuración que cumple todo no tiene errores", () => {
  expect(erroresDeConfiguracion(rango, { desde: 10, hasta: 20 })).toEqual([]);
});

test("un parámetro fuera de su rango da el error de ese parámetro", () => {
  expect(erroresDeConfiguracion(rango, { desde: 200, hasta: 20 })).toEqual([
    { clave: "desde", mensaje: formato`Tiene que ir de ${0} a ${127}` },
  ]);
});

test("una regla del tipo que no se cumple da su error", () => {
  expect(erroresDeConfiguracion(rango, { desde: 10, hasta: 5 })).toEqual([
    { clave: "hasta", mensaje: "Tiene que ser mayor que Desde" },
  ]);
});

test("con un error de parámetro, las reglas del tipo no se revisan", () => {
  const validar = vi.spyOn(rango, "validar");

  erroresDeConfiguracion(rango, { desde: 10, hasta: 500 });

  expect(validar).not.toHaveBeenCalled();
  validar.mockRestore();
});

test("un tipo sin reglas propias se valida solo con sus parámetros", () => {
  const sinReglas: TipoDeNodo = { ...rango, validar: undefined };

  expect(erroresDeConfiguracion(sinReglas, { desde: 10, hasta: 5 })).toEqual([]);
});
