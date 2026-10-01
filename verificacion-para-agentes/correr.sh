#!/usr/bin/env bash
# Corre una prueba contra el servidor de desarrollo (que tiene que estar
# levantado en localhost:1420) y muestra el resultado en JSON. Ver el LEEME.
#
# Uso: correr.sh <prueba.js> [--motor webkit|chromium] [--oscuro] [--captura archivo.png]
set -euo pipefail
aqui=$(cd "$(dirname "$0")" && pwd)
prueba=$(cd "$(dirname "${1:?falta la prueba}")" && pwd)/$(basename "$1")
shift
motor=$([[ $(uname) == Darwin ]] && echo webkit || echo chromium)
captura=""
while (($#)); do
  case $1 in
    --motor) motor=$2; shift 2 ;;
    --oscuro) export OSCURO=1; shift ;;
    --captura) captura=$(cd "$(dirname "$2")" && pwd)/$(basename "$2"); shift 2 ;;
    *) echo "opción desconocida: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$aqui/salida"
combinada="$aqui/salida/prueba-$$.js"
cat "$aqui/ayudas/comun.js" "$prueba" > "$combinada"
trap 'rm -f "$combinada"' EXIT

if [[ $motor == webkit && $(uname) == Darwin ]]; then
  binario="$aqui/salida/webkit"
  if [[ ! -x $binario || $aqui/motores/webkit.swift -nt $binario ]]; then
    swiftc -O "$aqui/motores/webkit.swift" -o "$binario" >&2
  fi
  "$binario" "$combinada" ${captura:+"$captura"}
else
  MOTOR=$motor node "$aqui/motores/playwright.mjs" "$combinada" ${captura:+"$captura"}
fi
