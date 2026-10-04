import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ChevronDown } from "lucide";

import { dibujarIcono } from "@/workflow/iconos";
import { Campo } from "./campo";

type Valor = number | string | boolean;

/** Una opción de una lista: elegir una, con un `<select>`. Avisa el valor de la elegida. */
@customElement("campo-lista")
export class CampoLista extends Campo<Valor> {
  static styles = [
    ...Campo.styles,
    css`
      .lista {
        position: relative;
        display: flex;
      }

      select.control {
        flex: 1;
        min-width: 0;
        appearance: none;
        -webkit-appearance: none;
        padding-right: 20px;
        text-overflow: ellipsis;
        cursor: pointer;
      }

      .flecha {
        position: absolute;
        top: 4px;
        right: 4px;
        color: var(--letra-secundaria);
        pointer-events: none;
      }
    `,
  ];

  @property({ attribute: false }) opciones: { valor: Valor; texto: string }[] = [];
  @property({ attribute: false }) valor: Valor = "";
  /** Lo que se muestra cuando no hay ninguna opción. */
  @property() textoSinOpciones = "";
  /** Si se da, se muestra mientras ninguna opción tiene el valor actual. */
  @property() textoSinElegir?: string;
  @property({ type: Boolean }) deshabilitado = false;

  protected control() {
    const hayElegida = this.opciones.some((opcion) => opcion.valor === this.valor);
    return html`
      <div class="lista">
        <select id="control" class="control" ?disabled=${this.deshabilitado} @change=${this.elegir}>
          ${this.opciones.length === 0
            ? html`<option disabled selected>${this.textoSinOpciones}</option>`
            : html`
                ${this.textoSinElegir !== undefined
                  ? html`<option value="" disabled .selected=${live(!hayElegida)}>
                      ${this.textoSinElegir}
                    </option>`
                  : null}
                ${this.opciones.map(
                  (opcion, indice) =>
                    html`<option value=${indice} .selected=${live(opcion.valor === this.valor)}>
                      ${opcion.texto}
                    </option>`,
                )}
              `}
        </select>
        <span class="flecha" aria-hidden="true">${dibujarIcono(ChevronDown, 12)}</span>
      </div>
    `;
  }

  private elegir(evento: Event) {
    const indice = Number((evento.target as HTMLSelectElement).value);
    this.avisar(this.opciones[indice].valor);
  }
}
