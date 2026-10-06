import { css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import type { IconNode } from "lucide";

import { Componente } from "./componente";
import { estilosDeControl } from "./estilos";
import { dibujarIcono } from "./icono";

/**
 * Un botón de texto, con un ícono opcional. El texto va como contenido; si el
 * botón tiene solo ícono, `etiqueta` es su nombre accesible. Se escucha con
 * `click`, como un botón nativo.
 */
@customElement("boton-de-accion")
export class BotonDeAccion extends Componente {
  static styles = [
    estilosDeControl,
    css`
      :host {
        display: inline-flex;
      }

      /* Con la clase, para ganarle al alto y al padding comunes de .control. */
      button.control {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        height: 22px;
        padding: 0 10px;
        white-space: nowrap;
        cursor: pointer;
      }

      button.solo-icono {
        width: 22px;
        padding: 0;
      }

      button.activo,
      button.activo:hover:not(:disabled) {
        background-color: var(--ambar);
        color: var(--letra-sobre-ambar);
      }

      /* Más claro y no gris: sobre el gris de siempre, la letra oscura de lo
         encendido no se leería en modo oscuro. */
      button.activo:hover:not(:disabled) {
        background-color: var(--ambar-claro);
      }

      /* Mientras se aprieta, como un botón de Live que se enciende. Va al
         final y con la clase, para ganarle al puntero encima. */
      button.control:active:not(:disabled) {
        background-color: var(--ambar);
        color: var(--letra-apretado);
      }
    `,
  ];

  @property({ attribute: false }) icono?: IconNode;
  /** El nombre accesible cuando el botón tiene solo ícono. */
  @property() etiqueta?: string;
  @property({ type: Boolean }) activo = false;
  @property({ type: Boolean }) deshabilitado = false;

  constructor() {
    super();
    // El clic sobre el texto llega al host aunque el botón esté deshabilitado:
    // se corta antes de que lo vea quien escucha afuera.
    this.addEventListener(
      "click",
      (evento) => {
        if (this.deshabilitado) {
          evento.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
  }

  render() {
    const soloIcono = this.etiqueta !== undefined;
    return html`
      <button
        type="button"
        class="control ${soloIcono ? "solo-icono" : ""} ${this.activo ? "activo" : ""}"
        ?disabled=${this.deshabilitado}
        aria-label=${ifDefined(this.etiqueta)}
        title=${ifDefined(this.etiqueta)}
      >
        ${this.icono ? dibujarIcono(this.icono, 13) : nothing}
        <slot></slot>
      </button>
    `;
  }
}
