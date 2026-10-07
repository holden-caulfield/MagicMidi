import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import "./campo-numero";
import { Campo } from "./campo";
import { ModoNumerico } from "./modo-numerico";
import type { Modo } from "./modos";

export interface Rango {
  desde: number;
  hasta: number;
}

export type Extremo = keyof Rango;

export interface Limites {
  minimo: number;
  maximo: number;
  /** Si "desde" puede quedar mayor que "hasta". */
  invertible: boolean;
}

/** El valor entero que está en esa proporción (de 0 a 1) entre el mínimo y el máximo. */
export function valorEnProporcion(proporcion: number, { minimo, maximo }: Limites): number {
  const valor = Math.round(minimo + proporcion * (maximo - minimo));
  return Math.min(Math.max(valor, minimo), maximo);
}

/** Dónde se dibuja un valor, de 0 a 1. Lo que se sale de los límites queda en el borde. */
export function proporcionDe(valor: number, { minimo, maximo }: Limites): number {
  if (maximo === minimo) return 0;
  return Math.min(Math.max((valor - minimo) / (maximo - minimo), 0), 1);
}

/**
 * El rango con un extremo movido a `nuevo`, sin pasarse de los límites. Si no
 * se puede invertir, el extremo se frena al llegar al otro.
 */
export function moverExtremo(
  rango: Rango,
  extremo: Extremo,
  nuevo: number,
  limites: Limites,
): Rango {
  let valor = Math.min(Math.max(Math.round(nuevo), limites.minimo), limites.maximo);
  if (!limites.invertible) {
    valor = extremo === "desde" ? Math.min(valor, rango.hasta) : Math.max(valor, rango.desde);
  }
  return { ...rango, [extremo]: valor };
}

/**
 * El extremo que se mueve con un clic en la barra: el más cercano. Si los dos
 * están en el mismo lugar, el que puede ir hacia el clic.
 */
export function extremoMasCercano(rango: Rango, valor: number): Extremo {
  const aDesde = Math.abs(valor - rango.desde);
  const aHasta = Math.abs(valor - rango.hasta);
  if (aDesde !== aHasta) {
    return aDesde < aHasta ? "desde" : "hasta";
  }
  const derecha = valor > rango.desde;
  return rango.desde <= rango.hasta === derecha ? "hasta" : "desde";
}

/**
 * Hasta dónde llegan las flechas en el campo de un extremo, para que se frene
 * como su perilla: si el rango no se puede invertir, en el otro extremo (o en
 * el borde, si el otro quedó afuera); si se puede, en el mínimo y el máximo.
 */
export function limitesDelExtremo(
  rango: Rango,
  extremo: Extremo,
  { minimo, maximo, invertible }: Limites,
): { minimo: number; maximo: number } {
  if (invertible) {
    return { minimo, maximo };
  }
  const otro = Math.min(Math.max(extremo === "desde" ? rango.hasta : rango.desde, minimo), maximo);
  return extremo === "desde" ? { minimo, maximo: otro } : { minimo: otro, maximo };
}

/**
 * Dos extremos enteros, con una barra de dos perillas y un campo numérico a
 * cada lado. El tramo entre las perillas lleva marcas que apuntan de "desde" a
 * "hasta". Avisa el rango nuevo. Los dos campos comparten un modo, el del
 * rango, que se cambia con un solo botón.
 */
@customElement("campo-rango")
export class CampoRango extends Campo<Rango> {
  static styles = [
    ...Campo.styles,
    css`
      .rango {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 6px;
      }

      .barra {
        position: relative;
        height: 18px;
        touch-action: none;
        cursor: pointer;
      }

      .barra::before {
        content: "";
        position: absolute;
        inset: 2px 0;
        border-radius: 2px;
        background-color: var(--fondo-control);
      }

      .tramo {
        position: absolute;
        top: 2px;
        bottom: 2px;
        background-color: color-mix(in srgb, var(--ambar) 42%, transparent);
        color: var(--letra-control);
      }

      /* Las marcas son una máscara pintada con el color de la letra, así se
         ven en los dos modos. */
      .tramo::after {
        content: "";
        position: absolute;
        inset: 0;
        background-color: currentColor;
        opacity: 0.4;
        -webkit-mask: var(--marcas) repeat-x left center;
        mask: var(--marcas) repeat-x left center;
        --marcas: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='14'%3E%3Cpath d='M3.5 4l3 3-3 3' fill='none' stroke='black' stroke-width='1.3'/%3E%3C/svg%3E");
      }

      .tramo.invertido::after {
        transform: scaleX(-1);
      }

      .perilla {
        position: absolute;
        top: 0;
        width: 4px;
        height: 18px;
        padding: 0;
        border: none;
        border-radius: 1px;
        transform: translateX(-50%);
        background-color: var(--ambar);
        cursor: ew-resize;
        outline: none;
      }

      .perilla.desde {
        background-color: var(--letra-secundaria);
      }

      .perilla:focus-visible {
        outline: 1.5px solid var(--ambar);
        outline-offset: 2px;
      }
    `,
  ];

