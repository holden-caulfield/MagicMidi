/** Lo que declara todo parámetro, sea del tipo que sea. */
export interface ParametroBase<T> {
  clave: string;
  etiqueta: string;
  inicial: T;
}
