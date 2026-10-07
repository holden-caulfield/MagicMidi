import { html } from "lit";

import "@/componentes/campo-interruptor";
import type { Texto } from "@/formato";
import type { ParametroBase } from "./parametro";

export interface ParametroInterruptor extends ParametroBase<boolean> {
  tipo: "interruptor";
}

export default {
  validar: (_parametro: ParametroInterruptor, valor: boolean) =>
    typeof valor === "boolean" ? null : "Tiene que ser sí o no",
  dibujar: (parametro: ParametroInterruptor, valor: boolean, error: Texto | null) =>
    html`<campo-interruptor
      etiqueta=${parametro.etiqueta}
      .valor=${valor}
      .error=${error}
    ></campo-interruptor>`,
};