  @property({ attribute: false }) valor: Rango = { desde: 0, hasta: 0 };
  @property({ type: Number }) minimo = 0;
  @property({ type: Number }) maximo = 127;
  @property({ type: Boolean }) invertible = false;
  /** Los modos que ofrece, en el orden en que rotan. Si se omite, los tres. */
  @property({ attribute: false }) modos?: Modo[];

  protected esGrupo = true;

  private arrastrando: Extremo | null = null;

  private modo = new ModoNumerico(this, (estado) => this.avisarEstado(estado));

  protected formatearValor(valor: unknown) {
    return typeof valor === "number" ? this.modo.formatear(valor) : String(valor);
  }

  protected botonDeModo() {
    const boton = this.modo.boton;
    return boton && { ...boton, siguiente: () => this.modo.siguiente() };
  }

  private get limites(): Limites {
    return { minimo: this.minimo, maximo: this.maximo, invertible: this.invertible };
  }

  protected control() {
    const { desde, hasta } = this.valor;
    const pDesde = proporcionDe(desde, this.limites) * 100;
    const pHasta = proporcionDe(hasta, this.limites) * 100;
    return html`
      <div id="control" class="rango">
        ${this.campo("desde")}
        <div
          class="barra"
          @pointerdown=${this.empezarArrastre}
          @pointermove=${this.arrastrar}
          @pointerup=${() => (this.arrastrando = null)}
          @pointercancel=${() => (this.arrastrando = null)}
        >
          <div
            class="tramo ${desde > hasta ? "invertido" : ""}"
            style="left: ${Math.min(pDesde, pHasta)}%; width: ${Math.abs(pHasta - pDesde)}%"
          ></div>
          ${this.perilla("desde", pDesde)} ${this.perilla("hasta", pHasta)}
        </div>
        ${this.campo("hasta")}
      </div>
    `;
  }

  // Los dos campos muestran el modo del rango: si uno lee lo escrito en otro
  // modo, el rango lo adopta y se lo pasa a los dos.
  private campo(extremo: Extremo) {
    const { minimo, maximo } = limitesDelExtremo(this.valor, extremo, this.limites);
    return html`
      <campo-numero
        compacto
        etiqueta=${extremo}
        .valor=${this.valor[extremo]}
        .modos=${this.modos}
        .minimo=${minimo}
        .maximo=${maximo}
        .estado=${this.modo.estado}
        @cambio-de-estado=${(evento: CustomEvent<unknown>) => this.modo.cambiar(evento.detail)}
        @cambio=${(evento: CustomEvent<number>) =>
          // Lo escrito se guarda aunque no sirva: el error lo muestra el panel.
          this.avisar({ ...this.valor, [extremo]: evento.detail })}
      ></campo-numero>
    `;
  }

  private perilla(extremo: Extremo, posicion: number) {
    return html`
      <button
        type="button"
        class="perilla ${extremo}"
        role="slider"
        aria-label=${extremo}
        aria-valuemin=${this.minimo}
        aria-valuemax=${this.maximo}
        aria-valuenow=${this.valor[extremo]}
        aria-valuetext=${this.modo.formatear(this.valor[extremo])}
        style="left: ${posicion}%"
        @keydown=${(evento: KeyboardEvent) => this.teclaEnPerilla(evento, extremo)}
      ></button>
    `;
  }

  private teclaEnPerilla(evento: KeyboardEvent, extremo: Extremo) {
    const paso = evento.shiftKey ? 10 : 1;
    const actual = this.valor[extremo];
    const nuevos: Record<string, number> = {
      ArrowRight: actual + paso,
      ArrowUp: actual + paso,
      ArrowLeft: actual - paso,
      ArrowDown: actual - paso,
      Home: this.minimo,
      End: this.maximo,
    };
    if (evento.key in nuevos) {
      evento.preventDefault();
      this.mover(extremo, nuevos[evento.key]);
    }
  }

  private valorEnElPuntero(evento: PointerEvent): number {
    const barra = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    return valorEnProporcion((evento.clientX - barra.left) / barra.width, this.limites);
  }

  private empezarArrastre(evento: PointerEvent) {
    evento.preventDefault();
    const valor = this.valorEnElPuntero(evento);
    const perilla = (evento.target as HTMLElement).closest(".perilla");
    const extremo: Extremo = perilla
      ? perilla.classList.contains("desde")
        ? "desde"
        : "hasta"
      : extremoMasCercano(this.valor, valor);
    this.arrastrando = extremo;
    (evento.currentTarget as HTMLElement).setPointerCapture(evento.pointerId);
    this.renderRoot.querySelector<HTMLElement>(`.perilla.${extremo}`)?.focus();
    this.mover(extremo, valor);
  }

  private arrastrar(evento: PointerEvent) {
    if (this.arrastrando) {
      this.mover(this.arrastrando, this.valorEnElPuntero(evento));
    }
  }

  private mover(extremo: Extremo, nuevo: number) {
    const rango = moverExtremo(this.valor, extremo, nuevo, this.limites);
    if (rango.desde !== this.valor.desde || rango.hasta !== this.valor.hasta) {
      this.avisar(rango);
    }
  }
}
