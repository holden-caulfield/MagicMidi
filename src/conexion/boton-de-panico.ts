import { css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Siren } from "lucide";

import "@/componentes/boton-de-accion";
import type { Atajo } from "@/componentes/boton-de-accion";
import { Componente } from "@/componentes/componente";
import { ControladorDeEstado } from "@/estado/controlador";
import { estado } from "@/estado/estado";
import { mandarPanico } from "./conexion";

const EN_MAC = navigator.userAgent.includes("Mac");

// Cmd+. es el "cancelar" de macOS, y en SuperCollider para todo el sonido.
const ATAJO: Atajo = EN_MAC
  ? { teclas: "Meta+.", texto: "⌘." }
  : { teclas: "Control+.", texto: "Ctrl+." };

function esElAtajo(evento: KeyboardEvent): boolean {
  return evento.key === "." && (EN_MAC ? evento.metaKey : evento.ctrlKey);
}

const DURACION_DEL_DESTELLO_MS = 150;

/**
 * Manda el pánico con un clic o con su atajo, desde cualquier tab, mientras
 * hay conexión. El atajo se escucha mientras el botón está en el documento.
 */
@customElement("boton-de-panico")
export class BotonDePanico extends Componente {
  static styles = css`
    :host {
      display: inline-flex;
    }
  `;

  /** Encendido un instante cuando el atajo manda el pánico, para que se vea. */
  @state() private encendido = false;
  private apagar?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    new ControladorDeEstado(this);
  }

  connectedCallback() {
    super.connectedCallback();
    // En captura, para que ningún campo ni el lienzo lo frenen antes.
    window.addEventListener("keydown", this.tecla, { capture: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.tecla, { capture: true });
    clearTimeout(this.apagar);
  }

  private tecla = (evento: KeyboardEvent) => {
    if (!esElAtajo(evento)) {
      return;
    }
    // Para que WebKit no lo tome como un "cancelar".
    evento.preventDefault();
    if (evento.repeat || !estado.conectado) {
      return;
    }
    mandarPanico();
    this.encendido = true;
    clearTimeout(this.apagar);
    this.apagar = setTimeout(() => (this.encendido = false), DURACION_DEL_DESTELLO_MS);
  };

  render() {
    return html`
      <boton-de-accion
        urgente
        .icono=${Siren}
        .atajo=${ATAJO}
        ?activo=${this.encendido}
        ?deshabilitado=${!estado.conectado}
        @click=${mandarPanico}
      >
        Pánico
      </boton-de-accion>
    `;
  }
}
