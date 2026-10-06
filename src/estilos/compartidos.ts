import { css } from "lit";

/**
 * Lo que necesita todo componente y el CSS global no le alcanza, porque no
 * entra en el Shadow DOM. Lo suma `Componente`, la base de todos los
 * componentes: ninguno lo importa por su cuenta. Los controles (botones,
 * listas, campos) no se estilizan acá: cada uno es un componente de
 * `src/componentes/`.
 */
export const compartidos = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  [hidden] {
    display: none !important;
  }
`;
