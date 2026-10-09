import { css, html } from "lit";
import { customElement, query, state } from "lit/decorators.js";

import { Componente } from "@/componentes/componente";
import type { IdDeTipo } from "../nodos/catalogo";
import "./barra-de-herramientas";
import type { LienzoWorkflow } from "./lienzo";
import "./lienzo";
import "./panel-de-configuracion";

@customElement("panel-workflow")
export class PanelWorkflow extends Componente {
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

  // La selección la usan el lienzo, que la marca, y el panel de
  // configuración, que la muestra: vive acá, su contenedor común.
  @state() private nodoSeleccionado: string | null = null;

  @query("lienzo-workflow") private lienzo!: LienzoWorkflow;

  render() {
    return html`
      <barra-de-herramientas
        @agregar-caja=${(evento: CustomEvent<IdDeTipo>) => this.lienzo.agregarCaja(evento.detail)}
      ></barra-de-herramientas>
      <p class="ayuda">
        Para borrar una conexión, arrastrala desde su entrada y soltala en un lugar vacío.
      </p>
      <div class="area">
        <lienzo-workflow
          .nodoSeleccionado=${this.nodoSeleccionado}
          @seleccionar-caja=${(evento: CustomEvent<string | null>) =>
            (this.nodoSeleccionado = evento.detail)}
        ></lienzo-workflow>
        <panel-de-configuracion
          .nodoSeleccionado=${this.nodoSeleccionado}
          @eliminar-caja=${(evento: CustomEvent<string>) => this.eliminarCaja(evento.detail)}
        ></panel-de-configuracion>
      </div>
    `;
  }

  private async eliminarCaja(id: string) {
    await this.lienzo.eliminarCaja(id);
    if (this.nodoSeleccionado === id) this.nodoSeleccionado = null;
  }
}
