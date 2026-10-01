import { Send } from "lucide";

import type { TipoDeNodo } from "../tipos";

export default {
  nombre: "Emitir",
  icono: Send,
  tieneSalida: false,
  parametros: [],
  // Emitir no tiene salida hacia otras cajas: lo que devuelve es lo que sale
  // por el puerto MIDI, y el envío lo hace la aplicación.
  procesar(mensaje) {
    return mensaje;
  },
} satisfies TipoDeNodo;
