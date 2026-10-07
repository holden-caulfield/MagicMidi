import type { TemplateResult } from "lit";

import type { Texto } from "@/formato";
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
   * Si el valor le sirve a este parámetro: `null`, o el texto del error. El
   * chequeo de tipos no alcanza a ver, por ejemplo, que un entero no tenga
   * decimales o que esté fuera de su rango. Si el texto nombra valores, van
   * marcados con `formato`: los escribe el campo donde se muestra.
   */
  validar(parametro: P, valor: P["inicial"]): Texto | null;
  /**
   * El campo que muestra el parámetro, con `error`, lo que devolvió `validar`
   * (o una regla del tipo de nodo). `estado` es lo que el campo conservó en la
   * caja, o `undefined`: el tipo se lo pasa al campo sin leerlo, y un tipo cuyo
   * campo no conserva nada no lo declara.
   */
  dibujar(parametro: P, valor: P["inicial"], error: Texto | null, estado: unknown): TemplateResult;
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

/** Si el valor le sirve al parámetro: `null`, o el texto del error. */
export function validarParametro(parametro: Parametro, valor: ValorDeParametro): Texto | null {
  return tipoDe(parametro).validar(parametro, valor);
}

/** El campo de un parámetro, el que dibuja su tipo, con su error si tiene. */
export function dibujarParametro(
  parametro: Parametro,
  valor: ValorDeParametro,
  error: Texto | null,
  estado: unknown,
) {
  return tipoDe(parametro).dibujar(parametro, valor, error, estado);
}
