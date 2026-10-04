import { html } from "lit";
import { customElement } from "lit/decorators.js";

import "@/componentes/campo-rango";
import type { Rango } from "@/componentes/campo-rango";
import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

/** Dos extremos enteros, "desde" y "hasta", entre un mínimo y un máximo. */
export interface ParametroRango extends ParametroBase<Rango> {
  tipo: "rango";
  minimo: number;
  maximo: number;
  /** Si "desde" puede ser mayor que "hasta", para recorrer el rango al revés. */
  invertible: boolean;
}

/** El texto del error si el valor no le sirve al parámetro, o `null`. */
export function error(parametro: ParametroRango, valor: Rango): string | null {
  const { minimo, maximo, invertible } = parametro;
  const extremos = [valor?.desde, valor?.hasta];
  if (!extremos.every((extremo) => Number.isInteger(extremo))) {
    return "Tiene que ser un número entero";
  }
  if (extremos.some((extremo) => extremo < minimo || extremo > maximo)) {
    return `Tiene que ir de ${minimo} a ${maximo}`;
  }
  if (!invertible && valor.desde > valor.hasta) {
    return "Desde tiene que ser igual o menor que hasta";
  }
  return null;
}

@customElement("parametro-rango")
export class CampoRango extends CampoDeParametro<ParametroRango, Rango> {
  render() {
    return html`
      <campo-rango
        etiqueta=${this.parametro.etiqueta}
        .valor=${this.valor}
        .minimo=${this.parametro.minimo}
        .maximo=${this.parametro.maximo}
        .invertible=${this.parametro.invertible}
        .error=${this.error}
        @cambio=${(evento: CustomEvent<Rango>) => this.avisarCambio(evento.detail)}
      ></campo-rango>
    `;
  }
}

export default {
  error,
  dibujar: (parametro: ParametroRango, valor: Rango, error: string | null) =>
    html`<parametro-rango .parametro=${parametro} .valor=${valor} .error=${error}></parametro-rango>`,
};
