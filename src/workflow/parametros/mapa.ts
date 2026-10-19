import { html } from "lit";

import "@/componentes/campo-mapa";
import type { Mapa } from "@/componentes/campo-mapa";
import { type Modo, MODOS_POR_DEFECTO } from "@/componentes/modo-numerico";
import { formato } from "@/formato";
import type { Declaracion, Parametro } from "./parametro";

export interface DeclaracionDeMapa extends Declaracion<Mapa> {
  minimo: number;
  maximo: number;
  /** Los modos de todas las entradas y salidas, como en el entero. */
  modos?: Modo[];
  /**
   * Se muestra en lugar de los pares cuando no hay ninguno. Lo dice quien
   * declara el parámetro, porque lo que significa un mapa vacío depende de la
   * caja: en Mapear, "Sin pares: todo pasa sin cambios.".
   */
  textoDeAyuda?: string;
}

/**
 * Una lista de pares entrada → salida, de números enteros entre un mínimo y un
 * máximo. Una entrada no se repite: cada una lleva a una sola salida. Como el
 * entero, lleva sus modos ya resueltos.
 */
export function mapa(declaracion: DeclaracionDeMapa): Parametro<Mapa> & DeclaracionDeMapa {
  const { etiqueta, minimo, maximo, modos = MODOS_POR_DEFECTO, textoDeAyuda } = declaracion;
  return {
    ...declaracion,
    modos,
    validar(valor) {
      if (
        !Array.isArray(valor) ||
        !valor.every((par) => Number.isInteger(par?.entrada) && Number.isInteger(par?.salida))
      ) {
        return "Tiene que ser una lista de pares de números enteros";
      }
      const afuera = valor
        .flatMap((par) => [par.entrada, par.salida])
        .find((numero) => numero < minimo || numero > maximo);
      if (afuera !== undefined) {
        return formato`Los valores tienen que ir de ${minimo} a ${maximo}, y hay un ${afuera}`;
      }
      const repetido = valor.find(
        (par, posicion) => valor.findIndex((otro) => otro.entrada === par.entrada) !== posicion,
      );
      if (repetido) {
        return formato`La entrada ${repetido.entrada} está más de una vez`;
      }
      return null;
    },
    dibujar: (valor, error, estado) =>
      html`<campo-mapa
        etiqueta=${etiqueta}
        .valor=${valor}
        .error=${error}
        .modos=${modos}
        .minimo=${minimo}
        .maximo=${maximo}
        .textoDeAyuda=${textoDeAyuda}
        .estado=${estado}
      ></campo-mapa>`,
  };
}
