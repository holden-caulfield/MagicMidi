import { html } from "lit";

import "@/componentes/campo-autocompletar";
import type { Declaracion, Parametro } from "./parametro";

type Valor = number | string;

export interface DeclaracionDeAutocompletar<T extends Valor> extends Declaracion<T[]> {
  opciones: { valor: T; texto: string }[];
  /** Se muestra debajo del campo cuando no hay ninguna elegida, por ejemplo "Cualquier tipo". */
  textoDeAyuda?: string;
}

/**
 * Varias opciones de una lista cerrada, que se buscan escribiendo: para listas
 * largas, que como píldoras ocuparían demasiado.
 */
export function autocompletar<T extends Valor>(
  declaracion: DeclaracionDeAutocompletar<T>,
): Parametro<T[]> {
  const { etiqueta, opciones, textoDeAyuda } = declaracion;
  const valores = opciones.map((opcion) => opcion.valor);
  return {
    ...declaracion,
    validar(valor) {
      if (
        !Array.isArray(valor) ||
        valor.some((elegida) => !valores.includes(elegida)) ||
        new Set(valor).size !== valor.length
      ) {
        return "Tiene que tener solo opciones de la lista, sin repetir";
      }
      return null;
    },
    dibujar: (valor, error) =>
      html`<campo-autocompletar
        etiqueta=${etiqueta}
        .opciones=${opciones}
        .valor=${valor}
        .textoDeAyuda=${textoDeAyuda}
        .error=${error}
      ></campo-autocompletar>`,
  };
}
