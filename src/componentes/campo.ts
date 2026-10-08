import { html, nothing, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";

import { escribir, type Texto } from "@/formato";
import { Componente } from "./componente";
import { estilosBase } from "./estilos";

/** El botón de modo de un campo: qué muestra, cómo se anuncia y qué hace al activarlo. */
export interface BotonDeModo {
  abreviatura: string;
  nombre: string;
  siguiente(): void;
}

/**
 * La base de los campos: pone la etiqueta (enlazada al control, que tiene que
 * llevar `id="control"`), el error debajo del control y los atributos ARIA que
 * los unen. Todo queda en la raíz del campo, porque `<label for>` y
 * `aria-describedby` no cruzan de un shadow root a otro. Cada campo escribe
 * solo `control()` y avisa el valor nuevo con `avisar`.
 *
 * Lo que un campo quiere conservar entre montajes (como el modo de uno
 * numérico) es solo suyo: avisa cada cambio con `avisarEstado`, y quien lo usa
 * lo guarda sin leerlo para pasárselo en `estado` la próxima vez que lo cree.
 */
export abstract class Campo<V> extends Componente {
  static styles = estilosBase;

  @property() etiqueta = "";
  /**
   * El texto del error, o `null`. Si nombra valores, los escribe el campo con
   * `formatearValor`.
   */
  @property({ attribute: false }) error: Texto | null = null;
  /**
   * Lo que el campo conservó en la caja, tal como lo avisó con
   * `cambio-de-estado`, o `undefined`. El campo lo lee una sola vez, al
   * dibujarse por primera vez; uno que no conserva nada lo ignora.
   */
  @property({ attribute: false }) estado: unknown = undefined;

  /** Con `true`, el control va antes de la etiqueta y en la misma línea, como una casilla. */
  protected enLinea = false;

  /**
   * Con `true`, el control es un grupo de varios controles, cada uno con su
   * texto: la etiqueta nombra al grupo en lugar de apuntar a un control, porque
   * un `<label for>` solo puede apuntar a uno. El elemento que agrupa lleva
   * `id="control"` igual.
   */
  protected esGrupo = false;

  protected abstract control(): TemplateResult;

  /**
   * Si no es `null`, junto a la etiqueta va un botón que muestra la
   * `abreviatura`, se anuncia con el `nombre` y llama a `siguiente`.
   */
  protected botonDeModo(): BotonDeModo | null {
    return null;
  }

  /**
   * Cómo escribe el campo un valor que nombra su error: el número de un campo
   * numérico, por ejemplo, va en su modo. Lo que no reconoce, como texto común.
   */
  protected formatearValor(valor: unknown): string {
    return String(valor);
  }

  // Los dos avisos suben (`bubbles`) para que los reciba quien envuelve al
  // campo, como el panel de configuración, pero no salen de la raíz donde está
  // dibujado: los campos de un rango le avisan solo al rango.

  /** Avisa el valor nuevo con el evento `cambio`. El campo no lo guarda: lo recibe de vuelta. */
  protected avisar(valor: V) {
    this.dispatchEvent(new CustomEvent("cambio", { detail: valor, bubbles: true }));
  }

  /** Avisa con `cambio-de-estado` lo que el campo quiere conservar. */
  protected avisarEstado(estado: unknown) {
    this.dispatchEvent(new CustomEvent("cambio-de-estado", { detail: estado, bubbles: true }));
  }

  render() {
    const texto = this.esGrupo
      ? html`<span id="etiqueta" class="etiqueta">${this.etiqueta}</span>`
      : html`<label for="control" class="etiqueta">${this.etiqueta}</label>`;
    const boton = this.botonDeModo();
    const etiqueta = boton
      ? html`<div class="fila-de-etiqueta">${texto}${this.dibujarBotonDeModo(boton)}</div>`
      : texto;
    const escrito = this.error && escribir(this.error, (valor) => this.formatearValor(valor));
    const error = escrito ? html`<p id="error" class="error">${escrito}</p>` : nothing;
    return this.enLinea
      ? html`<div class="campo en-linea">${this.control()}${etiqueta}</div>${error}`
      : html`<div class="campo">${etiqueta}${this.control()}${error}</div>`;
  }

  private dibujarBotonDeModo({ abreviatura, nombre, siguiente }: BotonDeModo) {
    return html`
      <button
        type="button"
        class="control modo"
        aria-label="Modo de ${this.etiqueta}: ${nombre}"
        @click=${siguiente}
      >
        ${abreviatura}
      </button>
    `;
  }

  // Los atributos van sobre el control que dibuja cada campo, así ninguno
  // tiene que ocuparse de marcar su error.
  protected updated() {
    const control = this.renderRoot.querySelector("#control");
    if (!control) {
      return;
    }
    if (this.esGrupo) {
      control.setAttribute("role", "group");
      control.setAttribute("aria-labelledby", "etiqueta");
    }
    if (this.error) {
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", "error");
    } else {
      control.removeAttribute("aria-invalid");
      control.removeAttribute("aria-describedby");
    }
  }
}
