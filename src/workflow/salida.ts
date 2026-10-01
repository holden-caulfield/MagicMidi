import { invoke } from "@tauri-apps/api/core";

import type { MensajeMidi } from "@/midi/mensaje";

// `invoke` es asincrónico y nada garantiza que dos pedidos simultáneos lleguen
// al backend en orden, así que cada envío espera al anterior.
let ultimoEnvio: Promise<void> = Promise.resolve();

export function enviarMensaje(mensaje: MensajeMidi) {
  ultimoEnvio = ultimoEnvio
    .then(() => invoke<void>("enviar_mensaje", { datos: mensaje.bytes }))
    .catch((error) => console.error("No se pudo enviar el mensaje MIDI:", error));
}
