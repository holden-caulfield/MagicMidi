import { Filter } from "lucide";

import type { Rango } from "@/componentes/campo-rango";
import { NOMBRES_DE_TIPO, TIPOS_ELEGIBLES } from "@/midi/mensaje";
import { autocompletar } from "../parametros/autocompletar";
import { opciones } from "../parametros/opciones";
import { rango } from "../parametros/rango";
import type { TipoDeNodo } from "../tipos";

/**
 * Si el byte está entre `desde` y `hasta`, los dos incluidos. De 0 a 127 es el
 * rango completo, que no restringe nada, ni siquiera a un mensaje que no tiene
 * ese byte.
 */
function dentroDelRango(byte: number | undefined, desde: number, hasta: number): boolean {
  if (desde === 0 && hasta === 127) {
    return true;
  }
  return byte !== undefined && byte >= desde && byte <= hasta;
}

// Un mensaje pasa solo si cumple todos los criterios a la vez. Un criterio que
// no se configuró (nada elegido, o un rango de 0 a 127) no restringe nada.
export default {
  nombre: "Filtrar",
  icono: Filter,
  parametros: [
    autocompletar({
      clave: "tipos",
      etiqueta: "Tipos de mensaje",
      inicial: [],
      opciones: TIPOS_ELEGIBLES.map((tipo) => ({ valor: tipo, texto: NOMBRES_DE_TIPO[tipo] })),
      textoDeAyuda: "Cualquier tipo",
    }),
    opciones({
      clave: "canales",
      etiqueta: "Canales",
      inicial: [],
      opciones: Array.from({ length: 16 }, (_, indice) => ({
        valor: indice + 1,
        texto: String(indice + 1),
      })),
    }),
    // Los rangos van de 0 a 127, como un byte de datos, y no se pueden
    // invertir: "desde" mayor que "hasta" no dejaría pasar nada.
    rango({
      clave: "datos1",
      etiqueta: "Datos 1",
      inicial: { desde: 0, hasta: 127 },
      minimo: 0,
      maximo: 127,
      invertible: false,
    }),
    rango({
      clave: "datos2",
      etiqueta: "Datos 2",
      inicial: { desde: 0, hasta: 127 },
      minimo: 0,
      maximo: 127,
      invertible: false,
    }),
  ],
  procesar(mensaje, parametros) {
    // Hay que decirle a TypeScript qué es cada parámetro: dos listas y dos
    // rangos.
    const tipos = parametros.tipos as string[];
    const canales = parametros.canales as number[];
    const datos1 = parametros.datos1 as Rango;
    const datos2 = parametros.datos2 as Rango;

    // Un mensaje de un tipo que no se puede elegir (por ejemplo, desconocido)
    // no pasa si hay tipos elegidos.
    if (tipos.length > 0 && !tipos.includes(mensaje.tipo)) {
      return;
    }
    // Un mensaje sin canal (de sistema) no pasa si hay canales elegidos.
    if (canales.length > 0 && (mensaje.canal === null || !canales.includes(mensaje.canal))) {
      return;
    }
    const bytes = mensaje.bytes;
    if (!dentroDelRango(bytes[1], datos1.desde, datos1.hasta)) {
      return;
    }
    if (!dentroDelRango(bytes[2], datos2.desde, datos2.hasta)) {
      return;
    }
    return mensaje;
  },
} satisfies TipoDeNodo;
