import { css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ArrowRight, Plus, X } from "lucide";

import { Campo } from "./campo";
import { limitar } from "./campo-numero";
import { dibujarIcono } from "./icono";
import { type Modo, ModoNumerico } from "./modo-numerico";

/** Un par del mapa: el valor que llega y el que lo reemplaza. */
export interface Par {
  entrada: number;
  salida: number;
}

/** Los pares, en el orden en que se agregaron. */
export type Mapa = Par[];

type Lado = keyof Par;

/** El control que tiene que quedar con el foco cuando vuelva el mapa nuevo. */
type Foco = { posicion: number; control: Lado | "quitar" } | "agregar";

/**
 * La entrada del par que suma el botón de agregar: la primera que no es
 * entrada de ningún par, buscando desde la que sigue a la del último par hasta
 * el máximo, y después desde el mínimo. Con el mapa vacío, el mínimo; `null`
 * si todos los valores ya son entradas.
 */
export function siguienteEntrada(mapa: Mapa, minimo: number, maximo: number): number | null {
  const usadas = new Set(mapa.map((par) => par.entrada));
  const cantidad = maximo - minimo + 1;
  const ultima = mapa[mapa.length - 1]?.entrada;
  // La entrada del último par puede estar fuera de los límites, porque lo
  // que no sirve también se guarda: entonces se empieza por el mínimo.
  const desde = ultima !== undefined && ultima >= minimo && ultima < maximo ? ultima + 1 : minimo;
  for (let paso = 0; paso < cantidad; paso++) {
    const candidata = minimo + ((desde - minimo + paso) % cantidad);
    if (!usadas.has(candidata)) {
      return candidata;
    }
  }
  return null;
}

/**
 * Un mapa de pares entrada → salida, con un par por fila: el campo de la
 * entrada, una flecha, el de la salida y un botón para quitar el par, y al
 * final uno para agregar. Todos los valores comparten el modo, que se cambia
 * con un solo botón. Sin títulos de columna: la flecha dice cuál es cuál. Avisa
 * siempre un mapa nuevo.
 *
 * Como el campo no guarda el mapa, después de quitar o agregar un par anota
 * dónde tiene que quedar el foco y lo pone cuando el mapa nuevo ya volvió y
 * está dibujado. Las filas se dibujan por posición: mientras una entrada está
 * repetida, no hay una clave que distinga sus pares.
 */
@customElement("campo-mapa")
export class CampoMapa extends Campo<Mapa> {
  static styles = [
    ...Campo.styles,
    css`
      .mapa {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }

      .fila {
        display: flex;
        align-items: center;
        gap: 1px;
      }

      input.control {
        width: 64px;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }

      .flecha {
        display: grid;
        place-items: center;
        width: 16px;
        color: var(--letra-secundaria);
      }

      button.control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        cursor: pointer;
      }

      button.control.icono {
        width: 20px;
        padding: 0;
      }

      .ayuda {
        margin: 0;
        font-size: 11px;
        color: var(--letra-secundaria);
      }

      .agregar {
        margin-top: 2px;
      }
    `,
  ];

  @property({ attribute: false }) valor: Mapa = [];
  @property({ type: Number }) minimo = 0;
  @property({ type: Number }) maximo = 127;
  /** Los modos que ofrece, en el orden en que rotan. Si se omite, los tres. */
  @property({ attribute: false }) modos?: Modo[];
  /** Se muestra en lugar de los pares cuando no hay ninguno. */
  @property() textoDeAyuda?: string;

  protected esGrupo = true;

  private modo = new ModoNumerico(this, (estado) => this.avisarEstado(estado));

  private foco: Foco | null = null;

  protected formatearValor(valor: unknown) {
    return typeof valor === "number" ? this.modo.formatear(valor) : String(valor);
  }

  protected botonDeModo() {
    return this.modo.boton;
  }

  protected control() {
    const ayuda =
      this.valor.length === 0 && this.textoDeAyuda
        ? html`<p class="ayuda">${this.textoDeAyuda}</p>`
        : nothing;
    return html`
      <div id="control" class="mapa">
        ${ayuda} ${this.valor.map((par, posicion) => this.fila(par, posicion))}
        <button
          type="button"
          class="control agregar"
          data-foco="agregar"
          aria-label="Agregar un par"
          ?disabled=${siguienteEntrada(this.valor, this.minimo, this.maximo) === null}
          @click=${this.agregar}
        >
          ${dibujarIcono(Plus, 12)} Agregar
        </button>
      </div>
    `;
  }

