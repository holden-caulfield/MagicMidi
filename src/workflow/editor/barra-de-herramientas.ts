import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { dibujarIcono } from "@/componentes/icono";
import { compartidos } from "@/estilos/compartidos";
import { etapaDelTipo, TIPOS_DE_NODO, type IdDeTipo } from "../nodos/catalogo";
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
        gap: 4px;
        flex-wrap: wrap;
      }

      /* Cada control anticipa la caja que agrega: su fondo, su borde y su
         ícono oscuro, en los dos modos. */
      button {
        position: relative;
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        margin: 0;
        padding: 0;
        border: 1px solid var(--borde-caja);
        border-radius: 2px;
        background-color: var(--fondo-caja);
        color: var(--letra-caja);
        cursor: pointer;
        outline: none;
      }

      .caja-fin {
        border-color: var(--borde-fin);
        background-color: var(--fondo-fin);
      }

      button:hover {
        border-color: var(--ambar);
      }

      button:focus-visible {
        outline: 1.5px solid var(--ambar);
        outline-offset: 1px;
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
              ${dibujarIcono(tipo.icono, 15)}
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
