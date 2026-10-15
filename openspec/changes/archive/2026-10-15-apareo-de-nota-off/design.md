# Design

## Context

Ver `proposal.md` (Why) para la motivación, y las specs `apareo-de-nota-off` y
`log-de-mensajes` para el comportamiento. Lo que condiciona el diseño:

- **La regla de "sale tal cual" vive en `procesarMensaje`** (`ejecutar.ts`):
  si `entregar` dice que ningún camino llegó a una caja de fin, devuelve el
  mensaje original. Hoy es una función sin estado: lee `estado.flujo`, no
  envía nada y devuelve `{ salidas, error }`. `recibirMensaje` envía las
  salidas y se las pasa al log. Los tests del ejecutor llaman a
  `procesarMensaje` directo.
- **El store avisa a todos los componentes con cada `actualizar()`**: por eso
  el log tiene su propio registro, como estado del módulo `log` (`log/log.ts`),
  y por lo mismo algo que cambia con cada nota no puede vivir en el store.
- **La conexión no conoce el flujo** (AGENTS.md): el flujo usa la conexión
  para enviar (`enviarMensaje`), y no al revés.
- **`estado.conectado` ya está en el store**, y lo cambian `conectar`,
  `desconectar` y `perderConexion`. Hoy solo los componentes se suscriben al
  store, con `ControladorDeEstado`.
- **El log clasifica cada entrada una sola vez** (`clasificarSalidas`), y la
  entrada no cambia después de creada. `<panel-log>` la dibuja según
  `resultado.tipo`.
- **Un mensaje guarda solo sus bytes**: el tipo, el canal y la nota son
  getters (`MensajeMidi`), y un Nota On con velocidad 0 ya se lee como
  `"nota-off"`.

## Goals / Non-Goals

**Goals:**

- Que el apareo sea una excepción de la regla de "sale tal cual", en el mismo
  lugar del código, sin que ningún tipo de nodo ni el recorrido (`entregar`,
  `procesarEn`) cambien.
- Que lo anotado y el registro del log sigan la misma regla: lo que cambia con
  cada mensaje MIDI es estado del módulo que lo usa, fuera del store.
- Que la conexión siga sin conocer el flujo.
- Que el apareo se pueda probar sin backend, igual que el recorrido.

**Non-Goals:**

- Aparear lo que no entra como nota (un CC convertido en notas), la Presión
  Polifónica de una nota transpuesta, o un Nota Off cuyo Nota On pasó por una
  caja que lo cambió de forma imprevisible: queda como hoy.
- Una caja "Aparear" o una opción en Filtrar: descartadas en el diseño
  acordado. Si aparece un caso real, una caja de fin que se comporte como
  Emitir y aparee se puede sumar sin cambiar esta regla.
- Dividir el store en secciones con avisos por sección. Resolvería a quién se
  avisa, pero lo anotado no lo dibuja nadie, y el log ya tiene sus propios
  avisos: no lo pide este cambio.
- Mostrar en algún lado qué notas hay anotadas.

## Decisions

### Lo anotado es estado propio del módulo `workflow`

`src/workflow/notas-prendidas.ts` guarda lo anotado en el módulo, como
`log/log.ts` guarda sus entradas, y exporta tres funciones:

- `anotarNotasPrendidas(notaOn, salidas)`: agrega, bajo el canal y la nota del
  Nota On que entró, la lista de `{ canal, nota }` de las salidas que son Nota
  On (`tipo === "nota-on"`, que ya excluye la velocidad 0). La lista puede
  quedar vacía.
- `sacarNotasPrendidas(notaOff)`: saca de lo anotado la anotación más vieja
  del canal y la nota del Nota Off y devuelve los Nota Off que apagarían sus
  notas, en orden; `null` si no había ninguna anotación. Una anotación vacía
  devuelve una lista vacía, que no es lo mismo que `null`: con la primera no
  sale nada, con la segunda sale tal cual.
- `olvidarNotasPrendidas()`: vacía todo.

Por dentro es un `Map` de clave canal y nota a una cola de listas. Cuando una
cola queda vacía se borra su clave, así lo anotado no crece con las teclas que
ya se soltaron.

Cada Nota Off que devuelve `sacarNotasPrendidas` es una copia del que entró
con el canal y la nota cambiados: `(status & 0xF0) | (canal - 1)`, la nota en
el segundo byte, y el resto igual. Así conserva la velocidad de soltar y su forma
(`8n`, o `9n` con velocidad 0), y en un flujo que no toca las notas el apareo
da los mismos bytes que salían antes.

La regla que queda, para el log y para esto: **lo que cambia con cada mensaje
MIDI no va al store; es estado del módulo que lo usa, con sus propias
funciones, y avisa solo si alguien lo dibuja.** El log tiene avisos porque lo
dibuja `<panel-log>`; lo anotado no tiene, porque no lo dibuja nadie. El log
no cambia.

Alternativas descartadas:

