import { Pin } from "lucide";

import type { TipoDeNodo } from "../tipos";

// En el status, los 4 bits de arriba son el tipo de mensaje (con el leading
// bit) y los 4 de abajo, el canal menos 1.
const TIPO = 0b1111_0000;

// La opción "Canal" usa la posición del status (0), porque es ahí donde está
// el canal.
const BYTE_CANAL = 0;

export default {
  nombre: "Fijar",
  icono: Pin,
  parametros: [
    {
      clave: "byte",
      etiqueta: "Byte",
      tipo: "lista",
      inicial: 2,
      opciones: [
        { valor: BYTE_CANAL, texto: "Canal" },
        { valor: 1, texto: "2.º (datos 1)" },
        { valor: 2, texto: "3.º (datos 2)" },
      ],
    },
    // De 0 a 127: un byte de datos con el leading bit en 0.
    { clave: "valor", etiqueta: "Valor", tipo: "entero", inicial: 100, minimo: 0, maximo: 127 },
  ],
  validar(parametros, formatear) {
    const valor = Number(parametros.valor);
    if (Number(parametros.byte) === BYTE_CANAL && (valor < 1 || valor > 16)) {
      // `formatear` escribe el 1 y el 16 como se muestra el valor en el panel.
      const desde = formatear("valor", 1);
      const hasta = formatear("valor", 16);
      return [{ clave: "valor", mensaje: `Con Canal, tiene que ir de ${desde} a ${hasta}` }];
    }
    return [];
  },
  procesar(mensaje, parametros) {
    const bytes = mensaje.bytes;
    const posicion = Number(parametros.byte);
    const valor = Number(parametros.valor);

    if (posicion === BYTE_CANAL) {
      // Un mensaje de sistema no tiene canal.
      if (mensaje.canal !== null) {
        // El canal 1 va como 0 en el byte, y el 16 como 15.
        bytes[0] = (bytes[0] & TIPO) | (valor - 1);
      }
      return mensaje;
    }

    if (posicion < bytes.length) {
      bytes[posicion] = valor;
    }
    return mensaje;
  },
} satisfies TipoDeNodo;
