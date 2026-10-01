import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

export interface ParametroEntero extends ParametroBase<number> {
  tipo: "entero";
}

/** El número escrito, o `null` si no es un entero (por ejemplo, "2.5" o nada). */
export function interpretar(texto: string): number | null {
  const numero = Number(texto);
  return texto.trim() !== "" && Number.isInteger(numero) ? numero : null;
}

@customElement("parametro-entero")
export class CampoEntero extends CampoDeParametro<ParametroEntero, number> {
  protected control() {
    return html`
      <input
        id="control"
        type="number"
        step="1"
        .value=${live(String(this.valor))}
        @change=${(evento: Event) => {
          const numero = interpretar((evento.target as HTMLInputElement).value);
          if (numero === null) {
            // Redibujar vuelve a mostrar el valor que la caja conserva.
            this.requestUpdate();
          } else {
            this.avisarCambio(numero);
          }
        }}
      />
    `;
  }
}

export default {
  valido: (_parametro: ParametroEntero, valor: number) => Number.isInteger(valor),
  dibujar: (parametro: ParametroEntero, valor: number) =>
    html`<parametro-entero .parametro=${parametro} .valor=${valor}></parametro-entero>`,
};
