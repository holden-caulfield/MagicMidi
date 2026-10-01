import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { guard } from "lit/directives/guard.js";
import { repeat } from "lit/directives/repeat.js";
import { Ban, CornerDownRight, Equal, type IconNode, TriangleAlert } from "lucide";

import { ControladorDeEstado } from "@/estado/controlador";
import { compartidos } from "@/estilos/compartidos";
import { describirMensaje } from "@/midi/describir";
import type { MensajeMidi } from "@/midi/mensaje";
import { dibujarIcono } from "@/workflow/iconos";
import {
  entradasDelLog,
  formatearBytes,
  formatearHora,
  limpiarLog,
  suscribirAlLog,
  type EntradaDelLog,
} from "./log";

function marca(icono: IconNode, texto: string) {
  return html`
    <span class="columna-marca" title=${texto}>
      ${dibujarIcono(icono, 14)}<span class="texto-oculto">${texto}</span>
    </span>
  `;
}

function marcaDelResultado({ resultado }: EntradaDelLog) {
  switch (resultado.tipo) {
    case "error":
      return marca(TriangleAlert, `Error: ${resultado.texto}`);
    case "sin-cambios":
      return marca(Equal, "Salió sin cambios");
    case "descartado":
      return marca(Ban, "Descartado");
    case "transformado":
      return html`<span class="columna-marca"></span>`;
  }
}

function filaDeSalida(mensaje: MensajeMidi) {
  return html`
    <div class="fila-mensaje fila-salida">
      <span class="columna-hora">
        ${dibujarIcono(CornerDownRight, 14)}<span class="texto-oculto">Salida</span>
      </span>
      <span class="columna-bytes">${formatearBytes(mensaje)}</span>
      <span class="columna-descripcion">${describirMensaje(mensaje)}</span>
      <span class="columna-marca"></span>
    </div>
  `;
}

function grupo(entrada: EntradaDelLog) {
  const { mensaje, resultado } = entrada;
  return html`
    <div class="grupo-mensaje">
      <div class="fila-mensaje fila-entrada ${resultado.tipo}">
        <span class="columna-hora">${formatearHora(entrada.marcaTemporalMs)}</span>
        <span class="columna-bytes">${formatearBytes(mensaje)}</span>
        <span class="columna-descripcion">${describirMensaje(mensaje)}</span>
        ${marcaDelResultado(entrada)}
      </div>
      ${resultado.tipo === "transformado" ? resultado.salidas.map(filaDeSalida) : null}
    </div>
  `;
}

@customElement("panel-log")
export class PanelLog extends LitElement {
  static styles = [
    compartidos,
    css`
      :host {
        flex: 1;
        min-height: 0;
        display: flex;
      }

      /* Lo justo para que la fila más ancha de un mensaje de canal ("Cambio de
         Control · canal 16 · controlador 127 · valor 127") entre en una
         línea: más ancho solo aleja las marcas de la descripción. */
      .contenido {
        flex: 1;
        min-height: 0;
        width: 100%;
        max-width: 51rem;
        margin-inline: auto;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .encabezado {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      h2 {
        margin: 0;
      }

      .lista {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        font-family: "SF Mono", "Fira Code", Consolas, monospace;
        font-size: 0.85em;
        border-radius: 8px;
        background-color: var(--fondo-hundido);
      }

      .grupo-mensaje {
        border-bottom: 1px solid rgba(127, 127, 127, 0.12);
      }

      /* Todas las filas comparten las columnas, así los bytes y la descripción
         de lo que salió quedan debajo de los de la entrada. */
      .fila-mensaje {
        display: grid;
        grid-template-columns: 7.5em 11em 1fr 1.5em;
        gap: 0.75rem;
        align-items: center;
        padding: 0.3rem 0.75rem;
      }

      .fila-entrada.transformado {
        background-color: var(--fondo-entrada-que-no-salio);
      }

      .fila-entrada.descartado {
        color: var(--letra-descartado);
        background-color: var(--fondo-entrada-que-no-salio);
      }

      .fila-entrada.sin-cambios {
        color: var(--letra-sin-cambios);
      }

      .fila-entrada.error {
        color: var(--letra-error);
        background-color: var(--fondo-error);
      }

      .fila-salida {
        color: var(--letra-salida);
        background-color: var(--fondo-salida);
      }

      .fila-salida .columna-hora,
      .columna-marca {
        display: flex;
        align-items: center;
      }

      .columna-marca {
        justify-content: flex-end;
      }

      .texto-oculto {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      .columna-hora {
        opacity: 0.6;
      }

      .columna-bytes {
        letter-spacing: 0.05em;
      }
    `,
  ];

  constructor() {
    super();
    new ControladorDeEstado(this, { suscribir: suscribirAlLog });
  }

  // Cada mensaje MIDI llega en su propia tarea, y Lit dibujaría una vez por
  // cada una: esperando al próximo cuadro, una ráfaga se dibuja una sola vez.
  protected override async scheduleUpdate() {
    await new Promise((listo) => requestAnimationFrame(listo));
    super.scheduleUpdate();
  }

  render() {
    // Cada entrada se dibuja una sola vez: no cambia después de creada, así
    // que `guard` evita volver a armar las 500 filas con cada mensaje nuevo.
    return html`
      <div class="contenido">
        <div class="encabezado">
          <h2>Mensajes MIDI</h2>
          <button type="button" @click=${limpiarLog}>Limpiar</button>
        </div>
        <div class="lista">
          ${repeat(
            entradasDelLog(),
            (entrada) => entrada.id,
            (entrada) => guard([entrada], () => grupo(entrada)),
          )}
        </div>
      </div>
    `;
  }
}
