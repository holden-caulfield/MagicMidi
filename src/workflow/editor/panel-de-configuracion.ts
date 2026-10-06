import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { Trash2 } from "lucide";

import "@/componentes/boton-de-accion";
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

function cambiarPresentacion(nodoId: string, clave: string, presentacion: unknown) {
  actualizar({
    flujo: {
      ...estado.flujo,
      nodos: estado.flujo.nodos.map((nodo) =>
        nodo.id === nodoId
          ? { ...nodo, presentaciones: { ...nodo.presentaciones, [clave]: presentacion } }
          : nodo,
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

      /* El padding deja lugar al contorno de foco de los controles, que el
         desplazamiento cortaría contra los bordes. */
      aside {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 4px 4px;
      }

      h3 {
        margin: 0;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--borde-suave);
        font-size: inherit;
        font-weight: 600;
      }

      .vacia {
        margin: 0;
        color: var(--letra-secundaria);
      }

      boton-de-accion {
        align-self: flex-start;
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
    const errores = tipo ? erroresDeConfiguracion(tipo, nodo.parametros, nodo.presentaciones) : [];
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
                  @cambio-de-presentacion=${(evento: CustomEvent<unknown>) =>
                    cambiarPresentacion(nodo.id, parametro.clave, evento.detail)}
                >
                  ${dibujarParametro(
                    parametro,
                    nodo.parametros[parametro.clave],
                    errorDe(parametro.clave),
                    nodo.presentaciones?.[parametro.clave],
                  )}
                </div>
              `,
            )}
        ${tipo
          ? html`<boton-de-accion .icono=${Trash2} @click=${() => this.pedirEliminar(nodo.id)}>
              Eliminar caja
            </boton-de-accion>`
          : null}
      </aside>
    `;
  }

  private pedirEliminar(id: string) {
    this.dispatchEvent(new CustomEvent("eliminar-caja", { detail: id, bubbles: true, composed: true }));
  }
}
