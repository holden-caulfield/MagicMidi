import { createElement, type IconNode } from "lucide";

export function dibujarIcono(icono: IconNode, tamano = 18) {
  return createElement(icono, { width: tamano, height: tamano, "aria-hidden": "true" });
}
