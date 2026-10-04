import type { TemplateResult } from "lit";

import autocompletar, { type ParametroAutocompletar } from "./autocompletar";
import entero, { type ParametroEntero } from "./entero";
import lista, { type ParametroLista } from "./lista";
import opciones, { type ParametroDeOpciones } from "./opciones";
import interruptor, { type ParametroInterruptor } from "./interruptor";
import rango, { type ParametroRango } from "./rango";

// Para sumar un tipo de parámetro: importarlo arriba, agregar su declaración a
// esta unión y su entrada a la lista de abajo. Si falta alguna de las dos, el
// chequeo de tipos lo marca.
export type Parametro =
  | ParametroEntero
  | ParametroInterruptor
  | ParametroLista<number>
  | ParametroLista<string>
  | ParametroLista<boolean>
  | ParametroDeOpciones<number>
  | ParametroDeOpciones<string>
  | ParametroAutocompletar<number>
  | ParametroAutocompletar<string>
  | ParametroRango;

export type ValorDeParametro = Parametro["inicial"];

interface TipoDeParametro<P extends Parametro> {
  /**
   * El texto del error si el valor no le sirve a este parámetro, o `null` si
   * le sirve. El chequeo de tipos no alcanza a ver, por ejemplo, que un entero
   * no tenga decimales o que esté fuera de su rango.
   */
  error(parametro: P, valor: P["inicial"]): string | null;
  dibujar(parametro: P, valor: P["inicial"], error: string | null): TemplateResult;
}

const TIPOS_DE_PARAMETRO = {
  entero,
  interruptor,
  lista,
  opciones,
  autocompletar,
  rango,
} satisfies { [T in Parametro["tipo"]]: TipoDeParametro<Extract<Parametro, { tipo: T }>> };

// TypeScript no sabe que la entrada que se busca con `parametro.tipo` es la de
// ese mismo tipo: el `satisfies` de arriba es el que lo garantiza.
function tipoDe(parametro: Parametro) {
  return TIPOS_DE_PARAMETRO[parametro.tipo] as TipoDeParametro<Parametro>;
}

export function errorDelParametro(parametro: Parametro, valor: ValorDeParametro): string | null {
  return tipoDe(parametro).error(parametro, valor);
}

/** El control de un parámetro, el que corresponde a su tipo, con su error si tiene. */
export function dibujarParametro(
  parametro: Parametro,
  valor: ValorDeParametro,
  error: string | null,
) {
  return tipoDe(parametro).dibujar(parametro, valor, error);
}
