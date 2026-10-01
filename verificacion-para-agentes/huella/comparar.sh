#!/usr/bin/env bash
# Saca la huella de la interfaz que está sirviendo el servidor de desarrollo,
# en modo claro y oscuro, y la guarda como salida/<nombre>-claro.json y
# salida/<nombre>-oscuro.json. Ver el LEEME.
#
# Uso: huella/comparar.sh <nombre> [--motor webkit|chromium]
set -euo pipefail
aqui=$(cd "$(dirname "$0")" && pwd)
nombre=${1:?falta el nombre}
shift
"$aqui/../correr.sh" "$aqui/huella.js" "$@" > "$aqui/../salida/$nombre-claro.json"
"$aqui/../correr.sh" "$aqui/huella.js" "$@" --oscuro > "$aqui/../salida/$nombre-oscuro.json"
echo "huella guardada: salida/$nombre-claro.json y salida/$nombre-oscuro.json"
