import { expect, test } from "vitest";

import { MensajeMidi } from "@/midi/mensaje";
import convertir from "./convertir";

// Cada `test` prueba una sola cosa: le pasa un mensaje y el tipo elegido a
// `procesar`, y con `expect` dice qué mensaje tiene que salir.

// Los cinco arreglos que motivaron el nodo.

test("una nota se convierte en el Cambio de Programa con su número", () => {
  const resultado = convertir.procesar(new MensajeMidi([0x90, 0x3c, 0x64]), {
    destino: "cambio-de-programa",
  });

  // La velocidad no tiene lugar en un Cambio de Programa: se descarta.
  expect(resultado).toEqual(new MensajeMidi([0xc0, 0x3c]));
});

test("el valor de un CC pasa a la parte gruesa del Pitch Bend", () => {
  const centro = convertir.procesar(new MensajeMidi([0xb0, 0x07, 0x40]), {
    destino: "pitch-bend",
  });
  const arriba = convertir.procesar(new MensajeMidi([0xb0, 0x07, 0x7f]), {
    destino: "pitch-bend",
  });

  // La parte fina queda en 0: 64 cae justo en el centro.
  expect(centro).toEqual(new MensajeMidi([0xe0, 0x00, 0x40]));
  expect(arriba).toEqual(new MensajeMidi([0xe0, 0x00, 0x7f]));
});

test("el Pitch Bend pasa a un CC 1 con su parte gruesa", () => {
  const centro = convertir.procesar(new MensajeMidi([0xe0, 0x35, 0x40]), {
    destino: "cambio-de-control",
  });
  const arriba = convertir.procesar(new MensajeMidi([0xe0, 0x7f, 0x7f]), {
    destino: "cambio-de-control",
  });

  // La parte fina (0x35) se pierde, sin redondear.
  expect(centro).toEqual(new MensajeMidi([0xb0, 0x01, 0x40]));
  expect(arriba).toEqual(new MensajeMidi([0xb0, 0x01, 0x7f]));
});

test("el aftertouch pasa a ser el valor de un CC 1", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xd0, 0x50]), {
    destino: "cambio-de-control",
  });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 0x01, 0x50]));
});

test("el valor de un CC pasa a ser la presión del aftertouch", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xb0, 0x01, 0x64]), {
    destino: "presion-de-canal",
  });

  // El número de controlador no tiene lugar: se descarta.
  expect(resultado).toEqual(new MensajeMidi([0xd0, 0x64]));
});

// Cada dato va al lugar con su mismo rol.

test("el número de controlador pasa a ser el programa", () => {
  const primero = convertir.procesar(new MensajeMidi([0xb0, 0x14, 0x7f]), {
    destino: "cambio-de-programa",
  });
  const segundo = convertir.procesar(new MensajeMidi([0xb0, 0x15, 0x7f]), {
    destino: "cambio-de-programa",
  });

  expect(primero).toEqual(new MensajeMidi([0xc0, 0x14]));
  expect(segundo).toEqual(new MensajeMidi([0xc0, 0x15]));
});

test("la presión polifónica pasa a ser la presión de canal", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xa0, 0x3c, 0x50]), {
    destino: "presion-de-canal",
  });

  // La nota no tiene lugar: se descarta.
  expect(resultado).toEqual(new MensajeMidi([0xd0, 0x50]));
});

test("una nota pasa a un CC con el mismo número y la velocidad como valor", () => {
  const resultado = convertir.procesar(new MensajeMidi([0x90, 0x24, 0x7f]), {
    destino: "cambio-de-control",
  });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 0x24, 0x7f]));
});

test("un pedal que manda CC se convierte en Nota On y Nota Off", () => {
  const apretado = convertir.procesar(new MensajeMidi([0xb0, 0x40, 0x7f]), {
    destino: "nota-on",
  });
  const suelto = convertir.procesar(new MensajeMidi([0xb0, 0x40, 0x00]), {
    destino: "nota-on",
  });

  expect(apretado).toEqual(new MensajeMidi([0x90, 0x40, 0x7f]));
  // Un Nota On con velocidad 0 es un Nota Off.
  expect(suelto).toEqual(new MensajeMidi([0x90, 0x40, 0x00]));
  expect(suelto?.tipo).toBe("nota-off");
});

