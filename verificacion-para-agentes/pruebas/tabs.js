// Tabs (spec navegacion-por-tabs): un panel visible por vez, aria-selected,
// los vínculos ARIA entre tabs y paneles, la barra de estado con el
// identificador del build en todos los tabs, el orden de tabulación y que
// las secciones ocultas no se vean.
// Los tabs y las secciones están en la raíz de <navegacion-por-tabs>.
const raiz = uno('navegacion-por-tabs').shadowRoot;
const tabs = [...raiz.querySelectorAll('[role=tab]')];
const r = { porTab: {} };
for (const tab of tabs) {
  tab.click(); await dibujado();
  const secciones = [...raiz.querySelectorAll('[role=tabpanel]')];
  r.porTab[tab.textContent.trim()] = {
    visibles: secciones.filter(visible).map((s) => s.id),
    seleccionados: tabs.filter((t) => t.getAttribute('aria-selected') === 'true').map((t) => t.id),
    ocultasConHidden: secciones.filter((s) => !visible(s)).every((s) => s.hidden && getComputedStyle(s).display === 'none'),
    barraDeEstado: visible(uno('.barra-de-estado')),
    identificadorDelBuild: visible(uno('.barra-de-estado .identificador')) && uno('.barra-de-estado .identificador').textContent,
    seccion: (() => { const s = secciones.find(visible).getBoundingClientRect(); return `${Math.round(s.width)}x${Math.round(s.height)}`; })(),
  };
}
r.aria = tabs.map((t) => { const p = raiz.getElementById(t.getAttribute('aria-controls')); return { tab: t.id, controla: p?.id, panelApuntaAlTab: p && raiz.getElementById(p.getAttribute('aria-labelledby')) === t }; });
r.tablist = raiz.querySelector('[role=tablist]').getAttribute('aria-label');
// Orden de tabulación: elementos enfocables en el orden en que se dibujan,
// entrando en cada shadow root y, en cada slot, en lo que tiene asignado
// (el botón de pánico va en el slot de las acciones).
const ordenDeTabulacion = () => {
  const enfocables = [];
  const visitar = (el) => {
    // Un botón cuyo texto llega por un slot (como los de boton-de-accion) se nombra por el de su componente.
    if (el.matches('button, select, input, [tabindex]') && visible(el) && !el.disabled) enfocables.push(el.id || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 20) || el.getRootNode().host?.textContent.trim().slice(0, 20) || '');
    if (el.shadowRoot) recorrer(el.shadowRoot);
    else if (el.localName === 'slot') el.assignedElements().forEach(visitar);
    else recorrer(el);
  };
  const recorrer = (nodo) => { for (const el of nodo.children) visitar(el); };
  recorrer(uno('ventana-principal').shadowRoot);
  return enfocables;
};
tabs[0].click(); await dibujado();
r.ordenConexion = ordenDeTabulacion();
r.tabsAlPrincipio = r.ordenConexion.slice(0, 3).join() === 'tab-conexion,tab-workflow,tab-log';
// Con conexión, el botón de pánico se habilita y va entre los tabs y el panel.
const estado = await modulo('/src/estado/estado.ts');
estado.actualizar({ conectado: true }); await dibujado();
r.ordenConectado = ordenDeTabulacion();
estado.actualizar({ conectado: false }); await dibujado();
// Hosts de componentes dentro de secciones ocultas: ninguno tiene `hidden` propio que su display anule
r.hostsVisiblesEnSeccionesOcultas = [...raiz.querySelectorAll('[role=tabpanel][hidden] > *')].filter(visible).map((e) => e.localName);
return r;
