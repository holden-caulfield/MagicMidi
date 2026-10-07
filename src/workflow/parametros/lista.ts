import { html } from "lit";

import "@/componentes/campo-lista";
import type { Texto } from "@/formato";
import type { ParametroBase } from "./parametro";

type Valor = number | string | boolean;

// Genérico para que el valor inicial y los de las opciones sean del mismo tipo.
export interface ParametroLista<T extends Valor> extends ParametroBase<T> {
  tipo: "lista";
  opciones: { valor: T; texto: string }[];
}

export default {
  validar: (parametro: ParametroLista<Valor>, valor: Valor) =>
    parametro.opciones.some((opcion) => opcion.valor === valor)
      ? null
      : "Tiene que ser una de las opciones",
  dibujar: (parametro: ParametroLista<Valor>, valor: Valor, error: Texto | null) =>
    html`<campo-lista
      etiqueta=${parametro.etiqueta}
      .opciones=${parametro.opciones}
      .valor=${valor}
      .error=${error}
    ></campo-lista>`,
};
