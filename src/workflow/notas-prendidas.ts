import { MensajeMidi } from "@/midi/mensaje";

/** Una nota que salió prendida por el puerto. */
interface NotaPrendida {
  canal: number;
  nota: number;
}

// Lo anotado vive en el módulo, fuera del store, como el registro del log:
// cambia con cada nota, y en el store haría volver a dibujar toda la ventana.
// Por cada canal y nota que entró hay una cola, porque la misma nota puede
// entrar dos veces antes de soltarse (un secuenciador, dos controladores), y
// cada Nota Off saca la anotación más vieja.
const anotaciones = new Map<string, NotaPrendida[][]>();

function clave(mensaje: MensajeMidi): string {
  return `${mensaje.canal} ${mensaje.nota}`;
}

function comoNotaPrendida(salida: MensajeMidi): NotaPrendida[] {
  // `canal` y `nota` nunca son `null` en un Nota On, pero TypeScript no lo sabe.
  const { canal, nota } = salida;
  return salida.tipo === "nota-on" && canal !== null && nota !== null ? [{ canal, nota }] : [];
}

/**
 * Anota qué prendió en la salida un Nota On que entró: el canal y la nota de
 * cada salida que es un Nota On, en orden. Si no prendió ninguna, la anotación
 * queda vacía, y su Nota Off no va a apagar nada.
 */
export function anotarNotasPrendidas(notaOn: MensajeMidi, salidas: MensajeMidi[]) {
  const cola = anotaciones.get(clave(notaOn)) ?? [];
  cola.push(salidas.flatMap(comoNotaPrendida));
  anotaciones.set(clave(notaOn), cola);
}

/**
 * Saca de lo anotado la anotación más vieja del canal y la nota de un Nota
 * Off que entró, y devuelve los Nota Off que apagarían las notas que prendió
 * su Nota On, en orden: copias del que entró con el canal y la nota
 * cambiados, así conservan su forma (`8n`, o `9n` con velocidad 0) y su
 * velocidad de soltar. Devuelve `null` si no había nada anotado, y una lista
 * vacía si su Nota On no prendió ninguna nota.
 */
export function sacarNotasPrendidas(notaOff: MensajeMidi): MensajeMidi[] | null {
  const cola = anotaciones.get(clave(notaOff));
  const prendidas = cola?.shift();
  if (!cola || !prendidas) {
    return null;
  }
  if (cola.length === 0) {
    anotaciones.delete(clave(notaOff));
  }
  const [status, , ...resto] = notaOff.bytes;
  return prendidas.map(
    ({ canal, nota }) => new MensajeMidi([(status & 0xf0) | (canal - 1), nota, ...resto]),
  );
}

export function olvidarNotasPrendidas() {
  anotaciones.clear();
}
