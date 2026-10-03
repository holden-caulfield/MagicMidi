import { expect, test } from "vitest";

import { MensajeMidi } from "./mensaje";

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

test("lee el tipo de cada mensaje de sistema", () => {
  expect(new MensajeMidi([0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]).tipo).toBe("sysex");
  expect(new MensajeMidi([0xf1, 0x10]).tipo).toBe("cuadro-de-tiempo");
  expect(new MensajeMidi([0xf2, 0x00, 0x08]).tipo).toBe("posicion-de-cancion");
  expect(new MensajeMidi([0xf3, 0x02]).tipo).toBe("seleccion-de-cancion");
  expect(new MensajeMidi([0xf6]).tipo).toBe("solicitud-de-afinacion");
  expect(new MensajeMidi([0xf8]).tipo).toBe("reloj");
  expect(new MensajeMidi([0xfa]).tipo).toBe("inicio");
  expect(new MensajeMidi([0xfb]).tipo).toBe("continuar");
  expect(new MensajeMidi([0xfc]).tipo).toBe("detener");
  expect(new MensajeMidi([0xfe]).tipo).toBe("sensor-activo");
  expect(new MensajeMidi([0xff]).tipo).toBe("reset");
});

test("los status de sistema no definidos tienen su propio tipo", () => {
  expect(new MensajeMidi([0xf4]).tipo).toBe("sistema-no-definido");
  expect(new MensajeMidi([0xf5]).tipo).toBe("sistema-no-definido");
  expect(new MensajeMidi([0xf7]).tipo).toBe("sistema-no-definido");
  expect(new MensajeMidi([0xf9]).tipo).toBe("sistema-no-definido");
  expect(new MensajeMidi([0xfd]).tipo).toBe("sistema-no-definido");
});

test("los mensajes de sistema no tienen canal", () => {
  expect(new MensajeMidi([0xfa]).canal).toBeNull();
  expect(new MensajeMidi([0xf0, 0x7e, 0xf7]).canal).toBeNull();
  expect(new MensajeMidi([0xf8]).canal).toBeNull();
  expect(new MensajeMidi([0xfe]).canal).toBeNull();
  expect(new MensajeMidi([0xf9]).canal).toBeNull();
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

test("lee la nota de los mensajes que la llevan", () => {
  expect(new MensajeMidi([0x90, 60, 100]).nota).toBe(60);
  expect(new MensajeMidi([0x80, 61, 64]).nota).toBe(61);
  expect(new MensajeMidi([0xa0, 62, 30]).nota).toBe(62);
});

test("los mensajes sin nota no la tienen", () => {
  expect(new MensajeMidi([0xb0, 7, 127]).nota).toBeNull();
  expect(new MensajeMidi([0xc0, 5]).nota).toBeNull();
  expect(new MensajeMidi([0xfa]).nota).toBeNull();
  expect(new MensajeMidi([]).nota).toBeNull();
});

test("un Nota On sin segundo byte tiene la nota 0", () => {
  expect(new MensajeMidi([0x90]).nota).toBe(0);
});

test("la nota sigue a los bytes si cambian", () => {
  const mensaje = new MensajeMidi([0x90, 60, 100]);
  mensaje.bytes[1] = 64;
  expect(mensaje.nota).toBe(64);
  mensaje.bytes[0] = 0xb0;
  expect(mensaje.nota).toBeNull();
});
