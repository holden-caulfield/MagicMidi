import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { List, Plug, Workflow } from "lucide";

import { barraDeEstado, estilosDeLaBarraDeEstado } from "@/conexion/conexion";
import "@/conexion/panel-conexion";
import { ControladorDeEstado } from "@/estado/controlador";
import { estado } from "@/estado/estado";
import { compartidos } from "@/estilos/compartidos";
import "@/log/panel-log";
import "@/workflow/editor/panel-workflow";
import { barraDeTabs, estilosDeLaBarraDeTabs, type Panel } from "./barra-de-tabs";

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

@customElement("ventana-principal")
export class VentanaPrincipal extends LitElement {
  static styles = [
    compartidos,
    estilosDeLaBarraDeEstado,
    estilosDeLaBarraDeTabs,
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
    `,
  ];

  constructor() {
    super();
    new ControladorDeEstado(this);
  }

  // Un panel oculto se oculta con `hidden`, nunca dejando de dibujarlo: el log
  // tiene que seguir juntando mensajes aunque no esté a la vista. La barra de
  // tabs va primera para que el recorrido con el teclado siga el orden visual.
  render() {
    return html`
      ${barraDeTabs(PANELES, estado.panelActivo)}

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

      ${barraDeEstado()}
    `;
  }
}
