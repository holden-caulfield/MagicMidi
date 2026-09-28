import { listen } from "@tauri-apps/api/event";

import { estado } from "../estado";
import { agregarAlLog, type EventoMidi } from "../log";
import { tieneSalida, TIPOS_DE_NODO } from "./catalogo";
import { enviarMensaje } from "./salida";
import type { MensajeMidi } from "./tipos";

function esMensajeValido(resultado: unknown): resultado is MensajeMidi {
  return (
    Array.isArray(resultado) &&
    resultado.length > 0 &&
    resultado.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
  );
}

function entregar(desde: string, mensaje: MensajeMidi, salidas: MensajeMidi[]) {
  for (const conexion of estado.flujo.conexiones) {
    if (conexion.desde === desde) {
      procesarEn(conexion.hacia, [...mensaje], salidas);
    }
  }
}

function procesarEn(nodoId: string, mensaje: MensajeMidi, salidas: MensajeMidi[]) {
  const nodo = estado.flujo.nodos.find((candidato) => candidato.id === nodoId);
  if (!nodo || nodo.tipo === "trigger") {
    return;
  }

  const tipo = TIPOS_DE_NODO[nodo.tipo];
  let resultado;
  try {
    resultado = tipo.procesar(mensaje, nodo.parametros);
  } catch (error) {
    console.error(`La caja "${tipo.nombre}" falló al procesar un mensaje:`, error);
    return;
  }

  if (resultado == null) {
    return;
  }
  if (!esMensajeValido(resultado)) {
    console.warn(`La caja "${tipo.nombre}" produjo un mensaje MIDI inválido:`, resultado);
    return;
  }
  // Lo que devuelve una caja sin salida, como Emitir, es lo que sale por el
  // puerto.
  if (tieneSalida(tipo)) {
    entregar(nodoId, resultado, salidas);
  } else {
    salidas.push(resultado);
  }
}

/**
 * Pasa el mensaje por el flujo y devuelve, en orden, lo que hay que enviar al
 * puerto de salida. No envía nada: de eso se encarga quien lo llama.
 */
export function procesarMensaje(mensaje: MensajeMidi): MensajeMidi[] {
  const salidas: MensajeMidi[] = [];
  entregar("trigger", mensaje, salidas);
  return salidas;
}

export async function inicializarWorkflow() {
  // Primero se procesa y después se dibuja, así el envío no espera al DOM.
  await listen<EventoMidi>("mensaje-midi", (evento) => {
    const salidas = procesarMensaje(evento.payload.datos);
    salidas.forEach(enviarMensaje);
    agregarAlLog(evento.payload, salidas);
  });
}
