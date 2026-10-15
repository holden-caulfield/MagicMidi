// Apareo de Nota Off en el log (specs apareo-de-nota-off y log-de-mensajes,
// "Un Nota Off apareado se marca como tal"): pasa mensajes por el flujo como si
// llegaran del backend y mide cada fila del log, de arriba hacia abajo: su
// clase, sus bytes, la marca, el texto oculto de las sub-filas y sus colores.
// También revisa que sin conexión se olvide lo anotado.
const estado = await modulo('/src/estado/estado.ts');
const ejecutar = await modulo('/src/workflow/ejecutar.ts');
const { MensajeMidi } = await modulo('/src/midi/mensaje.ts');
const r = {};
const FILTRO = { tipos: [], canales: [], datos1: { desde: 0, hasta: 127 }, datos2: { desde: 0, hasta: 127 } };
const cadena = (...nodos) => ({
  nodos: [{ id: 'trigger', tipo: 'trigger', parametros: {} }, ...nodos],
  conexiones: nodos.map((nodo, i) => ({ desde: i === 0 ? 'trigger' : nodos[i - 1].id, hacia: nodo.id })),
});
const notasOn = { id: 'notas', tipo: 'filtrar', parametros: { ...FILTRO, tipos: ['nota-on'] } };
const emitir = { id: 'emitir', tipo: 'emitir', parametros: {} };
const subir = (cuanto) => ({ id: 'subir', tipo: 'desplazar', parametros: { byte: 1, desplazamiento: cuanto, overflow: false } });
const aControl = { id: 'convertir', tipo: 'convertir', parametros: { destino: 'cambio-de-control' } };
let t = new Date(2026, 9, 1, 10, 0, 0, 5).getTime();
const llega = (...datos) => ejecutar.recibirMensaje({ puerto: 'x', marca_temporal_ms: (t += 137), datos });

// Sin conexión se olvida lo anotado: el Nota Off sale tal cual.
estado.actualizar({ conectado: true, flujo: cadena(notasOn, subir(12), emitir) });
ejecutar.procesarMensaje(new MensajeMidi([0x90, 0x3c, 0x64]));
estado.actualizar({ conectado: false });
estado.actualizar({ conectado: true });
const tiraDeBytes = (m) => m.bytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
const sinConexion = ejecutar.procesarMensaje(new MensajeMidi([0x80, 0x3c, 0x40]));
r.olvidaSinConexion = { salidas: sinConexion.salidas.map(tiraDeBytes), apareado: sinConexion.apareado };

// Los grupos, de abajo hacia arriba en el log.
estado.actualizar({ flujo: cadena(subir(4), emitir) });
llega(0xb0, 0x07, 0x64); // transformado, para comparar el fondo de la sub-fila
estado.actualizar({ flujo: cadena(emitir) });
llega(0x90, 0x3c, 0x64);
llega(0x80, 0x3c, 0x40); // por el Emitir: sin cambios, sin apareo
estado.actualizar({ flujo: cadena(notasOn, aControl, emitir) });
llega(0x90, 0x24, 0x7f);
llega(0x80, 0x24, 0x40); // apareado sin notas que apagar
estado.actualizar({ flujo: cadena(notasOn, emitir) });
llega(0x90, 0x3c, 0x64);
llega(0x80, 0x3c, 0x40); // apareado con los mismos bytes: sin cambios
estado.actualizar({ flujo: cadena(notasOn, subir(12), emitir) });
llega(0x80, 0x3d, 0x40); // sin nada anotado: sin cambios
llega(0x90, 0x3c, 0x64);
llega(0x80, 0x3c, 0x40); // apareado con la octava

boton('Log').click();
await dibujado();
const lista = uno('panel-log').shadowRoot.querySelector('.lista');
r.filas = [...lista.querySelectorAll('.fila-mensaje:not(.fila-encabezados)')].map((fila) => {
  const estilo = getComputedStyle(fila);
  return [
    fila.className.replace('fila-mensaje', '').trim(),
    fila.querySelector('.columna-bytes').textContent,
    fila.querySelector('.columna-marca')?.title ?? '',
    fila.querySelector('.columna-hora .texto-oculto')?.textContent ?? '',
    estilo.backgroundColor,
    estilo.color,
  ].join(' | ');
});
return r;
