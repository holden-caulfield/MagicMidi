use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use midir::{Ignore, MidiInput, MidiInputConnection, MidiOutput, MidiOutputConnection};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};

/// Estado compartido de la aplicación: mantiene vivas las conexiones MIDI
/// mientras dure la sesión. La conexión de salida se comparte mediante un
/// `Arc` porque también la necesita el callback de la conexión de entrada,
/// que reenvía directo el reloj y el Sensor Activo sin pasarlos por el
/// workflow.
///
/// `numero_de_conexion` cambia cada vez que se cierran las conexiones, y su
/// lock se toma durante todo el cierre y la apertura: así el hilo que vigila
/// una conexión sabe si sigue siendo la suya antes de cerrarla.
struct EstadoMidi {
    conexion_entrada: Mutex<Option<MidiInputConnection<()>>>,
    conexion_salida: Arc<Mutex<Option<MidiOutputConnection>>>,
    numero_de_conexion: Mutex<u64>,
}

impl Default for EstadoMidi {
    fn default() -> Self {
        Self {
            conexion_entrada: Mutex::new(None),
            conexion_salida: Arc::new(Mutex::new(None)),
            numero_de_conexion: Mutex::new(0),
        }
    }
}

/// Un puerto se identifica por el `id` que le asigna el sistema: dos puertos
/// pueden llamarse igual. `nombre` es solo para mostrar; en lo que manda el
/// frontend a `conectar` es el nombre tal como se ve en el selector, " (2)"
/// incluido, para que los mensajes coincidan con lo que se eligió.
#[derive(Clone, Serialize, Deserialize)]
struct Puerto {
    id: String,
    nombre: String,
}

#[derive(Clone, Serialize)]
struct MensajeMidi {
    puerto: String,
    marca_temporal_ms: u64,
    datos: Vec<u8>,
    descripcion: String,
}

fn marca_temporal_actual_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duracion| duracion.as_millis() as u64)
        .unwrap_or(0)
}

/// Traduce los bytes crudos de un mensaje MIDI a una descripción legible,
/// pensada para usuarios que están aprendiendo el protocolo.
fn describir_mensaje(datos: &[u8]) -> String {
    if datos.is_empty() {
        return "Mensaje vacío".to_string();
    }

    if datos[0] >= 0xF0 {
        return match datos[0] {
            0xF0 => "Mensaje de Sistema Exclusivo (SysEx)".to_string(),
            0xF1 => "Cuadro de Tiempo MIDI (MTC Quarter Frame)".to_string(),
            0xF2 => "Puntero de Posición de Canción (Song Position Pointer)".to_string(),
            0xF3 => "Selección de Canción (Song Select)".to_string(),
            0xF6 => "Solicitud de Afinación (Tune Request)".to_string(),
            0xF8 => "Reloj MIDI (Timing Clock)".to_string(),
            0xFA => "Inicio (Start)".to_string(),
            0xFB => "Continuar (Continue)".to_string(),
            0xFC => "Detener (Stop)".to_string(),
            0xFE => "Sensor Activo (Active Sensing)".to_string(),
            0xFF => "Reset del Sistema".to_string(),
            otro => format!("Mensaje de sistema sin reconocer (0x{otro:02X})"),
        };
    }

    let tipo = datos[0] & 0xF0;
    let canal = (datos[0] & 0x0F) + 1;
    let dato1 = datos.get(1).copied().unwrap_or(0);
    let dato2 = datos.get(2).copied().unwrap_or(0);

    match tipo {
        0x80 => format!("Nota Off · canal {canal} · nota {dato1} · velocidad {dato2}"),
        0x90 if dato2 == 0 => format!("Nota Off · canal {canal} · nota {dato1} · velocidad 0"),
        0x90 => format!("Nota On · canal {canal} · nota {dato1} · velocidad {dato2}"),
        0xA0 => format!("Presión Polifónica · canal {canal} · nota {dato1} · presión {dato2}"),
        0xB0 => format!("Cambio de Control · canal {canal} · controlador {dato1} · valor {dato2}"),
        0xC0 => format!("Cambio de Programa · canal {canal} · programa {dato1}"),
        0xD0 => format!("Presión de Canal · canal {canal} · presión {dato1}"),
        0xE0 => {
            let valor = ((dato2 as u16) << 7) | dato1 as u16;
            format!("Pitch Bend · canal {canal} · valor {valor}")
        }
        _ => format!("Mensaje MIDI sin reconocer: {datos:02X?}"),
    }
}

