import type { NodoDelFlujo } from "@/estado/estado";
import { TIPOS_DE_NODO } from "./nodos/catalogo";
import type { ErrorDeConfiguracion } from "./tipos";

/**
 * Los errores de configuración de una caja (de ella solo se miran su tipo y
 * sus valores): primero los de cada parámetro y, solo si no hay ninguno, los de
 * las reglas de su tipo. Así esas reglas pueden suponer que cada valor ya está
 * bien por separado. No dependen de cómo se muestra cada parámetro: los valores
 * que nombra un error los escribe quien lo muestra.
 */
export function erroresDeConfiguracion({
  tipo: id,
  parametros,
}: Pick<NodoDelFlujo, "tipo" | "parametros">): ErrorDeConfiguracion[] {
  if (id === "trigger") {
    return [];
  }
  const tipo = TIPOS_DE_NODO[id];
  const errores: ErrorDeConfiguracion[] = [];
  for (const parametro of tipo.parametros) {
    const mensaje = parametro.validar(parametros[parametro.clave]);
    if (mensaje !== null) {
      errores.push({ clave: parametro.clave, mensaje });
    }
  }
  if (errores.length > 0) {
    return errores;
  }
  return tipo.validar?.(parametros) ?? [];
}
