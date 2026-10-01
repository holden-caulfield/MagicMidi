import type { TemplateResult } from "lit";

import entero, { type ParametroEntero } from "./entero";
import opciones, { type ParametroDeOpciones } from "./opciones";
import siNo, { type ParametroSiNo } from "./si-no";

// Para sumar un tipo de parámetro: importarlo arriba, agregar su declaración a
// esta unión y su entrada a la lista de abajo. Si falta alguna de las dos, el
// chequeo de tipos lo marca.
export type Parametro =
  | ParametroEntero
  | ParametroSiNo
  | ParametroDeOpciones<number>
  | ParametroDeOpciones<string>
  | ParametroDeOpciones<boolean>;

export type ValorDeParametro = Parametro["inicial"];

interface TipoDeParametro<P extends Parametro> {
  dibujar(parametro: P, valor: P["inicial"]): TemplateResult;
}

const TIPOS_DE_PARAMETRO = {
  entero,
  "si-no": siNo,
  opciones,
} satisfies { [T in Parametro["tipo"]]: TipoDeParametro<Extract<Parametro, { tipo: T }>> };

/** El control de un parámetro, el que corresponde a su tipo. */
export function dibujarParametro(parametro: Parametro, valor: ValorDeParametro) {
  // TypeScript no sabe que la entrada que se busca con `parametro.tipo` es la
  // de ese mismo tipo: el `satisfies` de arriba es el que lo garantiza.
  const tipo = TIPOS_DE_PARAMETRO[parametro.tipo] as TipoDeParametro<Parametro>;
  return tipo.dibujar(parametro, valor);
}