/// Mensajes que se reenvían directo a la salida, sin pasar por el workflow, y
/// se excluyen del log para no saturar la pantalla:
/// - Reloj MIDI (Timing Clock, `F8`): llega 24 veces por negra y solo sirve
///   para sincronizar; el ida y vuelta al frontend le sumaría jitter.
/// - Sensor Activo (Active Sensing, `FE`): llega unas tres veces por segundo.
///   Tiene que llegar sí o sí a la salida: un receptor que ya recibió uno y
///   deja de recibirlos da la conexión por perdida y apaga las notas, así que
///   no puede quedar a merced de un flujo que no lo emita.
fn se_reenvia_directo(datos: &[u8]) -> bool {
    matches!(datos.first(), Some(0xF8 | 0xFE))
}

#[tauri::command]
fn listar_puertos_entrada() -> Result<Vec<Puerto>, String> {
    let midi_in = MidiInput::new("tauri-midi-listado-entrada").map_err(|error| error.to_string())?;
    Ok(midi_in
        .ports()
        .iter()
        .map(|puerto| Puerto {
            id: puerto.id(),
            nombre: midi_in
                .port_name(puerto)
                .unwrap_or_else(|_| "Puerto desconocido".to_string()),
        })
        .collect())
}

#[tauri::command]
fn listar_puertos_salida() -> Result<Vec<Puerto>, String> {
    let midi_out = MidiOutput::new("tauri-midi-listado-salida").map_err(|error| error.to_string())?;
    Ok(midi_out
        .ports()
        .iter()
        .map(|puerto| Puerto {
            id: puerto.id(),
            nombre: midi_out
                .port_name(puerto)
                .unwrap_or_else(|_| "Puerto desconocido".to_string()),
        })
        .collect())
}

const INTERVALO_DE_VIGILANCIA: Duration = Duration::from_secs(1);

/// Recibe el lock de `numero_de_conexion` ya tomado, para que quien llama
/// pueda cerrar y abrir sin que un vigilante se meta en el medio.
fn cerrar_conexiones(estado: &EstadoMidi, numero_de_conexion: &mut u64) {
    *numero_de_conexion += 1;
    if let Some(conexion) = estado.conexion_entrada.lock().unwrap().take() {
        conexion.close();
    }
    if let Some(conexion) = estado.conexion_salida.lock().unwrap().take() {
        conexion.close();
    }
}

#[tauri::command]
fn conectar(
    app: AppHandle,
    estado: State<EstadoMidi>,
    puerto_entrada: Puerto,
    puerto_salida: Puerto,
) -> Result<(), String> {
    let mut numero_de_conexion = estado.numero_de_conexion.lock().unwrap();
    cerrar_conexiones(&estado, &mut numero_de_conexion);

    // La salida se abre y se guarda antes que la entrada, porque el callback
    // de la entrada la necesita para reenviar el reloj y el Sensor Activo. Si
    // algo falla después, hay que cerrarla: un intento fallido no puede dejar
    // ningún puerto abierto.
    abrir_conexiones(app.clone(), &estado, puerto_entrada.clone(), puerto_salida.clone())
        .inspect_err(|_| cerrar_conexiones(&estado, &mut numero_de_conexion))?;

    vigilar_conexion(app, *numero_de_conexion, puerto_entrada, puerto_salida);
    Ok(())
}

