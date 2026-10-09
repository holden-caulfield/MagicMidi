import { css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import type { IconNode } from "lucide";

import { Componente } from "./componente";
import { estilosDeControl } from "./estilos";
import { dibujarIcono } from "./icono";

/** Un atajo de teclado: cómo se anuncia (`aria-keyshortcuts`) y cómo se muestra. */
export interface Atajo {
  teclas: string;
  texto: string;
}

/**
 * Un botón de texto, con un ícono opcional. El texto va como contenido; si el
 * botón tiene solo ícono, `etiqueta` es su nombre accesible. Se escucha con
 * `click`, como un botón nativo.
 */
@customElement("boton-de-accion")
export class BotonDeAccion extends Componente {
  static styles = [
    estilosDeControl,
    css`
      :host {
        display: inline-flex;
      }

      /* Con la clase, para ganarle al alto y al padding comunes de .control. */
      button.control {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        height: 22px;
        padding: 0 10px;
        white-space: nowrap;
        cursor: pointer;
      }

      button.solo-icono {
        width: 22px;
        padding: 0;
      }

      /* Van antes que las de activo y la de apretado: con la misma
         especificidad, esos estados siguen siendo ámbar porque vienen
         después. */
      button.urgente {
        background-color: var(--fondo-error);
        color: var(--letra-error);
      }

      button.urgente:hover:not(:disabled) {
        background-color: var(--letra-error);
        color: var(--fondo-error);
      }

      button.activo,
      button.activo:hover:not(:disabled) {
        background-color: var(--ambar);
        color: var(--letra-sobre-ambar);
      }

      /* Más claro y no gris: sobre el gris de siempre, la letra oscura de lo
         encendido no se leería en modo oscuro. */
      button.activo:hover:not(:disabled) {
        background-color: var(--ambar-claro);
      }

      /* Mientras se aprieta, como un botón de Live que se enciende. Va al
         final y con la clase, para ganarle al puntero encima. */
      button.control:active:not(:disabled) {
        background-color: var(--ambar);
        color: var(--letra-apretado);
      }
    `,
  ];

  @property({ attribute: false }) icono?: IconNode;
  /** El nombre accesible cuando el botón tiene solo ícono. */
  @property() etiqueta?: string;
  @property({ type: Boolean }) activo = false;
  @property({ type: Boolean }) deshabilitado = false;
  /** En el rojo de los errores mientras está habilitado, para una acción de emergencia. */
  @property({ type: Boolean }) urgente = false;
  /** Lo anuncia y lo muestra al pasar el puntero; escucharlo es de quien lo usa. */
  @property({ attribute: false }) atajo?: Atajo;

  constructor() {
    super();
    // El clic sobre el texto llega al host aunque el botón esté deshabilitado:
    // se corta antes de que lo vea quien escucha afuera.
    this.addEventListener(
      "click",
      (evento) => {
        if (this.deshabilitado) {
          evento.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
  }

  render() {
    const soloIcono = this.etiqueta !== undefined;
    // Deshabilitado se ve como cualquier botón deshabilitado, sin rojo.
    const urgente = this.urgente && !this.deshabilitado;
    const globo = this.etiqueta ?? (this.atajo && `Atajo: ${this.atajo.texto}`);
    return html`
      <button
        type="button"
        class="control ${soloIcono ? "solo-icono" : ""} ${urgente ? "urgente" : ""}
          ${this.activo ? "activo" : ""}"
        ?disabled=${this.deshabilitado}
        aria-label=${ifDefined(this.etiqueta)}
        aria-keyshortcuts=${ifDefined(this.atajo?.teclas)}
        title=${ifDefined(globo)}
      >
        ${this.icono ? dibujarIcono(this.icono, 13) : nothing}
        <slot></slot>
      </button>
    `;
  }
}
