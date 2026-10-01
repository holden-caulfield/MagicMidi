import { html } from "lit-html";
import { Ban, CornerDownRight, Equal, type IconNode, TriangleAlert } from "lucide";

import { describirMensaje } from "./describir";
import { dibujarIcono } from "@/workflow/iconos";
import { MensajeMidi } from "@/workflow/tipos";

export interface EventoMidi {
  puerto: string;
  marca_temporal_ms: number;
  datos: number[];
}

export type Resultado =
  | { tipo: "error"; texto: string }
  | { tipo: "descartado" }
  | { tipo: "sin-cambios" }
  | { tipo: "transformado"; salidas: MensajeMidi[] };

const MAXIMO_MENSAJES_EN_PANTALLA = 500;

// Las filas no se dibujan con una plantilla: redibujar la lista entera con
// cada mensaje MIDI no escala, así que se agregan a mano al contenedor.
let listaMensajes: HTMLDivElement;

function sonIguales(a: MensajeMidi, b: MensajeMidi): boolean {
  return a.bytes.length === b.bytes.length && a.bytes.every((byte, i) => byte === b.bytes[i]);
}

/**
 * Decide cómo se muestra lo que salió a partir de un mensaje de entrada. Solo
 * cuando la única salida es idéntica a la entrada se la marca en la misma
 * fila; si salió más de un mensaje, van todos como sub-filas, aunque alguno
 * sea igual a la entrada.
 */
export function clasificarSalidas(
  entrada: MensajeMidi,
  salidas: MensajeMidi[],
  error: string | null = null,
): Resultado {
  // Va primero: con un error las salidas vienen vacías, y sin esto se vería
  // como descartado.
  if (error !== null) {
    return { tipo: "error", texto: error };
  }
  if (salidas.length === 0) {
    return { tipo: "descartado" };
  }
  if (salidas.length === 1 && sonIguales(salidas[0], entrada)) {
    return { tipo: "sin-cambios" };
  }
  return { tipo: "transformado", salidas };
}

function formatearBytes(mensaje: MensajeMidi): string {
  return mensaje.bytes
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

function formatearHora(marcaTemporalMs: number): string {
  const fecha = new Date(marcaTemporalMs);
  const hora = fecha.toLocaleTimeString("es-AR", { hour12: false });
  const milisegundos = String(fecha.getMilliseconds()).padStart(3, "0");
  return `${hora}.${milisegundos}`;
}

function crearColumna(clase: string, texto = ""): HTMLSpanElement {
  const columna = document.createElement("span");
  columna.className = clase;
  columna.textContent = texto;
  return columna;
}

function crearTextoOculto(texto: string): HTMLSpanElement {
  return crearColumna("texto-oculto", texto);
}

function crearMarca(icono: IconNode, texto: string): HTMLSpanElement {
  const marca = crearColumna("columna-marca");
  marca.title = texto;
  marca.append(dibujarIcono(icono, 14), crearTextoOculto(texto));
  return marca;
}

function crearFila(clase: string, mensaje: MensajeMidi, primeraColumna: HTMLSpanElement) {
  const fila = document.createElement("div");
  fila.className = clase;
  fila.append(
    primeraColumna,
    crearColumna("columna-bytes", formatearBytes(mensaje)),
    crearColumna("columna-descripcion", describirMensaje(mensaje)),
  );
  return fila;
}

function crearFilaDeSalida(mensaje: MensajeMidi): HTMLDivElement {
  const flecha = crearColumna("columna-hora");
  flecha.append(dibujarIcono(CornerDownRight, 14), crearTextoOculto("Salida"));
  const fila = crearFila("fila-mensaje fila-salida", mensaje, flecha);
  fila.append(crearColumna("columna-marca"));
  return fila;
}

function crearGrupo(
  evento: EventoMidi,
  salidas: MensajeMidi[],
  error: string | null,
): HTMLDivElement {
  const mensaje = new MensajeMidi(evento.datos);
  const resultado = clasificarSalidas(mensaje, salidas, error);

  const entrada = crearFila(
    `fila-mensaje fila-entrada ${resultado.tipo}`,
    mensaje,
    crearColumna("columna-hora", formatearHora(evento.marca_temporal_ms)),
  );
  if (resultado.tipo === "error") {
    entrada.append(crearMarca(TriangleAlert, `Error: ${resultado.texto}`));
  } else if (resultado.tipo === "sin-cambios") {
    entrada.append(crearMarca(Equal, "Salió sin cambios"));
  } else if (resultado.tipo === "descartado") {
    entrada.append(crearMarca(Ban, "Descartado"));
  } else {
    entrada.append(crearColumna("columna-marca"));
  }

  const grupo = document.createElement("div");
  grupo.className = "grupo-mensaje";
  grupo.append(entrada);
  if (resultado.tipo === "transformado") {
    grupo.append(...resultado.salidas.map(crearFilaDeSalida));
  }
  return grupo;
}

/**
 * Agrega arriba de todo el mensaje que entró junto con lo que salió de él, o
 * con el error si una caja falló al procesarlo.
 */
export function agregarAlLog(evento: EventoMidi, salidas: MensajeMidi[], error: string | null) {
  listaMensajes.prepend(crearGrupo(evento, salidas, error));

  while (listaMensajes.childElementCount > MAXIMO_MENSAJES_EN_PANTALLA) {
    listaMensajes.removeChild(listaMensajes.lastChild as ChildNode);
  }
}

function limpiar() {
  listaMensajes.innerHTML = "";
}

export function panelLog() {
  return html`
    <div class="contenido-log">
      <div class="encabezado-log">
        <h2>Mensajes MIDI</h2>
        <button type="button" @click=${limpiar}>Limpiar</button>
      </div>
      <div id="lista-mensajes" class="lista-mensajes"></div>
    </div>
  `;
}

export function inicializarLog() {
  listaMensajes = document.querySelector<HTMLDivElement>("#lista-mensajes")!;
}
