import { html } from "lit";

import "@/componentes/campo-autocompletar";
import type { Texto } from "@/formato";
import type { ParametroBase } from "./parametro";

type Valor = number | string;

/**
 * Varias opciones de una lista cerrada, que se buscan escribiendo: para listas
 * largas, que como píldoras ocuparían demasiado.
 */
export interface ParametroAutocompletar<T extends Valor> extends ParametroBase<T[]> {
  tipo: "autocompletar";
  opciones: { valor: T; texto: string }[];
  /** Se muestra debajo del campo cuando no hay ninguna elegida, por ejemplo "Cualquier tipo". */
  textoDeAyuda?: string;
}

/** Si el valor le sirve al parámetro: `null`, o el texto del error. */
export function validar(parametro: ParametroAutocompletar<Valor>, valor: Valor[]): string | null {
  const valores = parametro.opciones.map((opcion) => opcion.valor);
  if (
    !Array.isArray(valor) ||
    valor.some((elegida) => !valores.includes(elegida)) ||
    new Set(valor).size !== valor.length
  ) {
    return "Tiene que tener solo opciones de la lista, sin repetir";
  }
  return null;
}

export default {
  validar,
  dibujar: (parametro: ParametroAutocompletar<Valor>, valor: Valor[], error: Texto | null) =>
    html`<campo-autocompletar
      etiqueta=${parametro.etiqueta}
      .opciones=${parametro.opciones}
      .valor=${valor}
      .textoDeAyuda=${parametro.textoDeAyuda}
      .error=${error}
    ></campo-autocompletar>`,
};
