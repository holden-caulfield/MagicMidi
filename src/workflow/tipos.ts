import type { IconNode } from "lucide";

import type { Texto } from "@/formato";
import type { MensajeMidi } from "@/midi/mensaje";
import type { Parametro } from "./parametros/parametro";

/** Un problema en la configuración de una caja, asociado a uno de sus parámetros. */
export interface ErrorDeConfiguracion {
  /** La clave del parámetro debajo del cual se muestra el error. */
  clave: string;
  /**
   * Si nombra valores, van marcados con `formato`: los escribe el campo donde
   * se muestra (un número, en su modo), y el log, como texto común.
   */
  mensaje: Texto;
}

/**
 * Todo lo que hace falta para definir un tipo de nodo. Ver la guía en
 * `nodos/LEEME.md`.
 */
export interface TipoDeNodo {
  nombre: string;
  icono: IconNode;
  /** Si se omite, la caja tiene salida. */
  tieneSalida?: boolean;
  /** Cada uno armado con la función de su tipo: `entero(…)`, `lista(…)`… */
  parametros: Parametro[];
  /**
   * Reglas que miran varios parámetros juntos. Es opcional, y se llama solo si
   * cada parámetro, por separado, ya tiene un valor que le sirve. Devuelve los
   * errores que encontró, o una lista vacía. Para nombrar un valor en un
   * error, se lo marca con `formato`: lo escribe el campo debajo del cual se
   * muestra, como él lo muestra.
   */
  validar?(parametros: Record<string, unknown>): ErrorDeConfiguracion[];
  /**
   * Recibe una copia del mensaje (se puede modificar sin afectar a otras
   * ramas) y devuelve el mensaje que pasa a las cajas siguientes, o nada para
   * descartarlo. En una caja sin salida, lo que devuelve es lo que sale por el
   * puerto MIDI. Nunca envía nada por su cuenta.
   */
  procesar(
    mensaje: MensajeMidi,
    parametros: Record<string, unknown>,
  ): MensajeMidi | null | void;
}
