import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { estilosDelIndicador, indicadorDeEstado } from "@/conexion/conexion";
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
  { id: "conexion", titulo: "Conexión", contenido: () => html`<panel-conexion></panel-conexion>` },
  { id: "log", titulo: "Log", contenido: () => html`<panel-log></panel-log>` },
  { id: "workflow", titulo: "Workflow", contenido: () => html`<panel-workflow></panel-workflow>` },
];

@customElement("ventana-principal")
export class VentanaPrincipal extends LitElement {
  static styles = [
    compartidos,
    estilosDelIndicador,
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

      .encabezado {
        padding: 1.25rem 1.5rem 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
        justify-content: space-between;
        align-items: baseline;
      }

      h1 {
        margin: 0;
        font-size: 1.6rem;
      }

      .contenedor {
        flex: 1;
        min-height: 0;
        display: flex;
        padding: 1.25rem 1.5rem 1.5rem;
      }

      .panel {
        flex: 1;
        min-width: 0;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        border: 1px solid rgba(127, 127, 127, 0.25);
        border-radius: 12px;
        padding: 1.25rem 1.5rem;
        background-color: rgba(127, 127, 127, 0.06);
      }
    `,
  ];

  constructor() {
    super();
    new ControladorDeEstado(this);
  }

  // Un panel oculto se oculta con `hidden`, nunca dejando de dibujarlo: el log
  // tiene que seguir juntando mensajes aunque no esté a la vista. La barra va
  // última para que el recorrido con el teclado siga el orden visual.
  render() {
    return html`
      <header class="encabezado">
        <h1>Tauri MIDI</h1>
        ${indicadorDeEstado()}
      </header>

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

      ${barraDeTabs(PANELES, estado.panelActivo)}
    `;
  }
}
