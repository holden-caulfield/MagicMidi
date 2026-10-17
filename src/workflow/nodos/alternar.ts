import { Repeat } from "lucide";

import { formato } from "@/formato";
import type { MensajeMidi } from "@/midi/mensaje";
import { lista } from "../parametros/lista";
import { opciones } from "../parametros/opciones";
import { secuencia } from "../parametros/secuencia";
import type { TipoDeNodo } from "../tipos";

// En el status, los 4 bits de arriba son el tipo de mensaje (con el leading
// bit) y los 4 de abajo, el canal menos 1.
const TIPO = 0b1111_0000;

// La opción "Canal" usa la posición del status (0), porque es ahí donde está
// el canal; los datos, la suya (1 y 2). Así "Byte" y "Un ciclo por" se leen
// igual.
const BYTE_CANAL = 0;

/** El canal, o el byte de datos de esa posición; `null` si el mensaje no lo tiene. */
function leer(mensaje: MensajeMidi, posicion: number): number | null {
  if (posicion === BYTE_CANAL) {
    return mensaje.canal;
  }
  return posicion < mensaje.bytes.length ? mensaje.bytes[posicion] : null;
}

/**
 * El nombre con que se guarda en la memoria el ciclo del mensaje: qué byte es
 * y cuánto vale, por cada uno de los elegidos en "Un ciclo por", tal como
 * llegó el mensaje. Si le falta alguno, cuenta como un valor más ("nada"), y
 * los que tampoco lo tienen comparten el ciclo. Sin ninguno elegido, es el
 * mismo para todos los mensajes: hay un solo ciclo.
 */
function nombreDelCiclo(mensaje: MensajeMidi, cicloPor: number[]): string {
  return cicloPor.map((byte) => `${byte}=${leer(mensaje, byte) ?? "nada"}`).join(" ");
}

export default {
  nombre: "Alternar",
  icono: Repeat,
  parametros: [
    lista({
      clave: "byte",
      etiqueta: "Byte",
      inicial: 2,
      opciones: [
        { valor: BYTE_CANAL, texto: "Canal" },
        { valor: 1, texto: "2.º (datos 1)" },
        { valor: 2, texto: "3.º (datos 2)" },
      ],
    }),
    // De 0 a 127: un byte de datos con el leading bit en 0. Con Canal, de 1
    // a 16 (lo revisa `validar`).
    secuencia({ clave: "valores", etiqueta: "Valores", inicial: [127, 0], minimo: 0, maximo: 127 }),
    opciones({
      clave: "cicloPor",
      etiqueta: "Un ciclo por",
      inicial: [],
      opciones: [
        { valor: BYTE_CANAL, texto: "Canal" },
        { valor: 1, texto: "Datos 1" },
        { valor: 2, texto: "Datos 2" },
      ],
    }),
  ],
  validar(parametros) {
    const fuera = (parametros.valores as number[]).find((valor) => valor < 1 || valor > 16);
    if (Number(parametros.byte) === BYTE_CANAL && fuera !== undefined) {
      // Los números van marcados como valores: el campo los escribe como
      // muestra los suyos.
      return [
        {
          clave: "valores",
          mensaje: formato`Con Canal, los valores tienen que ir de ${1} a ${16}, y hay un ${fuera}`,
        },
      ];
    }
    return [];
  },
  procesar(mensaje, parametros, memoria) {
    const posicion = Number(parametros.byte);
    const valores = parametros.valores as number[];

    // Sin el byte elegido, el mensaje pasa sin cambios y el ciclo no avanza.
    if (leer(mensaje, posicion) === null) {
      return mensaje;
    }

    // La memoria guarda, por ciclo, la posición en la lista del valor que
    // toca. Es la posición y no el valor: con valores repetidos (127, 80, 80,
    // 80), recordar el valor trabaría el ciclo en el 80. Sin nada guardado, o
    // si la lista se acortó y la posición quedó afuera, toca el primero.
    const ciclo = nombreDelCiclo(mensaje, parametros.cicloPor as number[]);
    const guardada = Number(memoria.get(ciclo) ?? 0);
    const actual = guardada < valores.length ? guardada : 0;
    memoria.set(ciclo, (actual + 1) % valores.length);

    const valor = valores[actual];
    if (posicion === BYTE_CANAL) {
      // El canal 1 va como 0 en el byte, y el 16 como 15.
      mensaje.bytes[0] = (mensaje.bytes[0] & TIPO) | (valor - 1);
    } else {
      mensaje.bytes[posicion] = valor;
    }
    return mensaje;
  },
} satisfies TipoDeNodo;
