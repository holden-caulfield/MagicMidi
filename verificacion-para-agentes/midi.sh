#!/usr/bin/env bash
# Manda y escucha mensajes MIDI por los puertos del sistema, como el IAC
# Driver. Compila midi.swift la primera vez o cuando cambia. Ver el LEEME.
#
# Uso: midi.sh listar
#      midi.sh mandar <destino> <byte en hex>...
#      midi.sh escuchar <origen> [segundos]
set -euo pipefail
aqui=$(cd "$(dirname "$0")" && pwd)
binario="$aqui/salida/midi"
if [[ ! -x $binario || $aqui/midi.swift -nt $binario ]]; then
  mkdir -p "$aqui/salida"
  swiftc -O "$aqui/midi.swift" -o "$binario" >&2
fi
exec "$binario" "$@"
