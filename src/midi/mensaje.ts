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
  "sistema": "Mensajes de sistema",
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
