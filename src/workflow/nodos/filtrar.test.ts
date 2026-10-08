import { expect, test } from "vitest";

import { MensajeMidi, TIPOS_ELEGIBLES } from "@/midi/mensaje";
import { erroresDeConfiguracion } from "../validacion";
import filtrar from "./filtrar";

// Filtrar deja pasar el mensaje tal cual si cumple todos sus criterios, y si
// no, no devuelve nada: esa rama del flujo termina ahí.
//
// Así arranca una caja nueva: sin tipos ni canales elegidos y con los dos
// rangos completos, deja pasar todo. Cada `test` cambia solo lo que prueba.
const CAJA_NUEVA = {
  tipos: [],
  canales: [],
  datos1: { desde: 0, hasta: 127 },
  datos2: { desde: 0, hasta: 127 },
};

test("una caja nueva deja pasar cualquier mensaje", () => {
  expect(filtrar.procesar(new MensajeMidi([0x90, 60, 100]), CAJA_NUEVA)).toEqual(
    new MensajeMidi([0x90, 60, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0xb0, 7, 100]), CAJA_NUEVA)).toEqual(
    new MensajeMidi([0xb0, 7, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0xfa]), CAJA_NUEVA)).toEqual(new MensajeMidi([0xfa]));
});

// Tipos de mensaje: si hay alguno elegido, pasa el mensaje que sea de uno de
// ellos.

test("con las notas elegidas, deja pasar un Nota On y un Nota Off", () => {
  const parametros = { ...CAJA_NUEVA, tipos: ["nota-on", "nota-off"] };

  expect(filtrar.procesar(new MensajeMidi([0x90, 60, 100]), parametros)).toEqual(
    new MensajeMidi([0x90, 60, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0x80, 60, 64]), parametros)).toEqual(
    new MensajeMidi([0x80, 60, 64]),
  );
});

test("con las notas elegidas, no deja pasar un Cambio de Control", () => {
  const resultado = filtrar.procesar(new MensajeMidi([0xb0, 7, 100]), {
    ...CAJA_NUEVA,
    tipos: ["nota-on", "nota-off"],
  });

  expect(resultado).toBeUndefined();
});

test("un Nota On con velocidad 0 no pasa si solo está elegido Nota On", () => {
  // Es un Nota Off.
  const resultado = filtrar.procesar(new MensajeMidi([0x90, 60, 0]), {
    ...CAJA_NUEVA,
    tipos: ["nota-on"],
  });

  expect(resultado).toBeUndefined();
});

test("el tipo sirve en cualquier canal", () => {
  const parametros = { ...CAJA_NUEVA, tipos: ["cambio-de-control"] };

  expect(filtrar.procesar(new MensajeMidi([0xb0, 7, 100]), parametros)).toEqual(
    new MensajeMidi([0xb0, 7, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0xbf, 7, 100]), parametros)).toEqual(
    new MensajeMidi([0xbf, 7, 100]),
  );
});

test("los mensajes de sistema se eligen de a uno", () => {
  const parametros = { ...CAJA_NUEVA, tipos: ["inicio", "detener"] };

  expect(filtrar.procesar(new MensajeMidi([0xfa]), parametros)).toEqual(new MensajeMidi([0xfa]));
  expect(filtrar.procesar(new MensajeMidi([0xfc]), parametros)).toEqual(new MensajeMidi([0xfc]));
  expect(filtrar.procesar(new MensajeMidi([0xfb]), parametros)).toBeUndefined();
  expect(
    filtrar.procesar(new MensajeMidi([0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]), parametros),
  ).toBeUndefined();
});

test("un status de sistema no definido no pasa si hay tipos elegidos", () => {
  const resultado = filtrar.procesar(new MensajeMidi([0xf9]), {
    ...CAJA_NUEVA,
    // Todos los que se pueden elegir.
    tipos: [...TIPOS_ELEGIBLES],
  });

  expect(resultado).toBeUndefined();
});

// Canales: si hay alguno elegido, pasa el mensaje que sea de uno de ellos.

test("con el canal 10 elegido, deja pasar solo lo del canal 10", () => {
  const parametros = { ...CAJA_NUEVA, canales: [10] };

  expect(filtrar.procesar(new MensajeMidi([0x99, 36, 100]), parametros)).toEqual(
    new MensajeMidi([0x99, 36, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0xb9, 7, 100]), parametros)).toEqual(
    new MensajeMidi([0xb9, 7, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0x90, 60, 100]), parametros)).toBeUndefined();
});

test("con los canales 1 y 2 elegidos, no deja pasar el 3", () => {
  const parametros = { ...CAJA_NUEVA, canales: [1, 2] };

  expect(filtrar.procesar(new MensajeMidi([0x90, 60, 100]), parametros)).toEqual(
    new MensajeMidi([0x90, 60, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0x91, 60, 100]), parametros)).toEqual(
    new MensajeMidi([0x91, 60, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0x92, 60, 100]), parametros)).toBeUndefined();
});

