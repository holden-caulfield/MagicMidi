import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { guard } from "lit/directives/guard.js";
import { repeat } from "lit/directives/repeat.js";
import { Ban, CornerDownRight, Equal, type IconNode, Trash2, TriangleAlert } from "lucide";

import "@/componentes/boton-de-accion";
import { dibujarIcono } from "@/componentes/icono";
import { ControladorDeEstado } from "@/estado/controlador";
import { compartidos } from "@/estilos/compartidos";
import { partesDeLaDescripcion } from "@/midi/describir";
import type { MensajeMidi } from "@/midi/mensaje";
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

// Cada parte va en su sub-columna, así las partes equivalentes de filas
// distintas quedan una debajo de la otra. Lo que tiene una sola parte (los
// mensajes de sistema) ocupa todas.
function descripcion(mensaje: MensajeMidi) {
  const partes = partesDeLaDescripcion(mensaje);
  if (partes.length === 1) {
    return html`<span class="descripcion-entera">${partes[0]}</span>`;
  }
  return [0, 1, 2, 3].map((i) => html`<span class="parte">${partes[i] ?? ""}</span>`);
}

function filaDeSalida(mensaje: MensajeMidi) {
  return html`
    <div class="fila-mensaje fila-salida">
      <span class="columna-hora">
        ${dibujarIcono(CornerDownRight, 14)}<span class="texto-oculto">Salida</span>
      </span>
      <span class="columna-bytes">${formatearBytes(mensaje)}</span>
      ${descripcion(mensaje)}
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
        ${descripcion(mensaje)}
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

      /* La fila de encabezados va dentro de lo que se desplaza, pegada arriba:
         así acompaña a las filas cuando se desplazan a lo ancho. */
      .lista {
        flex: 1;
        min-height: 0;
        overflow: auto;
        font-family: var(--letra-monoespaciada);
        background-color: var(--fondo-hundido);
      }

      /* La fila conserva la letra monoespaciada, porque las columnas se miden
         en ch y con otra letra tendrían otro ancho: la de los títulos se
         cambia en cada uno. Suma una columna que llega hasta el borde derecho,
         para el botón de limpiar. */
      .fila-mensaje.fila-encabezados {
        position: sticky;
        top: 0;
        z-index: 1;
        grid-template-columns: var(--columnas) minmax(0, 1fr);
        color: var(--letra-secundaria);
        background-color: var(--fondo-ventana);
        border-bottom: 1px solid var(--borde-suave);
      }

      .fila-encabezados > span {
        font-family: var(--letra-interfaz);
        font-size: 11px;
      }

      .fila-encabezados .limpiar {
        grid-column: -2;
        justify-self: end;
      }

      .grupo-mensaje {
        border-bottom: 1px solid rgba(127, 127, 127, 0.12);
      }

      /* Todas las filas comparten las columnas, así los bytes y cada parte de
         la descripción de lo que salió quedan debajo de los de la entrada.
         Las medidas van en ch (la letra es monoespaciada): las sub-columnas
         de la descripción alcanzan para su parte más ancha ("Presión
         Polifónica", "canal 16", "controlador 127", "velocidad 127"). Las
         columnas no se estiran: lo que sobra queda a la derecha. */
      .fila-mensaje {
        --columnas: 13.5ch 10.5ch 18ch 8ch 15ch 13ch 2em;
        min-width: max-content;
        display: grid;
        grid-template-columns: var(--columnas);
        column-gap: 1ch;
        align-items: center;
        padding: 3px 10px;
      }

      .descripcion-entera {
        grid-column: span 4;
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
      <div class="lista">
        <div class="fila-mensaje fila-encabezados">
          <span>Hora</span>
          <span>Bytes</span>
          <span class="descripcion-entera">Descripción</span>
          <boton-de-accion
            class="limpiar"
            etiqueta="Limpiar"
            .icono=${Trash2}
            @click=${limpiarLog}
          ></boton-de-accion>
        </div>
        ${repeat(
          entradasDelLog(),
          (entrada) => entrada.id,
          (entrada) => guard([entrada], () => grupo(entrada)),
        )}
      </div>
    `;
  }
}
