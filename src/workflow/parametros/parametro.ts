import type { TemplateResult } from "lit";

import type { Texto } from "@/formato";

/** Lo que declara todo parámetro, sea del tipo que sea. */
export interface Declaracion<V> {
  /** El nombre con que el tipo de nodo lee el valor. */
  clave: string;
  /** El texto que se ve en el panel. */
  etiqueta: string;
  /** El valor de una caja nueva. */
  inicial: V;
}

/**
 * Un parámetro de un tipo de nodo, armado por la función de su tipo
 * (`entero(…)`, `lista(…)`…): lo que declaró el tipo de nodo, más lo que sabe
 * hacer con un valor.
 */
export interface Parametro<V = unknown> extends Declaracion<V> {
  /**
   * Si el valor le sirve: `null`, o el texto del error. El chequeo de tipos no
   * alcanza a ver, por ejemplo, que un entero no tenga decimales o que esté
   * fuera de su rango. Si el texto nombra valores, van marcados con `formato`:
   * los escribe el campo donde se muestra.
   */
  validar(valor: V): Texto | null;
  /**
   * El campo que lo muestra en el panel. `error` es lo que devolvió `validar`
   * (o una regla del tipo de nodo), y `estado`, lo que el campo conservó en la
   * caja, que se le pasa sin leerlo.
   */
  dibujar(valor: V, error: Texto | null, estado: unknown): TemplateResult;
}
