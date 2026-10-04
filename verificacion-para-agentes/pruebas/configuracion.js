// Panel de configuración (spec editor-de-workflow, "La caja seleccionada se
// configura en el mismo tab"): cada caja con su configuración, valores no
// enteros rechazados, la etiqueta que lleva al control y borrar la caja
// seleccionada.
const m = await modulo('/src/estado/estado.ts');
const r = {};
const nodo = (id) => m.estado.flujo.nodos.find((n) => n.id === id);
const panel = () => uno('panel-de-configuracion').shadowRoot;
const campos = () => todos('campo-numero, campo-lista, campo-interruptor, campo-opciones');
const campoDe = (etiqueta) => campos().find((c) => c.shadowRoot.querySelector('.etiqueta').textContent.trim() === etiqueta);
const campo = (etiqueta) => campoDe(etiqueta)?.shadowRoot.querySelector('#control');
boton('Workflow').click(); await espera(500);
m.actualizar({ flujo: { ...m.estado.flujo, nodos: [...m.estado.flujo.nodos,
  { id: 'd1', tipo: 'desplazar', parametros: { byte: 1, desplazamiento: 4, overflow: false } },
  { id: 'd2', tipo: 'desplazar', parametros: { byte: 1, desplazamiento: 0, overflow: false } }] } });
r.nadaSeleccionado = panel().textContent.trim();
m.actualizar({ nodoSeleccionado: 'd1' }); await dibujado();
r.d1 = { titulo: panel().querySelector('h3').textContent, campos: todos('label').map((l) => l.textContent.trim()).filter((t) => ['Byte', 'Desplazamiento', 'Overflow'].includes(t)), desplazamiento: campo('Desplazamiento').value };
const d = campo('Desplazamiento');
d.value = '7'; d.dispatchEvent(new Event('change', { bubbles: true })); await dibujado();
r.cambiar = { d1: nodo('d1').parametros.desplazamiento, d2: nodo('d2').parametros.desplazamiento };
d.value = '2.5'; d.dispatchEvent(new Event('change', { bubbles: true })); await dibujado();
r.decimal = { valor: nodo('d1').parametros.desplazamiento, campo: campo('Desplazamiento').value };
campo('Desplazamiento').value = ''; campo('Desplazamiento').dispatchEvent(new Event('change', { bubbles: true })); await dibujado();
r.vacio = { valor: nodo('d1').parametros.desplazamiento, campo: campo('Desplazamiento').value };
const byte = campo('Byte'); byte.selectedIndex = 2; byte.dispatchEvent(new Event('change', { bubbles: true }));
const ov = campo('Overflow'); ov.checked = true; ov.dispatchEvent(new Event('change', { bubbles: true })); await dibujado();
r.otros = { byte: nodo('d1').parametros.byte, overflow: nodo('d1').parametros.overflow };
m.actualizar({ nodoSeleccionado: 'd2' }); await dibujado();
r.d2 = { desplazamiento: campo('Desplazamiento').value, byte: campo('Byte').selectedIndex, overflow: campo('Overflow').checked };
// la etiqueta lleva al control
const etiquetaDe = (t) => campoDe(t).shadowRoot.querySelector('.etiqueta');
etiquetaDe('Desplazamiento').click(); await espera(50);
r.foco = { desplazamiento: campoDe('Desplazamiento').shadowRoot.activeElement?.id };
etiquetaDe('Overflow').click(); await dibujado();
r.casillaPorEtiqueta = nodo('d2').parametros.overflow;
m.actualizar({ nodoSeleccionado: 'trigger' }); await dibujado();
r.trigger = panel().textContent.replace(/\s+/g, ' ').trim();
m.actualizar({ nodoSeleccionado: 'emitir-inicial' }); await dibujado();
r.emitir = panel().textContent.replace(/\s+/g, ' ').trim();
// borrar la caja seleccionada (con el lienzo actual: se borra del lienzo y del estado)
m.actualizar({ nodoSeleccionado: 'emitir-inicial' }); await dibujado();
boton('Eliminar caja').click(); await espera(300); await dibujado();
r.borrar = { seleccionado: m.estado.nodoSeleccionado, panel: panel().textContent.trim(), sigue: !!nodo('emitir-inicial') };
return r;
