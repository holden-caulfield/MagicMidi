// La huella de la interfaz: posición, tamaño y estilos computados de cada
// elemento visible, en cada tab y con el panel de configuración mostrando
// cajas con cada tipo de parámetro, más algunas filas de log de cada clase.
// Para comparar dos versiones de la interfaz, ver comparar.sh.
const props = [
  "color", "background-color", "border-top-color", "border-top-width", "border-radius",
  "font-size", "font-weight", "font-family", "padding-top", "padding-left",
  "opacity", "box-shadow", "outline-style",
];

const hojas = () =>
  todos("*").filter(
    (el) =>
      ((!el.shadowRoot && el.children.length === 0) ||
        el.matches("button, select, input, label, h1, h2, h3, p, section, [role=tablist]")) &&
      visible(el),
  );
const describir = (el) => {
  const r = el.getBoundingClientRect();
  const c = getComputedStyle(el);
  const texto = el.textContent.trim().slice(0, 25);
  return (
    `${el.localName}${texto ? ` "${texto}"` : ""} @${Math.round(r.left)},${Math.round(r.top)} ` +
    `${Math.round(r.width)}x${Math.round(r.height)} ` +
    props.map((p) => c.getPropertyValue(p)).join("|")
  );
};
// Las listas son botones con role="combobox": su valor es el texto que muestran.
const valores = () =>
  todos("input, select, button[role=combobox]").map((el) =>
    el.type === "checkbox" ? el.checked : el.localName === "button" ? el.textContent.trim() : el.value,
  );

const est = await modulo("/src/estado/estado.ts");
est.actualizar({
  flujo: {
    ...est.estado.flujo,
    nodos: [
      ...est.estado.flujo.nodos,
      { id: "d", tipo: "desplazar", parametros: { byte: 2, desplazamiento: -3, overflow: true } },
      {
        id: "f",
        tipo: "filtrar",
        parametros: {
          tipos: ["nota-on", "nota-off"],
          canales: [1, 10],
          datos1: { desde: 60, hasta: 72 },
          datos2: { desde: 0, hasta: 127 },
        },
      },
    ],
  },
});

const log = await modulo("/src/log/log.ts");
const { MensajeMidi } = await modulo("/src/midi/mensaje.ts");
const t = new Date(2026, 9, 1, 10, 0, 0).getTime();
const m = (...bytes) => new MensajeMidi(bytes);
log.agregarAlLog({ puerto: "x", marca_temporal_ms: t, datos: [0x90, 60, 100] }, [m(0x90, 60, 100)], null);
log.agregarAlLog({ puerto: "x", marca_temporal_ms: t + 1, datos: [0x90, 60, 100] }, [m(0x90, 64, 100), m(0x90, 67, 100)], null);
log.agregarAlLog({ puerto: "x", marca_temporal_ms: t + 2, datos: [0x80, 60, 0] }, [], null);
log.agregarAlLog({ puerto: "x", marca_temporal_ms: t + 3, datos: [0xb0, 7, 100] }, [], "Desplazar: fuera de rango");

const salida = {};
for (const tab of todos("[role=tab]")) {
  tab.click();
  await espera(800);
  salida[tab.textContent.trim()] = hojas().map(describir);
}
// Las cajas se seleccionan con un clic, con el tab Workflow a la vista, que ya no es el
// último de la barra.
todos("[role=tab]").find((tab) => tab.textContent.trim() === "Workflow").click();
await espera(800);
for (const id of ["d", "f", "trigger"]) {
  const caja = cajaDelLienzo(id);
  await arrastrar(caja, centro(caja), centro(caja));
  await espera(400);
  salida[`Workflow, seleccionada ${id}`] = hojas().map(describir);
  salida[`valores, seleccionada ${id}`] = valores();
}
return salida;
