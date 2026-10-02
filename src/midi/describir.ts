import { type MensajeMidi, NOMBRES_DE_TIPO } from "./mensaje";

const MENSAJES_DE_SISTEMA: Record<number, string> = {
  0xf0: "Mensaje de Sistema Exclusivo (SysEx)",
  0xf1: "Cuadro de Tiempo MIDI (MTC Quarter Frame)",
  0xf2: "Puntero de Posición de Canción (Song Position Pointer)",
  0xf3: "Selección de Canción (Song Select)",
  0xf6: "Solicitud de Afinación (Tune Request)",
  0xf8: "Reloj MIDI (Timing Clock)",
  0xfa: "Inicio (Start)",
  0xfb: "Continuar (Continue)",
  0xfc: "Detener (Stop)",
  0xfe: "Sensor Activo (Active Sensing)",
  0xff: "Reset del Sistema",
};

function hexadecimal(byte: number): string {
  return byte.toString(16).padStart(2, "0").toUpperCase();
}

const NOMBRES_DE_NOTA = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * El nombre de una nota en notación científica, con el Do central (60) como
 * C4 y las notas negras como sostenidos: 0 es C-1 y 127 es G9.
 */
export function nombreDeNota(numero: number): string {
  return `${NOMBRES_DE_NOTA[numero % 12]}${Math.floor(numero / 12) - 1}`;
}

function nota(numero: number): string {
  return `nota ${nombreDeNota(numero)} (${numero})`;
}

/**
 * Las partes de la descripción de un mensaje: en los de canal, el tipo, el
 * canal y cada valor; en los demás, una sola parte con la descripción entera.
 */
export function partesDeLaDescripcion(mensaje: MensajeMidi): string[] {
  const { bytes, tipo } = mensaje;
  if (tipo === "desconocido") {
    return [
      bytes.length === 0
        ? "Mensaje vacío"
        : `Mensaje MIDI sin reconocer: [${bytes.map(hexadecimal).join(", ")}]`,
    ];
  }
  if (tipo === "sistema") {
    return [
      MENSAJES_DE_SISTEMA[bytes[0]] ??
        `Mensaje de sistema sin reconocer (0x${hexadecimal(bytes[0])})`,
    ];
  }

  const inicio = [NOMBRES_DE_TIPO[tipo], `canal ${mensaje.canal}`];
  // Un mensaje incompleto no tiene que hacer fallar la descripción: los bytes
  // que faltan cuentan como 0.
  const dato1 = bytes[1] ?? 0;
  const dato2 = bytes[2] ?? 0;

  switch (tipo) {
    case "nota-off":
    case "nota-on":
      return [...inicio, nota(dato1), `velocidad ${dato2}`];
    case "presion-polifonica":
      return [...inicio, nota(dato1), `presión ${dato2}`];
    case "cambio-de-control":
      return [...inicio, `controlador ${dato1}`, `valor ${dato2}`];
    case "cambio-de-programa":
      return [...inicio, `programa ${dato1}`];
    case "presion-de-canal":
      return [...inicio, `presión ${dato1}`];
    case "pitch-bend":
      return [...inicio, `valor ${(dato2 << 7) | dato1}`];
  }
}

/**
 * Traduce un mensaje MIDI a una descripción legible, pensada para usuarios que
 * están aprendiendo el protocolo.
 */
export function describirMensaje(mensaje: MensajeMidi): string {
  return partesDeLaDescripcion(mensaje).join(" · ");
}
