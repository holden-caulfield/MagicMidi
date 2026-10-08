import { html } from "lit";

import "@/componentes/campo-rango";
import type { Rango } from "@/componentes/campo-rango";
import type { ParametroBase } from "./parametro";
import type { Modo } from "@/componentes/modo-numerico";
import { formato, type Texto } from "@/formato";

/** Dos extremos enteros, "desde" y "hasta", entre un mínimo y un máximo. */
export interface ParametroRango extends ParametroBase<Rango> {
  tipo: "rango";
  minimo: number;
  maximo: number;
  /** Si "desde" puede ser mayor que "hasta", para recorrer el rango al revés. */
  invertible: boolean;
  /** Los modos de los dos extremos, como en el entero. */
  modos?: Modo[];
}

/** Si el valor le sirve al parámetro: `null`, o el texto del error. */
export function validar(parametro: ParametroRango, valor: Rango): Texto | null {
  const { minimo, maximo, invertible } = parametro;
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
}

export default {
  validar,
  dibujar: (parametro: ParametroRango, valor: Rango, error: Texto | null, estado: unknown) =>
    html`<campo-rango
      etiqueta=${parametro.etiqueta}
      .valor=${valor}
      .error=${error}
      .modos=${parametro.modos}
      .minimo=${parametro.minimo}
      .maximo=${parametro.maximo}
      .invertible=${parametro.invertible}
      .estado=${estado}
    ></campo-rango>`,
};
