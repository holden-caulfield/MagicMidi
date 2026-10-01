# Verificación para agentes

Esta carpeta es para **agentes de codeo asistido**, no para personas: son
herramientas para que un agente pruebe la interfaz sin la ventana real de
Tauri. Una persona prueba la aplicación con `npm run tauri dev`, como dice
`AGENTS.md`. Nada de acá forma parte de la aplicación ni de `npm test`.

## Qué hay

- **`correr.sh`**: corre una prueba contra el servidor de desarrollo y
  muestra el resultado en JSON. Es la única entrada.
- **`motores/`**: con qué navegador se corre.
  - `webkit.swift`: un `WKWebView`, el WebKit del sistema, que es el mismo
    motor que la ventana de Tauri en macOS. Es el motor por defecto en macOS.
    `correr.sh` lo compila solo, la primera vez o cuando cambia.
  - `playwright.mjs`: Chromium de Playwright (y, en Linux, también su
    WebKit). El WebKit de Playwright no arranca en macOS 14.1; ahí se usa
    `webkit.swift`.
- **`ayudas/comun.js`**: funciones que `correr.sh` agrega arriba de cada
  prueba: buscar entrando en los shadow roots (`todos`, `uno`, `boton`),
  esperar el dibujado (`dibujado`), importar la misma copia de un módulo que
  cargó la página (`modulo`), simular el puntero (`arrastrar`), correr algo en
  su propia tarea como un mensaje MIDI (`enTarea`), medir cuadros
  (`medirCuadros`) y ocultar, mostrar o cambiar el tamaño de la ventana
  (`ventana`).
- **`huella/`**: para comparar dos versiones de la interfaz (ver más abajo).
- **`pruebas/`**: pruebas por área, cada una con un comentario arriba que
  dice qué revisa y de qué spec sale.
- **`salida/`**: lo que generan las herramientas (el binario de WebKit, las
  huellas). Está en `.gitignore`.

## Antes de correr

- El servidor de desarrollo tiene que estar levantado en `localhost:1420`
  (con la herramienta de preview del agente, o el `npm run tauri dev` de la
  persona usuaria, que levanta el mismo servidor).
- Para el motor `webkit` en macOS hace falta `swiftc` (las Command Line Tools
  de Xcode).
- Para el motor `chromium` hace falta el navegador de Playwright:
  `npx playwright install chromium`. Playwright está en `devDependencies`,
  pero el navegador se descarga aparte.

## Correr una prueba

```bash
verificacion-para-agentes/correr.sh verificacion-para-agentes/pruebas/log.js
verificacion-para-agentes/correr.sh verificacion-para-agentes/pruebas/log.js --motor chromium --oscuro --captura /tmp/log.png
```

El JSON tiene `resultado` (lo que devolvió la prueba), `errores` (los errores
de la página) o `excepcion`, si la prueba falló. En el navegador la aplicación
no tiene el puente de IPC, así que el error de `transformCallback` que puede
aparecer en `errores` es el esperado (ver `AGENTS.md`).

Las pruebas **no deciden si algo pasó**: devuelven lo que midieron, y quien
corre la prueba lo compara con lo que dicen las specs. Antes de medir
rendimiento, conviene correr `pruebas/cuadros.js`: si la página no está a la
vista, el navegador no pide cuadros y las mediciones no sirven.

## Comparar la interfaz antes y después de un cambio

La huella guarda, para cada elemento visible (entrando en los shadow roots),
su posición, su tamaño y sus estilos computados: en los tres tabs, en modo
claro y oscuro, con el panel de configuración mostrando cada tipo de
parámetro y con filas de log de cada clase. Sirve para confirmar que un cambio
que no debería verse no movió nada.

1. Con el código de antes (por ejemplo, `main`), y con el servidor recién
   levantado: `verificacion-para-agentes/huella/comparar.sh antes`.
2. Con el código nuevo, después de **reiniciar el servidor** (si no, Vite
   puede servir módulos viejos con `?t=…`):
   `verificacion-para-agentes/huella/comparar.sh despues`.
3. `python3 verificacion-para-agentes/huella/diferencias.py antes despues`.
   Termina con 0 si todo es igual; si no, muestra qué elementos faltan (`-`) y
   cuáles aparecieron (`+`).

Si un cambio agrega o mueve algo a propósito, la huella lo va a mostrar como
diferencia: hay que leerla y decidir si es la esperada.

## Escribir una prueba

Una prueba es el cuerpo de una función `async`: puede usar `await` y todo lo
de `ayudas/comun.js`, y termina con `return` de algo que se pueda pasar a
JSON. Las rutas de los módulos son las de Vite (`/src/estado/estado.ts`), y se
importan con `modulo(…)`, no con `import(…)`.

Lo que ninguna de estas herramientas reemplaza, y sigue necesitando la
ventana real: la activación con teclado (Enter y barra espaciadora), el flujo
MIDI completo con el IAC Driver, y minimizar la ventana de verdad (`ventana`
la oculta, que es lo más parecido que se puede automatizar).