  private fila(par: Par, posicion: number) {
    const quitar = `Quitar el par ${posicion + 1}`;
    return html`
      <div class="fila">
        ${this.campoDelLado(par, posicion, "entrada")}
        <span class="flecha">${dibujarIcono(ArrowRight, 12)}</span>
        ${this.campoDelLado(par, posicion, "salida")}
        <button
          type="button"
          class="control icono"
          data-foco="${posicion}:quitar"
          aria-label=${quitar}
          title=${quitar}
          @click=${() => this.quitar(posicion)}
        >
          ${dibujarIcono(X, 12)}
        </button>
      </div>
    `;
  }

  private campoDelLado(par: Par, posicion: number, lado: Lado) {
    const nombre = lado === "entrada" ? "Entrada" : "Salida";
    return html`
      <input
        class="control"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        aria-label="${nombre} ${posicion + 1}"
        data-foco="${posicion}:${lado}"
        .value=${live(this.modo.formatear(par[lado]))}
        @change=${(evento: Event) => this.escribir(evento, posicion, lado)}
        @keydown=${(evento: KeyboardEvent) => this.tecla(evento, posicion, lado)}
      />
    `;
  }

  private conValor(posicion: number, lado: Lado, numero: number): Mapa {
    return this.valor.map((par, i) => (i === posicion ? { ...par, [lado]: numero } : par));
  }

  private escribir(evento: Event, posicion: number, lado: Lado) {
    const numero = this.modo.leer((evento.target as HTMLInputElement).value);
    // Lo escrito se guarda aunque no sirva: el error lo muestra el panel.
    if (numero !== null) {
      this.avisar(this.conValor(posicion, lado, numero));
    }
    // Si no se pudo leer, Lit no redibujaría: así el campo vuelve a mostrar
    // el que tiene.
    this.requestUpdate();
  }

  /**
   * Las flechas en el campo de un valor le suman 1, o con Mayúsculas el paso
   * del modo, a lo escrito aunque no se haya confirmado, sin pasar del mínimo
   * ni del máximo.
   */
  private tecla(evento: KeyboardEvent, posicion: number, lado: Lado) {
    const sentido = evento.key === "ArrowUp" ? 1 : evento.key === "ArrowDown" ? -1 : 0;
    if (sentido === 0) {
      return;
    }
    evento.preventDefault();
    const numero = this.modo.leer((evento.target as HTMLInputElement).value);
    if (numero !== null) {
      const paso = sentido * this.modo.paso(evento.shiftKey);
      this.avisar(this.conValor(posicion, lado, limitar(this, numero + paso)));
    }
    // Como al salir del campo: si no cambió nada, vuelve a lo que tiene.
    this.requestUpdate();
  }

  /**
   * El foco va al botón de quitar del par que quedó en su lugar, o al del
   * anterior si era el último, o al de agregar si no queda ninguno.
   */
  private quitar(posicion: number) {
    const mapa = this.valor.filter((_, i) => i !== posicion);
    this.foco =
      mapa.length === 0
        ? "agregar"
        : { posicion: Math.min(posicion, mapa.length - 1), control: "quitar" };
    this.avisar(mapa);
  }

  /**
   * Agrega la siguiente entrada libre, que sale igual que entra: así no repite
   * una entrada ni cambia nada hasta que se la edita.
   */
  private agregar() {
    const entrada = siguienteEntrada(this.valor, this.minimo, this.maximo);
    if (entrada === null) {
      return;
    }
    this.foco = { posicion: this.valor.length, control: "entrada" };
    this.avisar([...this.valor, { entrada, salida: entrada }]);
  }

  protected updated() {
    super.updated();
    if (!this.foco) {
      return;
    }
    const clave =
      this.foco === "agregar" ? "agregar" : `${this.foco.posicion}:${this.foco.control}`;
    this.foco = null;
    // WebKit no enfoca un botón al hacerle clic: el foco se pone a mano.
    this.renderRoot.querySelector<HTMLElement>(`[data-foco="${clave}"]`)?.focus();
  }
}
