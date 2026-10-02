import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { ControladorDeEstado } from "@/estado/controlador";
import { actualizar, estado } from "@/estado/estado";
import { compartidos } from "@/estilos/compartidos";
import { actualizarListaDePuertos, conectar, desconectar } from "./conexion";
import "./selector-de-puerto";

@customElement("panel-conexion")
export class PanelConexion extends LitElement {
  static styles = [
    compartidos,
    css`
      :host {
        display: block;
        padding: 0.75rem;
      }

      /* Los selectores no ganan nada con más ancho: conservan el que tenían
         cuando todo el contenido medía como máximo 900px. */
      .formulario {
        width: 100%;
        max-width: 804px;
        margin-inline: auto;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: end;
      }

      .subtitulo {
        flex-basis: 100%;
        margin: 0;
        opacity: 0.75;
      }

      .fila-botones {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }

      .mensaje {
        flex-basis: 100%;
        margin: 0;
        font-weight: 600;
        color: #b3261e;
      }

      .mensaje:empty {
        display: none;
      }
    `,
  ];

  constructor() {
    super();
    new ControladorDeEstado(this);
  }

  render() {
    return html`
      <div class="formulario">
        <p class="subtitulo">
          Elegí un puerto de entrada y uno de salida para ver los mensajes MIDI que pasan por la
          aplicación.
        </p>

        <selector-de-puerto
          etiqueta="Puerto de entrada"
          .puertos=${estado.puertosEntrada}
          elegido=${estado.puertoEntradaElegido}
          ?deshabilitado=${estado.conectado}
          @cambio=${(evento: CustomEvent<string>) =>
            actualizar({ puertoEntradaElegido: evento.detail })}
        ></selector-de-puerto>
        <selector-de-puerto
          etiqueta="Puerto de salida"
          .puertos=${estado.puertosSalida}
          elegido=${estado.puertoSalidaElegido}
          ?deshabilitado=${estado.conectado}
          @cambio=${(evento: CustomEvent<string>) =>
            actualizar({ puertoSalidaElegido: evento.detail })}
        ></selector-de-puerto>

        <div class="fila-botones">
          <button type="button" ?disabled=${estado.conectado} @click=${actualizarListaDePuertos}>
            Actualizar puertos
          </button>
          <button type="button" ?disabled=${estado.conectado} @click=${conectar}>Conectar</button>
          <button type="button" ?disabled=${!estado.conectado} @click=${desconectar}>
            Desconectar
          </button>
        </div>

        <p class="mensaje">${estado.mensajeConexion}</p>
      </div>
    `;
  }
}
