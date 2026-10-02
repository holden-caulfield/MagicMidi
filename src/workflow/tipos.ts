import type { IconNode } from "lucide";

import type { MensajeMidi } from "@/midi/mensaje";
import type { Parametro, ValorDeParametro } from "./parametros/catalogo";

/** Un problema en la configuración de una caja, asociado a uno de sus parámetros. */
export interface ErrorDeConfiguracion {
  /** La clave del parámetro debajo del cual se muestra el error. */
  clave: string;
  mensaje: string;
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
  parametros: Parametro[];
  /**
   * Reglas que miran varios parámetros juntos. Es opcional, y se llama solo si
   * cada parámetro, por separado, ya tiene un valor que le sirve. Devuelve los
   * errores que encontró, o una lista vacía.
   */
  validar?(parametros: Record<string, ValorDeParametro>): ErrorDeConfiguracion[];
  /**
   * Recibe una copia del mensaje (se puede modificar sin afectar a otras
   * ramas) y devuelve el mensaje que pasa a las cajas siguientes, o nada para
   * descartarlo. En una caja sin salida, lo que devuelve es lo que sale por el
   * puerto MIDI. Nunca envía nada por su cuenta.
   */
  procesar(
    mensaje: MensajeMidi,
    parametros: Record<string, ValorDeParametro>,
  ): MensajeMidi | null | void;
}
