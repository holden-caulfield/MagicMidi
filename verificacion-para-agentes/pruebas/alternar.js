// La caja Alternar en el panel (specs nodo-alternar, "Parámetros del nodo
// Alternar", y tipos-de-parametro, "El control de secuencia", "Los
// parámetros numéricos se muestran en un modo" y "Las flechas del campo
// numérico"): la configuración inicial, escribir, agregar, quitar, subir y
// bajar valores con clics, dónde queda el foco, los nombres para lectores de
// pantalla, el modo, los errores y el ancho con diez valores. La activación
// con teclado (Enter, barra espaciadora) se prueba en la ventana real.
const m = await modulo('/src/estado/estado.ts');
const r = {};
const nodo = (id) => m.estado.flujo.nodos.find((n) => n.id === id);
const valores = () => nodo('a1').parametros.valores;
const campoDe = (etiqueta) =>
  todos('campo-secuencia, campo-lista, campo-opciones, campo-numero').find((c) => c.shadowRoot.querySelector('.etiqueta')?.textContent.trim() === etiqueta);
const secuencia = () => campoDe('Valores');
const raiz = () => secuencia().shadowRoot;
const entradas = () => [...raiz().querySelectorAll('input')];
const botonLlamado = (nombre) => [...raiz().querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === nombre);
const clic = async (nombre) => { botonLlamado(nombre).click(); await dibujado(); };
const enfocado = () => {
  const el = raiz().activeElement;
  return el ? el.getAttribute('aria-label') : null;
};
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
const botonDeModo = () => raiz().querySelector('button.modo');
const rotarHasta = async (modo) => { while (botonDeModo().textContent.trim() !== modo) { botonDeModo().click(); await dibujado(); } };
const conError = () => cajaDelLienzo('a1').shadowRoot.querySelector('.caja').classList.contains('con-errores');
const vista = () => ({
  caja: valores(),
  campos: entradas().map((i) => i.value),
  modo: botonDeModo()?.textContent.trim() ?? null,
  error: raiz().querySelector('.error')?.textContent.trim() ?? null,
  conError: conError(),
});
const escribirTodos = async (lista) => {
  // Agrega o quita filas hasta tener tantas como valores, y escribe cada uno.
  while (entradas().length < lista.length) await clic('Agregar un valor');
  while (entradas().length > lista.length) await clic(`Quitar el valor ${entradas().length}`);
  for (const [i, valor] of lista.entries()) await escribirEn(entradas()[i], String(valor));
};
const elegirByte = async (indice) => {
  const control = campoDe('Byte').shadowRoot.querySelector('#control');
  [...control.getRootNode().querySelectorAll('[role=option]')][indice].click();
  await dibujado();
};

// Las cajas se agregan antes de mostrar el tab: el lienzo copia el flujo al montarse.
m.actualizar({ flujo: { ...m.estado.flujo, nodos: [...m.estado.flujo.nodos,
  { id: 'a1', tipo: 'alternar', parametros: { byte: 2, valores: [127, 0], cicloPor: [] } },
  { id: 'f1', tipo: 'fijar', parametros: { byte: 2, valor: 100 } }] } });
boton('Workflow').click(); await espera(1200);

// La barra: Alternar justo después de Fijar.
r.barra = todos('barra-de-herramientas')[0].shadowRoot.textContent.replace(/\s+/g, ' ').trim();
r.barraEtiquetas = [...todos('barra-de-herramientas')[0].shadowRoot.querySelectorAll('[aria-label]')].map((b) => b.getAttribute('aria-label'));

// Configuración inicial y nombres para lectores de pantalla.
await seleccionar('a1');
const control = raiz().querySelector('#control');
r.inicial = {
  ...vista(),
  byte: campoDe('Byte').shadowRoot.querySelector('#control').textContent.trim(),
  cicloPor: [...campoDe('Un ciclo por').shadowRoot.querySelectorAll('input')].map((i) => ({ texto: i.closest('label')?.textContent.trim(), elegida: i.checked })),
  grupo: { role: control.getAttribute('role'), etiquetadoPor: raiz().getElementById(control.getAttribute('aria-labelledby'))?.textContent.trim() },
  nombres: [...raiz().querySelectorAll('#control [aria-label]')].map((el) => el.getAttribute('aria-label')),
  deshabilitados: [...raiz().querySelectorAll('#control button')].filter((b) => b.disabled).map((b) => b.getAttribute('aria-label')),
  modoAnunciado: botonDeModo()?.getAttribute('aria-label'),
};

