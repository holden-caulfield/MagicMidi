import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { html } from "lit";

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

async function actualizarListaDePuertos() {
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

async function conectar() {
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

async function desconectar() {
  actualizar({ mensajeConexion: "" });

  try {
    await invoke("desconectar");
  } finally {
    actualizar({ conectado: false });
  }
}

function selectorDePuerto(
  id: string,
  etiqueta: string,
  puertos: Puerto[],
  elegido: string,
  alElegir: (idDelPuerto: string) => void,
) {
  return html`
    <div class="campo">
      <label for=${id}>${etiqueta}</label>
      <select
        id=${id}
        ?disabled=${estado.conectado}
        @change=${(evento: Event) =>
          alElegir((evento.target as HTMLSelectElement).value)}
      >
        ${puertos.length === 0
          ? html`<option disabled selected>No hay puertos disponibles</option>`
          : html`
              <option value="" disabled .selected=${elegido === ""}>
                Elegí un puerto
              </option>
              ${conNombresAMostrar(puertos).map(
                (puerto) =>
                  html`<option value=${puerto.id} .selected=${puerto.id === elegido}>${puerto.nombre}</option>`,
              )}
            `}
      </select>
    </div>
  `;
}

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

export function panelConexion() {
  return html`
    <div class="formulario-conexion">
      <p class="subtitulo">
        Elegí un puerto de entrada y uno de salida para ver los mensajes MIDI que
        pasan por la aplicación.
      </p>

      ${selectorDePuerto(
        "select-puerto-entrada",
        "Puerto de entrada",
        estado.puertosEntrada,
        estado.puertoEntradaElegido,
        (idDelPuerto) => actualizar({ puertoEntradaElegido: idDelPuerto }),
      )}
      ${selectorDePuerto(
        "select-puerto-salida",
        "Puerto de salida",
        estado.puertosSalida,
        estado.puertoSalidaElegido,
        (idDelPuerto) => actualizar({ puertoSalidaElegido: idDelPuerto }),
      )}

      <div class="fila-botones">
        <button
          type="button"
          ?disabled=${estado.conectado}
          @click=${actualizarListaDePuertos}
        >
          Actualizar puertos
        </button>
        <button type="button" ?disabled=${estado.conectado} @click=${conectar}>
          Conectar
        </button>
        <button type="button" ?disabled=${!estado.conectado} @click=${desconectar}>
          Desconectar
        </button>
    </div>

    <p class="mensaje-conexion">${estado.mensajeConexion}</p>
    </div>
  `;
}

export async function inicializarConexion() {
  await listen<string>("conexion-perdida", (evento) => {
    actualizar({ conectado: false, mensajeConexion: evento.payload });
  });

  await actualizarListaDePuertos();
}
