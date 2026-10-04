import { html } from "lit";
import { customElement } from "lit/decorators.js";

import "@/componentes/campo-lista";
import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

type Valor = number | string | boolean;

// Genérico para que el valor inicial y los de las opciones sean del mismo tipo.
export interface ParametroLista<T extends Valor> extends ParametroBase<T> {
  tipo: "lista";
  opciones: { valor: T; texto: string }[];
}

@customElement("parametro-lista")
export class CampoLista extends CampoDeParametro<ParametroLista<Valor>, Valor> {
  render() {
    return html`
      <campo-lista
        etiqueta=${this.parametro.etiqueta}
        .opciones=${this.parametro.opciones}
        .valor=${this.valor}
        .error=${this.error}
        @cambio=${(evento: CustomEvent<Valor>) => this.avisarCambio(evento.detail)}
      ></campo-lista>
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