/// `midir` no avisa cuando un puerto desaparece: la conexión simplemente deja
/// de recibir. Por eso se revisa periódicamente que los dos puertos sigan en
/// la lista del sistema, y si falta alguno se cierra todo y se avisa.
fn vigilar_conexion(app: AppHandle, numero: u64, puerto_entrada: Puerto, puerto_salida: Puerto) {
    thread::spawn(move || {
        let (Ok(midi_in), Ok(midi_out)) = (
            MidiInput::new("tauri-midi-vigilancia-entrada"),
            MidiOutput::new("tauri-midi-vigilancia-salida"),
        ) else {
            return;
        };

        loop {
            thread::sleep(INTERVALO_DE_VIGILANCIA);

            let falta_entrada = midi_in.find_port_by_id(&puerto_entrada.id).is_none();
            let falta_salida = midi_out.find_port_by_id(&puerto_salida.id).is_none();

            let estado = app.state::<EstadoMidi>();
            let mut numero_de_conexion = estado.numero_de_conexion.lock().unwrap();
            if *numero_de_conexion != numero {
                return;
            }

            let (entrada, salida) = (&puerto_entrada.nombre, &puerto_salida.nombre);
            let mensaje = match (falta_entrada, falta_salida) {
                (false, false) => continue,
                (true, false) => {
                    format!("Se perdió la conexión con el puerto de entrada '{entrada}'")
                }
                (false, true) => {
                    format!("Se perdió la conexión con el puerto de salida '{salida}'")
                }
                (true, true) => format!(
                    "Se perdió la conexión con el puerto de entrada '{entrada}' y el de salida '{salida}'"
                ),
            };

            cerrar_conexiones(&estado, &mut numero_de_conexion);
            let _ = app.emit("conexion-perdida", mensaje);
            return;
        }
    });
}

fn abrir_conexiones(
    app: AppHandle,
    estado: &EstadoMidi,
    puerto_entrada: Puerto,
    puerto_salida: Puerto,
) -> Result<(), String> {
    let midi_out = MidiOutput::new("tauri-midi-salida").map_err(|error| error.to_string())?;
    let puerto_salida_encontrado = midi_out
        .find_port_by_id(&puerto_salida.id)
        .ok_or_else(|| format!("No se encontró el puerto de salida '{}'", puerto_salida.nombre))?;
    let conexion_salida = midi_out
        .connect(&puerto_salida_encontrado, "tauri-midi-conexion-salida")
        .map_err(|error| error.to_string())?;
    *estado.conexion_salida.lock().unwrap() = Some(conexion_salida);

    let mut midi_in = MidiInput::new("tauri-midi-entrada").map_err(|error| error.to_string())?;
    midi_in.ignore(Ignore::None);
    let puerto_entrada_encontrado = midi_in
        .find_port_by_id(&puerto_entrada.id)
        .ok_or_else(|| format!("No se encontró el puerto de entrada '{}'", puerto_entrada.nombre))?;

    let nombre_puerto_entrada = puerto_entrada.nombre;
    let conexion_salida_compartida = estado.conexion_salida.clone();
    let app_para_eventos = app.clone();

    let conexion_entrada = midi_in
        .connect(
            &puerto_entrada_encontrado,
            "tauri-midi-conexion-entrada",
            move |_marca_temporal_us, mensaje, _contexto| {
                if se_reenvia_directo(mensaje) {
                    if let Ok(mut salida) = conexion_salida_compartida.lock() {
                        if let Some(conexion) = salida.as_mut() {
                            let _ = conexion.send(mensaje);
                        }
                    }
                    return;
                }

                // El resto va al frontend, que lo pasa por el workflow y
                // devuelve con `enviar_mensaje` lo que tenga que salir.

                let evento = MensajeMidi {
                    puerto: nombre_puerto_entrada.clone(),
                    marca_temporal_ms: marca_temporal_actual_ms(),
                    datos: mensaje.to_vec(),
                    descripcion: describir_mensaje(mensaje),
                };
                let _ = app_para_eventos.emit("mensaje-midi", evento);
            },
            (),
        )
        .map_err(|error| error.to_string())?;

    *estado.conexion_entrada.lock().unwrap() = Some(conexion_entrada);

    Ok(())
}

#[tauri::command]
fn desconectar(estado: State<EstadoMidi>) {
    let mut numero_de_conexion = estado.numero_de_conexion.lock().unwrap();
    cerrar_conexiones(&estado, &mut numero_de_conexion);
}

// Sincrónico a propósito: Tauri corre los comandos sincrónicos en el hilo
// principal, de a uno, y eso ayuda a que los mensajes salgan en orden.
#[tauri::command]
fn enviar_mensaje(estado: State<EstadoMidi>, datos: Vec<u8>) -> Result<(), String> {
    let mut salida = estado.conexion_salida.lock().map_err(|error| error.to_string())?;
    let conexion = salida
        .as_mut()
        .ok_or_else(|| "No hay una conexión de salida activa".to_string())?;
    conexion.send(&datos).map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(EstadoMidi::default())
        .invoke_handler(tauri::generate_handler![
            listar_puertos_entrada,
            listar_puertos_salida,
            conectar,
            desconectar,
            enviar_mensaje
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
