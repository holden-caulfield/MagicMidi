import { html, nothing, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";

import { Componente } from "./componente";
import { estilosBase } from "./estilos";

/**
 * La base de los campos: pone la etiqueta (enlazada al control, que tiene que
 * llevar `id="control"`), el error debajo del control y los atributos ARIA que
 * los unen. Todo queda en la raíz del campo, porque `<label for>` y
 * `aria-describedby` no cruzan de un shadow root a otro. Cada campo escribe
 * solo `control()` y avisa el valor nuevo con `avisar`.
 */
export abstract class Campo<V> extends Componente {
  static styles = estilosBase;

  @property() etiqueta = "";
  /** El texto del error, o `null`. */
  @property({ attribute: false }) error: string | null = null;
  /**
   * Si no es `null`, junto a la etiqueta va un botón que muestra la
   * `abreviatura` y se anuncia con el `nombre`. Al activarlo, el campo avisa
   * `siguiente-modo`: qué cambia lo decide quien lo usa.
   */
  @property({ attribute: false }) modo: { abreviatura: string; nombre: string } | null = null;

  /** Con `true`, el control va antes de la etiqueta y en la misma línea, como una casilla. */
  protected enLinea = false;

  /**
   * Con `true`, el control es un grupo de varios controles, cada uno con su
   * texto: la etiqueta nombra al grupo en lugar de apuntar a un control, porque
   * un `<label for>` solo puede apuntar a uno. El elemento que agrupa lleva
   * `id="control"` igual.
   */
  protected esGrupo = false;

  protected abstract control(): TemplateResult;

  /** Avisa el valor nuevo con el evento `cambio`. El campo no lo guarda: lo recibe de vuelta. */
  protected avisar(valor: V) {
    this.dispatchEvent(new CustomEvent("cambio", { detail: valor }));
  }

  render() {
    const texto = this.esGrupo
      ? html`<span id="etiqueta" class="etiqueta">${this.etiqueta}</span>`
      : html`<label for="control" class="etiqueta">${this.etiqueta}</label>`;
    const etiqueta = this.modo
      ? html`<div class="fila-de-etiqueta">${texto}${this.botonDeModo(this.modo)}</div>`
      : texto;
    const error = this.error ? html`<p id="error" class="error">${this.error}</p>` : nothing;
    return this.enLinea
      ? html`<div class="campo en-linea">${this.control()}${etiqueta}</div>${error}`
      : html`<div class="campo">${etiqueta}${this.control()}${error}</div>`;
  }

  private botonDeModo({ abreviatura, nombre }: { abreviatura: string; nombre: string }) {
    return html`
      <button
        type="button"
        class="control modo"
        aria-label="Modo de ${this.etiqueta}: ${nombre}"
        @click=${() => this.dispatchEvent(new CustomEvent("siguiente-modo"))}
      >
        ${abreviatura}
      </button>
    `;
  }

  // Los atributos van sobre el control que dibuja cada campo, así ninguno
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
