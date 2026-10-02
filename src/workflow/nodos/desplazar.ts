import { ArrowUpDown } from "lucide";

import type { TipoDeNodo } from "../tipos";

// En MIDI el primer bit de cada byte es fijo (1 en el status, 0 en los datos):
// se separa, se desplazan los 7 bits restantes y se vuelve a poner.
const LEADING_BIT = 0b1000_0000;
const RESTO = 0b0111_1111;

// En el status, los 4 bits de arriba son el tipo de mensaje (con el leading
// bit) y los 4 de abajo, el canal menos 1.
const TIPO = 0b1111_0000;
const CANAL = 0b0000_1111;

// La opción "Canal" usa la posición del status (0), porque es ahí donde está
// el canal.
const BYTE_CANAL = 0;

export default {
  nombre: "Desplazar",
  icono: ArrowUpDown,
  parametros: [
    {
      clave: "byte",
      etiqueta: "Byte",
      tipo: "opciones",
      inicial: 1,
      opciones: [
        { valor: BYTE_CANAL, texto: "Canal" },
        { valor: 1, texto: "2.º (datos 1)" },
        { valor: 2, texto: "3.º (datos 2)" },
      ],
    },
    { clave: "desplazamiento", etiqueta: "Desplazamiento", tipo: "entero", inicial: 0 },
    { clave: "overflow", etiqueta: "Overflow", tipo: "si-no", inicial: false },
  ],
  procesar(mensaje, parametros) {
    const bytes = mensaje.bytes;
    const posicion = Number(parametros.byte);
    const desplazamiento = Number(parametros.desplazamiento);

    if (posicion === BYTE_CANAL) {
      // Un mensaje de sistema no tiene canal.
      if (mensaje.canal === null) {
        return mensaje;
      }
      // Se cuenta desde 0 (canal 1) hasta 15 (canal 16), como va en el byte.
      const desplazado = mensaje.canal - 1 + desplazamiento;
      const canal = parametros.overflow
        ? desplazado & CANAL
        : Math.min(Math.max(desplazado, 0), CANAL);
      bytes[0] = (bytes[0] & TIPO) | canal;
      return mensaje;
    }

    if (posicion >= bytes.length) {
      return mensaje;
    }

    const byte = bytes[posicion];
    const leading = byte & LEADING_BIT;
    const desplazado = (byte & RESTO) + desplazamiento;
    // `& RESTO` se queda con los 7 bits de abajo: es tomar módulo 128, y por el
    // complemento a dos también da bien con resultados negativos.
    const resto = parametros.overflow
      ? desplazado & RESTO
      : Math.min(Math.max(desplazado, 0), RESTO);

    bytes[posicion] = leading | resto;
    return mensaje;
  },
} satisfies TipoDeNodo;
