import { TableProperties } from "lucide";

import type { Mapa } from "@/componentes/campo-mapa";
import { formato } from "@/formato";
import type { MensajeMidi } from "@/midi/mensaje";
import { lista } from "../parametros/lista";
import { mapa } from "../parametros/mapa";
import type { TipoDeNodo } from "../tipos";

// En el status, los 4 bits de arriba son el tipo de mensaje (con el leading
// bit) y los 4 de abajo, el canal menos 1.
const TIPO = 0b1111_0000;

// La opción "Canal" usa la posición del status (0), porque es ahí donde está
// el canal; los datos, la suya (1 y 2).
const BYTE_CANAL = 0;

/** El canal, o el byte de datos de esa posición; `null` si el mensaje no lo tiene. */
function leer(mensaje: MensajeMidi, posicion: number): number | null {
  if (posicion === BYTE_CANAL) {
    return mensaje.canal;
  }
  return posicion < mensaje.bytes.length ? mensaje.bytes[posicion] : null;
}

export default {
  nombre: "Mapear",
  icono: TableProperties,
  parametros: [
    lista({
      clave: "byte",
      etiqueta: "Byte",
      inicial: 1,
      opciones: [
        { valor: BYTE_CANAL, texto: "Canal" },
        { valor: 1, texto: "2.º (datos 1)" },
        { valor: 2, texto: "3.º (datos 2)" },
      ],
    }),
    // De 0 a 127: un byte de datos con el leading bit en 0. Con Canal, de 1
    // a 16 (lo revisa `validar`). Arranca en modo nota porque arranca en datos
    // 1, y lo más común es cambiar unas notas por otras.
    mapa({
      clave: "mapa",
      etiqueta: "Mapa",
      inicial: [],
      minimo: 0,
      maximo: 127,
      modos: ["nota", "decimal", "hexadecimal"],
      textoDeAyuda: "Sin pares: todo pasa sin cambios.",
    }),
  ],
  validar(parametros) {
    const fuera = (parametros.mapa as Mapa)
      .flatMap((par) => [par.entrada, par.salida])
      .find((valor) => valor < 1 || valor > 16);
    if (Number(parametros.byte) === BYTE_CANAL && fuera !== undefined) {
      // Los números van marcados como valores: el campo los escribe como
      // muestra los suyos.
      return [
        {
          clave: "mapa",
          mensaje: formato`Con Canal, los valores tienen que ir de ${1} a ${16}, y hay un ${fuera}`,
        },
      ];
    }
    return [];
  },
  procesar(mensaje, parametros) {
    const posicion = Number(parametros.byte);
    const valor = leer(mensaje, posicion);

    // Se busca una sola vez: la salida de un par no se vuelve a buscar como
    // entrada de otro, y así se pueden intercambiar dos valores. Lo que no
    // está en el mapa, o un mensaje sin el byte elegido, pasa sin cambios.
    const par = (parametros.mapa as Mapa).find((candidato) => candidato.entrada === valor);
    if (par === undefined) {
      return mensaje;
    }

    if (posicion === BYTE_CANAL) {
      // El canal 1 va como 0 en el byte, y el 16 como 15.
      mensaje.bytes[0] = (mensaje.bytes[0] & TIPO) | (par.salida - 1);
    } else {
      mensaje.bytes[posicion] = par.salida;
    }
    return mensaje;
  },
} satisfies TipoDeNodo;
