// La memoria vive en el módulo, fuera del store, como lo anotado del apareo:
// cambia con cada mensaje, y en el store haría volver a dibujar toda la
// ventana. Es una por caja, por su `id`. Al borrar una caja, la suya queda
// hasta que se olvida todo: el `id` no se repite, así que nadie la vuelve a
// leer, y una caja nueva arranca vacía igual.
const memorias = new Map<string, Map<string, unknown>>();

/**
 * La memoria de una caja: lo que su tipo guardó al procesar mensajes
 * anteriores. La primera vez que se pide, está vacía.
 */
export function memoriaDeLaCaja(id: string): Map<string, unknown> {
  let memoria = memorias.get(id);
  if (!memoria) {
    memoria = new Map();
    memorias.set(id, memoria);
  }
  return memoria;
}

export function olvidarLaMemoriaDeLasCajas() {
  memorias.clear();
}
