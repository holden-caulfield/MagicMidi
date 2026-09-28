import { invoke } from "@tauri-apps/api/core";

import type { MensajeMidi } from "./tipos";

// `invoke` es asincrónico y nada garantiza que dos pedidos simultáneos lleguen
// al backend en orden, así que cada envío espera al anterior.
let ultimoEnvio: Promise<void> = Promise.resolve();

let enviosRecolectados: MensajeMidi[] | null = null;

export function enviarMensaje(datos: MensajeMidi) {
  enviosRecolectados?.push([...datos]);
  ultimoEnvio = ultimoEnvio
    .then(() => invoke<void>("enviar_mensaje", { datos }))
    .catch((error) => console.error("No se pudo enviar el mensaje MIDI:", error));
}

/**
 * Corre `procesar` y devuelve, en orden, lo que se mandó a la salida mientras
 * corría. Alcanza con esto porque el recorrido del flujo es sincrónico: todo lo
 * que se envía durante la llamada salió del mismo mensaje de entrada.
 */
export function recolectarEnvios(procesar: () => void): MensajeMidi[] {
  const recolectados: MensajeMidi[] = [];
  enviosRecolectados = recolectados;
  try {
    procesar();
  } finally {
    enviosRecolectados = null;
  }
  return recolectados;
}
