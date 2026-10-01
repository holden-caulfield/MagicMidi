"""Compara dos huellas sacadas con comparar.sh, en modo claro y oscuro.

Uso: python3 huella/diferencias.py <antes> <despues>

Los elementos se comparan como conjunto, sin importar el orden (entrar en un
shadow root cambia el orden del recorrido) y sin el texto de los elementos
(el texto que está adentro de un shadow root no aparece en el textContent
del que lo contiene). Los <section> se ignoran por lo mismo.
"""

import json
import sys
from collections import Counter
from pathlib import Path

salida = Path(__file__).resolve().parent.parent / "salida"


def sin_texto(linea):
    etiqueta, resto = linea.split(" @", 1)
    return etiqueta.split(' "')[0] + " @" + resto


def leer(nombre, modo):
    datos = json.loads((salida / f"{nombre}-{modo}.json").read_text())
    if "resultado" not in datos:
        sys.exit(f"{nombre}-{modo}.json no tiene resultado: {datos}")
    return datos["resultado"]


antes_nombre, despues_nombre = sys.argv[1], sys.argv[2]
todo_igual = True
for modo in ["claro", "oscuro"]:
    antes, despues = leer(antes_nombre, modo), leer(despues_nombre, modo)
    for parte in antes:
        if parte.startswith("valores"):
            igual = antes[parte] == despues.get(parte)
            print(f"{modo} · {parte}: {'igual' if igual else f'distinto: {despues.get(parte)}'}")
            todo_igual &= igual
            continue
        a = Counter(map(sin_texto, antes[parte]))
        b = Counter(map(sin_texto, despues.get(parte, [])))
        faltan = [l for l in (a - b).elements() if not l.startswith("section ")]
        sobran = [l for l in (b - a).elements() if not l.startswith("section ")]
        print(f"{modo} · {parte}: {'igual' if not faltan and not sobran else f'{len(faltan) + len(sobran)} diferencias'}")
        for l in faltan[:8]:
            print("    -", l)
        for l in sobran[:8]:
            print("    +", l)
        todo_igual &= not faltan and not sobran
sys.exit(0 if todo_igual else 1)
