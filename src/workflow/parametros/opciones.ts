import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

type Valor = number | string;

/** Varias opciones de una lista cerrada, todas a la vista: para pocas opciones de texto corto. */
export interface ParametroDeOpciones<T extends Valor> extends ParametroBase<T[]> {
  tipo: "opciones";
  opciones: { valor: T; texto: string }[];
}

/** El texto del error si el valor no le sirve al parámetro, o `null`. */
export function error(parametro: ParametroDeOpciones<Valor>, valor: Valor[]): string | null {
  const valores = parametro.opciones.map((opcion) => opcion.valor);
  if (
    !Array.isArray(valor) ||
    valor.some((elegida) => !valores.includes(elegida)) ||
    new Set(valor).size !== valor.length
  ) {
    return "Tiene que tener solo opciones de la lista, sin repetir";
  }
  return null;
}

@customElement("parametro-opciones")
export class CampoDeOpciones extends CampoDeParametro<ParametroDeOpciones<Valor>, Valor[]> {
  static styles = [
    ...CampoDeParametro.styles,
    css`
      .pildoras {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      /* La casilla queda para el teclado y el lector de pantalla; lo que se ve
         es la píldora, que es su etiqueta. Va con .pildoras delante para
         ganarle a .campo label, que es para la etiqueta del parámetro. */
      .pildoras .pildora {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.9rem;
        height: 1.3rem;
        padding: 0 0.45rem;
        border: 1px solid var(--borde-suave);
        border-radius: 999px;
        background-color: var(--fondo-control);
        font-size: 0.75rem;
        font-weight: 500;
        opacity: 1;
        cursor: pointer;
        user-select: none;
      }

      .pildoras .pildora:has(:checked) {
        border-color: var(--acento);
        background-color: var(--acento);
        color: #ffffff;
      }

      .pildoras .pildora:has(:focus-visible) {
        outline: 2px solid var(--acento);
        outline-offset: 2px;
      }

      .pildoras .pildora input {
        position: absolute;
        opacity: 0;
        width: 1px;
        height: 1px;
        margin: 0;
      }
    `,
  ];

  protected esGrupo = true;

  protected control() {
    return html`
      <div id="control" class="pildoras">
        ${this.parametro.opciones.map(
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

  // Siempre una lista nueva, en el orden de las opciones, sin importar en qué
  // orden se eligieron.
  private cambiar(valor: Valor, elegida: boolean) {
    const elegidas = this.parametro.opciones
      .map((opcion) => opcion.valor)
      .filter((candidato) => (candidato === valor ? elegida : this.valor.includes(candidato)));
    this.avisarCambio(elegidas);
  }
}

export default {
  error,
  dibujar: (parametro: ParametroDeOpciones<Valor>, valor: Valor[], error: string | null) =>
    html`<parametro-opciones
      .parametro=${parametro}
      .valor=${valor}
      .error=${error}
    ></parametro-opciones>`,
};
