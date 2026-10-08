import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { Trash2 } from "lucide";

import "@/componentes/boton-de-accion";
import { Componente } from "@/componentes/componente";
import { ControladorDeEstado } from "@/estado/controlador";
import { actualizar, estado } from "@/estado/estado";
import { TIPOS_DE_NODO, TRIGGER } from "../nodos/catalogo";
import { erroresDeConfiguracion } from "../validacion";

function cambiarParametro(nodoId: string, clave: string, valor: unknown) {
  actualizar({
    flujo: {
      ...estado.flujo,
      nodos: estado.flujo.nodos.map((nodo) =>
        nodo.id === nodoId ? { ...nodo, parametros: { ...nodo.parametros, [clave]: valor } } : nodo,
      ),
    },
  });
}

function cambiarEstado(nodoId: string, clave: string, estadoDelCampo: unknown) {
  actualizar({
    flujo: {
      ...estado.flujo,
      nodos: estado.flujo.nodos.map((nodo) =>
        nodo.id === nodoId
          ? {
              ...nodo,
              estadoDeLosParametros: { ...nodo.estadoDeLosParametros, [clave]: estadoDelCampo },
            }
          : nodo,
      ),
    },
  });
}

/**
 * Configura la caja de `nodoSeleccionado`. Pide borrarla con el evento
 * `eliminar-caja`, con su `id`.
 */
@customElement("panel-de-configuracion")
export class PanelDeConfiguracion extends Componente {
  static styles = css`
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
  `;

  @property({ attribute: false }) nodoSeleccionado: string | null = null;

  constructor() {
    super();
    new ControladorDeEstado(this);
  }

  render() {
    const nodo = estado.flujo.nodos.find((candidato) => candidato.id === this.nodoSeleccionado);
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
    const errores = erroresDeConfiguracion(nodo);
    // Si un parámetro tiene varios errores, se muestra el primero.
    const errorDe = (clave: string) =>
      errores.find((error) => error.clave === clave)?.mensaje ?? null;

    // Cada campo queda atado a su caja y su parámetro: si Lit los reusara por
    // posición, el estado propio de un campo (como su modo) aparecería en otra
    // caja.
    const campos = repeat(
      parametros,
      (parametro) => `${nodo.id}/${parametro.clave}`,
      (parametro) => html`
        <div
          class="parametro"
          @cambio=${(evento: CustomEvent<unknown>) =>
            cambiarParametro(nodo.id, parametro.clave, evento.detail)}
          @cambio-de-estado=${(evento: CustomEvent<unknown>) =>
            cambiarEstado(nodo.id, parametro.clave, evento.detail)}
        >
          ${parametro.dibujar(
            nodo.parametros[parametro.clave],
            errorDe(parametro.clave),
            nodo.estadoDeLosParametros?.[parametro.clave],
          )}
        </div>
      `,
    );

    return html`
      <aside aria-label="Configuración de la caja">
        <h3>${nombre}</h3>
        ${parametros.length === 0
          ? html`<p class="vacia">Esta caja no tiene nada para configurar.</p>`
          : campos}
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
