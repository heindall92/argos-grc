"""Banda sonora del tráiler, generada por código y sin derechos de terceros.

A diferencia del vídeo largo, el tráiler no tiene voz: la música lleva el ritmo.
Va a 120 BPM (un pulso cada 0,5 s), así que todos los cortes de escena caen en un pulso.
Las escenas se leen de src/Trailer.jsx (const E y DURACION), de modo que si cambia el
montaje, la música se adapta sola.

Capas: pad en La menor (Am-F-C-G, un acorde por compás), arpegio desde el planteamiento,
bombo y bajo desde la primera toma de la app, charles a contratiempo en la parte central,
golpes graves en los cambios de bloque, barridos de ruido que anuncian cada golpe y un
cierre con el pad solo y fundido.

Uso:  python3 musica.py public/musica.wav
Requiere numpy, scipy y soundfile; ffmpeg para normalizar a -14 LUFS.
"""
from __future__ import annotations

import json
import pathlib
import re
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter

SR = 48000
FPS = 30
BPM = 120
PULSO = 60 / BPM          # 0,5 s
COMPAS = 4 * PULSO        # 2 s
AQUI = pathlib.Path(__file__).resolve().parent

# Am – F – C – G, en notas MIDI (fundamental primero)
ACORDES = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]


def escenas() -> tuple[dict[str, tuple[float, float]], float]:
    """Lee los tiempos de escena de Trailer.jsx para que música e imagen no se desincronicen."""
    jsx = (AQUI / "src" / "Trailer.jsx").read_text(encoding="utf8")
    bloque = re.search(r"const E = \{([^}]*)\}", jsx).group(1)
    e = {k: (int(a) / FPS, int(b) / FPS) for k, a, b in re.findall(r"(\w+):\s*\[(\d+),\s*(\d+)\]", bloque)}
    total = int(re.search(r"DURACION = (\d+)", jsx).group(1)) / FPS
    return e, total


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def filtro(x: np.ndarray, corte: float, tipo: str = "low") -> np.ndarray:
    b, a = butter(2, corte / (SR / 2), btype=tipo)
    return lfilter(b, a, x)


def suma(dest: np.ndarray, señal: np.ndarray, t0: float, gan: float = 1.0) -> None:
    i = int(t0 * SR)
    if i >= len(dest):
        return
    n = min(len(señal), len(dest) - i)
    dest[i:i + n] += gan * señal[:n]


def tramo(t: np.ndarray, a: float, b: float, rampa: float = 0.02) -> np.ndarray:
    """1 entre a y b, con rampas cortas para no producir clics."""
    return np.clip((t - a) / rampa, 0, 1) * np.clip((b - t) / rampa, 0, 1)


