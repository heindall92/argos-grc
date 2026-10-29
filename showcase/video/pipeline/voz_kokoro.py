"""Sintetiza la locución del guion frase a frase con Kokoro (open source, Apache 2.0).

Cada frase se guarda en build/voz/kokoro/<clave>.wav y se reutiliza mientras no cambie
su texto, la voz o la velocidad: editar una frase del guion solo resintetiza esa frase.

Uso:  python pipeline/voz_kokoro.py [--voz em_alex] [--velocidad 0.96]
Modelos: kokoro-v1.0.onnx y voices-v1.0.bin en build/modelos/ (los descarga si faltan).
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

import soundfile as sf

from comun import BUILD, cargar_guion, clave, texto_para_voz

MODELOS = BUILD / "modelos"
URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"


def asegurar_modelos() -> None:
    MODELOS.mkdir(parents=True, exist_ok=True)
    for nombre in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
        destino = MODELOS / nombre
        if not destino.exists():
            print(f"Descargando {nombre}…", flush=True)
            urllib.request.urlretrieve(URL + nombre, destino)


def config_espeak() -> dict:
    """espeak-ng del sistema si está instalado (Linux: apt install espeak-ng-data libespeak-ng1).

    La librería que trae espeakng-loader en algunas plataformas busca sus datos en la ruta donde se
    compiló y falla con «phontab: No such file»; con la del sistema no pasa. En Windows y macOS se
    usa la del paquete, que sí funciona.
    """
    import glob

    from kokoro_onnx import EspeakConfig

    for lib in glob.glob("/usr/lib/*/libespeak-ng.so.1") + glob.glob("/usr/lib/libespeak-ng.so.1"):
        datos = str(Path(lib).parent / "espeak-ng-data")
        if Path(datos, "phontab").exists():
            return {"espeak_config": EspeakConfig(lib_path=lib, data_path=datos)}
    return {}


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--voz", default="em_alex", help="em_alex, em_santa (masculinas) o ef_dora (femenina)")
    p.add_argument("--velocidad", type=float, default=0.96, help="0,96 deja la locución algo más pausada que la de serie")
    a = p.parse_args()

    asegurar_modelos()
    from kokoro_onnx import Kokoro

    k = Kokoro(str(MODELOS / "kokoro-v1.0.onnx"), str(MODELOS / "voices-v1.0.bin"), **config_espeak())
    destino = BUILD / "voz" / "kokoro"
    destino.mkdir(parents=True, exist_ok=True)

    guion = cargar_guion()
    indice = {}
    total = sum(len(e["frases"]) for e in guion["escenas"])
    hechas = nuevas = 0
    t0 = time.time()
    for escena in guion["escenas"]:
        for i, frase in enumerate(escena["frases"]):
            dicho = texto_para_voz(frase)
            c = clave(dicho, a.voz, str(a.velocidad))
            wav = destino / f"{c}.wav"
            if not wav.exists():
                muestras, sr = k.create(dicho, voice=a.voz, speed=a.velocidad, lang="es")
                sf.write(wav, muestras, sr)
                nuevas += 1
            indice[f"{escena['id']}#{i}"] = str(wav.relative_to(BUILD))
            hechas += 1
            print(f"\r[{hechas}/{total}] {escena['id']}", end="", flush=True)
    print(f"\n{nuevas} frases nuevas en {time.time() - t0:.0f} s")
    (BUILD / "voz" / "indice_kokoro.json").write_text(json.dumps(indice, indent=1), encoding="utf-8")


if __name__ == "__main__":
    sys.exit(main())