- **En `midi/`**: `midi/` es conocimiento del protocolo sin estado
  (descripciones, nombres de notas, la lista del pánico); esto es memoria de la
  ejecución.
- **Un archivo aparte en `estado/`, fuera del store**: `estado/` es para lo
  que usan áreas distintas, y lo anotado lo usa solo `workflow` (el olvido
  también, ver la decisión siguiente). Para que el log quedara igual habría
  que sacarlo de su módulo, que es el único que lo usa.
- **En el store, dividido en secciones con avisos por sección**: ver
  Non-Goals. Además `actualizar()` reemplaza y avisa, que no encaja con algo
  que cambia con cada mensaje.
- **Una clase con una instancia**: con una sola instancia, una clase no suma
  nada sobre el estado del módulo, y el log ya resuelve lo mismo así.

### Sin conexión, la ejecución está en cero

`main.ts` suscribe al store una función que olvida lo anotado cada vez que
`estado.conectado` es `false`:

```ts
// Sin conexión, la ejecución vuelve a cero: lo anotado no pasa a la próxima.
suscribir(() => {
  if (!estado.conectado) olvidarNotasPrendidas();
});
```

Olvidar cuando ya no hay nada no cambia nada, así que no hace falta detectar
el paso de conectado a desconectado. Cubre las tres formas en que una conexión
termina o no llega a abrirse (`desconectar`, `perderConexion`, un `conectar`
que falla), y si algún día el ejecutor guarda otra cosa, se olvida en el mismo
lugar. Va en `main.ts` porque ese archivo muestra todo lo que arranca y cómo
se engancha; es la primera suscripción al store que no hace un componente.

Alternativas descartadas:

- **Que `conectar` llame al ejecutor** (un `empezarAProcesar`, por ejemplo):
  se lee mejor desde `conectar`, pero arma un ciclo entre módulos, porque
  `workflow/ejecutar.ts` ya importa `enviarMensaje` de `conexion/conexion.ts`.
- **Un evento "conexión nueva" en `conexion/`, al que se suscriba el
  ejecutor**: un mecanismo de avisos para un solo interesado, cuando el store
  ya avisa y ya tiene el dato.
- **Que la conexión sea la dueña de lo anotado**, para olvidarlo desde sus
  acciones: lo usa solo el ejecutor, y la conexión tendría estado que no lee.

### El pánico no olvida