def acorde_en(t0: float) -> list[int]:
    return ACORDES[int(t0 // COMPAS) % len(ACORDES)]


# --- Instrumentos -------------------------------------------------------------

def pad(total: float, rng: np.random.Generator) -> np.ndarray:
    n = int(total * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for c in range(int(np.ceil(total / COMPAS))):
        t0 = c * COMPAS
        dur = COMPAS + 1.0  # se solapa 1 s con el siguiente acorde
        m = int(dur * SR)
        tt = np.arange(m) / SR
        v = np.zeros(m)
        for nota in acorde_en(t0):
            for det in (-0.08, 0.0, 0.08):
                f = hz(nota) * 2 ** (det / 12)
                ph = rng.uniform(0, 2 * np.pi)
                v += np.sin(2 * np.pi * f * tt + ph) + 0.3 * np.sin(4 * np.pi * f * tt + ph)
        env = np.minimum(1, tt / 0.6) * np.clip((dur - tt) / 1.0, 0, 1)
        suma(s, v * env, t0)
    return filtro(s, 1800) / 9


def pluck(nota: int, dur: float = 0.45) -> np.ndarray:
    tt = np.arange(int(dur * SR)) / SR
    f = hz(nota)
    v = np.sign(np.sin(2 * np.pi * f * tt)) * 0.4 + np.sin(2 * np.pi * f * tt)
    v = filtro(v, 2600) * np.exp(-tt * 9) * np.minimum(1, tt / 0.003)
    return v


def bombo() -> np.ndarray:
    tt = np.arange(int(0.42 * SR)) / SR
    f = 48 + 110 * np.exp(-tt * 28)            # caída de tono: el «tum»
    fase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(fase) * np.exp(-tt * 7.5) * np.minimum(1, tt / 0.002)


def charles(rng: np.random.Generator) -> np.ndarray:
    tt = np.arange(int(0.07 * SR)) / SR
    return filtro(rng.standard_normal(len(tt)), 7000, "high") * np.exp(-tt * 60)


def bajo(nota: int, dur: float) -> np.ndarray:
    tt = np.arange(int(dur * SR)) / SR
    f = hz(nota - 12)
    v = np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)
    # «Bombeo»: entra después del bombo, como si el bombo lo comprimiera
    return v * np.minimum(1, tt / 0.09) * np.clip((dur - tt) / 0.03, 0, 1)


def golpe(rng: np.random.Generator) -> np.ndarray:
    tt = np.arange(int(2.6 * SR)) / SR
    f = 32 + 70 * np.exp(-tt * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.6)
    ruido = filtro(rng.standard_normal(len(tt)), 1800) * np.exp(-tt * 5) * 0.5
    return (sub + ruido) * np.minimum(1, tt / 0.002)


def barrido(dur: float, rng: np.random.Generator) -> np.ndarray:
    """Ruido que sube de brillo y volumen durante dur segundos y acaba justo en el golpe."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    ruido = rng.standard_normal(n)
    grave = filtro(ruido, 600)
    agudo = filtro(ruido, 5000)
    k = (tt / dur) ** 2
    return (grave * (1 - k) + agudo * k) * k * 0.6


def campana(nota: int) -> np.ndarray:
    tt = np.arange(int(3.5 * SR)) / SR
    f = hz(nota)
    v = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 3)
    return v * np.exp(-tt * 1.3) * np.minimum(1, tt / 0.004)


# --- Arreglo ------------------------------------------------------------------

def generar() -> np.ndarray:
    e, total = escenas()
    rng = np.random.default_rng(2211)
    n = int(total * SR)
    t = np.arange(n) / SR

    ini = {k: v[0] for k, v in e.items()}
    planteamiento = ini["problema"]
    tomas = ini["caso"]
    centro = ini["fallo"]
    subida = ini["cifras"]
    cierre = ini["cierre"]

    # Pad: crece durante el logo, se mantiene y queda solo en el cierre
    p = pad(total, rng)
    vol_pad = np.interp(t, [0, planteamiento, cierre, total - 4, total], [0.25, 0.8, 0.9, 0.9, 0])
    mezcla_l = p * vol_pad
    mezcla_r = p * vol_pad

    # Arpegio a corcheas, alternando canales para dar anchura
    arp_l = np.zeros(n)
    arp_r = np.zeros(n)
    k = 0
    tp = planteamiento
    while tp < cierre - 1e-6:
        notas = acorde_en(tp)
        nota = (notas + [notas[0] + 12])[k % 4] + 12
        suma(arp_l if k % 2 == 0 else arp_r, pluck(nota), tp, 1.0 if k % 2 == 0 else 0.8)
        suma(arp_r if k % 2 == 0 else arp_l, pluck(nota), tp, 0.35)
        tp += PULSO / 2
        k += 1
    vol_arp = np.interp(t, [planteamiento, tomas, subida, cierre], [0.35, 0.45, 0.6, 0.6]) * tramo(t, planteamiento, cierre + 0.4, 0.3)
    mezcla_l += arp_l * vol_arp * 0.32
    mezcla_r += arp_r * vol_arp * 0.32

    # Bombo y bajo: medio tiempo en las tomas, a negras desde las cifras
    ritmo = np.zeros(n)
    graves = np.zeros(n)
    tb = tomas
    while tb < cierre - 1e-6:
        pulso_n = round((tb - tomas) / PULSO)
        lleno = tb >= subida - 1e-6
        if lleno or pulso_n % 2 == 0:
            suma(ritmo, bombo(), tb, 1.0 if lleno else 0.85)
        suma(graves, bajo(acorde_en(tb)[0], PULSO), tb)
        tb += PULSO
    # Un compás de respiro (sin bombo) antes de la subida, para que el golpe destaque
    respiro = tramo(t, subida - COMPAS, subida, 0.01)
    ritmo *= 1 - respiro
    mezcla_l += ritmo * 0.55 + graves * 0.22
    mezcla_r += ritmo * 0.55 + graves * 0.22

    # Charles a contratiempo en la parte central
    ch = np.zeros(n)
    th = centro + PULSO / 2
    while th < cierre - 1e-6:
        suma(ch, charles(rng), th)
        th += PULSO
    ch *= 1 - respiro
    mezcla_l += ch * 0.10
    mezcla_r += ch * 0.13

    # Barridos que anuncian cada bloque y golpes al entrar
    for momento, dur in ((tomas, 2.0), (subida, COMPAS), (cierre, 2.0)):
        b = barrido(dur, rng)
        suma(mezcla_l, b, momento - dur, 0.30)
        suma(mezcla_r, b, momento - dur, 0.30)
    for momento, g in ((0.0, 0.5), (tomas, 0.75), (subida, 0.85), (cierre, 0.9)):
        gl = golpe(rng)
        suma(mezcla_l, gl, momento, g)
        suma(mezcla_r, gl, momento, g)

    # Cierre: campanas sobre La menor
    for i, nota in enumerate((81, 76, 72, 69)):
        suma(mezcla_l if i % 2 == 0 else mezcla_r, campana(nota), cierre + 0.5 + i * PULSO * 2, 0.18)
        suma(mezcla_r if i % 2 == 0 else mezcla_l, campana(nota), cierre + 0.5 + i * PULSO * 2, 0.08)

    est = np.stack([mezcla_l, mezcla_r], axis=1)
    # Fundido final y saturación suave para que nada recorte
    est *= np.interp(t, [total - 4, total], [1, 0], left=1)[:, None]
    est = np.tanh(est * 1.2) / np.tanh(1.2)
    return (est / np.max(np.abs(est)) * 0.9).astype(np.float32)


def main() -> None:
    salida = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else AQUI / "public" / "musica.wav")
    salida.parent.mkdir(parents=True, exist_ok=True)
    audio = generar()
    with tempfile.TemporaryDirectory() as tmp:
        crudo = pathlib.Path(tmp) / "crudo.wav"
        sf.write(crudo, audio, SR)
        # -14 LUFS integrados y pico real de -1 dBTP, el nivel habitual de YouTube y redes.
        # Dos pasadas: la primera mide y la segunda aplica una ganancia lineal (sin bombeo).
        objetivo = "I=-14:TP=-1:LRA=11"
        medida = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(crudo), "-af",
                                 f"loudnorm={objetivo}:print_format=json", "-f", "null", "-"],
                                capture_output=True, text=True, check=True).stderr
        m = json.loads(medida[medida.rindex("{"):medida.rindex("}") + 1])
        segunda = (f"loudnorm={objetivo}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
                   f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(crudo), "-af", segunda,
                        "-ar", str(SR), str(salida)], check=True)
    print(f"Música: {len(audio) / SR:.1f} s → {salida}")


if __name__ == "__main__":
    main()
