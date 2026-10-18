import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { List, Plug, Workflow } from "lucide";

import { Componente } from "@/componentes/componente";
import "@/conexion/panel-conexion";
import "@/log/panel-log";
import "@/workflow/editor/panel-workflow";
import "./barra-de-estado";
import "./boton-de-panico";
import "./navegacion-por-tabs";
import type { Panel } from "./navegacion-por-tabs";

// La única fuente de los paneles: de acá salen los tabs, las secciones y los
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

/**
 * La raíz de la interfaz: la estructura que está siempre presente, sea cual
 * sea el panel. Dibuja los tabs con sus paneles, a los que les pasa los
 * paneles de cada módulo y las acciones de la barra, y la barra de estado.
 */
@customElement("ventana-principal")
export class VentanaPrincipal extends Componente {
  static styles = css`
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
  `;

  render() {
    return html`
      <navegacion-por-tabs .paneles=${PANELES}>
        <boton-de-panico slot="acciones"></boton-de-panico>
      </navegacion-por-tabs>
      <barra-de-estado></barra-de-estado>
    `;
  }
}
