import { css } from "lit";

/**
 * El globo con el nombre de una caja, en la barra y en el lienzo. Se oculta
 * con `opacity` y no con `display: none`, para que el nombre siga al alcance
 * de los lectores de pantalla. Quien lo use decide cuándo se ve.
 */
export const estilosDelGlobo = css`
  .globo {
    position: absolute;
    top: calc(100% + 5px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
    padding: 1px 6px;
    border-radius: 2px;
    background-color: var(--fondo-globo);
    color: var(--letra-globo);
    font-size: 11px;
    font-weight: 500;
    line-height: 16px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.1s;
  }
`;
