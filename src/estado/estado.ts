import type { IdDeTipo } from "@/workflow/nodos/catalogo";
import type { ValorDeParametro } from "@/workflow/parametros/catalogo";

export interface NodoDelFlujo {
  id: string;
  tipo: "trigger" | IdDeTipo;
  parametros: Record<string, ValorDeParametro>;
  /**
   * Cómo se muestra cada parámetro, por clave. Solo lo lee el tipo de ese
   * parámetro: el resto lo guarda y lo pasa sin saber qué tiene. Si falta, el
   * tipo usa la que corresponde por defecto.
   */
  presentaciones?: Record<string, unknown>;
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
 * Lo que usa la lógica o componentes de áreas distintas: la conexión y el
 * flujo. Los componentes lo leen para dibujarse y nadie lo modifica sin pasar
 * por `actualizar`. Lo que usa un área sola vive en sus componentes.
 */
export interface Estado {
  conectado: boolean;
  puertosEntrada: Puerto[];
  puertosSalida: Puerto[];
  /** El `id` del puerto elegido, o "" si no hay ninguno. */
  puertoEntradaElegido: string;
  puertoSalidaElegido: string;
  mensajeConexion: string;
  flujo: Flujo;
}

export const estado: Estado = {
  conectado: false,
  puertosEntrada: [],
  puertosSalida: [],
  puertoEntradaElegido: "",
  puertoSalidaElegido: "",
  mensajeConexion: "",
  flujo: {
    nodos: [
      { id: "trigger", tipo: "trigger", parametros: {} },
      { id: "emitir-inicial", tipo: "emitir", parametros: {} },
    ],
    conexiones: [{ desde: "trigger", hacia: "emitir-inicial" }],
  },
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
