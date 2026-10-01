// El log con la ventana oculta (design.md del cambio migrar-ui-a-componentes-lit,
// D8, "Con la ventana oculta"): con el log lleno, oculta la ventana, acumula
// 20 000 mensajes, la vuelve a mostrar y le cambia el tamaño. Solo anda con el
// motor webkit en macOS: Playwright no tiene una ventana para ocultar.
//
// No mide un flujo sostenido con la ventana oculta: WebKit frena los timers de
// las páginas ocultas a uno por segundo, y la prueba manda mensajes con timers.
// En la aplicación los mensajes llegan por eventos, sin ese freno.
if (!window.webkit?.messageHandlers?.ventana) {
  throw new Error("esta prueba solo anda con el motor webkit en macOS");
}
const log = await modulo("/src/log/log.ts");
boton("Log").click();
await espera(300);

let n = 0;
const agregarUno = () =>
  log.agregarAlLog({ puerto: "x", marca_temporal_ms: Date.now(), datos: [0xb0, 7, n++ % 128] }, [], null);
const primeraFila = () =>
  uno("panel-log").shadowRoot.querySelector(".fila-entrada .columna-bytes")?.textContent;
const bytesDe = (entrada) =>
  entrada.mensaje.bytes.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
for (let i = 0; i < 500; i++) agregarUno();
await espera(500);

const r = {};
ventana("ocultar");
await espera(800);
let cuadrosOculta = 0;
let contando = true;
const contar = () => {
  cuadrosOculta++;
  if (contando) requestAnimationFrame(contar);
};
requestAnimationFrame(contar);
const inicio = performance.now();
await new Promise((listo) => {
  for (let i = 0; i < 20000; i++) enTarea(i === 19999 ? () => (agregarUno(), listo()) : agregarUno);
});
r.oculta = {
  visibilidad: document.visibilityState,
  acumular20000Ms: Math.round(performance.now() - inicio),
};
await espera(500);
contando = false;
r.oculta.cuadros = cuadrosOculta;

const ultimo = bytesDe(log.entradasDelLog()[0]);
let fin = medirCuadros();
const alMostrar = performance.now();
ventana("mostrar");
while (primeraFila() !== ultimo && performance.now() - alMostrar < 5000) {
  await new Promise((listo) => requestAnimationFrame(listo));
}
r.alMostrar = { alDiaEnMs: Math.round(performance.now() - alMostrar), visibilidad: document.visibilityState };
await espera(1000);
Object.assign(r.alMostrar, fin());

fin = medirCuadros();
for (const [ancho, alto] of [[900, 650], [700, 500], [1200, 800], [800, 600], [1000, 700]]) {
  ventana(`tamano:${ancho},${alto}`);
  await espera(250);
}
r.alCambiarTamano = fin();
return r;
