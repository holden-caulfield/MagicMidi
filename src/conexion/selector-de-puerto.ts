import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { Puerto } from "@/estado/estado";
import { compartidos } from "@/estilos/compartidos";
import { conNombresAMostrar } from "./conexion";

/** Avisa el `id` del puerto elegido con el evento `cambio`. */
@customElement("selector-de-puerto")
export class SelectorDePuerto extends LitElement {
  static styles = [
    compartidos,
    css`
      :host {
        display: flex;
        flex: 1 1 220px;
      }
    `,
  ];

  @property() etiqueta = "";
  @property({ attribute: false }) puertos: Puerto[] = [];
  /** El `id` del puerto elegido, o "" si no hay ninguno. */
  @property() elegido = "";
  @property({ type: Boolean }) deshabilitado = false;

  render() {
    return html`
      <div class="campo">
        <label for="puerto">${this.etiqueta}</label>
        <select id="puerto" ?disabled=${this.deshabilitado} @change=${this.elegir}>
          ${this.puertos.length === 0
            ? html`<option disabled selected>No hay puertos disponibles</option>`
            : html`
                <option value="" disabled .selected=${this.elegido === ""}>Elegí un puerto</option>
                ${conNombresAMostrar(this.puertos).map(
                  (puerto) =>
                    html`<option value=${puerto.id} .selected=${puerto.id === this.elegido}>${puerto.nombre}</option>`,
                )}
              `}
        </select>
      </div>
    `;
  }

  private elegir(evento: Event) {
    const id = (evento.target as HTMLSelectElement).value;
    this.dispatchEvent(new CustomEvent("cambio", { detail: id }));
  }
}
