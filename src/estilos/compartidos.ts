import { css } from "lit";

/**
 * Lo que comparten todos los componentes que tienen controles. El CSS global no
 * entra en el Shadow DOM: cada componente que dibuja botones, listas o campos
 * lo suma a sus estilos con `static styles = [compartidos, css`…`]`.
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

  select,
  button,
  input[type="number"] {
    border-radius: 8px;
    border: 1px solid var(--borde-suave);
    padding: 0.6em 0.9em;
    font-size: 1em;
    font-family: inherit;
    color: var(--letra-control);
    background-color: var(--fondo-control);
  }

  select,
  button {
    font-weight: 500;
    outline: none;
  }

  button {
    cursor: pointer;
    transition: border-color 0.2s;
  }

  button:hover:not(:disabled) {
    border-color: var(--acento);
  }

  button:active {
    background-color: var(--fondo-control-activo);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 2px;
  }

  .campo {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1 1 220px;
  }

  .campo label {
    font-size: 0.85em;
    font-weight: 600;
    opacity: 0.8;
  }
`;
