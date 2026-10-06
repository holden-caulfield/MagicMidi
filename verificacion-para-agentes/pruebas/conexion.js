// Panel de conexión (specs estado-de-la-interfaz y conexion-midi): nombres
// repetidos con " (2)", controles que siguen al estado de la conexión, la
// elección de puerto que sobrevive a un redibujado, y las fallas del backend
// simuladas reemplazando el puente de IPC.
const m = await modulo('/src/estado/estado.ts');
const r = {};
// Las listas son propias (<campo-lista>): el control es un botón, y las
// opciones, los <li> de su lista.
const listas = () => todos('campo-lista').map((c) => c.shadowRoot.querySelector('#control'));
const textoDe = (control) => control.textContent.trim();
const opcionesDe = (control) => [...control.getRootNode().querySelectorAll('[role=option]')];
const elegir = (control, texto) => opcionesDe(control).find((o) => o.textContent.trim() === texto).click();
m.actualizar({ puertosEntrada: [], puertosSalida: [] }); await dibujado();
r.sinPuertos = listas().map(textoDe);
m.actualizar({ puertosEntrada: [{ id: 'a', nombre: 'IAC' }, { id: 'b', nombre: 'IAC' }], puertosSalida: [{ id: 'c', nombre: 'Salida' }] }); await dibujado();
r.opciones = opcionesDe(listas()[0]).map((o) => o.textContent.trim());
r.sinElegir = listas().map(textoDe);
const [entrada, salida] = listas();
elegir(entrada, 'IAC (2)'); elegir(salida, 'Salida'); await dibujado();
r.elegidos = [m.estado.puertoEntradaElegido, m.estado.puertoSalidaElegido];
m.actualizar({ conectado: true }); await dibujado();
r.conectado = { indicador: uno('.barra-de-estado').textContent.replace(/\s+/g, ' ').trim(), selects: listas().map((s) => s.disabled), conectar: boton('Conectar').disabled, desconectar: boton('Desconectar').disabled, actualizar: boton('Actualizar puertos').disabled };
m.actualizar({ panelActivo: 'log' }); await dibujado(); m.actualizar({ panelActivo: 'conexion', mensajeConexion: 'algo' }); await dibujado();
r.trasRedibujar = { entrada: textoDe(listas()[0]), mensaje: todos('p').find((p) => p.className === 'mensaje')?.textContent.trim(), visible: visible(todos('p').find((p) => p.className === 'mensaje')) };
m.actualizar({ conectado: false, mensajeConexion: '' }); await dibujado();
r.desconectado = { indicador: uno('.barra-de-estado').textContent.replace(/\s+/g, ' ').trim(), selects: listas().map((s) => s.disabled), conectar: boton('Conectar').disabled, desconectar: boton('Desconectar').disabled, mensajeVisible: visible(todos('p').find((p) => p.className === 'mensaje')) };
// 3.2: backend que falla
window.__TAURI_INTERNALS__ = { invoke: async () => { throw 'fallo simulado'; } };
boton('Actualizar puertos').click(); await espera(100); await dibujado();
r.fallaPuertos = { mensaje: todos('p').find((p) => p.className === 'mensaje').textContent.trim(), entradaSigue: textoDe(listas()[0]) };
boton('Conectar').click(); await espera(100); await dibujado();
r.fallaConectar = { mensaje: todos('p').find((p) => p.className === 'mensaje').textContent.trim(), indicador: uno('.barra-de-estado').textContent.replace(/\s+/g, ' ').trim(), conectarHabilitado: !boton('Conectar').disabled, selectsHabilitados: listas().map((s) => !s.disabled) };
return r;
