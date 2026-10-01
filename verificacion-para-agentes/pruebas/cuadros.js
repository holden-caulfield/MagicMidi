// Comprueba que el motor dibuje a ritmo normal (unos 16 ms por cuadro). Antes
// de medir rendimiento conviene correrla: si la página no está visible, el
// navegador deja de pedir cuadros y las mediciones no sirven.
const fin = medirCuadros();
await espera(1000);
return { ...fin(), visibilidad: document.visibilityState };
