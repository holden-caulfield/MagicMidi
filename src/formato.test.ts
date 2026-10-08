import { expect, test } from "vitest";

import { escribir, formato } from "./formato";

// `formato` arma un texto con valores sin escribirlos, y `escribir` los
// escribe: por defecto como texto común, o con la función que se le pase.

test("un texto sin valores queda igual", () => {
  expect(escribir("Tiene que ser un número entero")).toBe("Tiene que ser un número entero");
  expect(escribir(formato`Tiene que ser un número entero`)).toBe("Tiene que ser un número entero");
});

test("sin otra función, los valores se escriben como texto común", () => {
  expect(escribir(formato`Tiene que ir de ${0} a ${127}`)).toBe("Tiene que ir de 0 a 127");
});

test("cada valor se escribe con la función que se pasa", () => {
  const enHexadecimal = (valor: unknown) => (valor as number).toString(16).toUpperCase();

  expect(escribir(formato`Tiene que ir de ${1} a ${16}`, enHexadecimal)).toBe(
    "Tiene que ir de 1 a 10",
  );
});

test("un valor puede ir al principio o al final", () => {
  expect(escribir(formato`${3} cajas`)).toBe("3 cajas");
  expect(escribir(formato`Máximo: ${127}`)).toBe("Máximo: 127");
});

test("dos textos iguales escritos en lugares distintos son iguales", () => {
  const uno = () => formato`Tiene que ir de ${0} a ${127}`;
  const otro = () => formato`Tiene que ir de ${0} a ${127}`;

  expect(uno()).toEqual(otro());
  expect(uno()).not.toEqual(formato`Tiene que ir de ${1} a ${127}`);
});
