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
              ${dibujarIcono(panel.icono, 13)} ${panel.titulo}
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
