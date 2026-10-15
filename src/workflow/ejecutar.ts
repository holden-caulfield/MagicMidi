import { enviarMensaje } from "@/conexion/conexion";
import { estado } from "@/estado/estado";
import { escribir } from "@/formato";
import { agregarAlLog } from "@/log/log";
import { type EventoMidi, MensajeMidi } from "@/midi/mensaje";
import { tieneSalida, TIPOS_DE_NODO } from "./nodos/catalogo";
import { anotarNotasPrendidas, soltarNota } from "./notas-prendidas";
import { erroresDeConfiguracion } from "./validacion";

export interface ResultadoDelFlujo {
  /** Lo que hay que enviar al puerto de salida, en orden. */
  salidas: MensajeMidi[];
  /** El texto del error, si una caja falló; `null` si no. */
  error: string | null;
  /**
   * Si el mensaje es un Nota Off que, en lugar de salir tal cual, apagó lo que
   * prendió su Nota On: entonces `salidas` son los Nota Off del apareo.
   */
  apareado: boolean;
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
  // Una caja mal configurada no procesa nada: así `procesar` puede suponer
  // que sus parámetros están bien. Los valores del error van al log como
  // texto común: ahí no hay un campo que los escriba en su modo.
  const [primerError] = erroresDeConfiguracion(nodo);
  if (primerError) {
    const parametro = tipo.parametros.find((candidato) => candidato.clave === primerError.clave);
    throw new Error(
      `La caja "${tipo.nombre}" está mal configurada: ${parametro?.etiqueta ?? primerError.clave}: ${escribir(primerError.mensaje)}`,
    );
  }

  let resultado;
  try {
    resultado = tipo.procesar(mensaje, nodo.parametros);
  } catch (error) {
    throw new Error(`La caja "${tipo.nombre}" falló: ${detalleDelError(error)}`, {
      cause: error,
    });
  }

  const mensajes = resultado == null ? [] : Array.isArray(resultado) ? resultado : [resultado];
  if (!mensajes.every(esMensajeValido)) {
    throw new Error(`La caja "${tipo.nombre}" produjo un mensaje MIDI inválido`, {
      cause: resultado,
    });
  }
  // Llegar a una caja sin salida cuenta aunque no devuelva nada, como
  // Descartar: lo que devuelve es lo que sale por el puerto.
  if (!tieneSalida(tipo)) {
    salidas.push(...mensajes);
    return true;
  }
  let llegoAUnFin = false;
  // Sin `.some()`, por lo mismo que en `entregar`.
  for (const siguiente of mensajes) {
    if (entregar(nodoId, siguiente, salidas)) {
      llegoAUnFin = true;
    }
  }
  return llegoAUnFin;
}

function recorrerElFlujo(mensaje: MensajeMidi): ResultadoDelFlujo {
  // Cada Nota Off cierra lo que anotó su Nota On aunque no se aparee: la tecla
  // se soltó igual.
  const apagan = mensaje.tipo === "nota-off" ? soltarNota(mensaje) : null;
  const salidas: MensajeMidi[] = [];
  try {
    if (entregar("trigger", mensaje, salidas)) {
      return { salidas, error: null, apareado: false };
    }
  } catch (error) {
    console.error(error);
    return { salidas: [], error: detalleDelError(error), apareado: false };
  }
  if (apagan) {
    return { salidas: apagan, error: null, apareado: true };
  }
  return { salidas: [mensaje], error: null, apareado: false };
}

/**
 * Pasa el mensaje por el flujo y devuelve lo que hay que enviar al puerto de
 * salida. Si ningún camino llega a una caja de fin, el mensaje sale tal cual,
 * salvo un Nota Off, que apaga lo que prendió su Nota On, si quedó anotado; si
 * una caja falla, no sale nada. Anota lo que prende cada Nota On, pero no
 * envía nada: de eso se encarga quien lo llama.
 */
export function procesarMensaje(mensaje: MensajeMidi): ResultadoDelFlujo {
  const resultado = recorrerElFlujo(mensaje);
  if (mensaje.tipo === "nota-on") {
    anotarNotasPrendidas(mensaje, resultado.salidas);
  }
  return resultado;
}

/** Pasa por el flujo un mensaje que llegó del backend, envía lo que sale y lo agrega al log. */
export function recibirMensaje(evento: EventoMidi) {
  // Primero se procesa y después se dibuja, así el envío no espera al DOM.
  const { salidas, error, apareado } = procesarMensaje(new MensajeMidi(evento.datos));
  salidas.forEach(enviarMensaje);
  agregarAlLog(evento, salidas, error, apareado);
}
