// Única frontera con Rete: ningún otro módulo lo importa. Las posiciones, el
// zoom y el arrastre son de la librería; qué cajas hay y cómo se conectan vive
// en `estado.flujo`, y este módulo mantiene las dos cosas de acuerdo.
import { LitPlugin, Presets as PresetsDeDibujo, type LitArea2D } from "@retejs/lit-plugin";
import { css, html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import type { IconNode } from "lucide";
import { ClassicPreset, NodeEditor, type GetSchemes } from "rete";
import { AreaPlugin } from "rete-area-plugin";
import { ConnectionPlugin, Presets as PresetsDeConexion } from "rete-connection-plugin";

import { ControladorDeEstado } from "@/estado/controlador";
import { actualizar, estado, type Conexion, type NodoDelFlujo } from "@/estado/estado";
import {
  etapaDelTipo,
  tieneSalida,
  TIPOS_DE_NODO,
  TRIGGER,
  type IdDeTipo,
  type Etapa,
} from "../nodos/catalogo";
import { dibujarIcono } from "../iconos";
import { erroresDeConfiguracion } from "../validacion";
import { estilosDelGlobo } from "./globo";

/** Con este formato la barra de herramientas pone, al arrastrar, el tipo de la caja. */
export const FORMATO_ARRASTRE = "application/x-tipo-de-nodo";

const LADO_CAJA = 48;
const LADO_ICONO = 24;
const SEPARACION_INICIAL = 150;
/** El área que se agarra para conectar; el cuadrado que se ve es más chico. */
const LADO_CONECTOR = 16;

class Caja extends ClassicPreset.Node {
  conErrores = false;

  constructor(
    id: string,
    public nombre: string,
    public icono: IconNode,
    public etapa: Etapa,
    conEntrada: boolean,
    conSalida: boolean,
  ) {
    super(nombre);
    this.id = id;
    const socket = new ClassicPreset.Socket("midi");
    if (conEntrada) this.addInput("entrada", new ClassicPreset.Input(socket, "", true));
    if (conSalida) this.addOutput("salida", new ClassicPreset.Output(socket, ""));
  }
}

type Enlace = ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>;
type Esquema = GetSchemes<Caja, Enlace>;
type Senales = LitArea2D<Esquema>;

function tieneErrores(nodo: NodoDelFlujo): boolean {
  if (nodo.tipo === "trigger") return false;
  return erroresDeConfiguracion(TIPOS_DE_NODO[nodo.tipo], nodo.parametros, nodo.presentaciones).length > 0;
}

function crearCaja(nodo: NodoDelFlujo): Caja {
  if (nodo.tipo === "trigger") {
    return new Caja(nodo.id, TRIGGER.nombre, TRIGGER.icono, "inicio", false, true);
  }
  const tipo = TIPOS_DE_NODO[nodo.tipo];
  const caja = new Caja(nodo.id, tipo.nombre, tipo.icono, etapaDelTipo(tipo), true, tieneSalida(tipo));
  caja.conErrores = tieneErrores(nodo);
  return caja;
}

/**
 * Una caja del lienzo. Rete le asigna `data` (la caja) y `emit` cada vez que
 * la vuelve a dibujar, por ejemplo al cambiar la selección.
 */
@customElement("caja-del-flujo")
export class CajaDelFlujo extends LitElement {
  static styles = [
    estilosDelGlobo,
    css`
      .caja {
        box-sizing: border-box;
        position: relative;
        width: ${LADO_CAJA}px;
        height: ${LADO_CAJA}px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1.5px solid var(--borde-caja);
        border-radius: 4px;
        background-color: var(--fondo-caja);
        color: var(--letra-caja);
        cursor: grab;
        user-select: none;
      }

      .caja > svg {
        stroke-width: 1.75;
      }

      .caja-inicio {
        border-color: var(--borde-inicio);
        background-color: var(--fondo-inicio);
      }

      .caja-fin {
        border-color: var(--borde-fin);
        background-color: var(--fondo-fin);
      }

      /* Un anillo plano por fuera, sin desenfoque: el borde sigue diciendo la
         etapa, y el ámbar no se confunde con el naranja de una caja de fin. La
         primera sombra, del color del lienzo, lo separa del borde. */
      .seleccionada {
        box-shadow:
          0 0 0 2px var(--fondo-lienzo),
          0 0 0 4px var(--ambar);
      }

      /* Por fuera del anillo de selección: así el error no tapa ni la etapa
         ni la selección. */
      .con-errores {
        outline: 1.5px solid var(--letra-error);
        outline-offset: 6px;
      }

      /* Rete ubica las conexiones sumando offsetLeft/offsetTop, sin tener en
         cuenta transform: por eso los conectores se ubican con top y left. */
      .conector {
        position: absolute;
        top: calc(50% - ${LADO_CONECTOR / 2}px);
        width: ${LADO_CONECTOR}px;
        height: ${LADO_CONECTOR}px;
      }

      .conector-entrada {
        left: -${LADO_CONECTOR / 2}px;
      }

      .conector-salida {
        right: -${LADO_CONECTOR / 2}px;
      }

      /* Lo dibuja Rete dentro del conector, con la plantilla de
         customize.socket. */
      .punto {
        display: block;
        width: 10px;
        height: 10px;
        margin: 3px;
        border: 1.5px solid var(--fondo-lienzo);
        border-radius: 1px;
        background-color: var(--ambar);
        cursor: crosshair;
      }

      .caja:hover .globo {
        opacity: 1;
      }
    `,
  ];

  @property({ attribute: false }) data!: Caja;
  @property({ attribute: false }) emit!: (senal: Senales) => void;

  render() {
    const caja = this.data;
    const conector = (lado: "input" | "output", clave: string, socket: ClassicPreset.Socket) => html`
      <rete-ref
        class="conector conector-${lado === "input" ? "entrada" : "salida"}"
        .data=${{ type: "socket", side: lado, key: clave, nodeId: caja.id, payload: socket }}
        .emit=${this.emit}
      ></rete-ref>
    `;
    return html`
      <div
        class="caja caja-${caja.etapa} ${caja.selected ? "seleccionada" : ""} ${caja.conErrores ? "con-errores" : ""}"
      >
        ${caja.inputs.entrada ? conector("input", "entrada", caja.inputs.entrada.socket) : null}
        ${dibujarIcono(caja.icono, LADO_ICONO)}
        <span class="globo">${caja.nombre}</span>
        ${caja.outputs.salida ? conector("output", "salida", caja.outputs.salida.socket) : null}
      </div>
    `;
  }
}

/**
 * Una conexión del lienzo. Rete calcula el camino (el atributo `d` de un
 * `<path>`) y lo vuelve a asignar cada vez que se mueve una caja.
 */
@customElement("cable-del-flujo")
export class CableDelFlujo extends LitElement {
  // Rete dibuja cada conexión en un SVG enorme, que no tiene que tapar los
  // clics del lienzo: solo el trazo los recibe.
  static styles = css`
    svg {
      overflow: visible !important;
      position: absolute;
      pointer-events: none;
      width: 9999px;
      height: 9999px;
    }

    path {
      fill: none;
      stroke: var(--ambar);
      stroke-width: 2px;
      pointer-events: auto;
    }
  `;

  @property({ attribute: false }) camino = "";

  render() {
    return html`<svg><path d=${this.camino}></path></svg>`;
  }
}

function alcanzable(desde: string, objetivo: string, conexiones: Conexion[]): boolean {
  const pendientes = [desde];
  const visitados = new Set<string>();
  while (pendientes.length > 0) {
    const actual = pendientes.pop()!;
    if (actual === objetivo) return true;
    if (visitados.has(actual)) continue;
    visitados.add(actual);
    for (const conexion of conexiones) {
      if (conexion.desde === actual) pendientes.push(conexion.hacia);
    }
  }
  return false;
}

function conexionPermitida(desde: string, hacia: string): boolean {
  const { conexiones } = estado.flujo;
  if (desde === hacia) return false;
  if (conexiones.some((conexion) => conexion.desde === desde && conexion.hacia === hacia)) {
    return false;
  }
  // Si desde el destino se puede llegar al origen, la conexión cerraría un ciclo.
  return !alcanzable(hacia, desde, conexiones);
}

function agregarConexionAlEstado(desde: string, hacia: string) {
  actualizar({
    flujo: { ...estado.flujo, conexiones: [...estado.flujo.conexiones, { desde, hacia }] },
  });
}

function quitarConexionDelEstado(desde: string, hacia: string) {
  actualizar({
    flujo: {
      ...estado.flujo,
      conexiones: estado.flujo.conexiones.filter(
        (conexion) => !(conexion.desde === desde && conexion.hacia === hacia),
      ),
    },
  });
}

@customElement("lienzo-workflow")
export class LienzoWorkflow extends LitElement {
  static styles = css`
    :host {
      flex: 1;
      min-width: 0;
      display: flex;
    }

    /* Rete dibuja cada conexión en un SVG de 9999px: la contención asegura que
       nada de lo que hay en el lienzo agrande el panel. */
    .lienzo {
      flex: 1;
      position: relative;
      overflow: hidden;
      contain: strict;
      border: 1px solid var(--borde-suave);
      border-radius: 2px;
      background-color: var(--fondo-lienzo);
      background-image: radial-gradient(rgba(127, 127, 127, 0.35) 1px, transparent 1px);
      background-size: 20px 20px;
    }

    /* Rete le pone transform al contenedor de cada caja, y eso encierra al
       globo en ese contenedor: para que no lo tape otra caja, sube el
       contenedor entero. */
    .lienzo :has(> rete-root > caja-del-flujo:hover) {
      z-index: 10;
    }
  `;

  @query(".lienzo") private contenedor!: HTMLElement;

  private editor: NodeEditor<Esquema> | null = null;
  private area!: AreaPlugin<Esquema, Senales>;
  private cajasAgregadasConClic = 0;

  // Mientras se copian al lienzo cosas que ya están en el estado, los eventos
  // del editor no se tienen que volver a volcar al estado.
  private copiandoDesdeElEstado = false;

  constructor() {
    super();
    // Para marcar las cajas mal configuradas cada vez que cambia el flujo.
    new ControladorDeEstado(this);
  }

  render() {
    return html`
      <div
        class="lienzo"
        @dragover=${(evento: DragEvent) => evento.preventDefault()}
        @drop=${this.soltar}
      ></div>
    `;
  }

  firstUpdated() {
    // Rete mide las cajas en pantalla: dentro de un panel oculto todo mide
    // cero, así que el lienzo se monta la primera vez que tiene tamaño.
    const observador = new ResizeObserver(([entrada]) => {
      if (entrada.contentRect.width > 0 && entrada.contentRect.height > 0) {
        observador.disconnect();
        this.montar();
      }
    });
    observador.observe(this.contenedor);
  }

  updated() {
    this.marcarErrores();
  }

  private marcarErrores() {
    if (!this.editor) return;
    for (const caja of this.editor.getNodes()) {
      const nodo = estado.flujo.nodos.find((candidato) => candidato.id === caja.id);
      const conErrores = nodo ? tieneErrores(nodo) : false;
      if (caja.conErrores !== conErrores) {
        caja.conErrores = conErrores;
        this.area.update("node", caja.id);
      }
    }
  }

  async agregarCaja(id: IdDeTipo, posicion?: { x: number; y: number }) {
    if (!this.editor) return;

    const parametros = Object.fromEntries(
      TIPOS_DE_NODO[id].parametros.map((parametro) => [parametro.clave, parametro.inicial]),
    );
    const nodo: NodoDelFlujo = { id: crypto.randomUUID(), tipo: id, parametros };

    actualizar({ flujo: { ...estado.flujo, nodos: [...estado.flujo.nodos, nodo] } });

    const caja = crearCaja(nodo);
    await this.editor.addNode(caja);
    await this.area.translate(caja.id, posicion ?? this.centroVisible());
  }

  async eliminarCaja(id: string) {
    if (!this.editor || id === "trigger") return;

    // Rete no borra las conexiones de una caja al borrarla: se borran antes, y
    // cada una se quita del estado por el evento `connectionremoved`.
    for (const enlace of this.editor.getConnections()) {
      if (enlace.source === id || enlace.target === id) {
        await this.editor.removeConnection(enlace.id);
      }
    }
    await this.editor.removeNode(id);

    actualizar({
      flujo: { ...estado.flujo, nodos: estado.flujo.nodos.filter((nodo) => nodo.id !== id) },
      nodoSeleccionado: estado.nodoSeleccionado === id ? null : estado.nodoSeleccionado,
    });
  }

  private soltar = (evento: DragEvent) => {
    const tipo = evento.dataTransfer?.getData(FORMATO_ARRASTRE);
    if (!tipo || !(tipo in TIPOS_DE_NODO)) return;
    evento.preventDefault();
    this.area.area.setPointerFrom(evento);
    this.agregarCaja(tipo as IdDeTipo, {
      x: this.area.area.pointer.x - LADO_CAJA / 2,
      y: this.area.area.pointer.y - LADO_CAJA / 2,
    });
  };

  private seleccionar(id: string | null) {
    for (const caja of this.editor!.getNodes()) {
      caja.selected = caja.id === id;
      this.area.update("node", caja.id);
    }
    actualizar({ nodoSeleccionado: id });
  }

  private centroVisible() {
    const { x, y, k } = this.area.area.transform;
    const { width, height } = this.contenedor.getBoundingClientRect();
    const corrimiento = (this.cajasAgregadasConClic++ % 5) * (LADO_CAJA + 16);
    return {
      x: (width / 2 - x) / k - LADO_CAJA / 2 + corrimiento,
      y: (height / 2 - y) / k - LADO_CAJA / 2 + corrimiento,
    };
  }

  private async montar() {
    const editor = new NodeEditor<Esquema>();
    const area = new AreaPlugin<Esquema, Senales>(this.contenedor);
    const conexiones = new ConnectionPlugin<Esquema, Senales>();
    const dibujo = new LitPlugin<Esquema, Senales>();
    this.editor = editor;
    this.area = area;

    dibujo.addPreset(
      PresetsDeDibujo.classic.setup({
        customize: {
          node: (contexto) => ({ emit }) =>
            html`<caja-del-flujo .data=${contexto.payload} .emit=${emit}></caja-del-flujo>`,
          socket: () => () => html`<span class="punto"></span>`,
          connection: () => ({ path }) => html`<cable-del-flujo .camino=${path}></cable-del-flujo>`,
        },
      }),
    );
    conexiones.addPreset(PresetsDeConexion.classic.setup());

    editor.use(area);
    area.use(conexiones);
    area.use(dibujo);

    editor.addPipe((contexto) => {
      if (this.copiandoDesdeElEstado) return contexto;

      if (contexto.type === "connectioncreate") {
        return conexionPermitida(contexto.data.source, contexto.data.target) ? contexto : undefined;
      }
      if (contexto.type === "connectioncreated") {
        agregarConexionAlEstado(contexto.data.source, contexto.data.target);
      }
      if (contexto.type === "connectionremoved") {
        quitarConexionDelEstado(contexto.data.source, contexto.data.target);
      }
      return contexto;
    });

    area.addPipe((contexto) => {
      if (contexto.type === "nodepicked") {
        this.seleccionar(contexto.data.id);
      }
      if (contexto.type === "pointerdown") {
        const objetivo = contexto.data.event.target;
        if (objetivo === this.contenedor || objetivo === area.area.content.holder) {
          this.seleccionar(null);
        }
      }
      return contexto;
    });

    this.copiandoDesdeElEstado = true;
    const cajas = new Map<string, Caja>();
    for (const [indice, nodo] of estado.flujo.nodos.entries()) {
      const caja = crearCaja(nodo);
      cajas.set(nodo.id, caja);
      await editor.addNode(caja);
      await area.translate(caja.id, { x: indice * SEPARACION_INICIAL, y: 0 });
    }
    for (const conexion of estado.flujo.conexiones) {
      const origen = cajas.get(conexion.desde);
      const destino = cajas.get(conexion.hacia);
      if (origen && destino) {
        const enlace: Enlace = new ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>(
          origen,
          "salida",
          destino,
          "entrada",
        );
        await editor.addConnection(enlace);
      }
    }
    this.copiandoDesdeElEstado = false;

    await area.area.translate(40, 60);
  }
}
