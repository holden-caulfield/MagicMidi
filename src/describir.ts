import type { MensajeMidi } from "./workflow/tipos";

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
 * Traduce los bytes crudos de un mensaje MIDI a una descripción legible,
 * pensada para usuarios que están aprendiendo el protocolo.
 */
export function describirMensaje(datos: MensajeMidi): string {
  if (datos.length === 0) {
    return "Mensaje vacío";
  }

  const status = datos[0];
  if (status >= 0xf0) {
    return (
      MENSAJES_DE_SISTEMA[status] ??
      `Mensaje de sistema sin reconocer (0x${hexadecimal(status)})`
    );
  }

  const canal = (status & 0x0f) + 1;
  // Un mensaje incompleto no tiene que hacer fallar la descripción: los bytes
  // que faltan cuentan como 0.
  const dato1 = datos[1] ?? 0;
  const dato2 = datos[2] ?? 0;

  switch (status & 0xf0) {
    case 0x80:
      return `Nota Off · canal ${canal} · nota ${dato1} · velocidad ${dato2}`;
    case 0x90:
      if (dato2 === 0) {
        return `Nota Off · canal ${canal} · nota ${dato1} · velocidad 0`;
      }
      return `Nota On · canal ${canal} · nota ${dato1} · velocidad ${dato2}`;
    case 0xa0:
      return `Presión Polifónica · canal ${canal} · nota ${dato1} · presión ${dato2}`;
    case 0xb0:
      return `Cambio de Control · canal ${canal} · controlador ${dato1} · valor ${dato2}`;
    case 0xc0:
      return `Cambio de Programa · canal ${canal} · programa ${dato1}`;
    case 0xd0:
      return `Presión de Canal · canal ${canal} · presión ${dato1}`;
    case 0xe0:
      return `Pitch Bend · canal ${canal} · valor ${(dato2 << 7) | dato1}`;
    default:
      return `Mensaje MIDI sin reconocer: [${datos.map(hexadecimal).join(", ")}]`;
  }
}
