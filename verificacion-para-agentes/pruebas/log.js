// Log (spec log-de-mensajes): sigue juntando con su tab oculto, la más nueva
// arriba, sub-filas, el máximo de 500, que la lista se desplace sin agrandar
// la página, la fila de encabezados, y Limpiar.
const log = await modulo('/src/log/log.ts');
const { MensajeMidi } = await modulo('/src/midi/mensaje.ts');
const r = {};
const lista = () => uno('panel-log').shadowRoot.querySelector('.lista');
const grupos = () => lista().querySelectorAll('.grupo-mensaje').length;
const t = new Date(2026, 9, 1, 10, 0, 0, 5).getTime();
// Con el tab oculto (está en Conexión) sigue juntando
for (let i = 0; i < 3; i++) log.agregarAlLog({ puerto: 'x', marca_temporal_ms: t + i, datos: [0x90, 60 + i, 100] }, [new MensajeMidi([0x90, 60 + i, 100])], null);
await dibujado();
r.ocultoJunta = { grupos: grupos(), visible: visible(lista()) };
boton('Log').click(); await dibujado();
r.orden = [...lista().querySelectorAll('.fila-entrada .columna-bytes')].map((c) => c.textContent);
r.primeraFila = [...lista().querySelector('.fila-entrada').children].map((c) => c.textContent.trim() + (c.title ? ` [${c.title}]` : ''));
log.agregarAlLog({ puerto: 'x', marca_temporal_ms: t, datos: [0x90, 60, 100] }, [new MensajeMidi([0x90, 72, 100])], null);
await dibujado();
r.subfila = [...lista().querySelector('.grupo-mensaje').querySelectorAll('.fila-salida span')].map((c) => c.textContent.trim()).filter(Boolean);
for (let i = 0; i < 600; i++) log.agregarAlLog({ puerto: 'x', marca_temporal_ms: t, datos: [0xb0, 7, i % 128] }, [], null);
await dibujado();
r.maximo = { grupos: grupos(), ultimaEsVieja: lista().lastElementChild.querySelector('.columna-bytes').textContent };
// La lista se desplaza, el panel no crece
r.desplaza = { lista: lista().scrollHeight > lista().clientHeight, pagina: document.scrollingElement.scrollHeight <= innerHeight };
r.encabezados = [...lista().querySelector('.fila-encabezados').children].map((c) => c.textContent.trim() || c.getAttribute('aria-label'));
todos('button').find((b) => b.getAttribute('aria-label') === 'Limpiar').click(); await dibujado();
r.limpiar = grupos();
return r;
