import type { ReactiveController, ReactiveControllerHost } from "lit";

import { nombreDeNota, numeroDeNota } from "@/midi/notas";
import type { BotonDeModo } from "./campo";

/**
 * Cómo se muestra y se escribe un número: "60", "C4" o "3C". Solo cambia cómo
 * se ve: el valor es siempre el número.
 */
export type Modo = "decimal" | "nota" | "hexadecimal";

export const MODOS_POR_DEFECTO: Modo[] = ["decimal", "nota", "hexadecimal"];

// Lo único que cambia de un modo a otro.
const MODOS: Record<
  Modo,
  {
    abreviatura: string;
    nombre: string;
    escribir(numero: number, bemoles: boolean): string;
    leer(texto: string): number | null;
  }
> = {
  decimal: {
    abreviatura: "DEC",
    nombre: "decimal",
    escribir: (numero) => String(numero),
    leer: (texto) => (/^-?\d+$/.test(texto) ? Number(texto) : null),
  },
  nota: {
    abreviatura: "♪",
    nombre: "nota",
    escribir: nombreDeNota,
    leer: numeroDeNota,
  },
  hexadecimal: {
    abreviatura: "HEX",
    nombre: "hexadecimal",
    escribir: (numero) => numero.toString(16).toUpperCase().padStart(2, "0"),
    leer: (texto) => (/^(0x)?[0-9a-f]+$/i.test(texto) ? parseInt(texto, 16) : null),
  },
};

/**
 * Si una nota escrita usa bemoles: `true` con bemol ("Db4"), `false` con
 * sostenido ("C#4"), y la elección anterior si es natural ("C4").
 */
function conBemoles(nota: string, antes: boolean): boolean {
  const alteracion = nota[1];
  return alteracion === "b" ? true : alteracion === "#" ? false : antes;
}

/** Lo que el controlador lee del campo que lo usa. */
interface CampoConModo extends ReactiveControllerHost {
  /** Los modos que ofrece, en el orden en que rotan. Si se omite, los tres. */
  modos?: Modo[];
  /** Lo que el campo conservó en la caja, o `undefined`. */
  estado: unknown;
}

/**
 * El modo en que un campo muestra y lee sus números, y si las notas negras van
 * con bemoles ("Db4") o con sostenidos ("C#4"). Es solo del campo: lo cambian
 * el botón de modo y lo que se escribe, y cada cambio se avisa con `avisar`
 * para que la caja lo conserve.
 */
export class ModoNumerico implements ReactiveController {
  private modo: Modo = "decimal";
  private bemoles = false;
  private recuperado = false;

  constructor(
    private campo: CampoConModo,
    private avisar: (estado: { modo: Modo; bemoles: boolean }) => void,
  ) {
    campo.addController(this);
  }

  /**
   * La primera vez que el campo se dibuja, recupera lo que conservó en la caja
   * (si es un modo que ya no se ofrece, arranca en el primero). Después el modo
   * es solo suyo: la caja guarda una copia para la próxima vez que el campo se
   * cree, y no se la vuelve a pasar.
   */
  hostUpdate() {
    if (this.recuperado) {
      return;
    }
    this.recuperado = true;
    const guardado = this.campo.estado as { modo?: unknown; bemoles?: unknown } | undefined;
    this.modo = this.modos.find((modo) => modo === guardado?.modo) ?? this.modos[0];
    this.bemoles = guardado?.bemoles === true;
  }

  private get modos(): Modo[] {
    return this.campo.modos ?? MODOS_POR_DEFECTO;
  }

  /** Lo que muestra el botón de modo, o `null` si hay un solo modo y no hay botón. */
  get boton(): BotonDeModo | null {
    if (this.modos.length < 2) {
      return null;
    }
    const { abreviatura, nombre } = MODOS[this.modo];
    const siguiente = this.modos[(this.modos.indexOf(this.modo) + 1) % this.modos.length];
    return { abreviatura, nombre, siguiente: () => this.cambiar(siguiente, this.bemoles) };
  }

  /** El número en el modo actual. Un negativo no tiene nota ni hexadecimal, y va en decimal. */
  formatear(numero: number): string {
    return numero < 0 ? String(numero) : MODOS[this.modo].escribir(numero, this.bemoles);
  }

  /**
   * El número escrito, o `null` si no se puede leer en ninguno de los modos que
   * se ofrecen. Los prueba en el orden en que rotan, empezando por el actual, y
   * el campo pasa al modo en que se leyó. Una nota con bemol o con sostenido
   * elige además cómo se escriben las notas negras.
   */
  leer(texto: string): number | null {
    const limpio = texto.trim();
    const desde = this.modos.indexOf(this.modo);
    for (let paso = 0; paso < this.modos.length; paso++) {
      const modo = this.modos[(desde + paso) % this.modos.length];
      const numero = MODOS[modo].leer(limpio);
      if (numero !== null) {
        this.cambiar(modo, modo === "nota" ? conBemoles(limpio, this.bemoles) : this.bemoles);
        return numero;
      }
    }
    return null;
  }

  /** Si algo cambió, el campo se vuelve a dibujar y lo avisa. */
  private cambiar(modo: Modo, bemoles: boolean) {
    if (modo !== this.modo || bemoles !== this.bemoles) {
      this.modo = modo;
      this.bemoles = bemoles;
      this.campo.requestUpdate();
      this.avisar({ modo, bemoles });
    }
  }
}
