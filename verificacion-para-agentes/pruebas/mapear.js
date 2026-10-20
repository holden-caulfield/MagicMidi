// La caja Mapear en el panel (specs nodo-mapear, "Los parámetros de Mapear
// son el byte y el mapa", y tipos-de-parametro, "El parámetro mapa", "El
// control de mapa", "Los parámetros numéricos se muestran en un modo" y "Las
// flechas del campo numérico"): la configuración inicial, escribir, agregar y
// quitar pares con clics, dónde queda el foco, los nombres para lectores de
// pantalla, el modo, los errores y el ancho del par más largo. La activación
// con teclado (Enter, barra espaciadora) se prueba en la ventana real.
const m = await modulo('/src/estado/estado.ts');
const r = {};
const nodo = (id) => m.estado.flujo.nodos.find((n) => n.id === id);
const pares = () => nodo('m1').parametros.mapa.map((p) => `${p.entrada}→${p.salida}`);
const campoDe = (etiqueta) =>
  todos('campo-mapa, campo-lista, campo-numero').find((c) => c.shadowRoot.querySelector('.etiqueta')?.textContent.trim() === etiqueta);
const mapa = () => campoDe('Mapa');
const raiz = () => mapa().shadowRoot;
const entradas = () => [...raiz().querySelectorAll('input')];
const campoLlamado = (nombre) => entradas().find((i) => i.getAttribute('aria-label') === nombre);
const botonLlamado = (nombre) => [...raiz().querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === nombre);
const clic = async (nombre) => { botonLlamado(nombre).click(); await dibujado(); };
const enfocado = () => {
  const el = raiz().activeElement;
  return el ? el.getAttribute('aria-label') : null;
};
const seleccionar = async (id) => { const c = cajaDelLienzo(id); await arrastrar(c, centro(c), centro(c)); await dibujado(); };
const escribirEn = async (nombre, texto) => {
  const input = campoLlamado(nombre);
  input.value = texto;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await dibujado();
};
const tecla = async (nombre, key, shiftKey = false) => {
  campoLlamado(nombre).focus();
  campoLlamado(nombre).dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, composed: true }));
  await dibujado();
};
const botonDeModo = () => raiz().querySelector('button.modo');
const rotarHasta = async (modo) => { while (botonDeModo().textContent.trim() !== modo) { botonDeModo().click(); await dibujado(); } };
const conError = () => cajaDelLienzo('m1').shadowRoot.querySelector('.caja').classList.contains('con-errores');
const vista = () => ({
  caja: pares(),
  campos: entradas().map((i) => i.value),
  modo: botonDeModo()?.textContent.trim() ?? null,
  ayuda: raiz().querySelector('.ayuda')?.textContent.trim() ?? null,
  error: raiz().querySelector('.error')?.textContent.trim() ?? null,
  conError: conError(),
});
// El mapa de la caja se pone desde el store: es lo que la caja ya tenía
// antes de lo que se prueba. El modo es del campo, y no cambia.
const ponerMapa = async (lista, byte = nodo('m1').parametros.byte) => {
  m.actualizar({ flujo: { ...m.estado.flujo, nodos: m.estado.flujo.nodos.map((n) =>
    n.id === 'm1' ? { ...n, parametros: { byte, mapa: lista.map(([entrada, salida]) => ({ entrada, salida })) } } : n) } });
  await dibujado(); await dibujado();
};
const elegirByte = async (indice) => {
  const control = campoDe('Byte').shadowRoot.querySelector('#control');
  [...control.getRootNode().querySelectorAll('[role=option]')][indice].click();
  await dibujado();
};

// Las cajas se agregan antes de mostrar el tab: el lienzo copia el flujo al montarse.
m.actualizar({ flujo: { ...m.estado.flujo, nodos: [...m.estado.flujo.nodos,
  { id: 'm1', tipo: 'mapear', parametros: { byte: 1, mapa: [] } },
  { id: 'f1', tipo: 'fijar', parametros: { byte: 2, valor: 100 } }] } });
boton('Workflow').click(); await espera(1200);

// La barra: Interpolar y Mapear, justo antes de Emitir.
r.barraEtiquetas = [...todos('barra-de-herramientas')[0].shadowRoot.querySelectorAll('button[aria-label]')].map((b) => b.getAttribute('aria-label'));

// Configuración inicial y nombres para lectores de pantalla.
await seleccionar('m1');
const control = raiz().querySelector('#control');
r.inicial = {
  ...vista(),
  titulo: uno('panel-de-configuracion').shadowRoot.querySelector('h3').textContent.trim(),
  byte: campoDe('Byte').shadowRoot.querySelector('#control').textContent.trim(),
  grupo: { role: control.getAttribute('role'), etiquetadoPor: raiz().getElementById(control.getAttribute('aria-labelledby'))?.textContent.trim() },
  modoAnunciado: botonDeModo()?.getAttribute('aria-label'),
};

