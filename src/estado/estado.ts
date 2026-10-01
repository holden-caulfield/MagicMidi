import type { IdDeTipo } from "@/workflow/catalogo";
import type { ValorDeParametro } from "@/workflow/tipos";

export interface NodoDelFlujo {
  id: string;
  tipo: "trigger" | IdDeTipo;
  parametros: Record<string, ValorDeParametro>;
}

export interface Conexion {
  desde: string;
  hacia: string;
}

/**
 * `id` es el identificador que le da el sistema: dos puertos pueden llamarse
 * igual, así que se eligen, se conectan y se vigilan por `id`.
 */
export interface Puerto {
  id: string;
  nombre: string;
}

export interface Flujo {
  nodos: NodoDelFlujo[];
  conexiones: Conexion[];
}

/**
 * Todo lo que la pantalla muestra vive acá: los componentes lo leen para
 * dibujarse y nadie lo modifica sin pasar por `actualizar`.
 */
export interface Estado {
  conectado: boolean;
  puertosEntrada: Puerto[];
  puertosSalida: Puerto[];
  /** El `id` del puerto elegido, o "" si no hay ninguno. */
  puertoEntradaElegido: string;
  puertoSalidaElegido: string;
  mensajeConexion: string;
  panelActivo: string;
  flujo: Flujo;
  nodoSeleccionado: string | null;
}

export const estado: Estado = {
  conectado: false,
  puertosEntrada: [],
  puertosSalida: [],
  puertoEntradaElegido: "",
  puertoSalidaElegido: "",
  mensajeConexion: "",
  panelActivo: "conexion",
  flujo: {
    nodos: [
      { id: "trigger", tipo: "trigger", parametros: {} },
      { id: "emitir-inicial", tipo: "emitir", parametros: {} },
    ],
    conexiones: [{ desde: "trigger", hacia: "emitir-inicial" }],
  },
  nodoSeleccionado: null,
};

const observadores: Array<() => void> = [];

/** Devuelve la función para dejar de recibir los avisos. */
export function suscribir(observador: () => void): () => void {
  observadores.push(observador);
  return () => {
    observadores.splice(observadores.indexOf(observador), 1);
  };
}

export function actualizar(cambios: Partial<Estado>) {
  Object.assign(estado, cambios);

  for (const observador of observadores) {
    observador();
  }
}
