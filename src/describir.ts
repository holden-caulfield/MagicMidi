import { type MensajeMidi, NOMBRES_DE_TIPO } from "./workflow/tipos";

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

/**
 * Traduce un mensaje MIDI a una descripción legible, pensada para usuarios que
 * están aprendiendo el protocolo.
 */
export function describirMensaje(mensaje: MensajeMidi): string {
  const { bytes, tipo } = mensaje;
  if (tipo === "desconocido") {
    return bytes.length === 0
      ? "Mensaje vacío"
      : `Mensaje MIDI sin reconocer: [${bytes.map(hexadecimal).join(", ")}]`;
  }
  if (tipo === "sistema") {
    return (
      MENSAJES_DE_SISTEMA[bytes[0]] ??
      `Mensaje de sistema sin reconocer (0x${hexadecimal(bytes[0])})`
    );
  }

  const inicio = `${NOMBRES_DE_TIPO[tipo]} · canal ${mensaje.canal}`;
  // Un mensaje incompleto no tiene que hacer fallar la descripción: los bytes
  // que faltan cuentan como 0.
  const dato1 = bytes[1] ?? 0;
  const dato2 = bytes[2] ?? 0;

  switch (tipo) {
    case "nota-off":
    case "nota-on":
      return `${inicio} · nota ${dato1} · velocidad ${dato2}`;
    case "presion-polifonica":
      return `${inicio} · nota ${dato1} · presión ${dato2}`;
    case "cambio-de-control":
      return `${inicio} · controlador ${dato1} · valor ${dato2}`;
    case "cambio-de-programa":
      return `${inicio} · programa ${dato1}`;
    case "presion-de-canal":
      return `${inicio} · presión ${dato1}`;
    case "pitch-bend":
      return `${inicio} · valor ${(dato2 << 7) | dato1}`;
  }
}
