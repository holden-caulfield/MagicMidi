import { type EventoMidi, MensajeMidi } from "@/midi/mensaje";

export type Resultado =
  | { tipo: "error"; texto: string }
  | { tipo: "descartado" }
  | { tipo: "sin-cambios" }
  | { tipo: "transformado"; salidas: MensajeMidi[] };

/** Un mensaje que entró, con lo que pasó con él. No cambia una vez creada. */
export interface EntradaDelLog {
  /** Distinto para cada entrada: es la clave con que se dibuja la lista. */
  id: number;
  marcaTemporalMs: number;
  mensaje: MensajeMidi;
  resultado: Resultado;
}

const MAXIMO_DE_ENTRADAS = 500;

// El log tiene su propio registro, separado del estado de la pantalla: si
// estuviera ahí, cada mensaje MIDI haría volver a dibujar toda la ventana.
let entradas: EntradaDelLog[] = [];
let proximoId = 0;
const observadores: Array<() => void> = [];

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

export function formatearBytes(mensaje: MensajeMidi): string {
  return mensaje.bytes
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

export function formatearHora(marcaTemporalMs: number): string {
  const fecha = new Date(marcaTemporalMs);
  const hora = fecha.toLocaleTimeString("es-AR", { hour12: false });
  const milisegundos = String(fecha.getMilliseconds()).padStart(3, "0");
  return `${hora}.${milisegundos}`;
}

/** Las entradas del log, de la más nueva a la más vieja. */
export function entradasDelLog(): readonly EntradaDelLog[] {
  return entradas;
}

/** Devuelve la función para dejar de recibir los avisos. */
export function suscribirAlLog(observador: () => void): () => void {
  observadores.push(observador);
  return () => {
    observadores.splice(observadores.indexOf(observador), 1);
  };
}

function avisar() {
  for (const observador of observadores) {
    observador();
  }
}

/**
 * Agrega arriba de todo el mensaje que entró junto con lo que salió de él, o
 * con el error si una caja falló al procesarlo.
 */
export function agregarAlLog(evento: EventoMidi, salidas: MensajeMidi[], error: string | null) {
  const mensaje = new MensajeMidi(evento.datos);
  const entrada: EntradaDelLog = {
    id: proximoId++,
    marcaTemporalMs: evento.marca_temporal_ms,
    mensaje,
    resultado: clasificarSalidas(mensaje, salidas, error),
  };
  entradas = [entrada, ...entradas].slice(0, MAXIMO_DE_ENTRADAS);
  avisar();
}

export function limpiarLog() {
  entradas = [];
  avisar();
}
