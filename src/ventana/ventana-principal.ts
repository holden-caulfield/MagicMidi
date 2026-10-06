import { css, html, type TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { type IconNode, List, Plug, Workflow } from "lucide";

import { Componente } from "@/componentes/componente";
import { dibujarIcono } from "@/componentes/icono";
import "@/conexion/barra-de-estado";
import "@/conexion/panel-conexion";
import { ControladorDeEstado } from "@/estado/controlador";
import { actualizar, estado } from "@/estado/estado";
import "@/log/panel-log";
import "@/workflow/editor/panel-workflow";

interface Panel {
  id: string;
  titulo: string;
  icono: IconNode;
  contenido: () => TemplateResult;
}

// La única fuente de los paneles: de acá salen la barra, las secciones y los
// atributos ARIA que los enlazan.
const PANELES: Panel[] = [
  {
    id: "conexion",
    titulo: "Conexión",
    icono: Plug,
    contenido: () => html`<panel-conexion></panel-conexion>`,
  },
  {
    id: "workflow",
    titulo: "Workflow",
    icono: Workflow,
    contenido: () => html`<panel-workflow></panel-workflow>`,
  },
  { id: "log", titulo: "Log", icono: List, contenido: () => html`<panel-log></panel-log>` },
];

const estilosDeLaBarraDeTabs = css`
  .barra-tabs {
    display: flex;
    justify-content: center;
    padding: 4px 10px;
    /* El borde de arriba la separa de la barra de título de la ventana, que
       en macOS tiene el mismo color. */
    border-top: 1px solid var(--borde-suave);
    border-bottom: 1px solid var(--borde-suave);
    background-color: var(--fondo-hundido);
  }

  /* Una tira de tabs pegados, separados por una línea fina. El activo toma el
     fondo de la ventana, como si fuera parte del panel que muestra. */
  .selector {
    display: flex;
    border: 1px solid var(--borde-suave);
  }

  .selector button {
    display: flex;
    align-items: center;
    gap: 5px;
    margin: 0;
    padding: 1px 12px;
    border: none;
    border-radius: 0;
    background-color: transparent;
    color: var(--letra-secundaria);
    font: inherit;
    font-weight: 500;
    cursor: pointer;
    outline: none;
  }

  .selector button + button {
    border-left: 1px solid var(--borde-suave);
  }

  .selector button:hover {
    color: inherit;
  }

  .selector button[aria-selected="true"] {
    background-color: var(--fondo-ventana);
    color: inherit;
  }

  .selector button:focus-visible {
    color: inherit;
    outline: 1.5px solid var(--ambar);
    outline-offset: -1.5px;
  }
`;

const estilosDeLosPaneles = css`
  .contenedor {
    flex: 1;
    min-height: 0;
    display: flex;
  }

  .panel {
    flex: 1;
    min-width: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

/**
 * La raíz de la interfaz. Dibuja la barra de tabs y las secciones de los
 * paneles en la misma raíz porque se enlazan por `id` (`aria-controls`,
 * `aria-labelledby`), y eso no cruza de un shadow root a otro.
 */
@customElement("ventana-principal")
export class VentanaPrincipal extends Componente {
  static styles = [
    css`
      /* La ventana no se desplaza nunca: cada panel acomoda su contenido al
         lugar que tiene. Con 100dvh, WebKit se quedaba con una medida vieja
         al entrar y salir de pantalla completa; position: fixed ata la raíz
         a la ventana. */
      :host {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
      }
    `,
    estilosDeLaBarraDeTabs,
    estilosDeLosPaneles,
  ];

  constructor() {
    super();
    new ControladorDeEstado(this);
  }

  // La barra de tabs va primera para que el recorrido con el teclado siga el
  // orden visual.
  render() {
    return html`
      ${this.barraDeTabs()}
      ${this.paneles()}
      <barra-de-estado></barra-de-estado>
    `;
  }

  private barraDeTabs() {
    return html`
      <div class="barra-tabs">
        <div class="selector" role="tablist" aria-label="Secciones">
          ${PANELES.map(
            (panel) => html`
              <button
                id="tab-${panel.id}"
                type="button"
                role="tab"
                aria-controls="panel-${panel.id}"
                aria-selected=${panel.id === estado.panelActivo}
                @click=${() => actualizar({ panelActivo: panel.id })}
              >
                ${dibujarIcono(panel.icono, 13)} ${panel.titulo}
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }

  // Un panel oculto se oculta con `hidden`, nunca dejando de dibujarlo: el log
  // tiene que seguir juntando mensajes aunque no esté a la vista.
  private paneles() {
    return html`
      <main class="contenedor">
        ${PANELES.map(
          (panel) => html`
            <section
              id="panel-${panel.id}"
              class="panel"
              role="tabpanel"
              aria-labelledby="tab-${panel.id}"
              ?hidden=${estado.panelActivo !== panel.id}
            >
              ${panel.contenido()}
            </section>
          `,
        )}
      </main>
    `;
  }
}
