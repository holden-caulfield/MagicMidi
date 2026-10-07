import { html } from "lit";

import "@/componentes/campo-opciones";
import type { Texto } from "@/formato";
import type { ParametroBase } from "./parametro";

type Valor = number | string;

/** Varias opciones de una lista cerrada, todas a la vista: para pocas opciones de texto corto. */
export interface ParametroDeOpciones<T extends Valor> extends ParametroBase<T[]> {
  tipo: "opciones";
  opciones: { valor: T; texto: string }[];
}

/** Si el valor le sirve al parámetro: `null`, o el texto del error. */
export function validar(parametro: ParametroDeOpciones<Valor>, valor: Valor[]): string | null {
  const valores = parametro.opciones.map((opcion) => opcion.valor);
  if (
    !Array.isArray(valor) ||
    valor.some((elegida) => !valores.includes(elegida)) ||
    new Set(valor).size !== valor.length
  ) {
    return "Tiene que tener solo opciones de la lista, sin repetir";
  }
  return null;
}

export default {
  validar,
  dibujar: (parametro: ParametroDeOpciones<Valor>, valor: Valor[], error: Texto | null) =>
    html`<campo-opciones
      etiqueta=${parametro.etiqueta}
      .opciones=${parametro.opciones}
      .valor=${valor}
      .error=${error}
    ></campo-opciones>`,
};
