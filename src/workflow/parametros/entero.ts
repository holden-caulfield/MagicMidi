import { html } from "lit";

import "@/componentes/campo-numero";
import { type Modo, MODOS_POR_DEFECTO } from "@/componentes/modo-numerico";
import { formato } from "@/formato";
import type { Declaracion, Parametro } from "./parametro";

export interface DeclaracionDeEntero extends Declaracion<number> {
  /** Si se omite, no hay mínimo. */
  minimo?: number;
  /** Si se omite, no hay máximo. */
  maximo?: number;
  /**
   * Los modos en que se muestra y se escribe, en el orden en que rotan; el
   * primero es el de una caja nueva. Si se omite, son decimal, nota y
   * hexadecimal. La nota pide mínimo y máximo dentro de 0 a 127, y el
   * hexadecimal, un mínimo de 0 o más.
   */
  modos?: Modo[];
}

/**
 * Un número entero, con un rango opcional, que se muestra en decimal, como nota
 * o en hexadecimal. El parámetro lleva sus modos ya resueltos, así el test del
 * catálogo de nodos revisa que le entren.
 */
export function entero(declaracion: DeclaracionDeEntero): Parametro<number> & DeclaracionDeEntero {
  const { etiqueta, minimo, maximo, modos = MODOS_POR_DEFECTO } = declaracion;
  return {
    ...declaracion,
    modos,
    validar(valor) {
      if (!Number.isInteger(valor)) {
        return "Tiene que ser un número entero";
      }
      if (minimo !== undefined && maximo !== undefined && (valor < minimo || valor > maximo)) {
        return formato`Tiene que ir de ${minimo} a ${maximo}`;
      }
      if (minimo !== undefined && valor < minimo) {
        return formato`Tiene que ser ${minimo} o más`;
      }
      if (maximo !== undefined && valor > maximo) {
        return formato`Tiene que ser ${maximo} o menos`;
      }
      return null;
    },
    dibujar: (valor, error, estado) =>
      html`<campo-numero
        etiqueta=${etiqueta}
        .valor=${valor}
        .error=${error}
        .modos=${modos}
        .minimo=${minimo}
        .maximo=${maximo}
        .estado=${estado}
      ></campo-numero>`,
  };
}
