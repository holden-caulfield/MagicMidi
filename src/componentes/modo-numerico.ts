import type { ReactiveController, ReactiveControllerHost } from "lit";

import {
  type DeclaracionNumerica,
  type EstadoNumerico,
  estadoRevisado,
  formatear,
  leer,
  mismoEstado,
  siguienteModo,
  textoDelModo,
} from "./modos";

/** Lo que el controlador lee del campo que lo usa. */
interface CampoConModo extends ReactiveControllerHost, DeclaracionNumerica {
  /** Lo que el campo conservó en la caja, o el estado que le pasa un rango. */
  estado: unknown;
}

/**
 * El modo de un campo numérico, y si sus notas van con bemoles: el campo los
 * cambia por su cuenta (con el botón de modo, o al leer lo escrito en otro
 * modo) y avisa cada cambio con `avisar`, para que la caja lo conserve. Los
 * modos que se ofrecen y los límites los lee del campo, en cada uso.
 */
export class ModoNumerico implements ReactiveController {
  private guardado: unknown = undefined;
  private recibido: unknown = undefined;
  private avisados = new WeakSet<EstadoNumerico>();

  constructor(
    private campo: CampoConModo,
    private avisar: (estado: EstadoNumerico) => void,
  ) {
    campo.addController(this);
  }

  /**
   * Adopta el `estado` del campo cuando cambia: al montarse, y cada vez que
   * quien lo usa le pasa otro. No lo avisa: si lo avisara, quien se lo pasó lo
   * volvería a guardar y a pasar, sin fin. Lo que el propio campo avisó y le
   * vuelve no trae nada nuevo, y puede ser viejo: si hubo dos cambios antes de
   * que quien lo usa se dibujara, el primero vuelve después del segundo.
   */
  hostUpdate() {
    const recibido = this.campo.estado;
    if (recibido !== this.recibido) {
      this.recibido = recibido;
      if (!this.avisados.has(recibido as EstadoNumerico)) {
        this.guardado = recibido;
      }
    }
  }

  /** El estado actual, revisado contra los modos que ofrece el campo ahora. */
  get estado(): EstadoNumerico {
    return estadoRevisado(this.campo, this.guardado);
  }

  /** Lo que muestra el botón de modo, o `null` si hay un solo modo. */
  get boton() {
    return textoDelModo(this.campo, this.estado.modo);
  }

  /** Cambia el estado desde el campo: si es otro, redibuja y lo avisa. */
  cambiar(nuevo: unknown) {
    const estado = estadoRevisado(this.campo, nuevo);
    if (!mismoEstado(estado, this.estado)) {
      this.guardado = estado;
      this.avisados.add(estado);
      this.campo.requestUpdate();
      this.avisar(estado);
    }
  }

  siguiente() {
    this.cambiar({ ...this.estado, modo: siguienteModo(this.campo, this.estado.modo) });
  }

  formatear(numero: number): string {
    const { modo, bemoles } = this.estado;
    return formatear(numero, modo, bemoles);
  }

  /**
   * El número escrito, o `null` si no se puede leer en ninguno de los modos.
   * Si se leyó en otro modo, o una nota cambió los bemoles, el campo pasa a ese
   * estado.
   */
  leer(texto: string): number | null {
    const leido = leer(texto, this.estado, this.campo);
    if (leido) {
      this.cambiar(leido.estado);
    }
    return leido?.numero ?? null;
  }
}
