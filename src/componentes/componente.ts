import { type CSSResultGroup, LitElement } from "lit";

import { compartidos } from "@/estilos/compartidos";

/**
 * La base de todos los componentes: les suma `compartidos`, que el CSS global
 * no les alcanza porque no entra en el Shadow DOM. Va primero, así los
 * estilos propios de cada componente le ganan.
 */
export class Componente extends LitElement {
  protected static override finalizeStyles(styles?: CSSResultGroup) {
    return super.finalizeStyles([compartidos, styles ?? []]);
  }
}
