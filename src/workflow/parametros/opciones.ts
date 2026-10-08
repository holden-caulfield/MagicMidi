import { html } from "lit";

import "@/componentes/campo-opciones";
import type { Declaracion, Parametro } from "./parametro";

type Valor = number | string;

export interface DeclaracionDeOpciones<T extends Valor> extends Declaracion<T[]> {
  opciones: { valor: T; texto: string }[];
}

/**
 * Varias opciones de una lista cerrada, todas a la vista como píldoras: para
 * pocas opciones de texto corto.
 */
export function opciones<T extends Valor>(declaracion: DeclaracionDeOpciones<T>): Parametro<T[]> {
  const { etiqueta } = declaracion;
  const valores = declaracion.opciones.map((opcion) => opcion.valor);
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
      html`<campo-opciones
        etiqueta=${etiqueta}
        .opciones=${declaracion.opciones}
        .valor=${valor}
        .error=${error}
      ></campo-opciones>`,
  };
}
