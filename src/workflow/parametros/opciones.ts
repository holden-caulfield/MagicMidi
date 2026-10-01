import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

type Valor = number | string | boolean;

// Genérico para que el valor inicial y los de las opciones sean del mismo tipo.
export interface ParametroDeOpciones<T extends Valor> extends ParametroBase<T> {
  tipo: "opciones";
  opciones: { valor: T; texto: string }[];
}

@customElement("parametro-opciones")
export class CampoDeOpciones extends CampoDeParametro<ParametroDeOpciones<Valor>, Valor> {
  protected control() {
    return html`
      <select
        id="control"
        @change=${(evento: Event) => {
          const indice = (evento.target as HTMLSelectElement).selectedIndex;
          this.avisarCambio(this.parametro.opciones[indice].valor);
        }}
      >
        ${this.parametro.opciones.map(
          (opcion) =>
            html`<option .selected=${live(opcion.valor === this.valor)}>${opcion.texto}</option>`,
        )}
      </select>
    `;
  }
}

export default {
  dibujar: (parametro: ParametroDeOpciones<Valor>, valor: Valor) =>
    html`<parametro-opciones .parametro=${parametro} .valor=${valor}></parametro-opciones>`,
};
