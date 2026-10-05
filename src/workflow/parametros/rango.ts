import { html } from "lit";
import { customElement } from "lit/decorators.js";

import "@/componentes/campo-rango";
import type { Rango } from "@/componentes/campo-rango";
import { CampoDeParametro, type ParametroBase } from "./campo-de-parametro";
import {
  type DeclaracionNumerica,
  formatear as formatearEnModo,
  leer,
  mismaPresentacion,
  presentacionActual,
  siguienteModo,
  textoDelModo,
} from "./modos";

/** Dos extremos enteros, "desde" y "hasta", entre un mínimo y un máximo. */
export interface ParametroRango extends ParametroBase<Rango>, DeclaracionNumerica {
  tipo: "rango";
  minimo: number;
  maximo: number;
  /** Si "desde" puede ser mayor que "hasta", para recorrer el rango al revés. */
  invertible: boolean;
}

/** Un número como lo muestra el parámetro con esa presentación. */
export function formatear(parametro: ParametroRango, numero: number, presentacion?: unknown) {
  const { modo, bemoles } = presentacionActual(parametro, presentacion);
  return formatearEnModo(numero, modo, bemoles);
}

/** El texto del error si el valor no le sirve al parámetro, o `null`. */
export function error(
  parametro: ParametroRango,
  valor: Rango,
  presentacion?: unknown,
): string | null {
  const { minimo, maximo, invertible } = parametro;
  const extremos = [valor?.desde, valor?.hasta];
  if (!extremos.every((extremo) => Number.isInteger(extremo))) {
    return "Tiene que ser un número entero";
  }
  if (extremos.some((extremo) => extremo < minimo || extremo > maximo)) {
    const enModo = (numero: number) => formatear(parametro, numero, presentacion);
    return `Tiene que ir de ${enModo(minimo)} a ${enModo(maximo)}`;
  }
  if (!invertible && valor.desde > valor.hasta) {
    return "Desde tiene que ser igual o menor que hasta";
  }
  return null;
}

@customElement("parametro-rango")
export class CampoRango extends CampoDeParametro<ParametroRango, Rango> {
  render() {
    const presentacion = presentacionActual(this.parametro, this.presentacion);
    // Si lo escrito cambia cómo se muestra (otro modo, o una nota con bemol),
    // el rango lo avisa antes de que el campo avise el valor nuevo.
    const leerEnModo = (texto: string) => {
      const leido = leer(texto, presentacion, this.parametro);
      if (leido && !mismaPresentacion(leido.presentacion, presentacion)) {
        this.avisarCambioDePresentacion(leido.presentacion);
      }
      return leido?.numero ?? null;
    };
    return html`
      <campo-rango
        etiqueta=${this.parametro.etiqueta}
        .formatear=${(numero: number) => formatear(this.parametro, numero, presentacion)}
        .leer=${leerEnModo}
        .modo=${textoDelModo(this.parametro, presentacion.modo)}
        @siguiente-modo=${() =>
          this.avisarCambioDePresentacion({
            ...presentacion,
            modo: siguienteModo(this.parametro, presentacion.modo),
          })}
        .valor=${this.valor}
        .minimo=${this.parametro.minimo}
        .maximo=${this.parametro.maximo}
        .invertible=${this.parametro.invertible}
        .error=${this.error}
        @cambio=${(evento: CustomEvent<Rango>) => this.avisarCambio(evento.detail)}
      ></campo-rango>
    `;
  }
}

export default {
  error,
  formatear,
  dibujar: (parametro: ParametroRango, valor: Rango, error: string | null, presentacion: unknown) =>
    html`<parametro-rango
      .parametro=${parametro}
      .valor=${valor}
      .error=${error}
      .presentacion=${presentacion}
    ></parametro-rango>`,
};
