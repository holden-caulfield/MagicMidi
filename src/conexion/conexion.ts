import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { css, html } from "lit";
import { CircleCheck, TriangleAlert, Unplug } from "lucide";

import { actualizar, type Estado, estado, type Puerto } from "@/estado/estado";
import { dibujarIcono } from "@/workflow/iconos";

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

/** Los estilos de `barraDeEstado`, para el componente que la dibuja. */
export const estilosDeLaBarraDeEstado = css`
  .barra-de-estado {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    height: 1.5rem;
    padding: 0 0.75rem;
    font-size: 0.8em;
    line-height: 1;
    border-top: 1px solid var(--borde-suave);
    color: var(--letra-secundaria);
  }

  .barra-de-estado svg {
    flex-shrink: 0;
  }

  .barra-de-estado.conectado {
    color: var(--letra-estado-conectado);
    background-color: var(--fondo-estado-conectado);
  }

  .barra-de-estado.error {
    color: var(--letra-estado-error);
    background-color: var(--fondo-estado-error);
  }

  .texto-de-estado {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .texto-oculto {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

function contenidoDeLaBarra(estadoDeLaBarra: EstadoDeLaConexion) {
  switch (estadoDeLaBarra) {
    case "desconectado":
      return { icono: Unplug, texto: "Desconectado", contenido: html`Desconectado` };
    case "error":
      return {
        icono: TriangleAlert,
        texto: `Desconectado · ${estado.mensajeConexion}`,
        contenido: html`Desconectado · ${estado.mensajeConexion}`,
      };
    case "conectado": {
      const entrada = puertoElegido(estado.puertoEntradaElegido, estado.puertosEntrada)?.nombre;
      const salida = puertoElegido(estado.puertoSalidaElegido, estado.puertosSalida)?.nombre;
      return {
        icono: CircleCheck,
        texto: `Conectado · entrada ${entrada}, salida ${salida}`,
        contenido: html`Conectado ·
          <span class="texto-oculto">entrada</span>${entrada}
          <span aria-hidden="true">→</span>
          <span class="texto-oculto">salida</span>${salida}`,
      };
    }
  }
}

export function barraDeEstado() {
  const estadoDeLaBarra = estadoDeLaConexion(estado);
  const { icono, texto, contenido } = contenidoDeLaBarra(estadoDeLaBarra);
  return html`
    <footer class="barra-de-estado ${estadoDeLaBarra}" role="status" title=${texto}>
      ${dibujarIcono(icono, 14)}
      <span class="texto-de-estado">${contenido}</span>
    </footer>
  `;
}

export async function inicializarConexion() {
  await listen<string>("conexion-perdida", (evento) => {
    actualizar({ conectado: false, mensajeConexion: evento.payload });
  });

  await actualizarListaDePuertos();
}
