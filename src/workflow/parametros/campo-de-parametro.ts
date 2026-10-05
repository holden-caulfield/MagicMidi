import { css, LitElement } from "lit";
import { property } from "lit/decorators.js";

/** Lo que declara todo parámetro, sea del tipo que sea. */
export interface ParametroBase<T> {
  clave: string;
  etiqueta: string;
  inicial: T;
}

/**
 * La base del control de cada tipo de parámetro. Recibe la declaración, el
 * valor y el error, y cada tipo dibuja en `render()` el campo de
 * `src/componentes/` que le corresponde. Cuando el campo avisa un cambio, el
 * tipo llama a `avisarCambio` con el valor nuevo. La etiqueta, el error y los
 * estilos los pone el campo.
 */
export abstract class CampoDeParametro<P extends ParametroBase<V>, V> extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property({ attribute: false }) parametro!: P;
  @property({ attribute: false }) valor!: V;
  /** El texto del error de configuración de este parámetro, o `null`. */
  @property({ attribute: false }) error: string | null = null;
  /**
   * Cómo se muestra el valor, tal como lo guardó este tipo en la caja, o
   * `undefined`. Solo lo usan los tipos que lo necesitan, como el entero.
   */
  @property({ attribute: false }) presentacion: unknown = undefined;

  protected avisarCambio(valor: V) {
    this.dispatchEvent(new CustomEvent("cambio", { detail: valor, bubbles: true }));
  }

  /** Avisa con `cambio-de-presentacion` cómo pasa a mostrarse el valor. */
  protected avisarCambioDePresentacion(presentacion: unknown) {
    this.dispatchEvent(
      new CustomEvent("cambio-de-presentacion", { detail: presentacion, bubbles: true }),
    );
  }
}
