# MagicMidi

Una herramienta para aprender MIDI: una aplicación de escritorio para ver,
entender y transformar los mensajes MIDI que pasan entre tus instrumentos. Su
intención principal es educativa, orientada a músicos con ganas de aprender
conceptos básicos de programación y profundizar su entendimiento del
protocolo MIDI.

## Qué hace hoy

- Permite elegir un puerto MIDI de **entrada** y uno de **salida** entre los
  disponibles en el sistema.
- Pasa cada mensaje que llega por la entrada por un **flujo** que se arma
  en el tab Workflow, conectando cajas en un editor visual. Cada caja realiza
  algún tipo de transformación en los mensajes (ver "Cajas disponibles en esta
  version").
- Si un mensaje no llega a ninguna caja de fin (Emitir, Descartar o Pánico),
  sale tal cual por la salida elegida: el flujo solo cambia lo que se le pide. Si una
  caja falla, no sale nada de ese mensaje.
- Un mensaje que llega a una caja por dos caminos se procesa dos veces. Por
  eso, para dejar pasar una cosa *o* la otra con dos Filtrar en paralelo, lo
  que cumple los dos sale dos veces: conviene armarlos para que no se pisen.
- Muestra en pantalla un log en tiempo real de los mensajes que entran y lo
  que el flujo hizo con cada uno (si salió igual, transformado, descartado o
  con error), con una descripción legible (Nota On/Off, Control Change, Pitch
  Bend, etc.) pensada para gente que recién se acerca al protocolo.
- Las notas se nombran con letra y octava además del número, como "C4 (60)":
  se usa la notación científica, en la que el Do central (nota 60) es C4.
  Algunos programas, como Ableton Live o los equipos Yamaha, llaman C3 a
  esa misma nota.
- Los mensajes de reloj MIDI (*Timing Clock*, `0xF8`) y de Sensor Activo
  (*Active Sensing*, `0xFE`) no pasan por el flujo ni aparecen en el log: se
  reenvían directo a la salida, para no sumarles demora ni saturar la
  pantalla.
- Tiene un **botón de pánico**, arriba a la derecha y a la vista desde
  cualquier tab, para apagar las notas que quedaron colgadas. Mientras hay
  conexión se ve en rojo, y también se dispara con Cmd+. en macOS (Ctrl+. en
  Windows y Linux). Manda, en cada uno de los 16 canales, que se suelte el
  pedal de sustain (CC 64), que se corte todo el sonido (CC 120, *All Sound
  Off*), que los controladores vuelvan a su valor inicial (CC 121, *Reset All
  Controllers*) y que se apaguen las notas (CC 123, *All Notes Off*). Lo que
  manda el botón no aparece en el log, porque no sale de ningún mensaje que
  entró.

## Cajas disponibles en esta version

- **Filtrar**: deja seguir solo lo que cumple todos sus criterios: los tipos de
  mensaje elegidos, incluido cada mensaje de sistema por separado, los canales
  elegidos, y un rango para cada byte de datos, por ejemplo una zona del
  teclado o una capa de velocidad. Lo que no se configura no restringe.
- **Convertir**: cambia el tipo de mensaje, por ejemplo el aftertouch a un
  CC, un CC a Pitch Bend o una nota a un Cambio de Programa; cada dato va al
  lugar que significa lo mismo en el tipo nuevo, como el número de la nota al
  número de programa, y lo que falta se rellena. Para convertir solo algunos
  mensajes, se pone antes un Filtrar.
- **Fijar**: pone siempre el mismo canal o el mismo valor en un byte de datos,
  por ejemplo una velocidad pareja.
- **Desplazar**: suma o resta un valor al canal o a un byte de datos, por ejemplo
  para transponer.
- **Mapear**: lleva un rango de valores de un byte de datos a otro, por ejemplo para
  invertir un pedal o comprimir la velocidad.
- **Emitir**: manda el mensaje a la salida.
- **Descartar**: hace que no salga.
- **Pánico**: manda lo mismo que el botón de pánico, para dispararlo desde
  un controlador. Por ejemplo, para usar el botón que manda el CC 20: un
  Filtrar (Cambio de Control, datos 1 de 20 a 20, datos 2 de 64 a 127) y
  después la caja Pánico. Sin el filtro por datos 2, el pánico salta dos
  veces: al apretar el botón y al soltarlo.

## Hacia dónde va

A futuro se van a seguir agregando componentes visuales que permitan más posibilidades
a usuarios semi-técnicos armar sus propios flujos de trabajo manipulando mensajes MIDI. 
La idea no es necesariamente evitarles la programación, sino darles una puerta de entrada 
visual para que además vayan aprendiendo conceptos básicos de programación en el proceso.
Es por ello que un objetivo del proyecto es que modificar el código para agregar un tipo
de nodo (i.e. una caja) nueva sea relativamente sencillo sin necesidad de comprender la
arquitectura completa de la aplicación.

## Arquitectura

La app está hecha con [Tauri](https://tauri.app) y sigue su modelo estándar: un backend en Rust con acceso al
sistema operativo, y un frontend web embebido que corre en un WebView nativo.

```
┌─────────────────────────┐        eventos ("mensaje-midi")        ┌──────────────────────────┐
│   Frontend (WebView)    │  ───────────────────────────────────►  │   Backend (Rust / Tauri) │
│  src/main.ts, index.html│                                        │      src-tauri/src/      │
│                         │  ◄───────────────────────────────────  │                          │
└─────────────────────────┘        comandos (invoke)               └──────────────────────────┘
                                                                              │
                                                                              ▼
                                                                     midir (CoreMIDI/ALSA/WinMM)
                                                                              │
                                                                              ▼
                                                                    Puertos MIDI del sistema
```

- **Backend** ([src-tauri/src/lib.rs](src-tauri/src/lib.rs)): usa la
  librería [`midir`](https://docs.rs/midir) para listar puertos y abrir
  conexiones de entrada/salida. El estado de las conexiones activas se
  guarda en `tauri::State` (protegido con `Mutex`/`Arc` porque el callback
  de MIDI corre en su propio hilo). Expone:
  - Comandos (`invoke` desde el frontend): `listar_puertos_entrada`,
    `listar_puertos_salida`, `conectar`, `desconectar`, `enviar_mensaje`.
  - Un evento (`listen` desde el frontend): `mensaje-midi`, emitido por
    cada mensaje MIDI recibido que no sea de reloj o sensor activo.
- **Frontend** ([src/main.ts](src/main.ts), [index.html](index.html)):
  vanilla TypeScript + Vite, con Lit como librería de componentes.
  
## Cómo correr el proyecto

Requisitos: [Node.js](https://nodejs.org) y [Rust](https://rustup.rs)
(instalado vía `rustup`, para poder actualizar el toolchain si hace falta).

```bash
npm install
npm run tauri dev
```

Esto compila el backend, levanta el frontend con Vite y abre la ventana
nativa de la app.

### Probar sin hardware MIDI

Si no tenés un instrumento o interfaz MIDI a mano, podés crear puertos
virtuales para elegir como entrada y salida, y mandar mensajes de prueba con
cualquier app o controlador virtual que hable con esos puertos:

- **macOS**: usá el **IAC Driver**, que ya viene instalado. Abrí *Audio MIDI
  Setup* → *MIDI Studio* → doble clic en *IAC Driver* → tildar *"Device is
  online"*.
- **Windows**: no trae un driver virtual de fábrica, hace falta instalar uno
  de terceros como [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html).
  Abrí loopMIDI, creá un puerto con el botón `+` (por ejemplo `loopMIDI Port`)
  y ese puerto va a aparecer tanto como entrada como salida en la app.

## Estructura del repositorio

```
├── index.html              # Punto de entrada del frontend
├── src/                    # Frontend (TypeScript, CSS)
│   ├── main.ts
│   └── styles.css
├── src-tauri/              # Backend (Rust)
│   ├── src/
│   │   ├── lib.rs          # Lógica de MIDI y comandos de Tauri
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json     # Configuración de la app (ventana, bundle, etc.)
└── openspec/               # Planificación de cambios grandes (opcional)
    ├── changes/            # Cambios en curso y archivados
    └── specs/              # Specs de las capacidades ya implementadas
```

## Planificar un cambio grande (opcional)

El repo tiene configurado [OpenSpec](https://github.com/Fission-AI/OpenSpec)
para planificar features grandes antes de escribir código: genera la propuesta,
las specs, el diseño y la lista de tareas en `openspec/changes/<nombre>/`. Es
opcional y la mayoría de los cambios no lo necesitan — para un arreglo puntual
o una feature chica, trabajá como siempre. No hace falta instalar nada: el CLI
viene en las devDependencies del proyecto.

Si usás **Claude Code**, arrancá con el comando:

```
/opsx:propose <descripción del cambio a implementar>
```

Con **cualquier otra herramienta** (o a mano), el mismo flujo se conduce desde
el CLI, que va indicando el paso siguiente:

```bash
npx openspec new change <nombre-del-cambio>
npx openspec status --change <nombre-del-cambio>
```

`status` dice qué artefacto falta y qué comando sigue; `npx openspec
instructions <artefacto> --change <nombre-del-cambio>` devuelve qué escribir y
en qué archivo. Al terminar, `npx openspec archive <nombre-del-cambio>` archiva
el cambio y actualiza las specs.

El detalle del flujo y las reglas para agentes están en [AGENTS.md](AGENTS.md).

## Convenciones del proyecto

Ver [AGENTS.md](AGENTS.md) para las convenciones de código y de trabajo
(incluye el criterio de escribir todo el material del proyecto en
castellano).

## Licencia

[MIT](LICENSE)
