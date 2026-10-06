import { css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ChevronDown } from "lucide";

import { Campo } from "./campo";
import { dibujarIcono } from "./icono";

type Valor = number | string | boolean;
type Opcion = { valor: Valor; texto: string };

/**
 * La posición de la próxima opción, después de `desde` y dando la vuelta,
 * cuyo texto empieza con `letra` (sin distinguir mayúsculas ni tildes), o
 * `null` si ninguna empieza así. Es lo que hace escribir una letra con la
 * lista abierta o con el foco en ella.
 */
export function proximaConLetra(opciones: Opcion[], letra: string, desde: number): number | null {
  const normalizar = (texto: string) =>
    texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const buscada = normalizar(letra);
  for (let paso = 1; paso <= opciones.length; paso++) {
    const indice = (desde + paso) % opciones.length;
    if (normalizar(opciones[indice].texto).startsWith(buscada)) {
      return indice;
    }
  }
  return null;
}

/**
 * Una opción de una lista, con un desplegable propio (el del sistema no sigue
 * la estética del resto). Avisa el valor de la elegida.
 *
 * Sigue el patrón "select-only combobox" de la guía de ARIA (APG): el foco
 * queda siempre en el botón, y la opción activa de la lista se marca con
 * `aria-activedescendant`, que es lo que hace que el lector de pantalla la
 * anuncie.
 */
@customElement("campo-lista")
export class CampoLista extends Campo<Valor> {
  static styles = [
    ...Campo.styles,
    css`
      /* La lista flota sobre lo que sigue. Abierta, sube un poco más, para
         quedar también encima de otro campo que flota. */
      :host {
        position: relative;
      }

      :host([abierta]) {
        z-index: 2;
      }

      .lista-desplegable {
        position: relative;
        display: flex;
      }

      #control {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding-right: 4px;
        text-align: left;
        cursor: pointer;
      }

      .texto {
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .texto.sin-elegir {
        color: var(--letra-secundaria);
      }

      .flecha {
        display: flex;
        color: var(--letra-secundaria);
      }

      .opciones {
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

      .opciones li {
        padding: 2px 7px;
        cursor: pointer;
      }

      .opciones li.elegida {
        font-weight: 600;
      }

      .opciones li.activa {
        background-color: var(--ambar);
        color: var(--letra-sobre-ambar);
      }

      .opciones li.nada {
        cursor: default;
        color: var(--letra-secundaria);
      }
    `,
  ];

  @property({ attribute: false }) opciones: Opcion[] = [];
  @property({ attribute: false }) valor: Valor = "";
  /** Lo que se muestra cuando no hay ninguna opción. */
  @property() textoSinOpciones = "";
  /** Si se da, se muestra mientras ninguna opción tiene el valor actual. */
  @property() textoSinElegir?: string;
  @property({ type: Boolean }) deshabilitado = false;

  @property({ type: Boolean, reflect: true }) abierta = false;
  /** La posición de la opción que elige Enter. */
  @state() private activa = 0;

  private get elegida() {
    return this.opciones.findIndex((opcion) => opcion.valor === this.valor);
  }

  protected willUpdate(cambios: PropertyValues<this>) {
    if (cambios.has("deshabilitado") && this.deshabilitado) {
      this.abierta = false;
    }
  }

  protected control() {
    const elegida = this.elegida;
    const texto =
      this.opciones.length === 0
        ? this.textoSinOpciones
        : elegida >= 0
          ? this.opciones[elegida].texto
          : (this.textoSinElegir ?? "");
    const activa = this.abierta && this.opciones.length > 0 ? `opcion-${this.activa}` : undefined;

    return html`
      <div class="lista-desplegable">
        <button
          id="control"
          type="button"
          class="control"
          role="combobox"
          aria-haspopup="listbox"
          aria-controls="opciones"
          aria-expanded=${this.abierta ? "true" : "false"}
          aria-activedescendant=${activa ?? nothing}
          ?disabled=${this.deshabilitado}
          @click=${() => (this.abierta ? this.cerrar() : this.abrir())}
          @blur=${this.cerrar}
          @keydown=${this.tecla}
        >
          <span class="texto ${elegida < 0 ? "sin-elegir" : ""}">${texto}</span>
          <span class="flecha" aria-hidden="true">${dibujarIcono(ChevronDown, 12)}</span>
        </button>
        <ul
          id="opciones"
          class="opciones"
          role="listbox"
          aria-label=${this.etiqueta}
          ?hidden=${!this.abierta}
          @mousedown=${(evento: MouseEvent) => {
            // Sin esto, el botón pierde el foco (y cierra la lista) antes del clic.
            evento.preventDefault();
          }}
        >
          ${this.opciones.length === 0
            ? html`<li class="nada">${this.textoSinOpciones}</li>`
            : this.opciones.map(
                (opcion, indice) => html`
                  <li
                    id="opcion-${indice}"
                    role="option"
                    class="${indice === this.activa ? "activa" : ""} ${indice === elegida
                      ? "elegida"
                      : ""}"
                    aria-selected=${indice === elegida ? "true" : "false"}
                    @mouseenter=${() => (this.activa = indice)}
                    @click=${() => this.elegir(indice)}
                  >
                    ${opcion.texto}
                  </li>
                `,
              )}
        </ul>
      </div>
    `;
  }

  protected updated() {
    super.updated();
    if (this.abierta) {
      this.renderRoot.querySelector(".opciones .activa")?.scrollIntoView({ block: "nearest" });
    }
  }

  private abrir() {
    if (this.deshabilitado) return;
    // WebKit no enfoca un botón al hacerle clic: sin el foco, la lista no se
    // cerraría al hacer clic afuera, ni respondería al teclado.
    this.renderRoot.querySelector<HTMLElement>("#control")?.focus();
    this.activa = Math.max(this.elegida, 0);
    this.abierta = true;
  }

  private cerrar() {
    this.abierta = false;
  }

  private elegir(indice: number) {
    const opcion = this.opciones[indice];
    this.cerrar();
    if (opcion && opcion.valor !== this.valor) {
      this.avisar(opcion.valor);
    }
  }

  private tecla(evento: KeyboardEvent) {
    const ultima = this.opciones.length - 1;
    if (!this.abierta) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(evento.key)) {
        evento.preventDefault();
        this.abrir();
      } else if (evento.key.length === 1 && /\S/.test(evento.key)) {
        // Como en el desplegable del sistema: una letra elige sin abrir.
        const indice = proximaConLetra(this.opciones, evento.key, this.elegida);
        if (indice !== null) this.elegir(indice);
      }
      return;
    }
    switch (evento.key) {
      case "ArrowDown":
        evento.preventDefault();
        this.activa = Math.min(this.activa + 1, ultima);
        break;
      case "ArrowUp":
        evento.preventDefault();
        this.activa = Math.max(this.activa - 1, 0);
        break;
      case "Home":
        evento.preventDefault();
        this.activa = 0;
        break;
      case "End":
        evento.preventDefault();
        this.activa = ultima;
        break;
      case "Enter":
      case " ":
        evento.preventDefault();
        this.elegir(this.activa);
        break;
      case "Escape":
      case "Tab":
        // Tab sale del control sin elegir; Escape se queda en él.
        if (evento.key === "Escape") evento.preventDefault();
        this.cerrar();
        break;
      default:
        if (evento.key.length === 1 && /\S/.test(evento.key)) {
          const indice = proximaConLetra(this.opciones, evento.key, this.activa);
          if (indice !== null) this.activa = indice;
        }
    }
  }
}
