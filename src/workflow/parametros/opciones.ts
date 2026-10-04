import { html } from "lit";
import { customElement } from "lit/decorators.js";

import "@/componentes/campo-opciones";
import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

type Valor = number | string;

/** Varias opciones de una lista cerrada, todas a la vista: para pocas opciones de texto corto. */
export interface ParametroDeOpciones<T extends Valor> extends ParametroBase<T[]> {
  tipo: "opciones";
  opciones: { valor: T; texto: string }[];
}

/** El texto del error si el valor no le sirve al parámetro, o `null`. */
export function error(parametro: ParametroDeOpciones<Valor>, valor: Valor[]): string | null {
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

@customElement("parametro-opciones")
export class CampoDeOpciones extends CampoDeParametro<ParametroDeOpciones<Valor>, Valor[]> {
  render() {
    return html`
      <campo-opciones
        etiqueta=${this.parametro.etiqueta}
        .opciones=${this.parametro.opciones}
        .valor=${this.valor}
        .error=${this.error}
        @cambio=${(evento: CustomEvent<Valor[]>) => this.avisarCambio(evento.detail)}
      ></campo-opciones>
    `;
  }
}

export default {
  error,
  dibujar: (parametro: ParametroDeOpciones<Valor>, valor: Valor[], error: string | null) =>
    html`<parametro-opciones
      .parametro=${parametro}
      .valor=${valor}
      .error=${error}
    ></parametro-opciones>`,
};
