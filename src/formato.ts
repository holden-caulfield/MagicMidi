/**
 * Un texto con valores marcados, como el de un error que nombra los límites
 * de un parámetro. Los valores no se escriben al armarlo: los escribe quien
 * lo muestra, cada uno con su formato (un campo numérico, en su modo).
 */
export interface TextoConValores {
  partes: string[];
  valores: unknown[];
}

/** Un texto común, o uno con valores. */
export type Texto = string | TextoConValores;

/**
 * Arma un texto con valores: `formato\`Tiene que ir de ${0} a ${127}\``. Cada
 * `${…}` queda como un valor, sin escribir.
 */
export function formato(partes: TemplateStringsArray, ...valores: unknown[]): TextoConValores {
  // Las partes se copian a un arreglo común: las de cada plantilla son un
  // objeto propio, y así dos textos iguales escritos en lugares distintos dan
  // `toEqual` en un test.
  return { partes: [...partes], valores };
}

/** El texto con cada valor escrito con `escribirValor`; uno sin valores queda igual. */
export function escribir(
  texto: Texto,
  escribirValor: (valor: unknown) => string = String,
): string {
  if (typeof texto === "string") {
    return texto;
  }
  return texto.partes.reduce(
    (escrito, parte, i) => escrito + escribirValor(texto.valores[i - 1]) + parte,
  );
}
