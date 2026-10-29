"""Fotogramas de revisión: uno por escena (o de las indicadas) en build/fotos/, y una hoja con todos.

Empaqueta el proyecto una vez y saca cada fotograma del paquete, así no se reempaqueta por escena.
Uso: python pipeline/fotos.py [--en 0.6] [prefijo_de_escena ...]
"""
import json
import subprocess
import sys

from comun import BUILD, GENERADO, RAIZ, ffmpeg

NPX = "npx.cmd" if sys.platform == "win32" else "npx"
args = sys.argv[1:]
en = 0.6
if "--en" in args:
    i = args.index("--en")
    en = float(args[i + 1])
    del args[i:i + 2]
m = json.loads((GENERADO / "manifest.json").read_text(encoding="utf-8"))
dest = BUILD / "fotos"
dest.mkdir(parents=True, exist_ok=True)
paquete = BUILD / "paquete"
subprocess.run([NPX, "remotion", "bundle", "src/index.ts", f"--out-dir={paquete}", "--log=error"], cwd=RAIZ, check=True)
hechas = []
for e in m["escenas"]:
    if args and not any(e["id"].startswith(p) for p in args):
        continue
    f = e["inicio"] + int(e["duracion"] * en)
    salida = dest / f"{e['id']}.png"
    subprocess.run([NPX, "remotion", "still", str(paquete), "ARGOS", str(salida), f"--frame={f}", "--scale=0.5", "--log=error"], cwd=RAIZ, check=True)
    hechas.append(salida)
    print(e["id"], f, flush=True)
if len(hechas) > 1:
    entradas = []
    for h in hechas:
        entradas += ["-i", str(h)]
    columnas = 4
    filas = -(-len(hechas) // columnas)
    disposicion = "|".join(f"{(k % columnas) * 960}_{(k // columnas) * 540}" for k in range(len(hechas)))
    ffmpeg(*entradas, "-filter_complex", f"xstack=inputs={len(hechas)}:layout={disposicion}:fill=black,scale=1920:-1", "-frames:v", "1",
           str(BUILD / "hoja_escenas.png"))
    print(f"Hoja: {BUILD / 'hoja_escenas.png'} ({filas} filas)")
