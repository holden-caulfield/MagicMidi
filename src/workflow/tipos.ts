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
   * ramas) y devuelve el mensaje que pasa a las cajas siguientes, una lista
   * de mensajes que pasan de a uno, en orden, o nada para descartarlo (una
   * lista vacía es lo mismo). En una caja sin salida, lo que devuelve es lo
   * que sale por el puerto MIDI. Nunca envía nada por su cuenta.
   *
   * `memoria` es de esta caja, y es la única forma de recordar algo de un
   * mensaje al siguiente: lo que se guarda con `memoria.set(nombre, valor)`
   * se lee con `memoria.get(nombre)` cuando llega otro mensaje. Arranca vacía
   * y se olvida cuando no hay conexión. Lo que se guardara fuera de la
   * función lo compartirían todas las cajas del tipo, y no se olvidaría. Un
   * tipo que no recuerda nada no la declara.
   */
  procesar(
    mensaje: MensajeMidi,
    parametros: Record<string, unknown>,
    memoria: Map<string, unknown>,
  ): MensajeMidi | MensajeMidi[] | null | void;
}
