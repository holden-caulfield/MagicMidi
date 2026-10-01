import { Ban } from "lucide";

import type { TipoDeNodo } from "../tipos";

export default {
  nombre: "Descartar",
  icono: Ban,
  tieneSalida: false,
  parametros: [],
  // Como toda caja sin salida, llegar acá hace que el mensaje original no se
  // reenvíe; y como no devuelve nada, tampoco sale otra cosa en su lugar.
  procesar() {
    return;
  },
} satisfies TipoDeNodo;
