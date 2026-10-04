import { AlignCenterHorizontal } from "lucide";

import type { Rango } from "@/componentes/campo-rango";
import type { TipoDeNodo } from "../tipos";

export default {
  nombre: "Mapear",
  icono: AlignCenterHorizontal,
  // Los extremos van de 0 a 127, como un byte de datos: así el resultado,
  // que siempre queda entre los extremos de salida, también lo es. Los dos
  // rangos se pueden invertir: una salida de 127 a 0 da vuelta el sentido.
  parametros: [
    {
      clave: "byte",
      etiqueta: "Byte",
      tipo: "lista",
      inicial: 2,
      opciones: [
        { valor: 1, texto: "2.º (datos 1)" },
        { valor: 2, texto: "3.º (datos 2)" },
      ],
    },
    {
      clave: "entrada",
      etiqueta: "Entrada",
      tipo: "rango",
      inicial: { desde: 0, hasta: 127 },
      minimo: 0,
      maximo: 127,
      invertible: true,
    },
    {
      clave: "salida",
      etiqueta: "Salida",
      tipo: "rango",
      inicial: { desde: 0, hasta: 127 },
      minimo: 0,
      maximo: 127,
      invertible: true,
    },
  ],
  validar(parametros) {
    // Con un solo valor de entrada no hay cómo repartir: dividiría por cero.
    const entrada = parametros.entrada as Rango;
    if (entrada.desde === entrada.hasta) {
      return [{ clave: "entrada", mensaje: "Desde tiene que ser distinto de hasta" }];
    }
    return [];
  },
  procesar(mensaje, parametros) {
    const bytes = mensaje.bytes;
    const posicion = Number(parametros.byte);
    if (posicion >= bytes.length) {
      return mensaje;
    }

    const entrada = parametros.entrada as Rango;
    const salida = parametros.salida as Rango;

    // Lo que queda fuera del rango de entrada se toma como el extremo más
    // cercano. Los rangos pueden estar al revés (desde > hasta).
    const menor = Math.min(entrada.desde, entrada.hasta);
    const mayor = Math.max(entrada.desde, entrada.hasta);
    const valor = Math.min(Math.max(bytes[posicion], menor), mayor);

    // Qué parte del rango de entrada recorrió el valor (de 0 a 1), y el punto
    // que está en esa misma parte del rango de salida.
    const proporcion = (valor - entrada.desde) / (entrada.hasta - entrada.desde);
    bytes[posicion] = Math.round(salida.desde + proporcion * (salida.hasta - salida.desde));
    return mensaje;
  },
} satisfies TipoDeNodo;
