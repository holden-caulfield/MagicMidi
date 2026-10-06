import { invoke } from "@tauri-apps/api/core";

import { actualizar, type Estado, estado, type Puerto } from "@/estado/estado";

function puertoVigente(elegido: string, puertos: Puerto[]): string {
  return puertos.some((puerto) => puerto.id === elegido) ? elegido : "";
}

/**
 * Los puertos con el nombre con que se muestran: si varios se llaman igual,
 * del segundo en adelante se les agrega " (2)", " (3)", … en el orden de la
 * lista. Es también el nombre que se manda a `conectar` para los mensajes.
 */
export function conNombresAMostrar(puertos: Puerto[]): Puerto[] {
  const vecesPorNombre = new Map<string, number>();

  return puertos.map((puerto) => {
    const veces = (vecesPorNombre.get(puerto.nombre) ?? 0) + 1;
    vecesPorNombre.set(puerto.nombre, veces);
    const nombre = veces === 1 ? puerto.nombre : `${puerto.nombre} (${veces})`;
    return { id: puerto.id, nombre };
  });
}

export function puertoElegido(elegido: string, puertos: Puerto[]): Puerto | undefined {
  return conNombresAMostrar(puertos).find((puerto) => puerto.id === elegido);
}

export async function actualizarListaDePuertos() {
  actualizar({ mensajeConexion: "" });

  try {
    const [puertosEntrada, puertosSalida] = await Promise.all([
      invoke<Puerto[]>("listar_puertos_entrada"),
      invoke<Puerto[]>("listar_puertos_salida"),
    ]);

    actualizar({
      puertosEntrada,
      puertosSalida,
      puertoEntradaElegido: puertoVigente(estado.puertoEntradaElegido, puertosEntrada),
      puertoSalidaElegido: puertoVigente(estado.puertoSalidaElegido, puertosSalida),
    });
  } catch (error) {
    actualizar({ mensajeConexion: `No se pudo obtener la lista de puertos: ${error}` });
  }
}

export async function conectar() {
  actualizar({ mensajeConexion: "" });

  const puertoEntrada = puertoElegido(estado.puertoEntradaElegido, estado.puertosEntrada);
  const puertoSalida = puertoElegido(estado.puertoSalidaElegido, estado.puertosSalida);

  if (!puertoEntrada || !puertoSalida) {
    actualizar({ mensajeConexion: "Elegí un puerto de entrada y uno de salida" });
    return;
  }

  try {
    await invoke("conectar", { puertoEntrada, puertoSalida });
    actualizar({ conectado: true });
  } catch (error) {
    actualizar({ mensajeConexion: `Error al conectar: ${error}` });
  }
}

export async function desconectar() {
  actualizar({ mensajeConexion: "" });

  try {
    await invoke("desconectar");
  } finally {
    actualizar({ conectado: false });
  }
}

export type EstadoDeLaConexion = "conectado" | "desconectado" | "error";

/**
 * Un error es estar desconectado con un mensaje en el panel de conexión: es el
 * mismo dato que muestra el panel, así la barra y el panel no se contradicen.
 */
export function estadoDeLaConexion({
  conectado,
  mensajeConexion,
}: Pick<Estado, "conectado" | "mensajeConexion">): EstadoDeLaConexion {
  if (conectado) {
    return "conectado";
  }
  return mensajeConexion === "" ? "desconectado" : "error";
}

/** El backend cerró la conexión por su cuenta: `mensaje` dice por qué. */
export function perderConexion(mensaje: string) {
  actualizar({ conectado: false, mensajeConexion: mensaje });
}
