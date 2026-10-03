import { Zap } from "lucide";

import convertir from "./convertir";
import descartar from "./descartar";
import desplazar from "./desplazar";
import emitir from "./emitir";
import filtrar from "./filtrar";
import fijar from "./fijar";
import mapear from "./mapear";
import type { TipoDeNodo } from "../tipos";

// Para sumar un tipo de nodo: importarlo arriba y agregarlo acá. El orden de
// esta lista es el orden de la barra de herramientas.
const tipos = {
  filtrar,
  convertir,
  fijar,
  desplazar,
  mapear,
  emitir,
  descartar,
} satisfies Record<string, TipoDeNodo>;

export type IdDeTipo = keyof typeof tipos;

// `satisfies` conserva el tipo exacto de cada entrada (en Desplazar, por
// ejemplo, `tieneSalida` ni existe); acá se lo generaliza a `TipoDeNodo`.
export const TIPOS_DE_NODO: Record<IdDeTipo, TipoDeNodo> = tipos;

export const TRIGGER = {
  nombre: "Mensaje MIDI recibido",
  icono: Zap,
};

// El valor por defecto vive acá y en ningún otro lado: leer `tipo.tieneSalida`
// directo daría `undefined` en los tipos que no lo declaran, y eso cuenta como
// "sin salida".
export function tieneSalida(tipo: TipoDeNodo): boolean {
  return tipo.tieneSalida ?? true;
}

// El trigger es siempre "inicio": no es un tipo del catálogo.
export type Etapa = "inicio" | "intermedia" | "fin";

export function etapaDelTipo(tipo: TipoDeNodo): Etapa {
  return tieneSalida(tipo) ? "intermedia" : "fin";
}
