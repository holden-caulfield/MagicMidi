import { css, html, LitElement, nothing, type TemplateResult } from "lit";
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
 * control, que tiene que llevar `id="control"`), el error debajo del control y
 * los estilos de campo. Cada tipo escribe solo `control()` y llama a
 * `avisarCambio` con el valor nuevo.
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

      .etiqueta {
        font-size: 0.85em;
        font-weight: 600;
        opacity: 0.8;
      }

      .error {
        margin: 0;
        font-size: 0.85em;
        color: var(--letra-error);
      }
    `,
  ];

  @property({ attribute: false }) parametro!: P;
  @property({ attribute: false }) valor!: V;
  /** El texto del error de configuración de este parámetro, o `null`. */
  @property({ attribute: false }) error: string | null = null;

  /** Con `true`, el control va antes de la etiqueta y en la misma línea, como una casilla. */
  protected enLinea = false;

  /**
   * Con `true`, el control es un grupo de varios controles, cada uno con su
   * texto: la etiqueta nombra al grupo en lugar de apuntar a un control, porque
   * un `<label for>` solo puede apuntar a uno. El control tiene que llevar
   * `id="control"` igual, en el elemento que agrupa.
   */
  protected esGrupo = false;

  protected abstract control(): TemplateResult;

  protected avisarCambio(valor: V) {
    this.dispatchEvent(new CustomEvent("cambio", { detail: valor, bubbles: true }));
  }

  render() {
    const etiqueta = this.esGrupo
      ? html`<span id="etiqueta" class="etiqueta">${this.parametro.etiqueta}</span>`
      : html`<label for="control">${this.parametro.etiqueta}</label>`;
    const error = this.error ? html`<p id="error" class="error">${this.error}</p>` : nothing;
    return this.enLinea
      ? html`<div class="campo en-linea">${this.control()}${etiqueta}</div>${error}`
      : html`<div class="campo">${etiqueta}${this.control()}${error}</div>`;
  }

  // Los atributos van sobre el control que dibuja cada tipo, así ningún tipo
  // tiene que ocuparse de marcar su error.
  protected updated() {
    const control = this.renderRoot.querySelector("#control");
    if (!control) {
      return;
    }
    if (this.esGrupo) {
      control.setAttribute("role", "group");
      control.setAttribute("aria-labelledby", "etiqueta");
    }
    if (this.error) {
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", "error");
    } else {
      control.removeAttribute("aria-invalid");
      control.removeAttribute("aria-describedby");
    }
  }
}
