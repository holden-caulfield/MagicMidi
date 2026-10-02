import { css, html, type TemplateResult } from "lit";
import type { IconNode } from "lucide";

import { actualizar } from "@/estado/estado";
import { dibujarIcono } from "@/workflow/iconos";

export interface Panel {
  id: string;
  titulo: string;
  icono: IconNode;
  contenido: () => TemplateResult;
}

// Es una función y no un componente: los `aria-controls` de los tabs apuntan
// por `id` a los paneles, y eso solo funciona dentro de una misma raíz.
export function barraDeTabs(paneles: Panel[], activo: string) {
  return html`
    <div class="barra-tabs">
      <div class="selector" role="tablist" aria-label="Secciones">
        ${paneles.map(
          (panel) => html`
            <button
              id="tab-${panel.id}"
              type="button"
              role="tab"
              aria-controls="panel-${panel.id}"
              aria-selected=${panel.id === activo}
              @click=${() => actualizar({ panelActivo: panel.id })}
            >
              ${dibujarIcono(panel.icono, 14)} ${panel.titulo}
            </button>
          `,
        )}
      </div>
    </div>
  `;
}

/** Los estilos de `barraDeTabs`, para el componente que la dibuja. */
export const estilosDeLaBarraDeTabs = css`
  .barra-tabs {
    display: flex;
    justify-content: center;
    padding: 0.35rem 1rem;
    /* El borde de arriba la separa de la barra de título de la ventana, que
       en macOS tiene el mismo color. */
    border-top: 1px solid var(--borde-suave);
    border-bottom: 1px solid var(--borde-suave);
    background-color: var(--fondo-hundido);
  }

  /* Un selector segmentado: los tabs comparten un mismo borde, como en la
     barra de herramientas de una ventana de macOS. */
  .selector {
    display: flex;
    border: 1px solid var(--borde-suave);
    border-radius: 6px;
    overflow: hidden;
  }

  .selector button {
    display: flex;
    align-items: center;
    gap: 0.35em;
    border: none;
    border-radius: 0;
    background-color: transparent;
    padding: 0.2rem 0.85rem;
    font-size: 0.8rem;
    line-height: 1.25rem;
    font-weight: 500;
    opacity: 0.65;
  }

  .selector button + button {
    border-left: 1px solid var(--borde-suave);
  }

  .selector button[aria-selected="true"] {
    background-color: var(--fondo-tab-activo);
    opacity: 1;
  }

  .selector button:focus-visible {
    opacity: 1;
  }
`;
