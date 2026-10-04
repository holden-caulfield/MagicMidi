import { html } from "lit";
import { customElement } from "lit/decorators.js";

import "@/componentes/campo-autocompletar";
import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

type Valor = number | string;

/**
 * Varias opciones de una lista cerrada, que se buscan escribiendo: para listas
 * largas, que como píldoras ocuparían demasiado.
 */
export interface ParametroAutocompletar<T extends Valor> extends ParametroBase<T[]> {
  tipo: "autocompletar";
  opciones: { valor: T; texto: string }[];
  /** Se muestra debajo del campo cuando no hay ninguna elegida, por ejemplo "Cualquier tipo". */
  textoDeAyuda?: string;
}

/** El texto del error si el valor no le sirve al parámetro, o `null`. */
export function error(parametro: ParametroAutocompletar<Valor>, valor: Valor[]): string | null {
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

@customElement("parametro-autocompletar")
export class CampoAutocompletar extends CampoDeParametro<ParametroAutocompletar<Valor>, Valor[]> {
  render() {
    return html`
      <campo-autocompletar
        etiqueta=${this.parametro.etiqueta}
        .opciones=${this.parametro.opciones}
        .valor=${this.valor}
        .textoDeAyuda=${this.parametro.textoDeAyuda}
        .error=${this.error}
        @cambio=${(evento: CustomEvent<Valor[]>) => this.avisarCambio(evento.detail)}
      ></campo-autocompletar>
    `;
  }
}

export default {
  error,
  dibujar: (parametro: ParametroAutocompletar<Valor>, valor: Valor[], error: string | null) =>
    html`<parametro-autocompletar
      .parametro=${parametro}
      .valor=${valor}
      .error=${error}
    ></parametro-autocompletar>`,
};
