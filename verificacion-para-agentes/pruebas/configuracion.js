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
// Se seleccionan con un clic, como la persona usuaria; la selección se lee de
// las cajas marcadas en el lienzo.
const seleccionar = async (id) => { const c = cajaDelLienzo(id); await arrastrar(c, centro(c), centro(c)); await dibujado(); };
const seleccionadas = () => m.estado.flujo.nodos.map((n) => n.id).filter((id) => cajaDelLienzo(id)?.shadowRoot.querySelector('.caja').classList.contains('seleccionada'));
// Las cajas se agregan antes de mostrar el tab: el lienzo copia el flujo al montarse.
m.actualizar({ flujo: { ...m.estado.flujo, nodos: [...m.estado.flujo.nodos,
  { id: 'd1', tipo: 'desplazar', parametros: { byte: 1, desplazamiento: 4, overflow: false } },
  { id: 'd2', tipo: 'desplazar', parametros: { byte: 1, desplazamiento: 0, overflow: false } }] } });
boton('Workflow').click(); await espera(1200);
r.nadaSeleccionado = panel().textContent.trim();
await seleccionar('d1');
r.d1 = { titulo: panel().querySelector('h3').textContent, campos: todos('label').map((l) => l.textContent.trim()).filter((t) => ['Byte', 'Desplazamiento', 'Overflow'].includes(t)), desplazamiento: campo('Desplazamiento').value };
const d = campo('Desplazamiento');
d.value = '7'; d.dispatchEvent(new Event('change', { bubbles: true })); await dibujado();
r.cambiar = { d1: nodo('d1').parametros.desplazamiento, d2: nodo('d2').parametros.desplazamiento };
d.value = '2.5'; d.dispatchEvent(new Event('change', { bubbles: true })); await dibujado();
r.decimal = { valor: nodo('d1').parametros.desplazamiento, campo: campo('Desplazamiento').value };
campo('Desplazamiento').value = ''; campo('Desplazamiento').dispatchEvent(new Event('change', { bubbles: true })); await dibujado();
r.vacio = { valor: nodo('d1').parametros.desplazamiento, campo: campo('Desplazamiento').value };
const opcionesDe = (control) => [...control.getRootNode().querySelectorAll('[role=option]')];
opcionesDe(campo('Byte'))[2].click();
const ov = campo('Overflow'); ov.checked = true; ov.dispatchEvent(new Event('change', { bubbles: true })); await dibujado();
r.otros = { byte: nodo('d1').parametros.byte, overflow: nodo('d1').parametros.overflow };
await seleccionar('d2');
r.d2 = { desplazamiento: campo('Desplazamiento').value, byte: opcionesDe(campo('Byte')).findIndex((o) => o.getAttribute('aria-selected') === 'true'), overflow: campo('Overflow').checked };
// la etiqueta lleva al control
const etiquetaDe = (t) => campoDe(t).shadowRoot.querySelector('.etiqueta');
etiquetaDe('Desplazamiento').click(); await espera(50);
r.foco = { desplazamiento: campoDe('Desplazamiento').shadowRoot.activeElement?.id };
etiquetaDe('Overflow').click(); await dibujado();
r.casillaPorEtiqueta = nodo('d2').parametros.overflow;
await seleccionar('trigger');
r.trigger = panel().textContent.replace(/\s+/g, ' ').trim();
await seleccionar('emitir-inicial');
r.emitir = panel().textContent.replace(/\s+/g, ' ').trim();
// borrar la caja seleccionada: se borra del lienzo y del estado
boton('Eliminar caja').click(); await espera(300); await dibujado();
r.borrar = { seleccionadas: seleccionadas(), panel: panel().textContent.trim(), sigue: !!nodo('emitir-inicial') };
return r;