Ningún acceso al pánico (el botón, el atajo o la caja) olvida lo anotado. Con
una tecla apretada durante el pánico, olvidar es peor que no olvidar: al
soltarla, su Nota Off saldría tal cual, a la nota original, y puede apagar una
nota que prendió otra tecla después del pánico (el escenario "Pánico con otra
tecla prendida"). Sin olvidar, sale un Nota Off a la nota que prendió, que el
pánico ya apagó. Además, para que la caja olvidara, el ejecutor tendría que
reconocer un tipo de nodo, que es lo que su regla evita.

Lo único que se pierde es que el pánico limpie una anotación vieja (ver
Risks).

### La misma nota dos veces: una cola, no limpiar todo

Cada Nota Off saca la anotación más vieja de su clave, y no todas. Se
compararon las dos:

- **Notas superpuestas** (un secuenciador, un arpegiador o dos controladores
  mezclados mandan On, On, Off, Off de la misma nota): con la cola, cada Off
  apaga lo suyo, igual que sin apareo. Limpiando todo, el primer Off corta las
  dos, y el segundo no encuentra nada y sale tal cual, a la nota original, que
  puede estar sonando por otra tecla.
- **Un Nota Off que se pierde, y después cambia el flujo**: con la cola, esa
  tecla queda corrida en uno hasta la próxima conexión (cada Off apaga lo de la
  pulsación anterior). Limpiando todo, se arregla sola en la próxima
  pulsación.
- **Un Nota Off que se pierde, sin cambios en el flujo**: con las dos da lo
  mismo, porque las anotaciones son iguales.

Se elige la cola: su caso malo necesita dos cosas raras juntas y afecta a una
sola tecla; el de limpiar todo pasa cada vez que entran notas superpuestas.

### `procesarMensaje` anota y aparea

`procesarMensaje` lleva la cuenta, y `recorrerElFlujo` decide qué sale:

- antes de recorrer, si el mensaje es un Nota Off, `procesarMensaje` saca su
  anotación siempre, se aparee o no, porque la tecla se soltó y si no la cola
  crecería. Lo que devuelve `sacarNotasPrendidas` es el `apareo`;
- `recorrerElFlujo(mensaje, apareo)` recorre el flujo, y si ningún camino
  llegó a una caja de fin y no hubo error, sale el `apareo` si lo hay, o el
  mensaje tal cual. Para esta función el `apareo` es un valor: no toca lo
  anotado, y la decisión queda al lado de la regla de "sale tal cual";
- después de recorrer, si el mensaje es un Nota On, `procesarMensaje` anota
  sus salidas (vacías si hubo error).

Así los dos cambios a lo anotado quedan juntos, uno antes y otro después del
recorrido, y se ve que sacar la anotación no depende de lo que pase en el
flujo. Devuelve `{ salidas, error, apareado }`, y `recibirMensaje` le pasa
`apareado` al log. Los tests llaman a `olvidarNotasPrendidas()` en
`beforeEach`, como los del log llaman a `limpiarLog()`.

`procesarMensaje` deja de ser una función sin estado: anota y saca. Sigue
sin enviar nada ni tocar el log, que es lo que importa para probarla.

Alternativas descartadas:

- **Aparear en `recibirMensaje`**: deja `procesarMensaje` sin estado, pero
  `recibirMensaje` envía y llama al log, así que el apareo quedaría sin tests;
  y separa la excepción de la regla que exceptúa.
- **Pasarle lo anotado por parámetro**: tendría sentido con un objeto; con
  estado del módulo, como `estado.flujo`, se usa directo.
- **Que `entregar` devuelva más información** (qué cajas de fin alcanzó, por
  ejemplo): no hace falta; alcanza con el `llegoAUnFin` que ya devuelve.

### En el log, "apareado" es un resultado más

`Resultado` suma `{ tipo: "apareado"; salidas: MensajeMidi[] }`, y
`agregarAlLog` y `clasificarSalidas` reciben si hubo apareo. La clasificación
pregunta primero por el error, después por "sin cambios" (una única salida
igual a la entrada, haya apareo o no), después por el apareo (antes de
"descartado", porque un Nota Off cuyo Nota On no prendió ninguna nota no lo
descartó el flujo) y después lo de siempre. Así el apareo se marca solo
cuando cambió lo que sale.

`ResultadoDelFlujo.apareado` sigue diciendo si lo que salió es el apareo,
aunque sea igual a la entrada: lo que se muestra lo decide el log.

`<panel-log>`:

- la fila de entrada lleva la clase `apareado`, con el fondo gris de las
  entradas que no salieron tal cual;
- la marca es el ícono `Link2` de Lucide, con el texto "Apareado con su Nota
  On", con la misma función `marca` que las demás;
- las sub-filas son las de siempre (`filaDeSalida`), con una clase más que
  cambia solo el fondo: `--fondo-apareo`, una variable nueva de
  `estilos/global.css`, en modo claro y oscuro, cercana a `--fondo-salida`
  pero distinguible. La letra sigue siendo `--letra-salida`, porque recorrer
  esa letra tiene que seguir siendo leer todo lo que salió.

Alternativas descartadas:

- **Un `apareado: boolean` aparte de `Resultado`**: el panel tendría que
  combinar dos campos para decidir qué dibujar, y un apareo vacío se
  confundiría con un descarte.
- **Marcar siempre el apareo, aunque salga igual que entró**: es el caso más
  común (un flujo que solo toca los Nota On sin cambiarles la nota), y
  llenaría el log de marcas y sub-filas que repiten la entrada sin decir nada
  nuevo: lo que sale es lo mismo que saldría sin apareo.

## Risks / Trade-offs

- [Que haya apareo depende de todo el flujo: una rama que lleva el Nota Off a
  un Emitir lo desactiva, y una octava armada así queda colgada] → Es la
  misma característica que ya tiene "sale tal cual". La marca del log muestra
  si un Nota Off salió apareado o por el flujo, y `nodos/LEEME.md` explica el
  caso con la forma bien armada.
- [**BREAKING**: un flujo que filtra solo los Nota On hacia un Descartar o un
  Convertir deja de dejar salir el Nota Off] → Es lo buscado (un pad que se
  convierte en CC no debe mandar un Nota Off suelto), y lo de antes se arma
  con `Filtrar (Nota Off) → Emitir`.
- [Manejar el Nota Off a mano y además alternar notas: si el Nota On pasó por
  Alternar y el Nota Off llega a un Emitir, no hay forma de apagar la nota
  correcta] → Límite aceptado en el diseño acordado; se documenta en la spec
  de Alternar cuando llegue.
- [Lo anotado de un Nota Off que nunca llega queda hasta la próxima conexión,
  y si el flujo cambió, esa tecla queda corrida en uno] → Necesita dos cosas
  raras juntas y afecta a una sola tecla; reconectar lo arregla. Ver "La
  misma nota dos veces".
- [Un `mensaje-midi` que ya venía en camino al desconectar puede procesarse
  después del olvido y dejar una anotación] → Mientras no hay conexión, el
  próximo aviso del store vuelve a olvidar, y `conectar` avisa antes de abrir
  los puertos (limpia el mensaje de error). En el peor caso, esa anotación
  aparea el Nota Off de esa misma tecla en la conexión siguiente, que es lo
  correcto.
- [`procesarMensaje` deja de ser una función sin estado, y AGENTS.md lo dice]
  → Se propone el ajuste al archivar, con la regla del ejecutor y la del
  estado que cambia con cada mensaje.
