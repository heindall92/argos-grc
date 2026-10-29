"""Graba sesiones de terminal reales y las convierte en clips del vídeo.

1. Los comandos se ejecutan de verdad dentro de `script --log-timing` (con teclear.sh, que escribe
   cada comando con un prompt y luego lo ejecuta).
2. La salida y sus tiempos se reproducen tal cual en xterm.js (como asciinema), sin red: xterm.js
   sale de node_modules y se incrusta en la página.
3. El grabador filma la reproducción y deja public/clips/<nombre>.mp4.

Las pausas largas se acortan a MAX_PAUSA para no aburrir; la salida no se toca.

Uso: python grabacion/grabar_terminal.py [nombre ...]
"""
from __future__ import annotations

import asyncio
import base64
import json
import shlex
import subprocess
import sys
from pathlib import Path

from grabador import TMP, Toma, abrir, async_playwright

AQUI = Path(__file__).resolve().parent
MAX_PAUSA = 1.8
REPO = AQUI.parent.parent.parent   # raíz de argos-grc

SESIONES = {
    "term_pruebas": (str(REPO), "yoandy@argos — batería de pruebas", [
        "./run_tests.sh",
    ]),
}


def capturar(nombre: str, carpeta: str, comandos: list[str]) -> dict:
    """Ejecuta de verdad los comandos dentro de `script --log-timing` y devuelve los pasos para reproducirlos."""
    destino = TMP / "term"
    destino.mkdir(parents=True, exist_ok=True)
    tm, out = destino / f"{nombre}.tm", destino / f"{nombre}.out"
    args = " ".join(shlex.quote(c) for c in comandos)
    subprocess.run(["script", "-q", f"--log-timing={tm}", f"--log-out={out}", "-c",
                    f"bash {shlex.quote(str(AQUI / 'terminal' / 'teclear.sh'))} {shlex.quote(carpeta)} {args}"],
                   check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    salida = out.read_bytes()
    if salida.startswith(b"Script started"):
        salida = salida[salida.index(b"\n") + 1:]
    pasos, pos = [], 0
    for linea in tm.read_text().splitlines():
        partes = linea.split()
        if partes and partes[0] in ("O", "I", "S", "H"):
            if partes[0] != "O":
                continue
            partes = partes[1:]
        espera, n = float(partes[0]), int(partes[1])
        trozo = salida[pos:pos + n]
        pos += n
        pasos.append([round(min(espera, MAX_PAUSA), 3), base64.b64encode(trozo).decode()])
    return {"pasos": pasos}


async def filmar(nombre: str, titulo: str, datos: dict) -> None:
    datos["titulo"] = titulo
    xterm = AQUI.parent / "node_modules" / "@xterm" / "xterm"
    html = (AQUI / "terminal" / "reproductor.html").read_text(encoding="utf-8")
    html = html.replace("/*XTERM_CSS*/", (xterm / "css" / "xterm.css").read_text(encoding="utf-8"))
    html = html.replace("/*XTERM_JS*/", (xterm / "lib" / "xterm.js").read_text(encoding="utf-8").replace("</script", "<\\/script"))
    html = html.replace("<script>\n  // DATOS", f"<script>const DATOS = {json.dumps(datos)};</script>\n<script>\n  // DATOS", 1)
    pagina = TMP / "term" / f"{nombre}.html"
    pagina.write_text(html, encoding="utf-8")
    async with async_playwright() as p:
        nav, page = await abrir(p)
        await page.goto(pagina.as_uri(), wait_until="load")
        await page.evaluate("document.getElementById('__cur') && (document.getElementById('__cur').style.opacity = 0)")
        await page.add_style_tag(content="#__cur{display:none!important}")
        t = Toma(page, nombre)
        await t.empezar()
        await page.wait_for_function("window.__fin === true", timeout=600000)
        await t.terminar(cola=1.5)
        await nav.close()


async def main(nombres: list[str]) -> None:
    for n in nombres or list(SESIONES):
        carpeta, titulo, comandos = SESIONES[n]
        print(f"{n}: ejecutando…", flush=True)
        datos = capturar(n, carpeta, comandos)
        await filmar(n, titulo, datos)


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:]))
