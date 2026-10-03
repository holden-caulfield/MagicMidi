export type TipoDeMensaje =
  | "nota-on"
  | "nota-off"
  | "presion-polifonica"
  | "cambio-de-control"
  | "cambio-de-programa"
  | "presion-de-canal"
  | "pitch-bend"
  | "sysex"
  | "cuadro-de-tiempo"
  | "posicion-de-cancion"
  | "seleccion-de-cancion"
  | "solicitud-de-afinacion"
  | "reloj"
  | "inicio"
  | "continuar"
  | "detener"
  | "sensor-activo"
  | "reset"
  | "sistema-no-definido"
  | "desconocido";

/**
 * Los tipos que se pueden elegir, por ejemplo en Filtrar, en este orden. El
 * reloj y el Sensor Activo no están porque nunca llegan al flujo.
 */
export const TIPOS_ELEGIBLES = [
  "nota-on",
  "nota-off",
  "presion-polifonica",
  "cambio-de-control",
  "cambio-de-programa",
  "presion-de-canal",
  "pitch-bend",
  "sysex",
  "cuadro-de-tiempo",
  "posicion-de-cancion",
  "seleccion-de-cancion",
  "solicitud-de-afinacion",
  "inicio",
  "continuar",
  "detener",
  "reset",
] as const satisfies readonly TipoDeMensaje[];

export const NOMBRES_DE_TIPO: Record<(typeof TIPOS_ELEGIBLES)[number], string> = {
  "nota-on": "Nota On",
  "nota-off": "Nota Off",
  "presion-polifonica": "Presión Polifónica",
  "cambio-de-control": "Cambio de Control",
  "cambio-de-programa": "Cambio de Programa",
  "presion-de-canal": "Presión de Canal",
  "pitch-bend": "Pitch Bend",
  "sysex": "SysEx",
  "cuadro-de-tiempo": "Cuadro de Tiempo (MTC)",
  "posicion-de-cancion": "Posición de Canción",
  "seleccion-de-cancion": "Selección de Canción",
  "solicitud-de-afinacion": "Solicitud de Afinación",
  "inicio": "Inicio",
  "continuar": "Continuar",
  "detener": "Detener",
  "reset": "Reset del Sistema",
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

const TIPOS_DE_SISTEMA: Record<number, TipoDeMensaje> = {
  0xf0: "sysex",
  0xf1: "cuadro-de-tiempo",
  0xf2: "posicion-de-cancion",
  0xf3: "seleccion-de-cancion",
  0xf6: "solicitud-de-afinacion",
  0xf8: "reloj",
  0xfa: "inicio",
  0xfb: "continuar",
  0xfc: "detener",
  0xfe: "sensor-activo",
  0xff: "reset",
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
      return TIPOS_DE_SISTEMA[status] ?? "sistema-no-definido";
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

  /**
   * El número de nota en Nota On, Nota Off y Presión Polifónica; `null` en los
   * demás. Si falta el byte, cuenta como 0.
   */
  get nota(): number | null {
    const tipo = this.tipo;
    if (tipo !== "nota-on" && tipo !== "nota-off" && tipo !== "presion-polifonica") {
      return null;
    }
    return this.bytes[1] ?? 0;
  }

  copiar(): MensajeMidi {
    return new MensajeMidi([...this.bytes]);
  }
}
