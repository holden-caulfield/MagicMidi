import { css, html, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { IconNode } from "lucide";

import { Componente } from "@/componentes/componente";
import { dibujarIcono } from "@/componentes/icono";

/** Un panel de la ventana: su tab y lo que muestra. */
export interface Panel {
  id: string;
  titulo: string;
  icono: IconNode;
  contenido: () => TemplateResult;
}

const estilosDeLaBarraDeTabs = css`
  /* Tres columnas, para que el selector siga centrado a lo ancho con las
     acciones a la derecha. */
  .barra-tabs {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    column-gap: 8px;
    align-items: center;
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
    grid-column: 2;
    display: flex;
    border: 1px solid var(--borde-suave);
  }

  .acciones {
    display: flex;
    justify-self: end;
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
 * Los tabs de la ventana con sus paneles. Dibuja la barra de tabs y las
 * secciones de los paneles en la misma raíz porque se enlazan por `id`
 * (`aria-controls`, `aria-labelledby`), y eso no cruza de un shadow root a
 * otro. Los paneles le llegan por propiedad, con su contenido, y lo que va a
 * la derecha de la barra, como el pánico, en el slot `acciones`.
 */
@customElement("navegacion-por-tabs")
export class NavegacionPorTabs extends Componente {
  static styles = [
    css`
      :host {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
    `,
    estilosDeLaBarraDeTabs,
    estilosDeLosPaneles,
  ];

  @property({ attribute: false }) paneles: Panel[] = [];

  /** El que eligió la persona usuaria; hasta entonces, el primero. */
  @state() private elegido?: string;

  private get activo() {
    return this.elegido ?? this.paneles[0]?.id;
  }

  // La barra de tabs va primera para que el recorrido con el teclado siga el
  // orden visual: los tabs, las acciones y el panel.
  render() {
    return html`${this.barraDeTabs()} ${this.secciones()}`;
  }

  private barraDeTabs() {
    return html`
      <div class="barra-tabs">
        <div class="selector" role="tablist" aria-label="Secciones">
          ${this.paneles.map(
            (panel) => html`
              <button
                id="tab-${panel.id}"
                type="button"
                role="tab"
                aria-controls="panel-${panel.id}"
                aria-selected=${panel.id === this.activo}
                @click=${() => (this.elegido = panel.id)}
              >
                ${dibujarIcono(panel.icono, 13)} ${panel.titulo}
              </button>
            `,
          )}
        </div>
        <div class="acciones"><slot name="acciones"></slot></div>
      </div>
    `;
  }

  // Un panel oculto se oculta con `hidden`, nunca dejando de dibujarlo: el log
  // tiene que seguir juntando mensajes aunque no esté a la vista.
  private secciones() {
    return html`
      <main class="contenedor">
        ${this.paneles.map(
          (panel) => html`
            <section
              id="panel-${panel.id}"
              class="panel"
              role="tabpanel"
              aria-labelledby="tab-${panel.id}"
              ?hidden=${panel.id !== this.activo}
            >
              ${panel.contenido()}
            </section>
          `,
        )}
      </main>
    `;
  }
}
