import { MensajeMidi } from "./mensaje";

// El pedal va primero: con el sustain apretado, All Notes Off deja sonando las
// notas. Van All Sound Off y All Notes Off porque hay equipos que responden a
// uno solo de los dos.
const CONTROLES_DEL_PANICO = [
  64, // Pedal de sustain
  120, // All Sound Off
  121, // Reset All Controllers
  123, // All Notes Off
];

/**
 * Lo que apaga todo en el equipo conectado a la salida: los cuatro controles
 * del pánico con valor 0, canal por canal, del 1 al 16. Son mensajes nuevos en
 * cada llamada, así quien los recibe los puede modificar.
 */
export function mensajesDePanico(): MensajeMidi[] {
  return Array.from({ length: 16 }, (_, canal) =>
    CONTROLES_DEL_PANICO.map((control) => new MensajeMidi([0xb0 + canal, control, 0])),
  ).flat();
}
