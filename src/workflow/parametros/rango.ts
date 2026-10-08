import { html } from "lit";

import "@/componentes/campo-rango";
import type { Rango } from "@/componentes/campo-rango";
import { type Modo, MODOS_POR_DEFECTO } from "@/componentes/modo-numerico";
import { formato } from "@/formato";
import type { Declaracion, Parametro } from "./parametro";

export interface DeclaracionDeRango extends Declaracion<Rango> {
  minimo: number;
  maximo: number;
  /** Si "desde" puede ser mayor que "hasta", para recorrer el rango al revés. */
  invertible: boolean;
  /** Los modos de los dos extremos, como en el entero. */
  modos?: Modo[];
}

/**
 * Dos extremos enteros, "desde" y "hasta", entre un mínimo y un máximo, con
 * una barra de dos perillas. Como el entero, lleva sus modos ya resueltos.
 */
export function rango(declaracion: DeclaracionDeRango): Parametro<Rango> & DeclaracionDeRango {
  const { etiqueta, minimo, maximo, invertible, modos = MODOS_POR_DEFECTO } = declaracion;
  return {
    ...declaracion,
    modos,
    validar(valor) {
      const extremos = [valor?.desde, valor?.hasta];
      if (!extremos.every((extremo) => Number.isInteger(extremo))) {
        return "Tiene que ser un número entero";
      }
      if (extremos.some((extremo) => extremo < minimo || extremo > maximo)) {
        return formato`Tiene que ir de ${minimo} a ${maximo}`;
      }
      if (!invertible && valor.desde > valor.hasta) {
        return "Desde tiene que ser igual o menor que hasta";
      }
      return null;
    },
    dibujar: (valor, error, estado) =>
      html`<campo-rango
        etiqueta=${etiqueta}
        .valor=${valor}
        .error=${error}
        .modos=${modos}
        .minimo=${minimo}
        .maximo=${maximo}
        .invertible=${invertible}
        .estado=${estado}
      ></campo-rango>`,
  };
}
