import { listen } from "@tauri-apps/api/event";
import { html, render } from "lit";

import { actualizarListaDePuertos, perderConexion } from "@/conexion/conexion";
import type { EventoMidi } from "@/midi/mensaje";
import "@/ventana/ventana-principal";
import { recibirMensaje } from "@/workflow/ejecutar";

render(html`<ventana-principal></ventana-principal>`, document.body);

await listen<EventoMidi>("mensaje-midi", (evento) => recibirMensaje(evento.payload));
await listen<string>("conexion-perdida", (evento) => perderConexion(evento.payload));
await actualizarListaDePuertos();
