// Los modos de los números (spec tipos-de-parametro, "Los parámetros numéricos
// se muestran en un modo", "Lo escrito en un parámetro numérico elige el
// modo", "Las flechas del campo numérico" y "El control de rango"): escribir
// en cada modo, las flechas, el botón de modo, los errores en el modo del
// campo, el rango con un solo modo y pasar de una caja a otra. Maneja el panel
// solo con lo que se ve, así da lo mismo sea quien sea el dueño del modo.
const m = await modulo('/src/estado/estado.ts');
const r = {};
const nodo = (id) => m.estado.flujo.nodos.find((n) => n.id === id);
const campoDe = (etiqueta) =>
  todos('campo-numero, campo-rango, campo-lista').find((c) => c.shadowRoot.querySelector('.etiqueta')?.textContent.trim() === etiqueta);
const control = (campo) => campo.shadowRoot.querySelector('#control');
const entrada = (etiqueta) => control(campoDe(etiqueta));
// Los dos campos de texto de un rango, estén en su raíz o dentro de otros campos.
const extremos = (etiqueta) => todos('input', campoDe(etiqueta).shadowRoot);
const seleccionar = async (id) => { const c = cajaDelLienzo(id); await arrastrar(c, centro(c), centro(c)); await dibujado(); };
const escribirEn = async (input, texto) => {
  input.value = texto;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await dibujado();
};
const tecla = async (input, key, shiftKey = false) => {
  input.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, composed: true }));
  await dibujado();
};
const flecha = async (campo, cual, shiftKey = false) => {
  const [subir, bajar] = campo.shadowRoot.querySelectorAll('.flecha');
  (cual === 'subir' ? subir : bajar).dispatchEvent(new MouseEvent('click', { shiftKey, bubbles: true, composed: true }));
  await dibujado();
};
const botonDeModo = (etiqueta) => campoDe(etiqueta).shadowRoot.querySelector('button.modo');
const rotar = async (etiqueta) => { botonDeModo(etiqueta).click(); await dibujado(); };
const error = (etiqueta) => campoDe(etiqueta).shadowRoot.querySelector('.error')?.textContent.trim() ?? null;
const valor = (etiqueta) => {
  const campo = campoDe(etiqueta);
  const [subir, bajar] = campo.shadowRoot.querySelectorAll('.flecha');
  return {
    campo: control(campo).value,
    modo: botonDeModo(etiqueta)?.textContent.trim() ?? null,
    anuncio: botonDeModo(etiqueta)?.getAttribute('aria-label') ?? null,
    error: error(etiqueta),
    subir: subir ? !subir.disabled : null,
    bajar: bajar ? !bajar.disabled : null,
  };
};
const rango = (etiqueta) => ({
  campos: extremos(etiqueta).map((input) => input.value),
  perillas: [...campoDe(etiqueta).shadowRoot.querySelectorAll('.perilla')].map((p) => p.getAttribute('aria-valuetext')),
  modo: botonDeModo(etiqueta)?.textContent.trim() ?? null,
  error: error(etiqueta),
});
const elegirByte = async (indice) => {
  [...control(campoDe('Byte')).getRootNode().querySelectorAll('[role=option]')][indice].click();
  await dibujado();
};

// Las cajas se agregan antes de mostrar el tab: el lienzo copia el flujo al montarse.
m.actualizar({ flujo: { ...m.estado.flujo, nodos: [...m.estado.flujo.nodos,
  { id: 'f1', tipo: 'fijar', parametros: { byte: 2, valor: 100 } },
  { id: 'f2', tipo: 'fijar', parametros: { byte: 2, valor: 100 } },
  { id: 'fl', tipo: 'filtrar', parametros: { tipos: [], canales: [], datos1: { desde: 60, hasta: 72 }, datos2: { desde: 0, hasta: 127 } } },
  { id: 'd1', tipo: 'desplazar', parametros: { byte: 1, desplazamiento: 4, overflow: false } }] } });
boton('Workflow').click(); await espera(1200);

// El entero: arranca en el primer modo y rota.
await seleccionar('f1');
r.inicial = valor('Valor');
r.rotar = [];
for (let i = 0; i < 3; i++) { await rotar('Valor'); r.rotar.push(valor('Valor')); }

// Lo escrito elige el modo.
r.escribir = {};
for (const texto of ['C4', '3C', 'Db4', 'C#4', 'Db4', 'mucho']) {
  await escribirEn(entrada('Valor'), texto);
  r.escribir[texto + (r.escribir[texto] ? ' (otra vez)' : '')] = { ...valor('Valor'), caja: nodo('f1').parametros.valor };
}

