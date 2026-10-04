// Se agrega arriba de cada prueba (lo hace correr.sh). Todo lo que buscan estas
// funciones entra en los shadow roots, porque la interfaz vive adentro.

const espera = (ms) => new Promise((listo) => setTimeout(listo, ms));

/** Todos los elementos que coinciden con `selector`, en el documento y en todos los shadow roots. */
const todos = (selector, raiz = document) => {
  const encontrados = [...raiz.querySelectorAll(selector)];
  for (const el of raiz.querySelectorAll("*")) {
    if (el.shadowRoot) encontrados.push(...todos(selector, el.shadowRoot));
  }
  return encontrados;
};
const uno = (selector) => todos(selector)[0];
// Un <boton-de-accion> tiene el texto afuera de su <button>: se devuelve ese
// <button>, que es el que tiene `disabled` y recibe el clic.
const boton = (texto) =>
  todos("button").find((b) => b.textContent.trim() === texto) ??
  todos("boton-de-accion").find((b) => b.textContent.trim() === texto)?.shadowRoot.querySelector("button");
const visible = (el) => !!el && el.getClientRects().length > 0;

/** Espera a que todos los componentes terminen de dibujarse. */
const dibujado = async () => {
  await espera(50);
  for (const el of todos("*")) if (el.updateComplete) await el.updateComplete;
};

/**
 * Importa un módulo de la aplicación, la misma copia que cargó la página: Vite
 * puede servirla con `?t=…`, y un `import` sin ese sufijo trae otra copia.
 */
const modulo = (...rutas) => {
  for (const ruta of rutas) {
    const cargada = performance
      .getEntriesByType("resource")
      .map((r) => new URL(r.name))
      .find((u) => u.pathname === ruta);
    if (cargada) return import(cargada.pathname + cargada.search);
  }
  throw new Error("la página no cargó " + rutas.join(" ni "));
};

/** "ocultar", "mostrar" o "tamano:ancho,alto". Ocultar y mostrar solo andan con el motor webkit en macOS. */
const ventana = (orden) =>
  window.webkit?.messageHandlers?.ventana
    ? window.webkit.messageHandlers.ventana.postMessage(orden)
    : window.__ventana(orden);

// Puntero simulado: Rete escucha eventos de puntero, y para soltar busca qué
// hay bajo el punto, así que hace falta el elemento más profundo.
const centro = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};
const profundo = (x, y, raiz = document) => {
  const el = raiz.elementFromPoint(x, y);
  return el?.shadowRoot && el.shadowRoot !== raiz ? (profundo(x, y, el.shadowRoot) ?? el) : el;
};
const puntero = (tipo, el, p) =>
  el.dispatchEvent(
    new PointerEvent(tipo, {
      bubbles: true,
      composed: true,
      clientX: p.x,
      clientY: p.y,
      pointerId: 1,
      isPrimary: true,
      button: 0,
      buttons: tipo === "pointerup" ? 0 : 1,
      pointerType: "mouse",
    }),
  );
const arrastrar = async (el, desde, hasta) => {
  puntero("pointerdown", el, desde);
  await espera(50);
  for (let i = 1; i <= 5; i++) {
    const p = { x: desde.x + ((hasta.x - desde.x) * i) / 5, y: desde.y + ((hasta.y - desde.y) * i) / 5 };
    puntero("pointermove", profundo(p.x, p.y) ?? window, p);
    await espera(20);
  }
  puntero("pointerup", profundo(hasta.x, hasta.y) ?? window, hasta);
  await espera(250);
};

/** Corre `funcion` en su propia tarea, como llega cada evento `mensaje-midi`. */
const enTarea = (() => {
  const canal = new MessageChannel();
  const pendientes = [];
  canal.port1.onmessage = () => pendientes.shift()();
  return (funcion) => {
    pendientes.push(funcion);
    canal.port2.postMessage(0);
  };
})();

/** Empieza a medir cuadros; la función que devuelve deja de medir y da el resumen. */
const medirCuadros = () => {
  const marcas = [];
  let seguir = true;
  const paso = (t) => {
    marcas.push(t);
    if (seguir) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
  return () => {
    seguir = false;
    const duraciones = marcas.slice(1).map((t, i) => t - marcas[i]);
    return {
      cuadros: duraciones.length,
      peorMs: Math.round(Math.max(0, ...duraciones)),
      masDe50ms: duraciones.filter((d) => d > 50).length,
      masDe100ms: duraciones.filter((d) => d > 100).length,
    };
  };
};