// Escribir un valor, una nota y algo que no es un número.
await escribirEn(entradas()[1], '64');
r.escribir = vista();
await escribirEn(entradas()[0], 'C4');
r.nota = vista();
await escribirEn(entradas()[0], 'mucho');
r.mucho = vista();
await rotarHasta('DEC');

// Las flechas del teclado: de a 10 con Mayúsculas, y el tope en el máximo.
await escribirTodos([127, 0]);
await tecla(entradas()[1], 'ArrowUp', true);
await tecla(entradas()[0], 'ArrowUp');
r.flechas = vista();

// Agregar copia el último, y el foco va al campo nuevo.
await escribirTodos([127, 80]);
await clic('Agregar un valor');
r.agregar = { ...vista(), foco: enfocado() };

// Quitar: el foco va al botón de quitar del que quedó en su lugar.
await escribirTodos([127, 80, 64]);
await clic('Quitar el valor 2');
r.quitar = { ...vista(), foco: enfocado() };
await clic('Quitar el valor 2');
r.quitarElUltimo = { ...vista(), foco: enfocado() };

// Subir y bajar: el foco sigue al valor movido.
await escribirTodos([1, 2, 3]);
await clic('Subir el valor 3');
r.subir = { ...vista(), foco: enfocado() };
await clic('Subir el valor 2');
r.subirHastaArriba = { ...vista(), foco: enfocado() };
await clic('Bajar el valor 1');
r.bajar = { ...vista(), foco: enfocado() };
await clic('Bajar el valor 2');
r.bajarHastaAbajo = { ...vista(), foco: enfocado() };

// Quitar todos: el error, y el foco en agregar; agregar pone el mínimo.
await escribirTodos([127]);
await clic('Quitar el valor 1');
r.vacia = { ...vista(), foco: enfocado() };
await clic('Agregar un valor');
r.agregarAVacia = { ...vista(), foco: enfocado() };

// Un solo botón de modo para todos los valores.
await escribirTodos([60, 64, 67]);
botonDeModo().click(); await dibujado();
r.modoNota = vista();
await rotarHasta('DEC');

// Los errores en el modo del campo.
await escribirTodos([60, 200]);
r.fueraDeRango = vista();
await rotarHasta('HEX');
r.fueraDeRangoHex = vista();
await rotarHasta('DEC');
await escribirTodos([127, 0]);
await elegirByte(0);
r.canal = vista();
await rotarHasta('HEX');
r.canalHex = vista();
await escribirTodos(['01', '02']);
r.canalCorregido = vista();

// El modo queda con la caja.
await seleccionar('f1');
await seleccionar('a1');
r.alVolver = vista();
await rotarHasta('DEC');

// Diez valores entran a lo ancho del panel: crece hacia abajo.
await elegirByte(2);
await escribirTodos([127, 80, 80, 80, 100, 64, 32, 16, 8, 0]);
const aside = uno('panel-de-configuracion').shadowRoot.querySelector('aside');
const rect = secuencia().getBoundingClientRect();
const rAside = aside.getBoundingClientRect();
r.diez = {
  campos: entradas().length,
  anchoDelCampo: Math.round(rect.width),
  anchoDelPanel: Math.round(aside.clientWidth),
  derechaDelCampo: Math.round(Math.max(...[...raiz().querySelectorAll('#control *')].map((el) => el.getBoundingClientRect().right))),
  derechaDelPanel: Math.round(rAside.right),
  desplazaALoAncho: aside.scrollWidth > aside.clientWidth,
  desplazaHaciaAbajo: aside.scrollHeight > aside.clientHeight,
};
return r;
