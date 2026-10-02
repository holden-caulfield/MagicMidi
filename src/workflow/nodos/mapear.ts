import { AlignCenterHorizontal } from "lucide";

import type { TipoDeNodo } from "../tipos";

export default {
  nombre: "Mapear",
  icono: AlignCenterHorizontal,
  // Los cuatro extremos van de 0 a 127, como un byte de datos: así el
  // resultado, que siempre queda entre los extremos de salida, también lo es.
  parametros: [
    {
      clave: "byte",
      etiqueta: "Byte",
      tipo: "opciones",
      inicial: 2,
      opciones: [
        { valor: 1, texto: "2.º (datos 1)" },
        { valor: 2, texto: "3.º (datos 2)" },
      ],
    },
    {
      clave: "entradaDesde",
      etiqueta: "Entrada desde",
      tipo: "entero",
      inicial: 0,
      minimo: 0,
      maximo: 127,
    },
    {
      clave: "entradaHasta",
      etiqueta: "Entrada hasta",
      tipo: "entero",
      inicial: 127,
      minimo: 0,
      maximo: 127,
    },
    {
      clave: "salidaDesde",
      etiqueta: "Salida desde",
      tipo: "entero",
      inicial: 0,
      minimo: 0,
      maximo: 127,
    },
    {
      clave: "salidaHasta",
      etiqueta: "Salida hasta",
      tipo: "entero",
      inicial: 127,
      minimo: 0,
      maximo: 127,
    },
  ],
  validar(parametros) {
    // Con un solo valor de entrada no hay cómo repartir: dividiría por cero.
    if (parametros.entradaDesde === parametros.entradaHasta) {
      return [{ clave: "entradaHasta", mensaje: "Tiene que ser distinto de Entrada desde" }];
    }
    return [];
  },
  procesar(mensaje, parametros) {
    const bytes = mensaje.bytes;
    const posicion = Number(parametros.byte);
    if (posicion >= bytes.length) {
      return mensaje;
    }

    const entradaDesde = Number(parametros.entradaDesde);
    const entradaHasta = Number(parametros.entradaHasta);
    const salidaDesde = Number(parametros.salidaDesde);
    const salidaHasta = Number(parametros.salidaHasta);

    // Lo que queda fuera del rango de entrada se toma como el extremo más
    // cercano. Los rangos pueden estar al revés (desde > hasta).
    const menor = Math.min(entradaDesde, entradaHasta);
    const mayor = Math.max(entradaDesde, entradaHasta);
    const valor = Math.min(Math.max(bytes[posicion], menor), mayor);

    // Qué parte del rango de entrada recorrió el valor (de 0 a 1), y el punto
    // que está en esa misma parte del rango de salida.
    const proporcion = (valor - entradaDesde) / (entradaHasta - entradaDesde);
    bytes[posicion] = Math.round(salidaDesde + proporcion * (salidaHasta - salidaDesde));
    return mensaje;
  },
} satisfies TipoDeNodo;
