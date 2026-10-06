import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ChevronDown, ChevronUp } from "lucide";

import { Campo } from "./campo";
import { dibujarIcono } from "./icono";

/**
 * Un paso de las flechas: lo que hay escrito en el campo en ese momento (aunque
 * no se haya confirmado) y cuánto sumarle (1, o 10 con Mayúsculas, con signo).
 */
export interface Paso {
  texto: string;
  cantidad: number;
}

/**
 * Un número escrito. Avisa el texto tal como se escribió, al salir del campo:
 * interpretarlo le toca a quien lo usa, que devuelve el valor que corresponde.
 * Con las flechas del teclado (y las propias, si no es `compacto`) avisa un
 * `paso`, con el texto y cuánto sumarle.
 *
 * Es un campo de texto y no uno numérico: uno numérico decide por su cuenta
 * qué acepta (por ejemplo, qué separador de decimales, según el idioma del
 * sistema), y lo que no le gusta lo avisa vacío.
 */
@customElement("campo-numero")
export class CampoNumero extends Campo<string> {
  static styles = [
    ...Campo.styles,
    css`
      .numero {
        display: inline-flex;
        align-items: stretch;
        align-self: flex-start;
        gap: 1px;
        border-radius: 2px;
      }

      /* Con flechas, el contorno de foco rodea al campo y a las flechas
         juntos, en lugar de solo al campo de texto. */
      .numero > input:focus-visible {
        outline: none;
      }

      .numero:has(> input:focus-visible) {
        outline: 1.5px solid var(--ambar);
        outline-offset: 1px;
      }

      input {
        width: 64px;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }

      :host([compacto]) input {
        width: 36px;
        height: 18px;
        padding: 0 3px;
        font-size: 11px;
      }

      .flechas {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      button.control.flecha {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 9.5px;
        padding: 0;
        cursor: pointer;
      }

      .flecha:first-child {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }

      .flecha:last-child {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
      }
    `,
  ];

  @property() valor = "";
  /** Si acepta decimales: en una pantalla táctil, cambia el teclado que aparece. */
  @property({ type: Boolean }) decimales = false;
  /**
   * Más chico, para ir dentro de otro control (como el rango): la etiqueta
   * queda solo para los lectores de pantalla y no hay flechas propias, aunque
   * las del teclado siguen funcionando.
   */
  @property({ type: Boolean, reflect: true }) compacto = false;
  @property({ type: Boolean }) puedeSubir = true;
  @property({ type: Boolean }) puedeBajar = true;

  protected control() {
    const input = html`
      <input
        id="control"
        class="control"
        type="text"
        inputmode=${this.decimales ? "decimal" : "numeric"}
        autocomplete="off"
        .value=${live(this.valor)}
        @change=${(evento: Event) => {
          this.avisar((evento.target as HTMLInputElement).value);
          // Si quien lo usa no aceptó lo escrito, no le pasa un valor nuevo y
          // Lit no redibujaría: así el campo vuelve a mostrar el que tiene.
          this.requestUpdate();
        }}
        @keydown=${this.tecla}
      />
    `;
    if (this.compacto) {
      return input;
    }
    // Las flechas no se recorren con Tab: con el teclado se usa el campo.
    return html`
      <div class="numero">
        ${input}
        <div class="flechas" aria-hidden="true">
          ${this.flecha(1, ChevronUp, this.puedeSubir)}
          ${this.flecha(-1, ChevronDown, this.puedeBajar)}
        </div>
      </div>
    `;
  }

  private flecha(sentido: number, icono: typeof ChevronUp, habilitada: boolean) {
    return html`
      <button
        type="button"
        class="control flecha"
        tabindex="-1"
        ?disabled=${!habilitada}
        @pointerdown=${(evento: PointerEvent) => evento.preventDefault()}
        @click=${(evento: MouseEvent) => this.pasar(sentido * (evento.shiftKey ? 10 : 1))}
      >
        ${dibujarIcono(icono, 10)}
      </button>
    `;
  }

  private tecla(evento: KeyboardEvent) {
    const sentido = evento.key === "ArrowUp" ? 1 : evento.key === "ArrowDown" ? -1 : 0;
    if (sentido !== 0) {
      evento.preventDefault();
      this.pasar(sentido * (evento.shiftKey ? 10 : 1));
    }
  }

  /** Avisa el paso con lo que hay escrito ahora, confirmado o no. */
  private pasar(cantidad: number) {
    const input = this.renderRoot.querySelector<HTMLInputElement>("#control");
    const texto = input?.value ?? this.valor;
    this.dispatchEvent(new CustomEvent<Paso>("paso", { detail: { texto, cantidad } }));
    // Como con `change`: si no cambió nada, el campo vuelve a lo que tiene.
    this.requestUpdate();
  }

  render() {
    if (!this.compacto) {
      return super.render();
    }
    return html`
      <label for="control" class="texto-oculto">${this.etiqueta}</label>
      ${this.control()}
    `;
  }
}
