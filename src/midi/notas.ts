const NOMBRES_DE_NOTA = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOMBRES_CON_BEMOLES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

/**
 * El nombre de una nota en notación científica, con el Do central (60) como
 * C4 y las notas negras como sostenidos (o como bemoles, con `bemoles`): 0 es
 * C-1 y 127 es G9.
 */
export function nombreDeNota(numero: number, bemoles = false): string {
  const nombres = bemoles ? NOMBRES_CON_BEMOLES : NOMBRES_DE_NOTA;
  return `${nombres[numero % 12]}${Math.floor(numero / 12) - 1}`;
}

const SEMITONOS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * El número de una nota escrita en notación científica ("C4", "c#4", "Db4",
 * "C-1"), o `null` si no es una nota. Acepta sostenidos y bemoles; la letra,
 * en mayúscula o minúscula. Es la inversa de `nombreDeNota`.
 */
export function numeroDeNota(texto: string): number | null {
  // La letra se pasa a mayúscula aparte: la "b" minúscula después de ella es
  // el bemol.
  const conMayuscula = texto.trim().replace(/^[a-g]/, (letra) => letra.toUpperCase());
  const partes = /^([A-G])([#b]?)(-1|\d+)$/.exec(conMayuscula);
  if (!partes) {
    return null;
  }
  const [, letra, alteracion, octava] = partes;
  const alterar = alteracion === "#" ? 1 : alteracion === "b" ? -1 : 0;
  return (Number(octava) + 1) * 12 + SEMITONOS[letra] + alterar;
}
