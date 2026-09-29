import { expect, test } from "vitest";

import { MensajeMidi } from "./tipos";

test("lee el tipo de los mensajes de canal", () => {
  expect(new MensajeMidi([0x80, 60, 64]).tipo).toBe("nota-off");
  expect(new MensajeMidi([0x90, 60, 100]).tipo).toBe("nota-on");
  expect(new MensajeMidi([0xa0, 60, 30]).tipo).toBe("presion-polifonica");
  expect(new MensajeMidi([0xb0, 7, 127]).tipo).toBe("cambio-de-control");
  expect(new MensajeMidi([0xc0, 5]).tipo).toBe("cambio-de-programa");
  expect(new MensajeMidi([0xd0, 90]).tipo).toBe("presion-de-canal");
  expect(new MensajeMidi([0xe0, 0x00, 0x40]).tipo).toBe("pitch-bend");
});

test("un Nota On con velocidad 0 es un Nota Off", () => {
  expect(new MensajeMidi([0x90, 60, 0]).tipo).toBe("nota-off");
});

test("un Nota On sin tercer byte cuenta como velocidad 0", () => {
  expect(new MensajeMidi([0x90, 60]).tipo).toBe("nota-off");
});

test("un Nota On con velocidad 1 sigue siendo Nota On", () => {
  expect(new MensajeMidi([0x90, 60, 1]).tipo).toBe("nota-on");
});

test("los mensajes de sistema no tienen canal", () => {
  expect(new MensajeMidi([0xfa]).tipo).toBe("sistema");
  expect(new MensajeMidi([0xfa]).canal).toBeNull();
  expect(new MensajeMidi([0xf0, 0x7e, 0xf7]).tipo).toBe("sistema");
});

test("un mensaje que no empieza con un status es desconocido y no tiene canal", () => {
  expect(new MensajeMidi([0x3c, 0x40]).tipo).toBe("desconocido");
  expect(new MensajeMidi([0x3c, 0x40]).canal).toBeNull();
});

test("un mensaje vacío es desconocido y no tiene canal", () => {
  expect(new MensajeMidi([]).tipo).toBe("desconocido");
  expect(new MensajeMidi([]).canal).toBeNull();
});

test("el canal va de 1 a 16", () => {
  expect(new MensajeMidi([0x90, 60, 100]).canal).toBe(1);
  expect(new MensajeMidi([0x91, 60, 100]).canal).toBe(2);
  expect(new MensajeMidi([0x9f, 60, 100]).canal).toBe(16);
  expect(new MensajeMidi([0xb9, 7, 100]).canal).toBe(10);
});

test("el tipo y el canal siguen a los bytes cuando cambian", () => {
  const mensaje = new MensajeMidi([0x90, 60, 100]);

  mensaje.bytes[0] = 0xb3;

  expect(mensaje.tipo).toBe("cambio-de-control");
  expect(mensaje.canal).toBe(4);
});

test("bajar la velocidad a 0 lo vuelve Nota Off", () => {
  const mensaje = new MensajeMidi([0x90, 60, 100]);

  mensaje.bytes[2] = 0;

  expect(mensaje.tipo).toBe("nota-off");
});

test("una copia no comparte los bytes con el original", () => {
  const original = new MensajeMidi([0x90, 60, 100]);
  const copia = original.copiar();

  copia.bytes[1] = 72;

  expect(original.bytes).toEqual([0x90, 60, 100]);
  expect(copia.bytes).toEqual([0x90, 72, 100]);
});
