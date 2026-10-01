// Corre una prueba con Playwright: Chromium, o el WebKit de Playwright (que en
// Linux anda, pero en macOS 14.1 no arranca; ahí se usa webkit.swift). Lo usa
// `correr.sh`; ver el LEEME.
//
// Uso: node playwright.mjs <prueba.js> [captura.png]
// Variables: MOTOR (chromium o webkit), URL, OSCURO.
import { readFileSync } from "node:fs";
import { chromium, webkit } from "playwright";

const [archivo, captura] = process.argv.slice(2);
const cuerpo = readFileSync(archivo, "utf8");
const motor = process.env.MOTOR === "webkit" ? webkit : chromium;

const navegador = await motor.launch();
const pagina = await navegador.newPage({
  viewport: { width: 1000, height: 700 },
  colorScheme: process.env.OSCURO ? "dark" : "light",
});
const errores = [];
pagina.on("pageerror", (error) => errores.push(String(error)));
// Lo mismo que webkit.swift hace con la ventana, en lo que se puede: cambiar el
// tamaño sí; ocultarla no, porque no hay ventana.
await pagina.exposeFunction("__ventana", async (orden) => {
  if (!orden.startsWith("tamano:")) throw new Error(`"${orden}" solo anda con el motor webkit en macOS`);
  const [width, height] = orden.slice(7).split(",").map(Number);
  await pagina.setViewportSize({ width, height });
});

await pagina.goto(process.env.URL ?? "http://localhost:1420/", { waitUntil: "networkidle" });
await pagina.waitForTimeout(1000);
let salida;
try {
  salida = { errores, resultado: await pagina.evaluate(`(async () => {\n${cuerpo}\n})()`) };
} catch (error) {
  salida = { errores, excepcion: String(error) };
}
if (captura) await pagina.screenshot({ path: captura });
console.log(JSON.stringify(salida, null, 2));
await navegador.close();
