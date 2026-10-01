// Tabs (spec navegacion-por-tabs): un panel visible por vez, aria-selected,
// los vínculos ARIA entre tabs y paneles, el indicador de conexión en todos
// los tabs, el orden de tabulación y que las secciones ocultas no se vean.
const raiz = uno('ventana-principal').shadowRoot;
const tabs = [...raiz.querySelectorAll('[role=tab]')];
const r = { porTab: {} };
for (const tab of tabs) {
  tab.click(); await dibujado();
  const secciones = [...raiz.querySelectorAll('[role=tabpanel]')];
  r.porTab[tab.textContent.trim()] = {
    visibles: secciones.filter(visible).map((s) => s.id),
    seleccionados: tabs.filter((t) => t.getAttribute('aria-selected') === 'true').map((t) => t.id),
    ocultasConHidden: secciones.filter((s) => !visible(s)).every((s) => s.hidden && getComputedStyle(s).display === 'none'),
    indicador: visible(raiz.querySelector('.estado')),
    seccion: (() => { const s = secciones.find(visible).getBoundingClientRect(); return `${Math.round(s.width)}x${Math.round(s.height)}`; })(),
  };
}
r.aria = tabs.map((t) => { const p = raiz.getElementById(t.getAttribute('aria-controls')); return { tab: t.id, controla: p?.id, panelApuntaAlTab: p && raiz.getElementById(p.getAttribute('aria-labelledby')) === t }; });
r.tablist = raiz.querySelector('[role=tablist]').getAttribute('aria-label');
// Orden de tabulación: elementos enfocables en el orden del árbol compuesto (entrando en cada shadow root)
const enfocables = [];
const recorrer = (nodo) => { for (const el of nodo.children) { if (el.matches('button, select, input, [tabindex]') && visible(el) && !el.disabled) enfocables.push(el.id || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 20)); if (el.shadowRoot) recorrer(el.shadowRoot); recorrer(el); } };
tabs[0].click(); await dibujado();
recorrer(raiz);
r.ordenConexion = enfocables;
r.tabsAlFinal = enfocables.slice(-3).join() === 'tab-conexion,tab-log,tab-workflow';
// Hosts de componentes dentro de secciones ocultas: ninguno tiene `hidden` propio que su display anule
r.hostsVisiblesEnSeccionesOcultas = [...raiz.querySelectorAll('[role=tabpanel][hidden] > *')].filter(visible).map((e) => e.localName);
return r;
