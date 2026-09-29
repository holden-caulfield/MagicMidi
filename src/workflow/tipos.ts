import type { IconNode } from "lucide";

export type TipoDeMensaje =
  | "nota-on"
  | "nota-off"
  | "presion-polifonica"
  | "cambio-de-control"
  | "cambio-de-programa"
  | "presion-de-canal"
  | "pitch-bend"
  | "sistema"
  | "desconocido";

/** Los tipos que se pueden elegir, por ejemplo en Filtrar, en este orden. */
export const TIPOS_ELEGIBLES = [
  "nota-on",
  "nota-off",
  "presion-polifonica",
  "cambio-de-control",
  "cambio-de-programa",
  "presion-de-canal",
  "pitch-bend",
  "sistema",
] as const satisfies readonly TipoDeMensaje[];

export const NOMBRES_DE_TIPO: Record<(typeof TIPOS_ELEGIBLES)[number], string> = {
  "nota-on": "Nota On",
  "nota-off": "Nota Off",
  "presion-polifonica": "Presión Polifónica",
  "cambio-de-control": "Cambio de Control",
  "cambio-de-programa": "Cambio de Programa",
  "presion-de-canal": "Presión de Canal",
  "pitch-bend": "Pitch Bend",
  sistema: "Mensajes de sistema",
};

const TIPOS_DE_CANAL: Record<number, TipoDeMensaje> = {
  0x80: "nota-off",
  0x90: "nota-on",
  0xa0: "presion-polifonica",
  0xb0: "cambio-de-control",
  0xc0: "cambio-de-programa",
  0xd0: "presion-de-canal",
  0xe0: "pitch-bend",
};

/**
 * Un mensaje MIDI. Lo único que guarda es la lista de sus bytes, del status en
 * adelante: el tipo y el canal se leen de ahí cada vez, así que siguen siendo
 * correctos aunque una caja cambie los bytes.
 */
export class MensajeMidi {
  bytes: number[];

  constructor(bytes: number[]) {
    this.bytes = bytes;
  }

  get tipo(): TipoDeMensaje {
    const status = this.bytes[0];
    if (status === undefined || status < 0x80) {
      return "desconocido";
    }
    if (status >= 0xf0) {
      return "sistema";
    }
    // Un Nota On con velocidad 0 es un Nota Off; si le falta el tercer byte,
    // cuenta como velocidad 0.
    if ((status & 0xf0) === 0x90 && (this.bytes[2] ?? 0) === 0) {
      return "nota-off";
    }
    return TIPOS_DE_CANAL[status & 0xf0];
  }

  /** De 1 a 16 en los mensajes de canal; `null` en los demás. */
  get canal(): number | null {
    const status = this.bytes[0];
    if (status === undefined || status < 0x80 || status >= 0xf0) {
      return null;
    }
    return (status & 0x0f) + 1;
  }

  copiar(): MensajeMidi {
    return new MensajeMidi([...this.bytes]);
  }
}

export type ValorDeParametro = number | boolean | string;

// Genérico para que el valor inicial y los de las opciones sean del mismo tipo.
interface ParametroDeOpciones<T extends ValorDeParametro> {
  clave: string;
  etiqueta: string;
  tipo: "opciones";
  inicial: T;
  opciones: { valor: T; texto: string }[];
}

export type Parametro =
  | { clave: string; etiqueta: string; tipo: "entero"; inicial: number }
  | { clave: string; etiqueta: string; tipo: "si-no"; inicial: boolean }
  | ParametroDeOpciones<number>
  | ParametroDeOpciones<string>
  | ParametroDeOpciones<boolean>;

/**
 * Todo lo que hace falta para definir un tipo de nodo. Ver la guía en
 * `nodos/LEEME.md`.
 */
export interface TipoDeNodo {
  nombre: string;
  icono: IconNode;
  /** Si se omite, la caja tiene salida. */
  tieneSalida?: boolean;
  parametros: Parametro[];
  /**
   * Recibe una copia del mensaje (se puede modificar sin afectar a otras
   * ramas) y devuelve el mensaje que pasa a las cajas siguientes, o nada para
   * descartarlo. En una caja sin salida, lo que devuelve es lo que sale por el
   * puerto MIDI. Nunca envía nada por su cuenta.
   */
  procesar(
    mensaje: MensajeMidi,
    parametros: Record<string, ValorDeParametro>,
  ): MensajeMidi | null | void;
}
