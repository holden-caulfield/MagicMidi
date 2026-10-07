import { validarParametro, type ValorDeParametro } from "./parametros/catalogo";
import type { ErrorDeConfiguracion, TipoDeNodo } from "./tipos";

/**
 * Los errores de configuración de una caja: primero los de cada parámetro y,
 * solo si no hay ninguno, los de las reglas de su tipo. Así esas reglas pueden
 * suponer que cada valor ya está bien por separado. No dependen de cómo se
 * muestra cada parámetro: los valores que nombra un error los escribe quien lo
 * muestra.
 */
export function erroresDeConfiguracion(
  tipo: TipoDeNodo,
  parametros: Record<string, ValorDeParametro>,
): ErrorDeConfiguracion[] {
  const errores: ErrorDeConfiguracion[] = [];
  for (const parametro of tipo.parametros) {
    const mensaje = validarParametro(parametro, parametros[parametro.clave]);
    if (mensaje !== null) {
      errores.push({ clave: parametro.clave, mensaje });
    }
  }
  if (errores.length > 0) {
    return errores;
  }
  return tipo.validar?.(parametros) ?? [];
}
