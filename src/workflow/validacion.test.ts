import { expect, test, vi } from "vitest";

import { formato } from "@/formato";
import fijar from "./nodos/fijar";
import { erroresDeConfiguracion } from "./validacion";

// Se prueba con dos cajas de verdad: Fijar, que tiene una regla que mira dos
// parámetros juntos (con Canal, el valor tiene que ser un canal), y Desplazar,
// que no tiene reglas propias.

test("una configuración que cumple todo no tiene errores", () => {
  expect(erroresDeConfiguracion({ tipo: "fijar", parametros: { byte: 0, valor: 10 } })).toEqual([]);
});

test("un parámetro fuera de su rango da el error de ese parámetro", () => {
  expect(erroresDeConfiguracion({ tipo: "fijar", parametros: { byte: 2, valor: 200 } })).toEqual([
    { clave: "valor", mensaje: formato`Tiene que ir de ${0} a ${127}` },
  ]);
});

test("una regla del tipo que no se cumple da su error", () => {
  expect(erroresDeConfiguracion({ tipo: "fijar", parametros: { byte: 0, valor: 100 } })).toEqual([
    { clave: "valor", mensaje: formato`Con Canal, tiene que ir de ${1} a ${16}` },
  ]);
});

test("con un error de parámetro, las reglas del tipo no se revisan", () => {
  const validar = vi.spyOn(fijar, "validar");

  erroresDeConfiguracion({ tipo: "fijar", parametros: { byte: 0, valor: 500 } });

  expect(validar).not.toHaveBeenCalled();
  validar.mockRestore();
});

test("un tipo sin reglas propias se valida solo con sus parámetros", () => {
  const parametros = { byte: 0, desplazamiento: 300, overflow: true };

  expect(erroresDeConfiguracion({ tipo: "desplazar", parametros })).toEqual([]);
});

test("el trigger no tiene nada que revisar", () => {
  expect(erroresDeConfiguracion({ tipo: "trigger", parametros: {} })).toEqual([]);
});
