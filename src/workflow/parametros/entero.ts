import { html } from "lit";
import { customElement } from "lit/decorators.js";

import "@/componentes/campo-numero";
import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";

export interface ParametroEntero extends ParametroBase<number> {
  tipo: "entero";
  /** Si se omite, no hay mínimo. */
  minimo?: number;
  /** Si se omite, no hay máximo. */
  maximo?: number;
}

/** El número escrito, o `null` si no es un entero (por ejemplo, "2.5" o nada). */
export function interpretar(texto: string): number | null {
  const numero = Number(texto);
  return texto.trim() !== "" && Number.isInteger(numero) ? numero : null;
}

/** El texto del error si el valor no le sirve al parámetro, o `null`. */
export function error(parametro: ParametroEntero, valor: number): string | null {
  const { minimo, maximo } = parametro;
  if (!Number.isInteger(valor)) {
    return "Tiene que ser un número entero";
  }
  if (minimo !== undefined && maximo !== undefined && (valor < minimo || valor > maximo)) {
    return `Tiene que ir de ${minimo} a ${maximo}`;
  }
  if (minimo !== undefined && valor < minimo) {
    return `Tiene que ser ${minimo} o más`;
  }
  if (maximo !== undefined && valor > maximo) {
    return `Tiene que ser ${maximo} o menos`;
  }
  return null;
}

@customElement("parametro-entero")
export class CampoEntero extends CampoDeParametro<ParametroEntero, number> {
  render() {
    return html`
      <campo-numero
        etiqueta=${this.parametro.etiqueta}
        .valor=${String(this.valor)}
        .error=${this.error}
        @cambio=${(evento: CustomEvent<string>) => {
          const numero = interpretar(evento.detail);
          // Lo que no es un entero no cambia la caja: el campo vuelve solo al
          // valor que tenía. Fuera de rango sí se guarda, y el panel muestra
          // el error.
          if (numero !== null) {
            this.avisarCambio(numero);
          }
        }}
      ></campo-numero>
    `;
  }
}

export default {
  error,
  dibujar: (parametro: ParametroEntero, valor: number, error: string | null) =>
    html`<parametro-entero .parametro=${parametro} .valor=${valor} .error=${error}></parametro-entero>`,
};