test("un mensaje de sistema no pasa si hay canales elegidos", () => {
  // No tiene canal.
  const resultado = filtrar.procesar(new MensajeMidi([0xfa]), { ...CAJA_NUEVA, canales: [1] });

  expect(resultado).toBeUndefined();
});

// Rangos: el 2.º y el 3.º byte tienen que estar entre "desde" y "hasta", los
// dos incluidos.

test("una zona del teclado: notas de 60 a 72", () => {
  const parametros = { ...CAJA_NUEVA, datos1: { desde: 60, hasta: 72 } };

  expect(filtrar.procesar(new MensajeMidi([0x90, 59, 100]), parametros)).toBeUndefined();
  expect(filtrar.procesar(new MensajeMidi([0x90, 60, 100]), parametros)).toEqual(
    new MensajeMidi([0x90, 60, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0x90, 72, 100]), parametros)).toEqual(
    new MensajeMidi([0x90, 72, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0x90, 73, 100]), parametros)).toBeUndefined();
});

test("un valor exacto: solo el CC 7", () => {
  const parametros = { ...CAJA_NUEVA, tipos: ["cambio-de-control"], datos1: { desde: 7, hasta: 7 } };

  expect(filtrar.procesar(new MensajeMidi([0xb0, 7, 100]), parametros)).toEqual(
    new MensajeMidi([0xb0, 7, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0xb0, 1, 100]), parametros)).toBeUndefined();
});

test("el rango completo deja pasar mensajes que no tienen ese byte", () => {
  // Un Cambio de Programa y un Inicio no tienen 3.er byte.
  expect(filtrar.procesar(new MensajeMidi([0xc0, 5]), CAJA_NUEVA)).toEqual(
    new MensajeMidi([0xc0, 5]),
  );
  expect(filtrar.procesar(new MensajeMidi([0xfa]), CAJA_NUEVA)).toEqual(new MensajeMidi([0xfa]));
});

test("un rango más chico no deja pasar un mensaje sin ese byte", () => {
  const resultado = filtrar.procesar(new MensajeMidi([0xc0, 5]), {
    ...CAJA_NUEVA,
    datos2: { desde: 0, hasta: 100 },
  });

  expect(resultado).toBeUndefined();
});

// Todos los criterios juntos: el mensaje tiene que cumplirlos todos.

test("Nota On, en el canal 1, de 60 a 72", () => {
  const parametros = {
    ...CAJA_NUEVA,
    tipos: ["nota-on"],
    canales: [1],
    datos1: { desde: 60, hasta: 72 },
  };

  expect(filtrar.procesar(new MensajeMidi([0x90, 60, 100]), parametros)).toEqual(
    new MensajeMidi([0x90, 60, 100]),
  );
  // Del canal 2.
  expect(filtrar.procesar(new MensajeMidi([0x91, 60, 100]), parametros)).toBeUndefined();
  // Fuera de la zona.
  expect(filtrar.procesar(new MensajeMidi([0x90, 48, 100]), parametros)).toBeUndefined();
  // Un Nota Off.
  expect(filtrar.procesar(new MensajeMidi([0x80, 60, 64]), parametros)).toBeUndefined();
});

test("una capa de velocidad: Nota On de 100 a 127", () => {
  const parametros = { ...CAJA_NUEVA, tipos: ["nota-on"], datos2: { desde: 100, hasta: 127 } };

  expect(filtrar.procesar(new MensajeMidi([0x90, 60, 99]), parametros)).toBeUndefined();
  expect(filtrar.procesar(new MensajeMidi([0x90, 60, 100]), parametros)).toEqual(
    new MensajeMidi([0x90, 60, 100]),
  );
  expect(filtrar.procesar(new MensajeMidi([0x90, 60, 120]), parametros)).toEqual(
    new MensajeMidi([0x90, 60, 120]),
  );
});

// Un rango al revés es un error del parámetro (los rangos de Filtrar no se
// pueden invertir), no una regla del nodo: lo encuentra `erroresDeConfiguracion`,
// igual que en el panel y en el ejecutor.

test("una caja nueva no tiene errores", () => {
  expect(erroresDeConfiguracion({ tipo: "filtrar", parametros: CAJA_NUEVA })).toEqual([]);
});

test("un rango de datos 1 al revés es un error", () => {
  const parametros = { ...CAJA_NUEVA, datos1: { desde: 72, hasta: 60 } };

  expect(erroresDeConfiguracion({ tipo: "filtrar", parametros: parametros })).toEqual([
    { clave: "datos1", mensaje: "Desde tiene que ser igual o menor que hasta" },
  ]);
});

test("un rango de datos 2 al revés es un error", () => {
  const parametros = { ...CAJA_NUEVA, datos2: { desde: 100, hasta: 50 } };

  expect(erroresDeConfiguracion({ tipo: "filtrar", parametros: parametros })).toEqual([
    { clave: "datos2", mensaje: "Desde tiene que ser igual o menor que hasta" },
  ]);
});

test("un rango de un solo valor está bien", () => {
  const parametros = { ...CAJA_NUEVA, datos2: { desde: 64, hasta: 64 } };

  expect(erroresDeConfiguracion({ tipo: "filtrar", parametros: parametros })).toEqual([]);
});
