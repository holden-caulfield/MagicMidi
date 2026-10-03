import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

export interface ParametroInterruptor extends ParametroBase<boolean> {
  tipo: "interruptor";
}

@customElement("parametro-interruptor")
export class CampoInterruptor extends CampoDeParametro<ParametroInterruptor, boolean> {
  protected enLinea = true;

  protected control() {
    return html`
      <input
        id="control"
        type="checkbox"
        .checked=${live(this.valor)}
        @change=${(evento: Event) => this.avisarCambio((evento.target as HTMLInputElement).checked)}
      />
    `;
  }
}

export default {
  error: (_parametro: ParametroInterruptor, valor: boolean) =>
    typeof valor === "boolean" ? null : "Tiene que ser sí o no",
  dibujar: (parametro: ParametroInterruptor, valor: boolean, error: string | null) =>
    html`<parametro-interruptor .parametro=${parametro} .valor=${valor} .error=${error}></parametro-interruptor>`,
};
