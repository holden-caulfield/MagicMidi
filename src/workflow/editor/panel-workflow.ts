import { css, html, LitElement } from "lit";
import { customElement, query } from "lit/decorators.js";

import type { IdDeTipo } from "../nodos/catalogo";
import "./barra-de-herramientas";
import type { LienzoWorkflow } from "./lienzo";
import "./lienzo";
import "./panel-de-configuracion";

@customElement("panel-workflow")
export class PanelWorkflow extends LitElement {
  static styles = css`
    :host {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
    }

    .ayuda {
      margin: 0;
      font-size: 11px;
      color: var(--letra-secundaria);
    }

    .area {
      flex: 1;
      min-height: 0;
      display: flex;
      gap: 10px;
    }
  `;

  @query("lienzo-workflow") private lienzo!: LienzoWorkflow;

  render() {
    return html`
      <barra-de-herramientas
        @agregar-caja=${(evento: CustomEvent<IdDeTipo>) => this.lienzo.agregarCaja(evento.detail)}
      ></barra-de-herramientas>
      <p class="ayuda">
        Cada mensaje sale tal cual, salvo que llegue a una caja naranja: Emitir manda lo que
        recibe y Descartar no manda nada. Para borrar una conexión, arrastrala desde su entrada
        y soltala en un lugar vacío.
      </p>
      <div class="area">
        <lienzo-workflow></lienzo-workflow>
        <panel-de-configuracion
          @eliminar-caja=${(evento: CustomEvent<string>) => this.lienzo.eliminarCaja(evento.detail)}
        ></panel-de-configuracion>
      </div>
    `;
  }
}
