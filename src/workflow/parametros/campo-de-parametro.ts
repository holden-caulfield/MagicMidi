import { css, html, LitElement, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";

import { compartidos } from "@/estilos/compartidos";

/** Lo que declara todo parámetro, sea del tipo que sea. */
export interface ParametroBase<T> {
  clave: string;
  etiqueta: string;
  inicial: T;
}

/**
 * La base del control de cada tipo de parámetro: pone la etiqueta (enlazada al
 * control, que tiene que llevar `id="control"`) y los estilos de campo. Cada
 * tipo escribe solo `control()` y llama a `avisarCambio` con el valor nuevo.
 */
export abstract class CampoDeParametro<P extends ParametroBase<V>, V> extends LitElement {
  static styles = [
    compartidos,
    css`
      :host {
        display: block;
      }

      .campo {
        flex: none;
      }

      .en-linea {
        flex-direction: row;
        align-items: center;
      }
    `,
  ];

  @property({ attribute: false }) parametro!: P;
  @property({ attribute: false }) valor!: V;

  /** Con `true`, el control va antes de la etiqueta y en la misma línea, como una casilla. */
  protected enLinea = false;

  protected abstract control(): TemplateResult;

  protected avisarCambio(valor: V) {
    this.dispatchEvent(new CustomEvent("cambio", { detail: valor, bubbles: true }));
  }

  render() {
    const etiqueta = html`<label for="control">${this.parametro.etiqueta}</label>`;
    return this.enLinea
      ? html`<div class="campo en-linea">${this.control()}${etiqueta}</div>`
      : html`<div class="campo">${etiqueta}${this.control()}</div>`;
  }
}
