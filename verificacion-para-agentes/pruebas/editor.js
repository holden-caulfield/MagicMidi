// Editor de flujos (spec editor-de-workflow): montaje del lienzo, colores por
// etapa, agregar cajas con clic y arrastrando, mover, conectar, rechazar
// ciclos y duplicados, desconectar, deseleccionar y borrar desde el panel.
const m = await modulo('/src/estado/estado.ts');
const r = {};
// Montaje después de un cambio de tamaño con el tab oculto
document.documentElement.style.width = '800px'; await espera(200); document.documentElement.style.width = '';
boton('Workflow').click(); await espera(1200);
const l = uno('lienzo-workflow');
const vista = (id) => l.area.nodeViews.get(id);
const caja = cajaDelLienzo;
const div = (id) => caja(id).shadowRoot.querySelector('.caja');
const conector = (id, lado) => caja(id).shadowRoot.querySelector(`.conector-${lado}`);
const conexiones = () => m.estado.flujo.conexiones.map((c) => `${c.desde}->${c.hacia}`).sort();
const ids = () => m.estado.flujo.nodos.map((n) => n.id);
// La selección, por lo que se ve: las cajas marcadas en el lienzo.
const seleccionadas = () => ids().filter((id) => div(id)?.classList.contains('seleccionada'));
r.montaje = { cajas: todos('caja-del-flujo').length, conexionDibujada: todos('cable-del-flujo', l.shadowRoot).some((c) => todos('path', c.shadowRoot ?? c).some((p) => p.getAttribute('d'))) };
r.colores = { trigger: div('trigger').className, emitir: div('emitir-inicial').className };
// Agregar con clic en la barra
const barra = uno('barra-de-herramientas').shadowRoot;
barra.querySelector('button[aria-label="Filtrar"]').click(); await espera(300);
const filtrar = ids().find((id) => m.estado.flujo.nodos.find((n) => n.id === id).tipo === 'filtrar');
const rect = l.shadowRoot.querySelector('.lienzo').getBoundingClientRect();
r.clic = { agregado: !!filtrar, clase: div(filtrar).className, parametros: Object.keys(m.estado.flujo.nodos.find((n) => n.id === filtrar).parametros).length, enLaVista: (() => { const c = centro(caja(filtrar)); return c.x > rect.left && c.x < rect.right && c.y > rect.top && c.y < rect.bottom; })() };
// Arrastrar desde la barra hasta un punto del lienzo
const dt = new DataTransfer();
barra.querySelector('button[aria-label="Desplazar"]').dispatchEvent(new DragEvent('dragstart', { bubbles: true, composed: true, dataTransfer: dt }));
const punto = { x: rect.left + 120, y: rect.bottom - 90 };
l.shadowRoot.querySelector('.lienzo').dispatchEvent(new DragEvent('drop', { bubbles: true, composed: true, cancelable: true, clientX: punto.x, clientY: punto.y, dataTransfer: dt }));
await espera(300);
const desplazar = ids().find((id) => m.estado.flujo.nodos.find((n) => n.id === id).tipo === 'desplazar');
r.soltar = desplazar ? { centro: centro(caja(desplazar)), punto, clase: div(desplazar).className } : 'no se agregó';
// Mover
const antes = { ...vista(filtrar).position };
await arrastrar(caja(filtrar), centro(caja(filtrar)), { x: centro(caja(filtrar)).x + 50, y: centro(caja(filtrar)).y + 40 });
r.mover = { antes, despues: { ...vista(filtrar).position } };
r.seleccion = { soloElla: seleccionadas().join() === filtrar, clase: div(filtrar).className, panel: uno('panel-de-configuracion').shadowRoot.querySelector('h3')?.textContent };
// Conectar trigger -> desplazar -> filtrar
await arrastrar(conector('trigger', 'salida'), centro(conector('trigger', 'salida')), centro(conector(desplazar, 'entrada')));
await arrastrar(conector(desplazar, 'salida'), centro(conector(desplazar, 'salida')), centro(conector(filtrar, 'entrada')));
r.conectar = conexiones();
// Ciclo filtrar -> desplazar: no se permite; duplicado tampoco
await arrastrar(conector(filtrar, 'salida'), centro(conector(filtrar, 'salida')), centro(conector(desplazar, 'entrada')));
await arrastrar(conector('trigger', 'salida'), centro(conector('trigger', 'salida')), centro(conector(desplazar, 'entrada')));
r.cicloYDuplicado = conexiones();
// Desconectar trigger -> emitir arrastrando la entrada a un lugar vacío
await arrastrar(conector('emitir-inicial', 'entrada'), centro(conector('emitir-inicial', 'entrada')), { x: rect.right - 20, y: rect.top + 20 });
r.desconectar = conexiones();
// Clic en el fondo deselecciona
puntero('pointerdown', l.shadowRoot.querySelector('.lienzo'), { x: rect.right - 10, y: rect.bottom - 10 }); puntero('pointerup', window, { x: rect.right - 10, y: rect.bottom - 10 }); await dibujado();
r.fondo = { seleccionadas: seleccionadas(), clase: div(filtrar).className };
// Seleccionar desplazar y borrarlo desde el panel: se van sus conexiones
await arrastrar(caja(desplazar), centro(caja(desplazar)), centro(caja(desplazar)));
boton('Eliminar caja').click(); await espera(400); await dibujado();
r.borrar = { ids: ids().length, sigue: ids().includes(desplazar), conexiones: conexiones(), cajas: todos('caja-del-flujo').length, panel: uno('panel-de-configuracion').shadowRoot.textContent.trim() };
return r;
