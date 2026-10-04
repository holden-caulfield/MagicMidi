import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { Campo } from "./campo";

/**
 * Un número escrito. Avisa el texto tal como se escribió, al salir del campo:
 * interpretarlo le toca a quien lo usa, que devuelve el valor que corresponde.
 *
 * Es un campo de texto y no uno numérico: uno numérico decide por su cuenta
 * qué acepta (por ejemplo, qué separador de decimales, según el idioma del
 * sistema), y lo que no le gusta lo avisa vacío.
 */
@customElement("campo-numero")
export class CampoNumero extends Campo<string> {
  static styles = [
    ...Campo.styles,
    css`
      input {
        width: 64px;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }

      :host([compacto]) input {
        width: 36px;
        height: 18px;
        padding: 0 3px;
        font-size: 11px;
      }
    `,
  ];

  @property() valor = "";
  /** Si acepta decimales: en una pantalla táctil, cambia el teclado que aparece. */
  @property({ type: Boolean }) decimales = false;
  /** Más chico, para ir dentro de otro control (como el rango). */
  @property({ type: Boolean, reflect: true }) compacto = false;
  /** La etiqueta queda solo para los lectores de pantalla. */
  @property({ type: Boolean }) etiquetaOculta = false;

  protected control() {
    return html`
      <input
        id="control"
        class="control"
        type="text"
        inputmode=${this.decimales ? "decimal" : "numeric"}
        autocomplete="off"
        .value=${live(this.valor)}
        @change=${(evento: Event) => {
          this.avisar((evento.target as HTMLInputElement).value);
          // Si quien lo usa no aceptó lo escrito, no le pasa un valor nuevo y
          // Lit no redibujaría: así el campo vuelve a mostrar el que tiene.
          this.requestUpdate();
        }}
      />
    `;
  }

  render() {
    if (!this.etiquetaOculta) {
      return super.render();
    }
    return html`
      <label for="control" class="texto-oculto">${this.etiqueta}</label>
      ${this.control()}
    `;
  }
}
