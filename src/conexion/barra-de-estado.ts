import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { CircleCheck, TriangleAlert, Unplug } from "lucide";

import { Componente } from "@/componentes/componente";
import { dibujarIcono } from "@/componentes/icono";
import { ControladorDeEstado } from "@/estado/controlador";
import { estado } from "@/estado/estado";
import { type EstadoDeLaConexion, estadoDeLaConexion, puertoElegido } from "./conexion";

function contenidoDeLaBarra(estadoDeLaBarra: EstadoDeLaConexion) {
  switch (estadoDeLaBarra) {
    case "desconectado":
      return { icono: Unplug, texto: "Desconectado", contenido: html`Desconectado` };
    case "error":
      return {
        icono: TriangleAlert,
        texto: `Desconectado · ${estado.mensajeConexion}`,
        contenido: html`Desconectado · ${estado.mensajeConexion}`,
      };
    case "conectado": {
      const entrada = puertoElegido(estado.puertoEntradaElegido, estado.puertosEntrada)?.nombre;
      const salida = puertoElegido(estado.puertoSalidaElegido, estado.puertosSalida)?.nombre;
      return {
        icono: CircleCheck,
        texto: `Conectado · entrada ${entrada}, salida ${salida}`,
        contenido: html`Conectado ·
          <span class="texto-oculto">entrada</span>${entrada}
          <span aria-hidden="true">→</span>
          <span class="texto-oculto">salida</span>${salida}`,
      };
    }
  }
}

/** El estado de la conexión, al pie de la ventana y a la vista desde cualquier tab. */
@customElement("barra-de-estado")
export class BarraDeEstado extends Componente {
  static styles = css`
    :host {
      display: block;
    }

    .barra-de-estado {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 20px;
      padding: 0 10px;
      font-size: 11px;
      line-height: 1;
      border-top: 1px solid var(--borde-suave);
      color: var(--letra-secundaria);
    }

    .barra-de-estado svg {
      flex-shrink: 0;
    }

    .barra-de-estado.conectado {
      color: var(--letra-estado-conectado);
      background-color: var(--fondo-estado-conectado);
    }

    .barra-de-estado.error {
      color: var(--letra-estado-error);
      background-color: var(--fondo-estado-error);
    }

    .texto-de-estado {
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .texto-oculto {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `;

  constructor() {
    super();
    new ControladorDeEstado(this);
  }

  render() {
    const estadoDeLaBarra = estadoDeLaConexion(estado);
    const { icono, texto, contenido } = contenidoDeLaBarra(estadoDeLaBarra);
    return html`
      <footer class="barra-de-estado ${estadoDeLaBarra}" role="status" title=${texto}>
        ${dibujarIcono(icono, 13)}
        <span class="texto-de-estado">${contenido}</span>
      </footer>
    `;
  }
}
