import { html } from "lit";

import { etapaDelTipo, TIPOS_DE_NODO, type IdDeTipo } from "./catalogo";
import "./editor/panel-de-configuracion";
import { dibujarIcono } from "./iconos";
import { agregarNodo, eliminarNodo, posicionDesdeEvento } from "./lienzo";

const FORMATO_ARRASTRE = "application/x-tipo-de-nodo";

function soltarEnElLienzo(evento: DragEvent) {
  const tipo = evento.dataTransfer?.getData(FORMATO_ARRASTRE);
  if (!tipo || !(tipo in TIPOS_DE_NODO)) return;
  evento.preventDefault();
  agregarNodo(tipo as IdDeTipo, posicionDesdeEvento(evento));
}

function barraDeHerramientas() {
  const ids = Object.keys(TIPOS_DE_NODO) as IdDeTipo[];
  return html`
    <div class="barra-herramientas" role="toolbar" aria-label="Cajas para agregar">
      ${ids.map((id) => {
        const tipo = TIPOS_DE_NODO[id];
        return html`
          <button
            type="button"
            class="caja-${etapaDelTipo(tipo)}"
            aria-label=${tipo.nombre}
            draggable="true"
            @dragstart=${(evento: DragEvent) => evento.dataTransfer?.setData(FORMATO_ARRASTRE, id)}
            @click=${() => agregarNodo(id)}
          >
            ${dibujarIcono(tipo.icono)}
            <span class="globo" aria-hidden="true">${tipo.nombre}</span>
          </button>
        `;
      })}
    </div>
  `;
}

export function panelWorkflow() {
  return html`
    ${barraDeHerramientas()}
    <p class="ayuda-workflow">
      Cada mensaje sale tal cual, salvo que llegue a una caja naranja: Emitir manda lo que
      recibe y Descartar no manda nada. Para borrar una conexión, arrastrala desde su entrada
      y soltala en un lugar vacío.
    </p>
    <div class="area-workflow">
      <div
        id="lienzo-workflow"
        class="lienzo"
        @dragover=${(evento: DragEvent) => evento.preventDefault()}
        @drop=${soltarEnElLienzo}
      ></div>
      <panel-de-configuracion
        @eliminar-caja=${(evento: CustomEvent<string>) => eliminarNodo(evento.detail)}
      ></panel-de-configuracion>
    </div>
  `;
}
