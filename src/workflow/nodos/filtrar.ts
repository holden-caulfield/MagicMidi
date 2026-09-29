import { Filter } from "lucide";

import { NOMBRES_DE_TIPO, type TipoDeNodo, TIPOS_ELEGIBLES } from "../tipos";

export default {
  nombre: "Filtrar",
  icono: Filter,
  // Una casilla por tipo de mensaje. La clave de cada una es el tipo mismo
  // ("nota-on", "cambio-de-control", …), así se busca directo con
  // `mensaje.tipo`.
  parametros: TIPOS_ELEGIBLES.map((tipo) => ({
    clave: tipo,
    etiqueta: NOMBRES_DE_TIPO[tipo],
    tipo: "si-no" as const,
    inicial: false,
  })),
  procesar(mensaje, parametros) {
    // Un mensaje "desconocido" no tiene casilla, así que nunca pasa.
    if (parametros[mensaje.tipo] === true) {
      return mensaje;
    }
    return;
  },
} satisfies TipoDeNodo;