// Las flechas, propias y del teclado, con bemoles.
r.flechas = [];
await flecha(campoDe('Valor'), 'subir'); r.flechas.push(valor('Valor').campo);
await flecha(campoDe('Valor'), 'subir'); r.flechas.push(valor('Valor').campo);
await tecla(entrada('Valor'), 'ArrowUp', true); r.flechas.push(valor('Valor').campo);
await tecla(entrada('Valor'), 'ArrowDown'); r.flechas.push(valor('Valor').campo);
await escribirEn(entrada('Valor'), 'F#4'); r.flechas.push(valor('Valor').campo);
await flecha(campoDe('Valor'), 'subir'); r.flechas.push(valor('Valor').campo);

// Tope en el máximo, en decimal.
while (valor('Valor').modo !== 'DEC') await rotar('Valor');
await escribirEn(entrada('Valor'), '120');
await flecha(campoDe('Valor'), 'subir', true);
r.tope = { ...valor('Valor'), caja: nodo('f1').parametros.valor };
await tecla(entrada('Valor'), 'ArrowUp');
r.topeConTeclado = nodo('f1').parametros.valor;

// Lo escrito sin confirmar cuenta para la flecha.
entrada('Valor').value = '50';
await tecla(entrada('Valor'), 'ArrowUp');
r.sinConfirmar = { ...valor('Valor'), caja: nodo('f1').parametros.valor };

// Los errores, en el modo del campo.
await escribirEn(entrada('Valor'), '200');
r.fueraDeRango = [];
for (let i = 0; i < 3; i++) { r.fueraDeRango.push(valor('Valor')); await rotar('Valor'); }
await escribirEn(entrada('Valor'), '100');
await elegirByte(0);
r.conCanal = [];
for (let i = 0; i < 3; i++) { r.conCanal.push(valor('Valor')); await rotar('Valor'); }
while (valor('Valor').modo !== 'HEX') await rotar('Valor');
r.f1EnHexadecimal = valor('Valor');

// Otra caja no hereda el modo, y al volver la primera sigue igual.
await seleccionar('f2');
r.f2 = valor('Valor');
await seleccionar('f1');
r.f1AlVolver = valor('Valor');

// El rango: un solo modo para los dos extremos.
await seleccionar('fl');
r.rango = { inicial: rango('Datos 1'), datos2: rango('Datos 2') };
await rotar('Datos 1');
r.rango.nota = rango('Datos 1');
const [desde, hasta] = extremos('Datos 1');
await escribirEn(desde, 'D4'); r.rango.d4 = { ...rango('Datos 1'), caja: nodo('fl').parametros.datos1 };
await escribirEn(extremos('Datos 1')[0], '40'); r.rango.cifrasEnNota = { ...rango('Datos 1'), caja: nodo('fl').parametros.datos1 };
while (rango('Datos 1').modo !== 'DEC') await rotar('Datos 1');
await tecla(extremos('Datos 1')[0], 'ArrowUp', true); r.rango.desdeFrenado = nodo('fl').parametros.datos1;
await tecla(extremos('Datos 1')[1], 'ArrowDown'); r.rango.hastaFrenado = nodo('fl').parametros.datos1;
await tecla(extremos('Datos 1')[0], 'ArrowDown'); r.rango.desdeBaja = nodo('fl').parametros.datos1;
await escribirEn(extremos('Datos 1')[1], 'mucho'); r.rango.mucho = { ...rango('Datos 1'), caja: nodo('fl').parametros.datos1 };
await escribirEn(extremos('Datos 1')[0], 'Db4'); r.rango.bemol = { ...rango('Datos 1'), caja: nodo('fl').parametros.datos1, datos2: rango('Datos 2') };
await escribirEn(extremos('Datos 1')[1], '200'); r.rango.fueraDeRango = { ...rango('Datos 1'), caja: nodo('fl').parametros.datos1 };
r.rango.mismosCampos = extremos('Datos 1')[0] === desde && extremos('Datos 1')[1] === hasta;
await seleccionar('f2');
await seleccionar('fl');
r.rango.alVolver = rango('Datos 1');

// Un solo modo: sin botón, y solo ese formato.
await seleccionar('d1');
await escribirEn(entrada('Desplazamiento'), 'E4');
r.desplazamiento = { ...valor('Desplazamiento'), caja: nodo('d1').parametros.desplazamiento };
return r;
