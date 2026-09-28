# Tasks

Para tener dos puertos con el mismo nombre sin hardware repetido: en
Configuración de Audio MIDI, renombrar el bus IAC "Bus 2" a "Bus 1". Así cada
lado muestra dos "IAC Driver Bus 1". La herramienta de prueba tiene que poder
mandar y escuchar por identificador, porque por nombre no puede distinguirlos.
Al terminar, devolverle al bus su nombre "Bus 2".

## 1. Backend

- [x] 1.1 En `src-tauri/src/lib.rs`, agregar `Puerto { id, nombre }` y hacer
      que `listar_puertos_entrada`/`listar_puertos_salida` devuelvan
      `Vec<Puerto>`; verificar con `cargo check`
- [x] 1.2 Hacer que `conectar`/`abrir_conexiones` reciban dos `Puerto`, busquen
      con `find_port_by_id` y usen `nombre` en los mensajes; y que
      `vigilar_conexion` busque por identificador (design.md, "`conectar`
      recibe dos `Puerto`" y "El vigilante busca por identificador"); verificar
      con `cargo check` y `cargo clippy`

## 2. Frontend

- [x] 2.1 En `src/estado.ts` y `src/conexion.ts`: listas de `Puerto`, elección
      por identificador, la función que arma el nombre a mostrar con " (2)",
      el selector usándola, y `conectar` mandando los dos `Puerto` con el
      nombre que se muestra (design.md, "Un tipo `Puerto`" y "El ' (2)' se
      calcula en el frontend"); verificar con `npx tsc --noEmit`

## 3. Verificación

- [x] 3.1 Sin nombres repetidos, verificar que no se rompió nada: los
      selectores muestran los puertos como antes, una conexión Bus 1 → Bus 2
      pasa notas y reloj, y "Actualizar puertos" conserva la elección
- [x] 3.2 Con los dos buses llamados "IAC Driver Bus 1", verificar "Dos puertos
      con el mismo nombre": cada selector ofrece "IAC Driver Bus 1" e "IAC
      Driver Bus 1 (2)"; conectando la entrada "(2)" y la salida sin número,
      llega al log lo que se manda al bus "(2)" y no lo que se manda al otro
- [x] 3.3 Verificar "Se pierde un puerto que tiene otro con el mismo nombre":
      con esa conexión activa, borrar el bus conectado como entrada; la
      aplicación se desconecta y el mensaje nombra "IAC Driver Bus 1 (2)"
- [x] 3.4 Verificar "Queda otro puerto con el mismo nombre" y "Desapareció el
      elegido pero queda otro con su nombre": sin actualizar, "Conectar" falla
      con "No se encontró el puerto de entrada 'IAC Driver Bus 1 (2)'"; después
      de "Actualizar puertos", la entrada queda sin elegir
- [x] 3.5 Verificar "Volver a conectar cuando el dispositivo vuelve" con el
      Launchkey: perder la conexión desenchufándolo, volver a enchufarlo y
      presionar "Conectar" sin tocar los selectores; conecta
- [x] 3.6 Correr la verificación de AGENTS.md: `cargo check` desde
      `src-tauri/` y `npx tsc --noEmit` desde la raíz
- [ ] 3.7 Subir la rama, abrir el PR contra `main` y verificar que el PR quedó
      creado
