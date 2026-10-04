import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { Campo } from "./campo";

type Valor = number | string;

/**
 * Varias opciones de una lista, todas a la vista como píldoras. Avisa siempre
 * una lista nueva, en el orden de las opciones.
 */
@customElement("campo-opciones")
export class CampoOpciones extends Campo<Valor[]> {
  static styles = [
    ...Campo.styles,
    css`
      .pildoras {
        display: flex;
        flex-wrap: wrap;
        gap: 1px;
      }

      /* La casilla queda para el teclado y el lector de pantalla; lo que se ve
         es la píldora, que es su etiqueta. */
      .pildora {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 18px;
        padding: 0 5px;
        border-radius: 2px;
        background-color: var(--fondo-control);
        color: var(--letra-control);
        font-size: 11px;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        cursor: pointer;
        user-select: none;
      }

      .pildora:hover {
        background-color: var(--fondo-control-hover);
      }

      .pildora:has(:checked) {
        background-color: var(--ambar);
        color: var(--letra-sobre-ambar);
      }

      .pildora:has(:checked):hover {
        background-color: var(--ambar-claro);
      }

      .pildora:has(:focus-visible) {
        outline: 1.5px solid var(--ambar);
        outline-offset: 1px;
      }

      .pildora input {
        position: absolute;
        opacity: 0;
        width: 1px;
        height: 1px;
        margin: 0;
      }
    `,
  ];

  @property({ attribute: false }) opciones: { valor: Valor; texto: string }[] = [];
  @property({ attribute: false }) valor: Valor[] = [];

  protected esGrupo = true;

  protected control() {
    return html`
      <div id="control" class="pildoras">
        ${this.opciones.map(
          (opcion) => html`
            <label class="pildora">
              <input
                type="checkbox"
                .checked=${live(this.valor.includes(opcion.valor))}
                @change=${(evento: Event) =>
                  this.cambiar(opcion.valor, (evento.target as HTMLInputElement).checked)}
              />${opcion.texto}
            </label>
          `,
        )}
      </div>
    `;
  }

  private cambiar(valor: Valor, elegida: boolean) {
    this.avisar(
      this.opciones
        .map((opcion) => opcion.valor)
        .filter((candidato) => (candidato === valor ? elegida : this.valor.includes(candidato))),
    );
  }
}