// Agregar al mapa vacío: el mínimo, y el foco en su entrada.
await clic('Agregar un par');
r.agregarAlVacio = { ...vista(), foco: enfocado() };

// Escribir una salida, en otro modo y algo que no es un número.
await ponerMapa([[48, 48]]);
await escribirEn('Salida 1', 'C1');
r.escribirSalida = vista();
await escribirEn('Entrada 1', '50');
r.otroModo = vista();
await rotarHasta('♪');
await ponerMapa([[48, 36]]);
await escribirEn('Salida 1', 'mucho');
r.mucho = vista();

// Las flechas del teclado: de a 1, y una octava con Mayúsculas.
await tecla('Salida 1', 'ArrowUp');
await tecla('Salida 1', 'ArrowUp', true);
r.flechas = { ...vista(), foco: enfocado() };

// Agregar: la siguiente entrada libre, que sale igual, y el foco en su entrada.
await ponerMapa([[48, 36], [49, 38]]);
await clic('Agregar un par');
r.agregar = { ...vista(), foco: enfocado() };
await ponerMapa([[50, 42], [48, 36], [49, 38]]);
await clic('Agregar un par');
r.agregarSalteando = vista();
await rotarHasta('DEC');
await ponerMapa([[0, 10], [127, 20]]);
await clic('Agregar un par');
r.agregarDespuesDelMaximo = vista();
await rotarHasta('♪');

// Sin entradas libres, el botón de agregar se ve deshabilitado.
await ponerMapa(Array.from({ length: 128 }, (_, i) => [i, i]));
r.lleno = { pares: pares().length, agregarDeshabilitado: botonLlamado('Agregar un par').disabled };

// Quitar: el foco va al botón de quitar del par que quedó en su lugar, o al de
// agregar si no queda ninguno.
await ponerMapa([[48, 36], [49, 38], [50, 42]]);
await clic('Quitar el par 2');
r.quitar = { ...vista(), foco: enfocado() };
await ponerMapa([[48, 36]]);
await clic('Quitar el par 1');
r.quitarElUltimo = { ...vista(), foco: enfocado() };

// Los nombres de cada campo y cada botón, con dos pares.
await ponerMapa([[48, 36], [49, 38]]);
r.nombres = [...raiz().querySelectorAll('#control [aria-label]')].map((el) => el.getAttribute('aria-label'));
r.flechaAnunciada = [...raiz().querySelectorAll('.flecha svg')].every((svg) => svg.getAttribute('aria-hidden') === 'true');

// Un solo botón de modo para todo el mapa.
await rotarHasta('HEX');
await ponerMapa([[48, 36]]);
r.enHex = vista();
botonDeModo().click(); await dibujado();
r.deHexANota = vista();

// La entrada repetida, en modo nota.
await ponerMapa([[48, 36], [48, 38]]);
r.repetida = vista();

// Con Canal: un valor fuera de 1 a 16, y el error que aparece al cambiar el byte.
await rotarHasta('DEC');
await ponerMapa([[1, 10]], 0);
await escribirEn('Salida 1', '17');
r.canalFuera = vista();
await ponerMapa([[0, 100]], 1);
r.datos1ConCero = vista();
await elegirByte(0);
r.alElegirCanal = { ...vista(), byte: nodo('m1').parametros.byte };
await elegirByte(1);

// El modo queda con la caja.
await rotarHasta('HEX');
await seleccionar('f1');
await seleccionar('m1');
r.alVolver = vista();
await rotarHasta('♪');

// El par más ancho entra en una fila, y el panel no se desplaza a lo ancho.
await ponerMapa([[3, 126]]);
const aside = uno('panel-de-configuracion').shadowRoot.querySelector('aside');
const fila = raiz().querySelector('.fila');
r.ancho = {
  campos: entradas().map((i) => i.value),
  anchoDeLaFila: Math.round(fila.getBoundingClientRect().width),
  altoDeLaFila: Math.round(fila.getBoundingClientRect().height),
  derechaDelCampo: Math.round(Math.max(...[...raiz().querySelectorAll('#control *')].map((el) => el.getBoundingClientRect().right))),
  derechaDelPanel: Math.round(aside.getBoundingClientRect().right),
  desplazaALoAncho: aside.scrollWidth > aside.clientWidth,
  textoCortado: entradas().some((i) => i.scrollWidth > i.clientWidth),
};
return r;
