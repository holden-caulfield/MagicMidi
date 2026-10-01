import type { ReactiveController, ReactiveControllerHost } from "lit";

import { suscribir } from "./estado";

/** Cualquier cosa que avise cuando cambia: el estado de la pantalla, el registro del log… */
export interface Fuente {
  suscribir(observador: () => void): () => void;
}

/**
 * Vuelve a dibujar el componente cada vez que cambia la fuente (si no se le
 * pasa ninguna, el estado de la pantalla). Se suscribe mientras el componente
 * está en el documento.
 */
export class ControladorDeEstado implements ReactiveController {
  private desuscribir: (() => void) | null = null;

  constructor(
    private componente: ReactiveControllerHost,
    private fuente: Fuente = { suscribir },
  ) {
    componente.addController(this);
  }

  hostConnected() {
    this.desuscribir = this.fuente.suscribir(() => this.componente.requestUpdate());
  }

  hostDisconnected() {
    this.desuscribir?.();
    this.desuscribir = null;
  }
}
