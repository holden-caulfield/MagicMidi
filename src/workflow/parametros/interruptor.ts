import { html } from "lit";
import { customElement } from "lit/decorators.js";

import "@/componentes/campo-interruptor";
import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

export interface ParametroInterruptor extends ParametroBase<boolean> {
  tipo: "interruptor";
}

@customElement("parametro-interruptor")
export class CampoInterruptor extends CampoDeParametro<ParametroInterruptor, boolean> {
  render() {
    return html`
      <campo-interruptor
        etiqueta=${this.parametro.etiqueta}
        .valor=${this.valor}
        .error=${this.error}
        @cambio=${(evento: CustomEvent<boolean>) => this.avisarCambio(evento.detail)}
      ></campo-interruptor>
    `;
  }
}

export default {
  error: (_parametro: ParametroInterruptor, valor: boolean) =>
    typeof valor === "boolean" ? null : "Tiene que ser sí o no",
  dibujar: (parametro: ParametroInterruptor, valor: boolean, error: string | null) =>
    html`<parametro-interruptor .parametro=${parametro} .valor=${valor} .error=${error}></parametro-interruptor>`,
};
