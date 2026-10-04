import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { Plug, RefreshCw, Unplug } from "lucide";

import "@/componentes/boton-de-accion";
import "@/componentes/campo-lista";
import { ControladorDeEstado } from "@/estado/controlador";
import { actualizar, estado, type Puerto } from "@/estado/estado";
import { compartidos } from "@/estilos/compartidos";
import { actualizarListaDePuertos, conectar, conNombresAMostrar, desconectar } from "./conexion";

function opcionesDePuerto(puertos: Puerto[]) {
  return conNombresAMostrar(puertos).map((puerto) => ({ valor: puerto.id, texto: puerto.nombre }));
}

@customElement("panel-conexion")
export class PanelConexion extends LitElement {
  static styles = [
    compartidos,
    css`
      :host {
        display: block;
        padding: 12px;
      }

      /* Los selectores no ganan nada con más ancho: conservan el que tenían
         cuando todo el contenido medía como máximo 900px. */
      .formulario {
        width: 100%;
        max-width: 804px;
        margin-inline: auto;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: end;
      }

      .subtitulo {
        flex-basis: 100%;
        margin: 0;
        color: var(--letra-secundaria);
      }

      campo-lista {
        flex: 1 1 220px;
      }

      /* Siempre en su propia línea, debajo de los selectores, y los tres del
         ancho del más ancho. */
      .fila-botones {
        flex-basis: 100%;
        display: flex;
      }

      .botones {
        display: inline-grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        gap: 1px;
      }

      .mensaje {
        flex-basis: 100%;
        margin: 0;
        font-weight: 600;
        color: var(--letra-error);
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

        <campo-lista
          etiqueta="Puerto de entrada"
          textoSinOpciones="No hay puertos disponibles"
          textoSinElegir="Elegí un puerto"
          .opciones=${opcionesDePuerto(estado.puertosEntrada)}
          .valor=${estado.puertoEntradaElegido}
          ?deshabilitado=${estado.conectado}
          @cambio=${(evento: CustomEvent<string>) =>
            actualizar({ puertoEntradaElegido: evento.detail })}
        ></campo-lista>
        <campo-lista
          etiqueta="Puerto de salida"
          textoSinOpciones="No hay puertos disponibles"
          textoSinElegir="Elegí un puerto"
          .opciones=${opcionesDePuerto(estado.puertosSalida)}
          .valor=${estado.puertoSalidaElegido}
          ?deshabilitado=${estado.conectado}
          @cambio=${(evento: CustomEvent<string>) =>
            actualizar({ puertoSalidaElegido: evento.detail })}
        ></campo-lista>

        <div class="fila-botones">
          <div class="botones">
            <boton-de-accion
              .icono=${RefreshCw}
              ?deshabilitado=${estado.conectado}
              @click=${actualizarListaDePuertos}
            >
              Actualizar puertos
            </boton-de-accion>
            <boton-de-accion .icono=${Plug} ?deshabilitado=${estado.conectado} @click=${conectar}>
              Conectar
            </boton-de-accion>
            <boton-de-accion
              .icono=${Unplug}
              ?deshabilitado=${!estado.conectado}
              @click=${desconectar}
            >
              Desconectar
            </boton-de-accion>
          </div>
        </div>

        <p class="mensaje">${estado.mensajeConexion}</p>
      </div>
    `;
  }
}
