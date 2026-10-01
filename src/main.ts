import { html, render } from "lit";

import { indicadorDeEstado, inicializarConexion } from "@/conexion/conexion";
import "@/conexion/panel-conexion";
import { estado, suscribir } from "@/estado/estado";
import "@/log/panel-log";
import { barraDeTabs, type Panel } from "@/tabs";
import { inicializarWorkflow } from "@/workflow/ejecutar";
import "@/workflow/editor/panel-workflow";

const PANELES: Panel[] = [
  { id: "conexion", titulo: "Conexión", contenido: () => html`<panel-conexion></panel-conexion>` },
  { id: "log", titulo: "Log", contenido: () => html`<panel-log></panel-log>` },
  { id: "workflow", titulo: "Workflow", contenido: () => html`<panel-workflow></panel-workflow>` },
];

function ventana() {
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

window.addEventListener("DOMContentLoaded", async () => {
  const raiz = document.querySelector<HTMLElement>("#app")!;
  const dibujar = () => render(ventana(), raiz);

  suscribir(dibujar);
  dibujar();

  await inicializarWorkflow();
  await inicializarConexion();
});
