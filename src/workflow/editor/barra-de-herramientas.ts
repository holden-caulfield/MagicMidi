import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { compartidos } from "@/estilos/compartidos";
import { etapaDelTipo, TIPOS_DE_NODO, type IdDeTipo } from "../nodos/catalogo";
import { dibujarIcono } from "../iconos";
import { estilosDelGlobo } from "./globo";
import { FORMATO_ARRASTRE } from "./lienzo";

/** Pide una caja nueva con el evento `agregar-caja`, con el tipo elegido. */
@customElement("barra-de-herramientas")
export class BarraDeHerramientas extends LitElement {
  static styles = [
    compartidos,
    estilosDelGlobo,
    css`
      :host {
        display: block;
      }

      .barra {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1;
        /* Los 2px de más compensan que el ícono es más bajo que la línea de
           texto que llevaba antes, para que el botón conserve su altura. */
        padding: calc(0.6em + 2px);
      }

      .caja-fin {
        border-color: var(--borde-boton-fin);
        background-color: var(--fondo-boton-fin);
      }

      button:hover .globo,
      button:focus-visible .globo {
        opacity: 1;
      }
    `,
  ];

  render() {
    const ids = Object.keys(TIPOS_DE_NODO) as IdDeTipo[];
    return html`
      <div class="barra" role="toolbar" aria-label="Cajas para agregar">
        ${ids.map((id) => {
          const tipo = TIPOS_DE_NODO[id];
          return html`
            <button
              type="button"
              class="caja-${etapaDelTipo(tipo)}"
              aria-label=${tipo.nombre}
              draggable="true"
              @dragstart=${(evento: DragEvent) => evento.dataTransfer?.setData(FORMATO_ARRASTRE, id)}
              @click=${() => this.pedirCaja(id)}
            >
              ${dibujarIcono(tipo.icono)}
              <span class="globo" aria-hidden="true">${tipo.nombre}</span>
            </button>
          `;
        })}
      </div>
    `;
  }

  private pedirCaja(id: IdDeTipo) {
    this.dispatchEvent(new CustomEvent("agregar-caja", { detail: id, bubbles: true, composed: true }));
  }
}
