import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

export interface ParametroSiNo extends ParametroBase<boolean> {
  tipo: "si-no";
}

@customElement("parametro-si-no")
export class CampoSiNo extends CampoDeParametro<ParametroSiNo, boolean> {
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
  dibujar: (parametro: ParametroSiNo, valor: boolean) =>
    html`<parametro-si-no .parametro=${parametro} .valor=${valor}></parametro-si-no>`,
};
