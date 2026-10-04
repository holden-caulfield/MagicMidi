// Panel de conexión (specs estado-de-la-interfaz y conexion-midi): nombres
// repetidos con " (2)", controles que siguen al estado de la conexión, la
// elección de puerto que sobrevive a un redibujado, y las fallas del backend
// simuladas reemplazando el puente de IPC.
const m = await modulo('/src/estado/estado.ts');
const r = {};
m.actualizar({ puertosEntrada: [], puertosSalida: [] }); await dibujado();
r.sinPuertos = todos('select').map((s) => s.options[0]?.textContent.trim());
m.actualizar({ puertosEntrada: [{ id: 'a', nombre: 'IAC' }, { id: 'b', nombre: 'IAC' }], puertosSalida: [{ id: 'c', nombre: 'Salida' }] }); await dibujado();
r.opciones = [...todos('select')[0].options].map((o) => o.textContent.trim());
const [entrada, salida] = todos('select');
const elegir = (s, texto) => { s.selectedIndex = [...s.options].findIndex((o) => o.textContent.trim() === texto); s.dispatchEvent(new Event('change')); };
elegir(entrada, 'IAC (2)'); elegir(salida, 'Salida'); await dibujado();
r.elegidos = [m.estado.puertoEntradaElegido, m.estado.puertoSalidaElegido];
m.actualizar({ conectado: true }); await dibujado();
r.conectado = { indicador: uno('.barra-de-estado').textContent.replace(/\s+/g, ' ').trim(), selects: todos('select').map((s) => s.disabled), conectar: boton('Conectar').disabled, desconectar: boton('Desconectar').disabled, actualizar: boton('Actualizar puertos').disabled };
m.actualizar({ panelActivo: 'log' }); await dibujado(); m.actualizar({ panelActivo: 'conexion', mensajeConexion: 'algo' }); await dibujado();
r.trasRedibujar = { entrada: todos('select')[0].selectedOptions[0]?.textContent.trim(), mensaje: todos('p').find((p) => p.className === 'mensaje')?.textContent.trim(), visible: visible(todos('p').find((p) => p.className === 'mensaje')) };
m.actualizar({ conectado: false, mensajeConexion: '' }); await dibujado();
r.desconectado = { indicador: uno('.barra-de-estado').textContent.replace(/\s+/g, ' ').trim(), selects: todos('select').map((s) => s.disabled), conectar: boton('Conectar').disabled, desconectar: boton('Desconectar').disabled, mensajeVisible: visible(todos('p').find((p) => p.className === 'mensaje')) };
// 3.2: backend que falla
window.__TAURI_INTERNALS__ = { transformCallback: () => 1, invoke: async (comando) => { if (comando.startsWith('plugin:event|')) return 1; throw 'fallo simulado'; } };
boton('Actualizar puertos').click(); await espera(100); await dibujado();
r.fallaPuertos = { mensaje: todos('p').find((p) => p.className === 'mensaje').textContent.trim(), entradaSigue: todos('select')[0].selectedOptions[0]?.textContent.trim() };
boton('Conectar').click(); await espera(100); await dibujado();
r.fallaConectar = { mensaje: todos('p').find((p) => p.className === 'mensaje').textContent.trim(), indicador: uno('.barra-de-estado').textContent.replace(/\s+/g, ' ').trim(), conectarHabilitado: !boton('Conectar').disabled, selectsHabilitados: todos('select').map((s) => !s.disabled) };
return r;