test("un Cambio de Programa pasa a Selección de Canción con el mismo número", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xc3, 0x07]), {
    destino: "seleccion-de-cancion",
  });

  expect(resultado).toEqual(new MensajeMidi([0xf3, 0x07]));
});

test("entre Pitch Bend y Posición de Canción pasan los 14 bits", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xe0, 0x35, 0x40]), {
    destino: "posicion-de-cancion",
  });

  expect(resultado).toEqual(new MensajeMidi([0xf2, 0x35, 0x40]));
});

test("un dato no cambia de rol", () => {
  // La presión dice cuánto y el programa dice cuál: la presión se descarta y
  // el programa se rellena.
  const resultado = convertir.procesar(new MensajeMidi([0xd0, 0x05]), {
    destino: "cambio-de-programa",
  });

  expect(resultado).toEqual(new MensajeMidi([0xc0, 0x00]));
});

// El canal.

test("entre mensajes de canal, el canal no cambia", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xd2, 0x50]), {
    destino: "cambio-de-control",
  });

  // `B2` es Cambio de Control en el canal 3, como el `D2` que llegó.
  expect(resultado).toEqual(new MensajeMidi([0xb2, 0x01, 0x50]));
});

test("un mensaje de sistema convertido a uno de canal va por el canal 1", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xfa]), { destino: "nota-on" });

  expect(resultado).toEqual(new MensajeMidi([0x90, 0x00, 0x40]));
});

test("un mensaje de canal convertido a uno de sistema pierde el canal", () => {
  const resultado = convertir.procesar(new MensajeMidi([0x99, 0x24, 0x64]), {
    destino: "inicio",
  });

  expect(resultado).toEqual(new MensajeMidi([0xfa]));
});

// Lo que falta se rellena.

test("la velocidad que falta se rellena con 64", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xc0, 0x3c]), { destino: "nota-on" });

  expect(resultado).toEqual(new MensajeMidi([0x90, 0x3c, 0x40]));
});

test("el valor de un CC que falta se rellena con 0", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xc0, 0x05]), {
    destino: "cambio-de-control",
  });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 0x05, 0x00]));
});

test("el Pitch Bend que falta queda en el centro", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xc0, 0x05]), { destino: "pitch-bend" });

  expect(resultado).toEqual(new MensajeMidi([0xe0, 0x00, 0x40]));
});

test("la nota que falta se rellena con 0", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xd0, 0x50]), { destino: "nota-on" });

  expect(resultado).toEqual(new MensajeMidi([0x90, 0x00, 0x50]));
});

test("un byte que falta en el mensaje recibido cuenta como 0", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xd0]), {
    destino: "cambio-de-control",
  });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 0x01, 0x00]));
});

// Lo que pasa sin cambios.

test("un mensaje que ya es del tipo elegido pasa igual", () => {
  const resultado = convertir.procesar(new MensajeMidi([0xb0, 0x07, 0x64]), {
    destino: "cambio-de-control",
  });

  expect(resultado).toEqual(new MensajeMidi([0xb0, 0x07, 0x64]));
});

test("un SysEx y un Cuadro de Tiempo pasan igual", () => {
  const sysex = convertir.procesar(new MensajeMidi([0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]), {
    destino: "cambio-de-control",
  });
  const cuadro = convertir.procesar(new MensajeMidi([0xf1, 0x23]), {
    destino: "cambio-de-control",
  });

  expect(sysex).toEqual(new MensajeMidi([0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]));
  expect(cuadro).toEqual(new MensajeMidi([0xf1, 0x23]));
});

test("un Nota On con velocidad 0 ya es un Nota Off", () => {
  const resultado = convertir.procesar(new MensajeMidi([0x90, 0x3c, 0x00]), {
    destino: "nota-off",
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 0x3c, 0x00]));
});

test("un Nota Off con velocidad 0 convertido a Nota On sigue siendo un Nota Off", () => {
  const resultado = convertir.procesar(new MensajeMidi([0x80, 0x3c, 0x00]), {
    destino: "nota-on",
  });

  expect(resultado).toEqual(new MensajeMidi([0x90, 0x3c, 0x00]));
  expect(resultado?.tipo).toBe("nota-off");
});
