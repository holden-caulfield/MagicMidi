import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { Check } from "lucide";

import { dibujarIcono } from "@/workflow/iconos";
import { Campo } from "./campo";

/** Sí o no, con una casilla antes de la etiqueta. */
@customElement("campo-interruptor")
export class CampoInterruptor extends Campo<boolean> {
  static styles = [
    ...Campo.styles,
    css`
      .casilla {
        position: relative;
        width: 14px;
        height: 14px;
        display: grid;
        place-items: center;
        border-radius: 2px;
        background-color: var(--fondo-control);
        color: var(--letra-sobre-ambar);
      }

      .casilla:has(:checked) {
        background-color: var(--ambar);
      }

      .casilla:has(:focus-visible) {
        outline: 1.5px solid var(--ambar);
        outline-offset: 1px;
      }

      .casilla svg {
        opacity: 0;
        pointer-events: none;
      }

      .casilla:has(:checked) svg {
        opacity: 1;
      }

      /* La casilla nativa sigue ahí para el teclado y el lector de pantalla,
         ocupando toda la caja para recibir los clics. */
      input {
        position: absolute;
        inset: 0;
        margin: 0;
        opacity: 0;
        cursor: pointer;
      }

      label {
        cursor: pointer;
        user-select: none;
      }
    `,
  ];

  @property({ attribute: false }) valor = false;

  protected enLinea = true;

  protected control() {
    return html`
      <span class="casilla">
        <input
          id="control"
          type="checkbox"
          .checked=${live(this.valor)}
          @change=${(evento: Event) => this.avisar((evento.target as HTMLInputElement).checked)}
        />
        ${dibujarIcono(Check, 11)}
      </span>
    `;
  }
}
