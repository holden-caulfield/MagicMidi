import { html } from "lit";

import "@/componentes/campo-lista";
import type { Declaracion, Parametro } from "./parametro";

type Valor = number | string | boolean;

// Genérico para que el valor inicial y los de las opciones sean del mismo tipo.
export interface DeclaracionDeLista<T extends Valor> extends Declaracion<T> {
  opciones: { valor: T; texto: string }[];
}

/** Una sola opción de una lista cerrada, con un desplegable. */
export function lista<T extends Valor>(declaracion: DeclaracionDeLista<T>): Parametro<T> {
  const { etiqueta, opciones } = declaracion;
  return {
    ...declaracion,
    validar: (valor) =>
      opciones.some((opcion) => opcion.valor === valor)
        ? null
        : "Tiene que ser una de las opciones",
    dibujar: (valor, error) =>
      html`<campo-lista
        etiqueta=${etiqueta}
        .opciones=${opciones}
        .valor=${valor}
        .error=${error}
      ></campo-lista>`,
  };
}
