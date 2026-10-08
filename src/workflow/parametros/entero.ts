import { html } from "lit";

import "@/componentes/campo-numero";
import type { Modo } from "@/componentes/modo-numerico";
import { formato, type Texto } from "@/formato";
import type { ParametroBase } from "./parametro";

export interface ParametroEntero extends ParametroBase<number> {
  tipo: "entero";
  /** Si se omite, no hay mínimo. */
  minimo?: number;
  /** Si se omite, no hay máximo. */
  maximo?: number;
  /**
   * Los modos en que se muestra y se escribe, en el orden en que rotan; el
   * primero es el de una caja nueva. Si se omite, son decimal, nota y
   * hexadecimal. La nota pide mínimo y máximo dentro de 0 a 127, y el
   * hexadecimal, un mínimo de 0 o más.
   */
  modos?: Modo[];
}

/** Si el valor le sirve al parámetro: `null`, o el texto del error. */
export function validar(parametro: ParametroEntero, valor: number): Texto | null {
  const { minimo, maximo } = parametro;
  if (!Number.isInteger(valor)) {
    return "Tiene que ser un número entero";
  }
  if (minimo !== undefined && maximo !== undefined && (valor < minimo || valor > maximo)) {
    return formato`Tiene que ir de ${minimo} a ${maximo}`;
  }
  if (minimo !== undefined && valor < minimo) {
    return formato`Tiene que ser ${minimo} o más`;
  }
  if (maximo !== undefined && valor > maximo) {
    return formato`Tiene que ser ${maximo} o menos`;
  }
  return null;
}

export default {
  validar,
  dibujar: (parametro: ParametroEntero, valor: number, error: Texto | null, estado: unknown) =>
    html`<campo-numero
      etiqueta=${parametro.etiqueta}
      .valor=${valor}
      .error=${error}
      .modos=${parametro.modos}
      .minimo=${parametro.minimo}
      .maximo=${parametro.maximo}
      .estado=${estado}
    ></campo-numero>`,
};
