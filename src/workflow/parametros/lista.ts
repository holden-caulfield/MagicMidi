import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

type Valor = number | string | boolean;

// Genérico para que el valor inicial y los de las opciones sean del mismo tipo.
export interface ParametroLista<T extends Valor> extends ParametroBase<T> {
  tipo: "lista";
  opciones: { valor: T; texto: string }[];
}

@customElement("parametro-lista")
export class CampoLista extends CampoDeParametro<ParametroLista<Valor>, Valor> {
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
  error: (parametro: ParametroLista<Valor>, valor: Valor) =>
    parametro.opciones.some((opcion) => opcion.valor === valor)
      ? null
      : "Tiene que ser una de las opciones",
  dibujar: (parametro: ParametroLista<Valor>, valor: Valor, error: string | null) =>
    html`<parametro-lista
      .parametro=${parametro}
      .valor=${valor}
      .error=${error}
    ></parametro-lista>`,
};
