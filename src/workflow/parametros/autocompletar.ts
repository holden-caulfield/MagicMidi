import { css, html, nothing, type PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";

import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

type Valor = number | string;
type Opcion = { valor: Valor; texto: string };

/**
 * Varias opciones de una lista cerrada, que se buscan escribiendo: para listas
 * largas, que como píldoras ocuparían demasiado.
 */
export interface ParametroAutocompletar<T extends Valor> extends ParametroBase<T[]> {
  tipo: "autocompletar";
  opciones: { valor: T; texto: string }[];
  /** Se muestra debajo del campo cuando no hay ninguna elegida, por ejemplo "Cualquier tipo". */
  textoDeAyuda?: string;
}

/** El texto del error si el valor no le sirve al parámetro, o `null`. */
export function error(parametro: ParametroAutocompletar<Valor>, valor: Valor[]): string | null {
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

// Sigue el patrón "combobox" de la guía de ARIA (APG): el foco nunca sale del
// campo, y la opción activa de la lista se marca con `aria-activedescendant`,
// que es lo que hace que el lector de pantalla la anuncie.
@customElement("parametro-autocompletar")
export class CampoAutocompletar extends CampoDeParametro<ParametroAutocompletar<Valor>, Valor[]> {
  static styles = [
    ...CampoDeParametro.styles,
    css`
      /* La lista flota sobre los parámetros que siguen, que son hermanos de
         este componente en el panel: sin el z-index quedaría debajo de ellos. */
      :host {
        position: relative;
        z-index: 1;
      }

      .buscador {
        position: relative;
      }

      #control {
        width: 100%;
      }

      .lista {
        position: absolute;
        top: calc(100% + 2px);
        left: 0;
        right: 0;
        max-height: 12rem;
        overflow-y: auto;
        margin: 0;
        padding: 0.25rem 0;
        list-style: none;
        border: 1px solid var(--borde-suave);
        border-radius: 8px;
        /* Opaco en los dos modos: el fondo de los controles es translúcido en
           modo oscuro, y se verían los parámetros de abajo. */
        background-color: var(--fondo-ventana);
      }

      .lista li {
        padding: 0.25rem 0.6rem;
        font-size: 0.85em;
        cursor: pointer;
      }

      .lista li.activa {
        background-color: var(--acento);
        color: #ffffff;
      }

      .lista li.nada {
        cursor: default;
        color: var(--letra-secundaria);
      }

      .elegidas {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .elegida {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        height: 1.3rem;
        padding: 0 0.2rem 0 0.5rem;
        border: 1px solid var(--acento);
        border-radius: 999px;
        background-color: var(--acento);
        color: #ffffff;
        font-size: 0.75rem;
        font-weight: 500;
      }

      /* Sin borde ni fondo propio: solo un círculo al pasar el puntero o con el
         foco. Va con .elegidas delante para ganarle a los estilos de botón de
         compartidos. */
      .elegidas .quitar,
      .elegidas .quitar:hover,
      .elegidas .quitar:active {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1rem;
        height: 1rem;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: none;
        color: inherit;
        font-size: 0.85rem;
        line-height: 1;
      }

      .elegidas .quitar:hover,
      .elegidas .quitar:focus-visible {
        background-color: rgba(255, 255, 255, 0.3);
        outline: none;
      }

      .ayuda {
        margin: 0;
        font-size: 0.85em;
        color: var(--letra-secundaria);
      }
    `,
  ];

  @state() private texto = "";
  @state() private abierta = false;
  /** La posición, entre las opciones que coinciden, de la que elige Enter. */
  @state() private activa = 0;
  private volviendoDeQuitar = false;

  // El panel reusa este componente al pasar a otra caja: lo que se estaba
  // escribiendo era para el parámetro anterior.
  protected willUpdate(cambios: PropertyValues<this>) {
    if (cambios.has("parametro")) {
      this.texto = "";
      this.abierta = false;
    }
  }

  private get coincidencias() {
    return opcionesQueCoinciden(this.parametro.opciones, this.valor, this.texto);
  }

  protected control() {
    const coincidencias = this.coincidencias;
    const activa = this.abierta && coincidencias.length > 0 ? `opcion-${this.activa}` : undefined;
    const elegidas = this.parametro.opciones.filter((opcion) => this.valor.includes(opcion.valor));

    return html`
      <div class="buscador">
        <input
          id="control"
          role="combobox"
          autocomplete="off"
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
          aria-label=${this.parametro.etiqueta}
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
        ? this.parametro.textoDeAyuda
          ? html`<p class="ayuda">${this.parametro.textoDeAyuda}</p>`
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
                      ×
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
    this.avisarCambio(
      this.parametro.opciones
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
    this.avisarCambio(this.valor.filter((elegida) => elegida !== valor));
  }
}

export default {
  error,
  dibujar: (parametro: ParametroAutocompletar<Valor>, valor: Valor[], error: string | null) =>
    html`<parametro-autocompletar
      .parametro=${parametro}
      .valor=${valor}
      .error=${error}
    ></parametro-autocompletar>`,
};
