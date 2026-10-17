import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { ArrowDown, ArrowUp, type IconNode, Plus, X } from "lucide";

import { Campo } from "./campo";
import { limitar } from "./campo-numero";
import { dibujarIcono } from "./icono";
import { type Modo, ModoNumerico } from "./modo-numerico";

type ControlDeFila = "valor" | "subir" | "bajar" | "quitar";

/** El control que tiene que quedar con el foco cuando vuelva la lista nueva. */
type Foco = { posicion: number; control: ControlDeFila } | "agregar";

/**
 * Una lista de números enteros en orden, con un valor por fila. Cada fila
 * tiene su campo de texto y botones para subir, bajar y quitar el valor, y al
 * final hay uno para agregar. Todos los valores comparten el modo, que se
 * cambia con un solo botón. Avisa siempre una lista nueva.
 *
 * Como el campo no guarda la lista, después de un cambio anota dónde tiene
 * que quedar el foco y lo pone cuando la lista nueva ya volvió y está
 * dibujada: las filas se dibujan por posición (los valores se pueden repetir,
 * así que no tienen una clave), y un valor movido queda en otra fila.
 */
@customElement("campo-secuencia")
export class CampoSecuencia extends Campo<number[]> {
  static styles = [
    ...Campo.styles,
    css`
      .secuencia {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }

      .fila {
        display: flex;
        gap: 1px;
      }

      input.control {
        width: 64px;
        text-align: center;
        font-variant-numeric: tabular-nums;
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

      .agregar {
        margin-top: 2px;
      }
    `,
  ];

  @property({ attribute: false }) valor: number[] = [];
  @property({ type: Number }) minimo = 0;
  @property({ type: Number }) maximo = 127;
  /** Los modos que ofrece, en el orden en que rotan. Si se omite, los tres. */
  @property({ attribute: false }) modos?: Modo[];

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
    return html`
      <div id="control" class="secuencia">
        ${this.valor.map((numero, posicion) => this.fila(numero, posicion))}
        <button
          type="button"
          class="control agregar"
          data-foco="agregar"
          aria-label="Agregar un valor"
          @click=${this.agregar}
        >
          ${dibujarIcono(Plus, 12)} Agregar
        </button>
      </div>
    `;
  }

  private fila(numero: number, posicion: number) {
    const orden = posicion + 1;
    const ultima = this.valor.length - 1;
    return html`
      <div class="fila">
        <input
          class="control"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          aria-label="Valor ${orden}"
          data-foco="${posicion}:valor"
          .value=${live(this.modo.formatear(numero))}
          @change=${(evento: Event) => this.escribir(evento, posicion)}
          @keydown=${(evento: KeyboardEvent) => this.tecla(evento, posicion)}
        />
        ${this.boton({
          foco: `${posicion}:subir`,
          nombre: `Subir el valor ${orden}`,
          icono: ArrowUp,
          deshabilitado: posicion === 0,
          accion: () => this.mover(posicion, -1),
        })}
        ${this.boton({
          foco: `${posicion}:bajar`,
          nombre: `Bajar el valor ${orden}`,
          icono: ArrowDown,
          deshabilitado: posicion === ultima,
          accion: () => this.mover(posicion, 1),
        })}
        ${this.boton({
          foco: `${posicion}:quitar`,
          nombre: `Quitar el valor ${orden}`,
          icono: X,
          deshabilitado: false,
          accion: () => this.quitar(posicion),
        })}
      </div>
    `;
  }

  private boton({
    foco,
    nombre,
    icono,
    deshabilitado,
    accion,
  }: {
    foco: string;
    nombre: string;
    icono: IconNode;
    deshabilitado: boolean;
    accion: () => void;
  }) {
    return html`
      <button
        type="button"
        class="control icono"
        data-foco=${foco}
        aria-label=${nombre}
        title=${nombre}
        ?disabled=${deshabilitado}
        @click=${accion}
      >
        ${dibujarIcono(icono, 12)}
      </button>
    `;
  }

  private conValor(posicion: number, numero: number): number[] {
    return this.valor.map((anterior, i) => (i === posicion ? numero : anterior));
  }

  private escribir(evento: Event, posicion: number) {
    const numero = this.modo.leer((evento.target as HTMLInputElement).value);
    // Lo escrito se guarda aunque no sirva: el error lo muestra el panel.
    if (numero !== null) {
      this.avisar(this.conValor(posicion, numero));
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
  private tecla(evento: KeyboardEvent, posicion: number) {
    const sentido = evento.key === "ArrowUp" ? 1 : evento.key === "ArrowDown" ? -1 : 0;
    if (sentido === 0) {
      return;
    }
    evento.preventDefault();
    const numero = this.modo.leer((evento.target as HTMLInputElement).value);
    if (numero !== null) {
      const paso = sentido * this.modo.paso(evento.shiftKey);
      this.avisar(this.conValor(posicion, limitar(this, numero + paso)));
    }
    // Como al salir del campo: si no cambió nada, vuelve a lo que tiene.
    this.requestUpdate();
  }

  /**
   * El foco sigue al valor movido, en el mismo botón; si ese botón queda
   * deshabilitado, en el otro de mover, porque uno deshabilitado no puede
   * tenerlo.
   */
  private mover(posicion: number, sentido: -1 | 1) {
    const destino = posicion + sentido;
    const valores = [...this.valor];
    [valores[posicion], valores[destino]] = [valores[destino], valores[posicion]];
    const enLaPunta = sentido < 0 ? destino === 0 : destino === valores.length - 1;
    const mismo = sentido < 0 ? "subir" : "bajar";
    const otro = sentido < 0 ? "bajar" : "subir";
    this.foco = { posicion: destino, control: enLaPunta ? otro : mismo };
    this.avisar(valores);
  }

  /**
   * El foco va al botón de quitar del valor que quedó en su lugar, o al del
   * anterior si era el último, o al de agregar si no queda ninguno.
   */
  private quitar(posicion: number) {
    const valores = this.valor.filter((_, i) => i !== posicion);
    this.foco =
      valores.length === 0
        ? "agregar"
        : { posicion: Math.min(posicion, valores.length - 1), control: "quitar" };
    this.avisar(valores);
  }

  /**
   * Agrega una copia del último valor, que sirve para lo mismo que él (un
   * canal copiado sigue siendo un canal), o el mínimo si no hay ninguno.
   */
  private agregar() {
    const nuevo = this.valor.length > 0 ? this.valor[this.valor.length - 1] : this.minimo;
    this.foco = { posicion: this.valor.length, control: "valor" };
    this.avisar([...this.valor, nuevo]);
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
