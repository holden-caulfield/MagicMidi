import { expect, test } from "vitest";

import { describirMensaje } from "./describir";

test("describe los mensajes de canal", () => {
  expect(describirMensaje([0x80, 60, 64])).toBe("Nota Off · canal 1 · nota 60 · velocidad 64");
  expect(describirMensaje([0x90, 60, 100])).toBe("Nota On · canal 1 · nota 60 · velocidad 100");
  expect(describirMensaje([0x9f, 60, 100])).toBe("Nota On · canal 16 · nota 60 · velocidad 100");
  expect(describirMensaje([0xa2, 60, 30])).toBe(
    "Presión Polifónica · canal 3 · nota 60 · presión 30",
  );
  expect(describirMensaje([0xb0, 7, 127])).toBe(
    "Cambio de Control · canal 1 · controlador 7 · valor 127",
  );
  expect(describirMensaje([0xc5, 12])).toBe("Cambio de Programa · canal 6 · programa 12");
  expect(describirMensaje([0xd0, 90])).toBe("Presión de Canal · canal 1 · presión 90");
});

test("un Nota On con velocidad cero es un Nota Off", () => {
  expect(describirMensaje([0x90, 60, 0])).toBe("Nota Off · canal 1 · nota 60 · velocidad 0");
});

test("el Pitch Bend arma el valor con los dos bytes de datos", () => {
  expect(describirMensaje([0xe0, 0x00, 0x00])).toBe("Pitch Bend · canal 1 · valor 0");
  expect(describirMensaje([0xe0, 0x00, 0x40])).toBe("Pitch Bend · canal 1 · valor 8192");
  expect(describirMensaje([0xe0, 0x7f, 0x7f])).toBe("Pitch Bend · canal 1 · valor 16383");
});

test("describe los mensajes de sistema", () => {
  expect(describirMensaje([0xf0])).toBe("Mensaje de Sistema Exclusivo (SysEx)");
  expect(describirMensaje([0xf1])).toBe("Cuadro de Tiempo MIDI (MTC Quarter Frame)");
  expect(describirMensaje([0xf2])).toBe("Puntero de Posición de Canción (Song Position Pointer)");
  expect(describirMensaje([0xf3])).toBe("Selección de Canción (Song Select)");
  expect(describirMensaje([0xf6])).toBe("Solicitud de Afinación (Tune Request)");
  expect(describirMensaje([0xf8])).toBe("Reloj MIDI (Timing Clock)");
  expect(describirMensaje([0xfa])).toBe("Inicio (Start)");
  expect(describirMensaje([0xfb])).toBe("Continuar (Continue)");
  expect(describirMensaje([0xfc])).toBe("Detener (Stop)");
  expect(describirMensaje([0xfe])).toBe("Sensor Activo (Active Sensing)");
  expect(describirMensaje([0xff])).toBe("Reset del Sistema");
});

test("avisa cuando no reconoce el mensaje", () => {
  expect(describirMensaje([0xf4])).toBe("Mensaje de sistema sin reconocer (0xF4)");
  expect(describirMensaje([0xf7])).toBe("Mensaje de sistema sin reconocer (0xF7)");
  expect(describirMensaje([0xfd])).toBe("Mensaje de sistema sin reconocer (0xFD)");
  expect(describirMensaje([0x3c, 0x40])).toBe("Mensaje MIDI sin reconocer: [3C, 40]");
  expect(describirMensaje([])).toBe("Mensaje vacío");
});

// Un mensaje incompleto no tiene que hacer fallar la descripción: los bytes
// que faltan cuentan como 0.
test("describe los mensajes truncados sin fallar", () => {
  expect(describirMensaje([0xb0])).toBe("Cambio de Control · canal 1 · controlador 0 · valor 0");
  expect(describirMensaje([0xc0])).toBe("Cambio de Programa · canal 1 · programa 0");
  expect(describirMensaje([0xe0, 0x10])).toBe("Pitch Bend · canal 1 · valor 16");
  expect(describirMensaje([0x90, 60])).toBe("Nota Off · canal 1 · nota 60 · velocidad 0");
});
