import { createElement, type IconNode } from "lucide";

/**
 * Un ícono de Lucide como un `<svg>` suelto, sin un componente que lo
 * envuelva: así queda en la raíz de quien lo dibuja, que lo puede estilizar
 * directamente (por ejemplo, `.casilla svg`). Es decorativo: lo que dice lo
 * tiene que decir también un texto.
 */
export function dibujarIcono(icono: IconNode, tamano = 18) {
  return createElement(icono, { width: tamano, height: tamano, "aria-hidden": "true" });
}
