import { nombreDeNota, numeroDeNota } from "@/midi/describir";

/**
 * Cómo se muestra y se escribe un número: "60", "C4" o "3C". Solo cambia la
 * presentación: el valor de la caja es siempre el número. Lo usan los
 * parámetros entero y rango; el resto de la aplicación no sabe que existe.
 */
export type Modo = "decimal" | "nota" | "hexadecimal";

export const MODOS_POR_DEFECTO: Modo[] = ["decimal", "nota", "hexadecimal"];

/** Lo que declara un parámetro numérico sobre sus modos y sus límites. */
export interface DeclaracionNumerica {
  /**
   * Los modos que ofrece, en el orden en que rotan. El primero es el de una
   * caja nueva. Si se omite, son los tres, en el orden de `MODOS_POR_DEFECTO`.
   * El modo nota pide mínimo y máximo dentro de 0 a 127, y el hexadecimal, un
   * mínimo de 0 o más.
   */
  modos?: Modo[];
  minimo?: number;
  maximo?: number;
}

const TEXTOS: Record<Modo, { abreviatura: string; nombre: string }> = {
  decimal: { abreviatura: "DEC", nombre: "decimal" },
  nota: { abreviatura: "♪", nombre: "nota" },
  hexadecimal: { abreviatura: "HEX", nombre: "hexadecimal" },
};

export function modosDe(declaracion: DeclaracionNumerica): Modo[] {
  return declaracion.modos ?? MODOS_POR_DEFECTO;
}

/**
 * Cómo se muestra un parámetro numérico: su modo y, en modo nota, si las
 * notas negras van con bemoles ("Db4") en vez de sostenidos ("C#4"). Es lo
 * que la caja guarda como presentación del parámetro.
 */
export interface Presentacion {
  modo: Modo;
  bemoles: boolean;
}

/**
 * La presentación guardada en la caja, revisada: si falta, o su modo no es uno
 * de los que ofrece el parámetro, el primero de ellos, con sostenidos.
 */
export function presentacionActual(
  declaracion: DeclaracionNumerica,
  guardada: unknown,
): Presentacion {
  const leida: Partial<Presentacion> =
    typeof guardada === "object" && guardada !== null ? guardada : {};
  const modos = modosDe(declaracion);
  return {
    modo: modos.find((modo) => modo === leida.modo) ?? modos[0],
    bemoles: leida.bemoles === true,
  };
}

export function mismaPresentacion(una: Presentacion, otra: Presentacion): boolean {
  return una.modo === otra.modo && una.bemoles === otra.bemoles;
}

/** El modo que sigue a `modo`; después del último, el primero. */
export function siguienteModo(declaracion: DeclaracionNumerica, modo: Modo): Modo {
  const modos = modosDe(declaracion);
  return modos[(modos.indexOf(modo) + 1) % modos.length];
}

/**
 * Lo que muestra el botón de modo (abreviado, y completo para los lectores de
 * pantalla), o `null` si el parámetro ofrece un solo modo y no hay botón.
 */
export function textoDelModo(
  declaracion: DeclaracionNumerica,
  modo: Modo,
): { abreviatura: string; nombre: string } | null {
  return modosDe(declaracion).length > 1 ? TEXTOS[modo] : null;
}

/**
 * El número escrito en ese modo (en nota, con bemoles si `bemoles`). Un
 * negativo no tiene nota ni hexadecimal, y se escribe en decimal.
 */
export function formatear(numero: number, modo: Modo, bemoles = false): string {
  if (numero < 0 || modo === "decimal") {
    return String(numero);
  }
  if (modo === "nota") {
    return nombreDeNota(numero, bemoles);
  }
  return numero.toString(16).toUpperCase().padStart(2, "0");
}

const LECTORES: Record<Modo, (texto: string) => number | null> = {
  decimal: (texto) => (/^-?\d+$/.test(texto) ? Number(texto) : null),
  nota: numeroDeNota,
  hexadecimal: (texto) => (/^(0x)?[0-9a-f]+$/i.test(texto) ? parseInt(texto, 16) : null),
};

/**
 * Si una nota escrita usa bemoles: `true` con bemol ("Db4"), `false` con
 * sostenido ("C#4"), y la elección anterior si es natural ("C4").
 */
function conBemoles(nota: string, antes: boolean): boolean {
  const alteracion = nota[1];
  return alteracion === "b" ? true : alteracion === "#" ? false : antes;
}

/**
 * Lee lo escrito probando los modos que ofrece el parámetro en el orden en que
 * rotan, empezando por el actual. Devuelve el número y la presentación nueva
 * (el modo en que se leyó y, si es una nota, si se escribió con bemol), o
 * `null` si ningún modo lo puede leer.
 */
export function leer(
  texto: string,
  presentacion: Presentacion,
  declaracion: DeclaracionNumerica,
): { numero: number; presentacion: Presentacion } | null {
  const modos = modosDe(declaracion);
  const desde = Math.max(modos.indexOf(presentacion.modo), 0);
  const limpio = texto.trim();
  for (let paso = 0; paso < modos.length; paso++) {
    const modo = modos[(desde + paso) % modos.length];
    const numero = LECTORES[modo](limpio);
    if (numero !== null) {
      const bemoles =
        modo === "nota" ? conBemoles(limpio, presentacion.bemoles) : presentacion.bemoles;
      return { numero, presentacion: { modo, bemoles } };
    }
  }
  return null;
}
