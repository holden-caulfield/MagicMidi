import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { css, html } from "lit";

import { actualizar, estado, type Puerto } from "@/estado/estado";

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

function puertoElegido(elegido: string, puertos: Puerto[]): Puerto | undefined {
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

/** Los estilos de `indicadorDeEstado`, para el componente que lo dibuja. */
export const estilosDelIndicador = css`
  .estado {
    margin: 0;
    font-weight: 600;
  }

  .estado-conectado {
    color: #1b8a3d;
  }

  .estado-desconectado {
    color: #b3261e;
  }
`;

export function indicadorDeEstado() {
  return html`
    <p
      class="estado ${estado.conectado
        ? "estado-conectado"
        : "estado-desconectado"}"
      aria-live="polite"
    >
      ${estado.conectado ? "Conectado" : "Desconectado"}
    </p>
  `;
}

export async function inicializarConexion() {
  await listen<string>("conexion-perdida", (evento) => {
    actualizar({ conectado: false, mensajeConexion: evento.payload });
  });

  await actualizarListaDePuertos();
}
