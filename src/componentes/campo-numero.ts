import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ChevronDown, ChevronUp } from "lucide";

import { Campo } from "./campo";
import { dibujarIcono } from "./icono";
import { type Modo, ModoNumerico } from "./modo-numerico";

/** El número limitado al mínimo y al máximo, si los hay. */
export function limitar(
  { minimo = -Infinity, maximo = Infinity }: { minimo?: number; maximo?: number },
  numero: number,
): number {
  return Math.min(Math.max(numero, minimo), maximo);
}

/**
 * Un número escrito, que se muestra y se lee en un modo (decimal, nota o
 * hexadecimal, ver `ModoNumerico`). Lo escrito se lee al salir del campo,
 * probando los modos desde el actual: si se puede leer, avisa el número (y,
 * si se leyó en otro modo, el campo pasa a ese); si no, vuelve solo al valor
 * que tiene, sin avisar nada. Las flechas (las propias y las del teclado)
 * suman 1, o 10 con Mayúsculas, a lo escrito en ese momento, y se frenan en
 * el mínimo y el máximo.
 *
 * Es un campo de texto y no uno numérico: uno numérico decide por su cuenta
 * qué acepta (por ejemplo, qué separador de decimales, según el idioma del
 * sistema), y lo que no le gusta lo avisa vacío.
 */
@customElement("campo-numero")
export class CampoNumero extends Campo<number> {
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

  @property({ type: Number }) valor = 0;
  /** Los modos que ofrece, en el orden en que rotan. Si se omite, los tres. */
  @property({ attribute: false }) modos?: Modo[];
  /** Si se omite, no hay mínimo. */
  @property({ type: Number }) minimo?: number;
  /** Si se omite, no hay máximo. */
  @property({ type: Number }) maximo?: number;

  private modo = new ModoNumerico(this, (estado) => this.avisarEstado(estado));

  protected formatearValor(valor: unknown) {
    return typeof valor === "number" ? this.modo.formatear(valor) : String(valor);
  }

  protected botonDeModo() {
    return this.modo.boton;
  }

  protected control() {
    // Las flechas no se recorren con Tab: con el teclado se usa el campo.
    return html`
      <div class="numero">
        <input
          id="control"
          class="control"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          .value=${live(this.modo.formatear(this.valor))}
          @change=${(evento: Event) => {
            const numero = this.modo.leer((evento.target as HTMLInputElement).value);
            if (numero !== null) {
              this.avisar(numero);
            }
            // Si no se pudo leer, o quien lo usa no aceptó el número, no le
            // pasa un valor nuevo y Lit no redibujaría: así el campo vuelve a
            // mostrar el que tiene.
            this.requestUpdate();
          }}
          @keydown=${this.tecla}
        />
        <div class="flechas" aria-hidden="true">
          ${this.flecha(1, ChevronUp, this.maximo === undefined || this.valor < this.maximo)}
          ${this.flecha(-1, ChevronDown, this.minimo === undefined || this.valor > this.minimo)}
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

  /** Suma el paso a lo escrito ahora, confirmado o no, sin pasar de los límites. */
  private pasar(cantidad: number) {
    const input = this.renderRoot.querySelector<HTMLInputElement>("#control");
    const numero = input ? this.modo.leer(input.value) : this.valor;
    if (numero !== null) {
      this.avisar(limitar(this, numero + cantidad));
    }
    // Como al salir del campo: si no cambió nada, vuelve a lo que tiene.
    this.requestUpdate();
  }
}
