import {
  errorDelParametro,
  formatearParametro,
  type ValorDeParametro,
} from "./parametros/catalogo";
import type { ErrorDeConfiguracion, TipoDeNodo } from "./tipos";

/**
 * Los errores de configuración de una caja: primero los de cada parámetro y,
 * solo si no hay ninguno, los de las reglas de su tipo. Así esas reglas pueden
 * suponer que cada valor ya está bien por separado. `presentaciones` es lo que
 * la caja guarda sobre cómo se muestra cada parámetro: se le pasa a cada uno
 * sin leerla, para que sus errores hablen como él.
 */
export function erroresDeConfiguracion(
  tipo: TipoDeNodo,
  parametros: Record<string, ValorDeParametro>,
  presentaciones: Record<string, unknown> = {},
): ErrorDeConfiguracion[] {
  const errores: ErrorDeConfiguracion[] = [];
  for (const parametro of tipo.parametros) {
    const { clave } = parametro;
    const mensaje = errorDelParametro(parametro, parametros[clave], presentaciones[clave]);
    if (mensaje !== null) {
      errores.push({ clave: parametro.clave, mensaje });
    }
  }
  if (errores.length > 0) {
    return errores;
  }
  const formatear = (clave: string, numero: number) => {
    const parametro = tipo.parametros.find((candidato) => candidato.clave === clave);
    return parametro
      ? formatearParametro(parametro, numero, presentaciones[clave])
      : String(numero);
  };
  return tipo.validar?.(parametros, formatear) ?? [];
}
