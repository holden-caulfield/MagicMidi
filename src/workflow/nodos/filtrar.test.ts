import { expect, test } from "vitest";

import { MensajeMidi } from "@/workflow/tipos";
import filtrar from "./filtrar";

// Filtrar deja pasar el mensaje tal cual si su tipo está marcado, y si no, no
// devuelve nada: esa rama del flujo termina ahí.

const NADA_MARCADO = {
  "nota-on": false,
  "nota-off": false,
  "presion-polifonica": false,
  "cambio-de-control": false,
  "cambio-de-programa": false,
  "presion-de-canal": false,
  "pitch-bend": false,
  "sistema": false,
};

test("deja pasar un Nota On si Nota On está marcado", () => {
  const resultado = filtrar.procesar(new MensajeMidi([0x90, 60, 100]), {
    ...NADA_MARCADO,
    "nota-on": true,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 100]));
});

test("no deja pasar un Cambio de Control si solo están marcadas las notas", () => {
  const resultado = filtrar.procesar(new MensajeMidi([0xb0, 7, 100]), {
    ...NADA_MARCADO,
    "nota-on": true,
    "nota-off": true,
  });

  expect(resultado).toBeUndefined();
});

test("con las notas marcadas, deja pasar el Nota Off", () => {
  const resultado = filtrar.procesar(new MensajeMidi([0x80, 60, 64]), {
    ...NADA_MARCADO,
    "nota-on": true,
    "nota-off": true,
  });

  expect(resultado).toEqual(new MensajeMidi([0x80, 60, 64]));
});

// El caso límite de las notas: un Nota On con velocidad 0 es un Nota Off.

test("un Nota On con velocidad 0 no pasa si solo está marcado Nota On", () => {
  const resultado = filtrar.procesar(new MensajeMidi([0x90, 60, 0]), {
    ...NADA_MARCADO,
    "nota-on": true,
  });

  expect(resultado).toBeUndefined();
});

test("un Nota On con velocidad 0 pasa si está marcado Nota Off", () => {
  const resultado = filtrar.procesar(new MensajeMidi([0x90, 60, 0]), {
    ...NADA_MARCADO,
    "nota-off": true,
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 60, 0]));
});

test("no le importa el canal", () => {
  const parametros = { ...NADA_MARCADO, "cambio-de-control": true };

  expect(filtrar.procesar(new MensajeMidi([0xb0, 7, 100]), parametros)).toEqual(
    new MensajeMidi([0xb0, 7, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0xbf, 7, 100]), parametros)).toEqual(
    new MensajeMidi([0xbf, 7, 100]),
  );
});

test("con Mensajes de sistema marcado, deja pasar un Inicio", () => {
  const resultado = filtrar.procesar(new MensajeMidi([0xfa]), {
    ...NADA_MARCADO,
    "sistema": true,
  });

  expect(resultado).toEqual(new MensajeMidi([0xfa]));
});

test("con Mensajes de sistema marcado, no deja pasar una nota", () => {
  const resultado = filtrar.procesar(new MensajeMidi([0x90, 60, 100]), {
    ...NADA_MARCADO,
    "sistema": true,
  });

  expect(resultado).toBeUndefined();
});

test("sin nada marcado, no deja pasar nada", () => {
  expect(filtrar.procesar(new MensajeMidi([0x90, 60, 100]), NADA_MARCADO)).toBeUndefined();
  expect(filtrar.procesar(new MensajeMidi([0xfa]), NADA_MARCADO)).toBeUndefined();
});

test("un mensaje que no empieza con un status no pasa nunca", () => {
  const todoMarcado = {
    "nota-on": true,
    "nota-off": true,
    "presion-polifonica": true,
    "cambio-de-control": true,
    "cambio-de-programa": true,
    "presion-de-canal": true,
    "pitch-bend": true,
    "sistema": true,
  };

  expect(filtrar.procesar(new MensajeMidi([0x3c, 0x40]), todoMarcado)).toBeUndefined();
});
