"""Utilidades compartidas por el pipeline de voz y montaje del vídeo."""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
GUION = RAIZ / "guion" / "escenas.json"
PRONUNCIACION = RAIZ / "pipeline" / "pronunciacion.json"
BUILD = RAIZ / "build"
PUBLIC = RAIZ / "public"
GENERADO = RAIZ / "src" / "generated"
SALIDA = RAIZ / "out"


def cargar_guion() -> dict:
    return json.loads(GUION.read_text(encoding="utf-8"))


def _reemplazos() -> list[tuple[re.Pattern, str]]:
    datos = json.loads(PRONUNCIACION.read_text(encoding="utf-8"))["reemplazos"]
    # Los términos largos primero, para que «React 19» gane a «React».
    pares = sorted(datos.items(), key=lambda kv: -len(kv[0]))
    salida = []
    for original, dicho in pares:
        patron = re.compile(r"(?<![\w-])" + re.escape(original) + r"(?![\w-])")
        salida.append((patron, dicho))
    return salida


_REEMPLAZOS: list | None = None


def texto_para_voz(texto: str) -> str:
    """Texto que se envía al sintetizador: aplica el diccionario de pronunciación."""
    global _REEMPLAZOS
    if _REEMPLAZOS is None:
        _REEMPLAZOS = _reemplazos()
    for patron, dicho in _REEMPLAZOS:
        texto = patron.sub(dicho, texto)
    return texto.replace("«", "").replace("»", "")


def clave(*partes: str) -> str:
    return hashlib.sha256("\x1f".join(partes).encode("utf-8")).hexdigest()[:16]


def duracion(ruta: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(ruta)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)
