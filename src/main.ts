import { listen } from "@tauri-apps/api/event";
import { html, render } from "lit";

import { actualizarListaDePuertos, perderConexion } from "@/conexion/conexion";
import { estado, suscribir } from "@/estado/estado";
import type { EventoMidi } from "@/midi/mensaje";
import "@/ventana/ventana-principal";
import { recibirMensaje } from "@/workflow/ejecutar";
import { olvidarNotasPrendidas } from "@/workflow/notas-prendidas";

render(html`<ventana-principal></ventana-principal>`, document.body);

// Sin conexión, la ejecución vuelve a cero: lo anotado no pasa a la próxima.
suscribir(() => {
  if (!estado.conectado) {
    olvidarNotasPrendidas();
  }
});

await listen<EventoMidi>("mensaje-midi", (evento) => recibirMensaje(evento.payload));
await listen<string>("conexion-perdida", (evento) => perderConexion(evento.payload));
await actualizarListaDePuertos();
