import { html } from "lit";

import "@/componentes/campo-secuencia";
import { type Modo, MODOS_POR_DEFECTO } from "@/componentes/modo-numerico";
import { formato } from "@/formato";
import type { Declaracion, Parametro } from "./parametro";

export interface DeclaracionDeSecuencia extends Declaracion<number[]> {
  minimo: number;
  maximo: number;
  /** Los modos de todos los valores, como en el entero. */
  modos?: Modo[];
}

/**
 * Una lista de números enteros en orden, que se pueden repetir, entre un
 * mínimo y un máximo, con un valor por fila. Como el entero, lleva sus modos
 * ya resueltos.
 */
export function secuencia(
  declaracion: DeclaracionDeSecuencia,
): Parametro<number[]> & DeclaracionDeSecuencia {
  const { etiqueta, minimo, maximo, modos = MODOS_POR_DEFECTO } = declaracion;
  return {
    ...declaracion,
    modos,
    validar(valor) {
      if (!Array.isArray(valor) || !valor.every((numero) => Number.isInteger(numero))) {
        return "Tiene que ser una lista de números enteros";
      }
      if (valor.length === 0) {
        return "Tiene que tener al menos un valor";
      }
      const afuera = valor.find((numero) => numero < minimo || numero > maximo);
      if (afuera !== undefined) {
        return formato`Los valores tienen que ir de ${minimo} a ${maximo}, y hay un ${afuera}`;
      }
      return null;
    },
    dibujar: (valor, error, estado) =>
      html`<campo-secuencia
        etiqueta=${etiqueta}
        .valor=${valor}
        .error=${error}
        .modos=${modos}
        .minimo=${minimo}
        .maximo=${maximo}
        .estado=${estado}
      ></campo-secuencia>`,
  };
}
