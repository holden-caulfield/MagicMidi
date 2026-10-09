import { Siren } from "lucide";

import { mensajesDePanico } from "@/midi/panico";
import type { TipoDeNodo } from "../tipos";

export default {
  nombre: "Pánico",
  icono: Siren,
  tieneSalida: false,
  parametros: [],
  // Devuelve los mismos mensajes que el botón de pánico, sea cual sea el
  // mensaje que llega: para que la disparen solo algunos, va un Filtrar antes.
  procesar() {
    return mensajesDePanico();
  },
} satisfies TipoDeNodo;
