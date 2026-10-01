import type { IconNode } from "lucide";

import type { MensajeMidi } from "@/midi/mensaje";
import type { Parametro, ValorDeParametro } from "./parametros/catalogo";

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
