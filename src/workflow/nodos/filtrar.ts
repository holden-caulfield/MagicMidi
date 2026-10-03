import { Filter } from "lucide";

import { NOMBRES_DE_TIPO, TIPOS_ELEGIBLES } from "@/midi/mensaje";
import type { ErrorDeConfiguracion, TipoDeNodo } from "../tipos";

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
    {
      clave: "tipos",
      etiqueta: "Tipos de mensaje",
      tipo: "autocompletar",
      inicial: [],
      opciones: TIPOS_ELEGIBLES.map((tipo) => ({ valor: tipo, texto: NOMBRES_DE_TIPO[tipo] })),
      textoDeAyuda: "Cualquier tipo",
    },
    {
      clave: "canales",
      etiqueta: "Canales",
      tipo: "opciones",
      inicial: [],
      opciones: Array.from({ length: 16 }, (_, indice) => ({
        valor: indice + 1,
        texto: String(indice + 1),
      })),
    },
    // Los rangos van de 0 a 127, como un byte de datos.
    { clave: "datos1Desde", etiqueta: "Datos 1 desde", tipo: "entero", inicial: 0, minimo: 0, maximo: 127 },
    { clave: "datos1Hasta", etiqueta: "Datos 1 hasta", tipo: "entero", inicial: 127, minimo: 0, maximo: 127 },
    { clave: "datos2Desde", etiqueta: "Datos 2 desde", tipo: "entero", inicial: 0, minimo: 0, maximo: 127 },
    { clave: "datos2Hasta", etiqueta: "Datos 2 hasta", tipo: "entero", inicial: 127, minimo: 0, maximo: 127 },
  ],
  validar(parametros) {
    const errores: ErrorDeConfiguracion[] = [];
    if (Number(parametros.datos1Desde) > Number(parametros.datos1Hasta)) {
      errores.push({ clave: "datos1Hasta", mensaje: "Tiene que ser igual o mayor que Datos 1 desde" });
    }
    if (Number(parametros.datos2Desde) > Number(parametros.datos2Hasta)) {
      errores.push({ clave: "datos2Hasta", mensaje: "Tiene que ser igual o mayor que Datos 2 desde" });
    }
    return errores;
  },
  procesar(mensaje, parametros) {
    // Los dos primeros parámetros son listas: hay que decírselo a TypeScript,
    // como `Number(…)` le dice que un entero es un número.
    const tipos = parametros.tipos as string[];
    const canales = parametros.canales as number[];

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
    if (!dentroDelRango(bytes[1], Number(parametros.datos1Desde), Number(parametros.datos1Hasta))) {
      return;
    }
    if (!dentroDelRango(bytes[2], Number(parametros.datos2Desde), Number(parametros.datos2Hasta))) {
      return;
    }
    return mensaje;
  },
} satisfies TipoDeNodo;
