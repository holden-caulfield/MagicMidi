import { css, html, type TemplateResult } from "lit";

import { actualizar } from "@/estado/estado";

export interface Panel {
  id: string;
  titulo: string;
  contenido: () => TemplateResult;
}

// Es una función y no un componente: los `aria-controls` de los tabs apuntan
// por `id` a los paneles, y eso solo funciona dentro de una misma raíz.
export function barraDeTabs(paneles: Panel[], activo: string) {
  return html`
    <div class="barra-tabs" role="tablist" aria-label="Secciones">
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
            ${panel.titulo}
          </button>
        `,
      )}
    </div>
  `;
}

/** Los estilos de `barraDeTabs`, para el componente que la dibuja. */
export const estilosDeLaBarraDeTabs = css`
  .barra-tabs {
    display: flex;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.4rem 1rem;
    border-top: 1px solid rgba(127, 127, 127, 0.25);
    background-color: rgba(127, 127, 127, 0.08);
  }

  .barra-tabs button {
    border: none;
    border-radius: 8px;
    background-color: transparent;
    padding: 0.5em 1.4em;
    font-weight: 600;
    opacity: 0.65;
  }

  .barra-tabs button[aria-selected="true"] {
    background-color: var(--fondo-tab-activo);
    opacity: 1;
  }

  .barra-tabs button:focus-visible {
    opacity: 1;
  }
`;
