import { RefreshCw } from "lucide";

import { MensajeMidi, NOMBRES_DE_TIPO, type TipoDeMensaje } from "@/midi/mensaje";
import type { TipoDeNodo } from "../tipos";

// Lo que significa un byte de datos: "ordinal" dice cuál (la nota, el
// controlador, el programa), "cardinal" dice cuánto (la velocidad, la presión,
// el valor), y "cardinal-fino" es la parte fina de un valor de 14 bits.
type Rol = "ordinal" | "cardinal" | "cardinal-fino";

// Cada tipo al que se puede convertir: su status (en los de canal, con el
// canal en 0) y el rol de cada uno de sus bytes de datos, en orden. El orden de
// esta lista es el de las opciones del panel.
const FORMAS = {
  "nota-on": { status: 0x90, datos: ["ordinal", "cardinal"] },
  "nota-off": { status: 0x80, datos: ["ordinal", "cardinal"] },
  "presion-polifonica": { status: 0xa0, datos: ["ordinal", "cardinal"] },
  "cambio-de-control": { status: 0xb0, datos: ["ordinal", "cardinal"] },
  "cambio-de-programa": { status: 0xc0, datos: ["ordinal"] },
  "presion-de-canal": { status: 0xd0, datos: ["cardinal"] },
  // Pitch Bend y Posición de Canción mandan primero la parte fina (LSB) y
  // después la gruesa (MSB).
  "pitch-bend": { status: 0xe0, datos: ["cardinal-fino", "cardinal"] },
  "posicion-de-cancion": { status: 0xf2, datos: ["cardinal-fino", "cardinal"] },
  "seleccion-de-cancion": { status: 0xf3, datos: ["ordinal"] },
  "solicitud-de-afinacion": { status: 0xf6, datos: [] },
  "inicio": { status: 0xfa, datos: [] },
  "continuar": { status: 0xfb, datos: [] },
  "detener": { status: 0xfc, datos: [] },
  "reset": { status: 0xff, datos: [] },
} satisfies Record<string, { status: number; datos: Rol[] }>;

type TipoConvertible = keyof typeof FORMAS & TipoDeMensaje;

function esConvertible(tipo: TipoDeMensaje): tipo is TipoConvertible {
  return tipo in FORMAS;
}

// Con qué se llena un byte que el mensaje original no trae. En general 0, salvo
// donde el 0 cambiaría lo que significa el mensaje.
function relleno(tipo: TipoConvertible, rol: Rol): number {
  // El controlador 0 es Bank Select, que hace que el equipo cambie de banco.
  if (tipo === "cambio-de-control" && rol === "ordinal") {
    return 1;
  }
  // Un Nota On con velocidad 0 es un Nota Off. 64 es la velocidad que manda
  // un teclado que no la mide.
  if ((tipo === "nota-on" || tipo === "nota-off") && rol === "cardinal") {
    return 64;
  }
  // Con la parte gruesa en 64 y la fina en 0, el Pitch Bend queda en el centro.
  if (tipo === "pitch-bend" && rol === "cardinal") {
    return 64;
  }
  return 0;
}

export default {
  nombre: "Convertir",
  icono: RefreshCw,
  parametros: [
    {
      clave: "destino",
      etiqueta: "Convertir a",
      tipo: "lista",
      inicial: "cambio-de-control",
      opciones: (Object.keys(FORMAS) as TipoConvertible[]).map((tipo) => ({
        valor: tipo,
        texto: NOMBRES_DE_TIPO[tipo],
      })),
    },
  ],
  procesar(mensaje, parametros) {
    const destino = parametros.destino as TipoConvertible;
    const origen = mensaje.tipo;

    // Lo que ya es del tipo elegido, y lo que no tiene una forma conocida
    // (SysEx, Cuadro de Tiempo, desconocido…), pasa sin cambios.
    if (origen === destino || !esConvertible(origen)) {
      return mensaje;
    }

    // El dato de cada rol que trae el mensaje. Un byte que falta cuenta como 0.
    const datos: Partial<Record<Rol, number>> = {};
    FORMAS[origen].datos.forEach((rol, indice) => {
      datos[rol] = mensaje.bytes[indice + 1] ?? 0;
    });

    // Cada dato va al lugar de su mismo rol; lo que no tiene lugar se pierde.
    const forma = FORMAS[destino];
    const bytesDeDatos = forma.datos.map((rol) => datos[rol] ?? relleno(destino, rol));

    // Un mensaje de canal lleva el canal en los 4 bits de abajo del status: el
    // del original, o el 1 si el original era de sistema y no tenía.
    let status = forma.status;
    if (status < 0xf0) {
      status = status | ((mensaje.canal ?? 1) - 1);
    }
    return new MensajeMidi([status, ...bytesDeDatos]);
  },
} satisfies TipoDeNodo;
