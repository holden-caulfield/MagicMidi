import { html } from "lit";

import "@/componentes/campo-interruptor";
import type { Declaracion, Parametro } from "./parametro";

/** Una casilla, para prender o apagar algo. */
export function interruptor(declaracion: Declaracion<boolean>): Parametro<boolean> {
  const { etiqueta } = declaracion;
  return {
    ...declaracion,
    validar: (valor) => (typeof valor === "boolean" ? null : "Tiene que ser sí o no"),
    dibujar: (valor, error) =>
      html`<campo-interruptor
        etiqueta=${etiqueta}
        .valor=${valor}
        .error=${error}
      ></campo-interruptor>`,
  };
}
