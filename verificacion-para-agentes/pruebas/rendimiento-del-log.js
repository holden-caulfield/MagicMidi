// Rendimiento del log (design.md del cambio migrar-ui-a-componentes-lit, D8),
// con el log lleno y cada mensaje en su propia tarea:
// - ráfaga: 2000 mensajes seguidos, cuánto tarda y el peor cuadro;
// - sostenido: 500 por segundo durante 10 s, el peor cuadro y cuánto tardan en
//   atenderse un timer y un clic.
const log = await modulo("/src/log/log.ts");
boton("Log").click();
await espera(300);

let n = 0;
const agregarUno = () =>
  log.agregarAlLog({ puerto: "x", marca_temporal_ms: Date.now(), datos: [0xb0, 7, n++ % 128] }, [], null);
for (let i = 0; i < 500; i++) agregarUno();
await espera(500);

const r = {};
let fin = medirCuadros();
const inicioRafaga = performance.now();
await new Promise((listo) => {
  for (let i = 0; i < 2000; i++) enTarea(i === 1999 ? () => (agregarUno(), listo()) : agregarUno);
});
r.rafaga = { procesadaEnMs: Math.round(performance.now() - inicioRafaga) };
await espera(300);
Object.assign(r.rafaga, fin());

fin = medirCuadros();
const demoras = [];
const clics = [];
const tabLog = boton("Log");
const sondeoTimer = setInterval(() => {
  const t = performance.now();
  setTimeout(() => demoras.push(performance.now() - t), 0);
}, 100);
const sondeoClic = setInterval(() => {
  const t = performance.now();
  tabLog.addEventListener("click", () => clics.push(performance.now() - t), { once: true });
  enTarea(() => tabLog.click());
}, 250);
const inicio = performance.now();
let enviados = 0;
await new Promise((listo) => {
  const tic = setInterval(() => {
    const deberian = Math.floor((performance.now() - inicio) / 2);
    while (enviados < deberian) {
      enviados++;
      enTarea(agregarUno);
    }
    if (performance.now() - inicio >= 10000) {
      clearInterval(tic);
      listo();
    }
  }, 4);
});
clearInterval(sondeoTimer);
clearInterval(sondeoClic);
await espera(300);
r.sostenido = {
  ...fin(),
  porSegundo: Math.round(enviados / 10),
  timerPeorMs: Math.round(Math.max(...demoras)),
  clicPeorMs: Math.round(Math.max(...clics)),
};
r.filas = uno("panel-log").shadowRoot.querySelectorAll(".grupo-mensaje").length;
return r;
