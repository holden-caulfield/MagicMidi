import { expect, test } from "vitest";

import { describirMensaje } from "./describir";
import { MensajeMidi } from "./mensaje";

function describir(...bytes: number[]): string {
  return describirMensaje(new MensajeMidi(bytes));
}

test("describe los mensajes de canal", () => {
  expect(describir(0x80, 60, 64)).toBe("Nota Off · canal 1 · nota 60 · velocidad 64");
  expect(describir(0x90, 60, 100)).toBe("Nota On · canal 1 · nota 60 · velocidad 100");
  expect(describir(0x9f, 60, 100)).toBe("Nota On · canal 16 · nota 60 · velocidad 100");
  expect(describir(0xa2, 60, 30)).toBe(
    "Presión Polifónica · canal 3 · nota 60 · presión 30",
  );
  expect(describir(0xb0, 7, 127)).toBe(
    "Cambio de Control · canal 1 · controlador 7 · valor 127",
  );
  expect(describir(0xc5, 12)).toBe("Cambio de Programa · canal 6 · programa 12");
  expect(describir(0xd0, 90)).toBe("Presión de Canal · canal 1 · presión 90");
});

test("un Nota On con velocidad cero es un Nota Off", () => {
  expect(describir(0x90, 60, 0)).toBe("Nota Off · canal 1 · nota 60 · velocidad 0");
});

test("el Pitch Bend arma el valor con los dos bytes de datos", () => {
  expect(describir(0xe0, 0x00, 0x00)).toBe("Pitch Bend · canal 1 · valor 0");
  expect(describir(0xe0, 0x00, 0x40)).toBe("Pitch Bend · canal 1 · valor 8192");
  expect(describir(0xe0, 0x7f, 0x7f)).toBe("Pitch Bend · canal 1 · valor 16383");
});

test("describe los mensajes de sistema", () => {
  expect(describir(0xf0)).toBe("Mensaje de Sistema Exclusivo (SysEx)");
  expect(describir(0xf1)).toBe("Cuadro de Tiempo MIDI (MTC Quarter Frame)");
  expect(describir(0xf2)).toBe("Puntero de Posición de Canción (Song Position Pointer)");
  expect(describir(0xf3)).toBe("Selección de Canción (Song Select)");
  expect(describir(0xf6)).toBe("Solicitud de Afinación (Tune Request)");
  expect(describir(0xf8)).toBe("Reloj MIDI (Timing Clock)");
  expect(describir(0xfa)).toBe("Inicio (Start)");
  expect(describir(0xfb)).toBe("Continuar (Continue)");
  expect(describir(0xfc)).toBe("Detener (Stop)");
  expect(describir(0xfe)).toBe("Sensor Activo (Active Sensing)");
  expect(describir(0xff)).toBe("Reset del Sistema");
});

test("avisa cuando no reconoce el mensaje", () => {
  expect(describir(0xf4)).toBe("Mensaje de sistema sin reconocer (0xF4)");
  expect(describir(0xf7)).toBe("Mensaje de sistema sin reconocer (0xF7)");
  expect(describir(0xfd)).toBe("Mensaje de sistema sin reconocer (0xFD)");
  expect(describir(0x3c, 0x40)).toBe("Mensaje MIDI sin reconocer: [3C, 40]");
  expect(describir()).toBe("Mensaje vacío");
});

// Un mensaje incompleto no tiene que hacer fallar la descripción: los bytes
// que faltan cuentan como 0.
test("describe los mensajes truncados sin fallar", () => {
  expect(describir(0xb0)).toBe("Cambio de Control · canal 1 · controlador 0 · valor 0");
  expect(describir(0xc0)).toBe("Cambio de Programa · canal 1 · programa 0");
  expect(describir(0xe0, 0x10)).toBe("Pitch Bend · canal 1 · valor 16");
  expect(describir(0x90, 60)).toBe("Nota Off · canal 1 · nota 60 · velocidad 0");
});
