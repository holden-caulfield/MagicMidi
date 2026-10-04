import { css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { X } from "lucide";

import { dibujarIcono } from "@/workflow/iconos";
import { Campo } from "./campo";

type Valor = number | string;
type Opcion = { valor: Valor; texto: string };

function normalizar(texto: string): string {
  // Separa cada letra de su tilde ("ó" pasa a "o" + "´") y saca las tildes.
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Las opciones que todavía no están elegidas y cuyo texto contiene lo escrito,
 * sin distinguir mayúsculas ni tildes, en el orden de la lista.
 */
export function opcionesQueCoinciden<T extends Opcion>(
  opciones: T[],
  elegidas: Valor[],
  texto: string,
): T[] {
  const buscado = normalizar(texto.trim());
  return opciones.filter(
    (opcion) => !elegidas.includes(opcion.valor) && normalizar(opcion.texto).includes(buscado),
  );
}

/**
 * Varias opciones de una lista, que se buscan escribiendo. Avisa siempre una
 * lista nueva, en el orden de las opciones.
 *
 * Sigue el patrón "combobox" de la guía de ARIA (APG): el foco nunca sale del
 * campo, y la opción activa de la lista se marca con `aria-activedescendant`,
 * que es lo que hace que el lector de pantalla la anuncie.
 */
@customElement("campo-autocompletar")
export class CampoAutocompletar extends Campo<Valor[]> {
  static styles = [
    ...Campo.styles,
    css`
      /* La lista flota sobre lo que sigue, que puede ser un hermano de este
         componente: sin el z-index quedaría debajo. */
      :host {
        position: relative;
        z-index: 1;
      }

      .buscador {
        position: relative;
        display: flex;
      }

      #control {
        flex: 1;
        min-width: 0;
        font-weight: 400;
      }

      #control::placeholder {
        color: var(--letra-secundaria);
      }

      .lista {
        position: absolute;
        top: calc(100% + 2px);
        left: 0;
        right: 0;
        max-height: 12rem;
        overflow-y: auto;
        margin: 0;
        padding: 2px 0;
        list-style: none;
        border: 1px solid var(--borde-suave);
        border-radius: 2px;
        /* Opaco en los dos modos: si no, se verían los controles de abajo. */
        background-color: var(--fondo-ventana);
      }

      .lista li {
        padding: 2px 7px;
        cursor: pointer;
      }

      .lista li.activa {
        background-color: var(--ambar);
        color: var(--letra-sobre-ambar);
      }

      .lista li.nada {
        cursor: default;
        color: var(--letra-secundaria);
      }

      .elegidas {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
      }

      .elegida {
        display: inline-flex;
        align-items: center;
        gap: 1px;
        height: 18px;
        padding: 0 1px 0 6px;
        border-radius: 2px;
        background-color: var(--ambar);
        color: var(--letra-sobre-ambar);
        font-size: 11px;
        font-weight: 500;
      }

      .quitar {
        display: grid;
        place-items: center;
        width: 15px;
        height: 15px;
        padding: 0;
        border: none;
        border-radius: 2px;
        background: none;
        color: inherit;
        cursor: pointer;
        outline: none;
      }

      .quitar:hover {
        background-color: var(--ambar-claro);
      }

      .quitar:focus-visible {
        outline: 1.5px solid var(--letra-sobre-ambar);
      }

      .ayuda {
        margin: 0;
        font-size: 11px;
        color: var(--letra-secundaria);
      }
    `,
  ];

  @property({ attribute: false }) opciones: Opcion[] = [];
  @property({ attribute: false }) valor: Valor[] = [];
  /** Se muestra debajo del campo cuando no hay ninguna elegida, por ejemplo "Cualquier tipo". */
  @property() textoDeAyuda?: string;

  @state() private texto = "";
  @state() private abierta = false;
  /** La posición, entre las opciones que coinciden, de la que elige Enter. */
  @state() private activa = 0;
  private volviendoDeQuitar = false;

  // El panel de configuración reusa este componente al pasar a otra caja: lo
  // que se estaba escribiendo era para la anterior.
  protected willUpdate(cambios: PropertyValues<this>) {
    if (cambios.has("opciones")) {
      this.texto = "";
      this.abierta = false;
    }
  }

  private get coincidencias() {
    return opcionesQueCoinciden(this.opciones, this.valor, this.texto);
  }

  protected control() {
    const coincidencias = this.coincidencias;
    const activa = this.abierta && coincidencias.length > 0 ? `opcion-${this.activa}` : undefined;
    const elegidas = this.opciones.filter((opcion) => this.valor.includes(opcion.valor));

    return html`
      <div class="buscador">
        <input
          id="control"
          class="control"
          role="combobox"
          autocomplete="off"
          placeholder="Buscar…"
          aria-autocomplete="list"
          aria-controls="lista"
          aria-expanded=${this.abierta ? "true" : "false"}
          aria-activedescendant=${activa ?? nothing}
          .value=${live(this.texto)}
          @focus=${() => {
            if (!this.volviendoDeQuitar) {
              this.abrir();
            }
          }}
          @click=${this.abrir}
          @blur=${() => (this.abierta = false)}
          @input=${(evento: Event) => {
            this.texto = (evento.target as HTMLInputElement).value;
            this.activa = 0;
            this.abierta = true;
          }}
          @keydown=${this.teclaEnElCampo}
        />
        <ul
          id="lista"
          class="lista"
          role="listbox"
          aria-label=${this.etiqueta}
          ?hidden=${!this.abierta}
          @mousedown=${(evento: MouseEvent) => {
            // Sin esto, el campo pierde el foco (y cierra la lista) antes del clic.
            evento.preventDefault();
          }}
        >
          ${coincidencias.length === 0
            ? html`<li class="nada">Ninguna coincide</li>`
            : coincidencias.map(
                (opcion, indice) => html`
                  <li
                    id="opcion-${indice}"
                    role="option"
                    class=${indice === this.activa ? "activa" : ""}
                    aria-selected=${indice === this.activa ? "true" : "false"}
                    @click=${() => this.elegir(opcion.valor)}
                  >
                    ${opcion.texto}
                  </li>
                `,
              )}
        </ul>
      </div>
      ${elegidas.length === 0
        ? this.textoDeAyuda
          ? html`<p class="ayuda">${this.textoDeAyuda}</p>`
          : nothing
        : html`
            <div class="elegidas">
              ${elegidas.map(
                (opcion) => html`
                  <span class="elegida">
                    ${opcion.texto}
                    <button
                      type="button"
                      class="quitar"
                      aria-label="Quitar ${opcion.texto}"
                      @click=${() => this.quitar(opcion.valor)}
                    >
                      ${dibujarIcono(X, 11)}
                    </button>
                  </span>
                `,
              )}
            </div>
          `}
    `;
  }

  protected updated() {
    super.updated();
    if (this.abierta) {
      this.renderRoot.querySelector(".lista .activa")?.scrollIntoView({ block: "nearest" });
    }
  }

  private abrir() {
    if (!this.abierta) {
      this.abierta = true;
      this.activa = 0;
    }
  }

  private teclaEnElCampo(evento: KeyboardEvent) {
    const cantidad = this.coincidencias.length;
    switch (evento.key) {
      case "ArrowDown":
        evento.preventDefault();
        if (!this.abierta) {
          this.abrir();
        } else {
          this.activa = Math.min(this.activa + 1, cantidad - 1);
        }
        break;
      case "ArrowUp":
        evento.preventDefault();
        this.activa = Math.max(this.activa - 1, 0);
        break;
      case "Enter": {
        evento.preventDefault();
        const opcion = this.abierta ? this.coincidencias[this.activa] : undefined;
        if (opcion) {
          this.elegir(opcion.valor);
        }
        break;
      }
      case "Escape":
        if (this.abierta) {
          evento.preventDefault();
          this.abierta = false;
        }
        break;
    }
  }

  // Siempre una lista nueva, en el orden de las opciones, sin importar en qué
  // orden se eligieron.
  private elegir(valor: Valor) {
    this.avisar(
      this.opciones
        .map((opcion) => opcion.valor)
        .filter((candidato) => candidato === valor || this.valor.includes(candidato)),
    );
    this.texto = "";
    this.activa = 0;
    this.abierta = false;
  }

  private quitar(valor: Valor) {
    // El botón que tiene el foco va a desaparecer: el foco vuelve al campo,
    // pero sin desplegar la lista, que nadie pidió.
    this.volviendoDeQuitar = true;
    this.renderRoot.querySelector<HTMLInputElement>("#control")?.focus();
    this.volviendoDeQuitar = false;
    this.avisar(this.valor.filter((elegida) => elegida !== valor));
  }
}
