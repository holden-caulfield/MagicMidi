import { beforeEach, expect, test } from "vitest";

import { memoriaDeLaCaja, olvidarLaMemoriaDeLasCajas } from "./memoria-de-las-cajas";

beforeEach(() => {
  olvidarLaMemoriaDeLasCajas();
});

test("una caja nueva arranca con la memoria vacía", () => {
  expect(memoriaDeLaCaja("alternar").size).toBe(0);
});

test("la misma caja recibe la misma memoria, con lo que guardó", () => {
  memoriaDeLaCaja("alternar").set("posicion", 1);

  expect(memoriaDeLaCaja("alternar").get("posicion")).toBe(1);
});

test("cada caja tiene su memoria", () => {
  memoriaDeLaCaja("una").set("posicion", 1);

  expect(memoriaDeLaCaja("otra").get("posicion")).toBeUndefined();
});

test("olvidar deja vacías todas las memorias", () => {
  memoriaDeLaCaja("una").set("posicion", 1);
  memoriaDeLaCaja("otra").set("posicion", 2);

  olvidarLaMemoriaDeLasCajas();

  expect(memoriaDeLaCaja("una").size).toBe(0);
  expect(memoriaDeLaCaja("otra").size).toBe(0);
});
