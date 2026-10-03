import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { ControladorDeEstado } from "@/estado/controlador";
import { actualizar, estado } from "@/estado/estado";
import { compartidos } from "@/estilos/compartidos";
import { TIPOS_DE_NODO, TRIGGER } from "../nodos/catalogo";
import { dibujarParametro, type ValorDeParametro } from "../parametros/catalogo";
import { erroresDeConfiguracion } from "../validacion";

function cambiarParametro(nodoId: string, clave: string, valor: ValorDeParametro) {
  actualizar({
    flujo: {
      ...estado.flujo,
      nodos: estado.flujo.nodos.map((nodo) =>
        nodo.id === nodoId ? { ...nodo, parametros: { ...nodo.parametros, [clave]: valor } } : nodo,
      ),
    },
  });
}

/** Pide borrar la caja con el evento `eliminar-caja`, con su `id`. */
@customElement("panel-de-configuracion")
export class PanelDeConfiguracion extends LitElement {
  static styles = [
    compartidos,
    css`
      :host {
        flex: 0 0 220px;
        min-height: 0;
        display: flex;
      }

      aside {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      h3 {
        margin: 0;
      }

      .vacia {
        margin: 0;
        opacity: 0.7;
      }

      .parametro {
        display: contents;
      }
    `,
  ];

  constructor() {
    super();
    new ControladorDeEstado(this);
  }

  render() {
    const nodo = estado.flujo.nodos.find((candidato) => candidato.id === estado.nodoSeleccionado);
    if (!nodo) {
      return html`
        <aside aria-label="Configuración de la caja">
          <p class="vacia">Seleccioná una caja del lienzo para configurarla.</p>
        </aside>
      `;
    }

    const tipo = nodo.tipo === "trigger" ? null : TIPOS_DE_NODO[nodo.tipo];
    const nombre = tipo ? tipo.nombre : TRIGGER.nombre;
    const parametros = tipo ? tipo.parametros : [];
    const errores = tipo ? erroresDeConfiguracion(tipo, nodo.parametros) : [];
    // Si un parámetro tiene varios errores, se muestra el primero.
    const errorDe = (clave: string) =>
      errores.find((error) => error.clave === clave)?.mensaje ?? null;

    return html`
      <aside aria-label="Configuración de la caja">
        <h3>${nombre}</h3>
        ${parametros.length === 0
          ? html`<p class="vacia">Esta caja no tiene nada para configurar.</p>`
          : parametros.map(
              (parametro) => html`
                <div
                  class="parametro"
                  @cambio=${(evento: CustomEvent<ValorDeParametro>) =>
                    cambiarParametro(nodo.id, parametro.clave, evento.detail)}
                >
                  ${dibujarParametro(
                    parametro,
                    nodo.parametros[parametro.clave],
                    errorDe(parametro.clave),
                  )}
                </div>
              `,
            )}
        ${tipo
          ? html`<button type="button" @click=${() => this.pedirEliminar(nodo.id)}>
              Eliminar caja
            </button>`
          : null}
      </aside>
    `;
  }

  private pedirEliminar(id: string) {
    this.dispatchEvent(new CustomEvent("eliminar-caja", { detail: id, bubbles: true, composed: true }));
  }
}
