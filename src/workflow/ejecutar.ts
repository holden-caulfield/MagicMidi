import { listen } from "@tauri-apps/api/event";

import { estado } from "@/estado/estado";
import { agregarAlLog, type EventoMidi } from "@/log";
import { MensajeMidi } from "@/midi/mensaje";
import { tieneSalida, TIPOS_DE_NODO } from "./catalogo";
import { enviarMensaje } from "./salida";

export interface ResultadoDelFlujo {
  /** Lo que hay que enviar al puerto de salida, en orden. */
  salidas: MensajeMidi[];
  /** El texto del error, si una caja falló; `null` si no. */
  error: string | null;
}

function esMensajeValido(resultado: unknown): resultado is MensajeMidi {
  return (
    resultado instanceof MensajeMidi &&
    resultado.bytes.length > 0 &&
    resultado.bytes.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
  );
}

function detalleDelError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Devuelve si alguna de las ramas que salen de `desde` llegó a una caja de fin. */
function entregar(desde: string, mensaje: MensajeMidi, salidas: MensajeMidi[]): boolean {
  let llegoAUnFin = false;
  // Sin `.some()`: cortaría en la primera rama que llega y las demás no se
  // procesarían.
  for (const conexion of estado.flujo.conexiones) {
    if (conexion.desde === desde && procesarEn(conexion.hacia, mensaje.copiar(), salidas)) {
      llegoAUnFin = true;
    }
  }
  return llegoAUnFin;
}

/**
 * Devuelve si el mensaje llegó a una caja de fin por este camino. Si una caja
 * falla, lanza un error que corta todo el recorrido.
 */
function procesarEn(nodoId: string, mensaje: MensajeMidi, salidas: MensajeMidi[]): boolean {
  const nodo = estado.flujo.nodos.find((candidato) => candidato.id === nodoId);
  if (!nodo || nodo.tipo === "trigger") {
    return false;
  }

  const tipo = TIPOS_DE_NODO[nodo.tipo];
  let resultado;
  try {
    resultado = tipo.procesar(mensaje, nodo.parametros);
  } catch (error) {
    throw new Error(`La caja "${tipo.nombre}" falló: ${detalleDelError(error)}`, {
      cause: error,
    });
  }

  if (resultado != null && !esMensajeValido(resultado)) {
    throw new Error(`La caja "${tipo.nombre}" produjo un mensaje MIDI inválido`, {
      cause: resultado,
    });
  }
  // Llegar a una caja sin salida cuenta aunque no devuelva nada, como
  // Descartar: lo que devuelve es lo que sale por el puerto.
  if (!tieneSalida(tipo)) {
    if (resultado != null) {
      salidas.push(resultado);
    }
    return true;
  }
  return resultado != null && entregar(nodoId, resultado, salidas);
}

/**
 * Pasa el mensaje por el flujo y devuelve lo que hay que enviar al puerto de
 * salida. Si ningún camino llega a una caja de fin, el mensaje sale tal cual;
 * si una caja falla, no sale nada. No envía nada: de eso se encarga quien lo
 * llama.
 */
export function procesarMensaje(mensaje: MensajeMidi): ResultadoDelFlujo {
  const salidas: MensajeMidi[] = [];
  try {
    const llegoAUnFin = entregar("trigger", mensaje, salidas);
    return { salidas: llegoAUnFin ? salidas : [mensaje], error: null };
  } catch (error) {
    console.error(error);
    return { salidas: [], error: detalleDelError(error) };
  }
}

export async function inicializarWorkflow() {
  // Primero se procesa y después se dibuja, así el envío no espera al DOM.
  await listen<EventoMidi>("mensaje-midi", (evento) => {
    const { salidas, error } = procesarMensaje(new MensajeMidi(evento.payload.datos));
    salidas.forEach(enviarMensaje);
    agregarAlLog(evento.payload, salidas, error);
  });
}
