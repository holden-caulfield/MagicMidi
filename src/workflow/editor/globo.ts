import { css } from "lit";

/**
 * El globo con el nombre de una caja, en la barra y en el lienzo. Se oculta
 * con `opacity` y no con `display: none`, para que el nombre siga al alcance
 * de los lectores de pantalla. Quien lo use decide cuándo se ve.
 */
export const estilosDelGlobo = css`
  .globo {
    position: absolute;
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    background-color: #0f0f0f;
    color: #ffffff;
    font-size: 0.8rem;
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.1s;
  }
`;
