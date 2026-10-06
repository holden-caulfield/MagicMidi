import { html } from "lit";
import { customElement } from "lit/decorators.js";

import "@/componentes/campo-numero";
import type { Paso } from "@/componentes/campo-numero";
import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";
import {
  type DeclaracionNumerica,
  formatear as formatearEnModo,
  leer,
  mismaPresentacion,
  type Presentacion,
  presentacionActual,
  siguienteModo,
  textoDelModo,
} from "./modos";

export interface ParametroEntero extends ParametroBase<number>, DeclaracionNumerica {
  tipo: "entero";
  /** Si se omite, no hay mínimo. */
  minimo?: number;
  /** Si se omite, no hay máximo. */
  maximo?: number;
}

/**
 * El número escrito y cómo pasa a mostrarse (el modo en que se leyó, y si una
 * nota se escribió con bemol), o `null` si no se puede leer en ninguno de los
 * modos del parámetro (por ejemplo, "2.5" o nada). Se prueba primero el modo
 * de `presentacion`, y después los que le siguen.
 */
export function interpretar(
  texto: string,
  parametro: DeclaracionNumerica,
  presentacion: Presentacion,
): { numero: number; presentacion: Presentacion } | null {
  return leer(texto, presentacion, parametro);
}

/** El número limitado al mínimo y al máximo del parámetro, si los tiene. */
export function limitar(parametro: DeclaracionNumerica, numero: number): number {
  const { minimo = -Infinity, maximo = Infinity } = parametro;
  return Math.min(Math.max(numero, minimo), maximo);
}

/** Un número como lo muestra el parámetro con esa presentación. */
export function formatear(parametro: ParametroEntero, numero: number, presentacion?: unknown) {
  const { modo, bemoles } = presentacionActual(parametro, presentacion);
  return formatearEnModo(numero, modo, bemoles);
}

/** El texto del error si el valor no le sirve al parámetro, o `null`. */
export function error(
  parametro: ParametroEntero,
  valor: number,
  presentacion?: unknown,
): string | null {
  const { minimo, maximo } = parametro;
  const enModo = (numero: number) => formatear(parametro, numero, presentacion);
  if (!Number.isInteger(valor)) {
    return "Tiene que ser un número entero";
  }
  if (minimo !== undefined && maximo !== undefined && (valor < minimo || valor > maximo)) {
    return `Tiene que ir de ${enModo(minimo)} a ${enModo(maximo)}`;
  }
  if (minimo !== undefined && valor < minimo) {
    return `Tiene que ser ${enModo(minimo)} o más`;
  }
  if (maximo !== undefined && valor > maximo) {
    return `Tiene que ser ${enModo(maximo)} o menos`;
  }
  return null;
}

@customElement("parametro-entero")
export class CampoEntero extends CampoDeParametro<ParametroEntero, number> {
  render() {
    const presentacion = presentacionActual(this.parametro, this.presentacion);
    const { minimo, maximo } = this.parametro;
    return html`
      <campo-numero
        etiqueta=${this.parametro.etiqueta}
        .valor=${formatear(this.parametro, this.valor, presentacion)}
        .error=${this.error}
        .modo=${textoDelModo(this.parametro, presentacion.modo)}
        .puedeSubir=${maximo === undefined || this.valor < maximo}
        .puedeBajar=${minimo === undefined || this.valor > minimo}
        @siguiente-modo=${() =>
          this.avisarCambioDePresentacion({
            ...presentacion,
            modo: siguienteModo(this.parametro, presentacion.modo),
          })}
        @cambio=${(evento: CustomEvent<string>) => this.escrito(evento.detail, presentacion, 0)}
        @paso=${(evento: CustomEvent<Paso>) =>
          this.escrito(evento.detail.texto, presentacion, evento.detail.cantidad)}
      ></campo-numero>
    `;
  }

  /**
   * Lo que no se puede leer no cambia la caja: el campo vuelve solo al valor
   * que tenía. Fuera de rango sí se guarda, y el panel muestra el error. Un
   * paso, en cambio, nunca deja el valor fuera del mínimo ni del máximo.
   */
  private escrito(texto: string, presentacion: Presentacion, paso: number) {
    const leido = interpretar(texto, this.parametro, presentacion);
    if (leido === null) {
      return;
    }
    if (!mismaPresentacion(leido.presentacion, presentacion)) {
      this.avisarCambioDePresentacion(leido.presentacion);
    }
    this.avisarCambio(paso === 0 ? leido.numero : limitar(this.parametro, leido.numero + paso));
  }
}

export default {
  error,
  formatear,
  dibujar: (parametro: ParametroEntero, valor: number, error: string | null, presentacion: unknown) =>
    html`<parametro-entero
      .parametro=${parametro}
      .valor=${valor}
      .error=${error}
      .presentacion=${presentacion}
    ></parametro-entero>`,
};
