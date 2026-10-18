# Proposal

## Why

Con los binarios publicados en dos canales (los releases estables y el
prerelease `dev`, que se reemplaza con cada merge a `main`), hoy no hay forma
de saber, desde la app, qué build tiene alguien instalado: dos builds `dev`
distintos, o un `dev` y el estable de la misma versión, se ven iguales. El
release `dev` ya lleva en el título un identificador del build, pero lo
calcula el workflow por su cuenta, y la app no lo conoce.

## What Changes

- **El identificador del build.** Un texto que dice de qué build se trata:
  - estable, cuando el commit tiene el tag de su versión: `0.1.0+a897f0c`;
  - dev, en cualquier otro caso: `0.1.1-dev.5+b83b9c7`, el quinto merge a
    `main` desde el último release, camino a la 0.1.1.

  La versión es la de `src-tauri/Cargo.toml`; el commit, su forma corta de 7
  caracteres en minúsculas, como la muestran git y GitHub. Lo que va después
  de `+` es información del build y no cambia el orden entre versiones; el
  `-dev` marca una versión previa de la próxima.
- **Un solo cálculo.** Un módulo de Node lo calcula a partir de git. Lo usan
  el build del frontend, que lo deja fijo en la app, y el workflow de
  distribución, para el título del release `dev` y para decidir si un build
  es estable: así la app y el release nunca dicen cosas distintas. El
  workflow deja de calcularlo por su cuenta.
- **En la barra de estado.** El identificador se ve a la derecha de la barra
  de estado, en los tres estados de la conexión, sin cortarse: el que se
  corta con puntos suspensivos es el texto de la conexión. No se anuncia con
  los cambios de la conexión. La barra deja de reflejar solo la conexión.
- **Sin git**, como al compilar desde un zip del código, el identificador es
  la versión con `-dev` y sin commit (`0.1.1-dev`), y el build no falla.
- **El módulo `ventana` es la estructura de la ventana.** Como la barra de
  estado deja de ser solo de la conexión, `ventana/` pasa a reunir lo que
  está siempre presente, cada pieza en su archivo: los tabs con sus paneles,
  la barra de estado y el botón de pánico. La ventana principal importa los
  paneles de sus módulos y se los pasa al componente de los tabs, junto con
  las acciones de la barra, como el pánico. A futuro, también vivirían ahí
  los menús y los atajos generales. No cambia nada de lo que se ve ni de cómo
  se usa.

## Capabilities

### New Capabilities

- `identificador-del-build`: el formato del identificador, cuándo un build es
  estable o dev, y que la app y el release `dev` muestren el mismo para un
  mismo commit.

### Modified Capabilities

- `navegacion-por-tabs`: la barra de estado al pie muestra también el
  identificador del build, y deja de reflejar solo la conexión.

## Impact

- Un módulo de Node nuevo que calcula el identificador, con su test.
- `vite.config.ts`: deja el identificador fijo en el frontend al compilar,
  también en `tauri dev`.
- La barra de estado (`barra-de-estado.ts`): dibuja el identificador, y se
  muda de `conexion/` a `ventana/`, igual que el botón de pánico.
- `ventana-principal.ts`: los tabs y las secciones de los paneles pasan a un
  componente propio, en `ventana/`.
- `.github/workflows/distribucion.yml`: toma el identificador del módulo; los
  builds traen el historial completo y los tags, que el cálculo necesita.
- No cambia la versión que llevan los instaladores (la de `Cargo.toml`), ni
  el backend.
