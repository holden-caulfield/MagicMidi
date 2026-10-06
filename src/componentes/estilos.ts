import { css } from "lit";

/**
 * La apariencia común de los controles: rellenos grises de 20px, sin borde,
 * con esquinas de 2px. Se aplica a todo elemento con la clase `control`.
 */
export const estilosDeControl = css`
  .control {
    height: 20px;
    margin: 0;
    padding: 0 7px;
    border: none;
    border-radius: 2px;
    background-color: var(--fondo-control);
    color: var(--letra-control);
    font: inherit;
    font-weight: 500;
    outline: none;
  }

  .control:hover:not(:disabled) {
    background-color: var(--fondo-control-hover);
  }

  .control:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .control:focus-visible {
    outline: 1.5px solid var(--ambar);
    outline-offset: 1px;
  }

  .control[aria-invalid="true"] {
    box-shadow: inset 0 0 0 1px var(--letra-error);
  }

  .texto-oculto {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

/** La etiqueta arriba del control y el error debajo. */
export const estilosDeCampo = css`
  :host {
    display: block;
  }

  .campo {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .en-linea {
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }

  .fila-de-etiqueta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  /* El botón de modo es más chico que un control, para no agrandar la fila de
     la etiqueta. */
  button.control.modo {
    height: 14px;
    min-width: 28px;
    padding: 0 4px;
    font-size: 9px;
    line-height: 14px;
    letter-spacing: 0.04em;
    cursor: pointer;
  }

  .etiqueta {
    font-size: 11px;
    font-weight: 500;
    color: var(--letra-secundaria);
  }

  .en-linea .etiqueta {
    font-size: inherit;
    color: inherit;
  }

  .error {
    margin: 0;
    font-size: 11px;
    color: var(--letra-error);
  }
`;

export const estilosBase = [estilosDeControl, estilosDeCampo];
