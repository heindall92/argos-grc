"""Música de fondo generada por código: un pad ambiental en La menor, sin derechos de autor.

Así el vídeo no depende de pistas de terceros (ni de su licencia, ni de que YouTube marque
el audio). Es deliberadamente discreta: acordes lentos, un bajo suave y un brillo agudo
que respira. Se mezcla muy por debajo de la voz y se atenúa cuando hay locución.

Uso:  python pipeline/musica.py <segundos> <salida.wav>
"""
from __future__ import annotations

import sys

import numpy as np
import soundfile as sf

SR = 48000

# Progresión Am – F – C – G (notas MIDI); cada acorde dura 8 s.
ACORDES = [
    [57, 60, 64, 69],
    [53, 57, 60, 65],
    [48, 55, 60, 64],
    [55, 59, 62, 67],
]
DUR_ACORDE = 8.0


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def paso_bajo(x: np.ndarray, corte: float, sr: int = SR) -> np.ndarray:
    """Filtro paso bajo Butterworth de 2.º orden (12 dB/oct)."""
    from scipy.signal import butter, lfilter

    b, a = butter(2, corte / (sr / 2))
    return lfilter(b, a, x)


def acorde(notas: list[int], dur: float, rng: np.random.Generator) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for nota in notas:
        f = hz(nota)
        for detune in (-0.07, 0.0, 0.07):  # tres osciladores ligeramente desafinados: coro
            fase = rng.uniform(0, 2 * np.pi)
            ff = f * 2 ** (detune / 12)
            # Diente de sierra suave (pocos armónicos) para que el filtro tenga material.
            for k, amp in ((1, 1.0), (2, 0.35), (3, 0.15)):
                s += amp * np.sin(2 * np.pi * ff * k * t + fase * k)
    # Bajo una octava por debajo de la fundamental.
    s += 1.6 * np.sin(2 * np.pi * hz(notas[0] - 12) * t)
    # Envolvente con ataque y caída largos para encadenar acordes sin cortes.
    env = np.minimum(1, t / 2.5) * np.minimum(1, (dur - t) / 2.5).clip(0)
    return s * env


def generar(segundos: float) -> np.ndarray:
    rng = np.random.default_rng(1720)
    total = int(segundos * SR) + SR
    mezcla = np.zeros(total)
    paso = int((DUR_ACORDE - 2.5) * SR)  # solapamiento de 2,5 s entre acordes
    cache = {}
    i = 0
    pos = 0
    while pos < total:
        idx = i % len(ACORDES)
        if idx not in cache:
            cache[idx] = acorde(ACORDES[idx], DUR_ACORDE, rng)
        bloque = cache[idx]
        fin = min(total, pos + len(bloque))
        mezcla[pos:fin] += bloque[: fin - pos]
        pos += paso
        i += 1
    # Mezcla entre un filtro abierto y otro cerrado que oscila despacio: el pad «respira».
    t = np.arange(total) / SR
    abierto = paso_bajo(mezcla, 1400.0)
    cerrado = paso_bajo(mezcla, 500.0)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * t / 41.0)
    mezcla = cerrado * (1 - lfo) + abierto * lfo
    # Brillo agudo: senoidales en La 5 y Mi 6 con trémolo lento.
    brillo = 0.05 * (np.sin(2 * np.pi * hz(81) * t) + 0.6 * np.sin(2 * np.pi * hz(88) * t))
    brillo *= 0.5 + 0.5 * np.sin(2 * np.pi * t / 23.0)
    mezcla = mezcla / np.max(np.abs(mezcla)) * 0.8 + brillo
    # Eco estéreo sencillo para dar espacio.
    izq = mezcla.copy()
    der = mezcla.copy()
    for retardo, g in ((0.31, 0.35), (0.62, 0.2), (0.93, 0.1)):
        d = int(retardo * SR)
        izq[d:] += g * mezcla[:-d]
        der[int(d * 1.13):] += g * mezcla[: -int(d * 1.13)]
    est = np.stack([izq, der], axis=1)[: int(segundos * SR)]
    # Entrada y salida con fundido.
    fade = int(3 * SR)
    est[:fade] *= np.linspace(0, 1, fade)[:, None]
    est[-fade:] *= np.linspace(1, 0, fade)[:, None]
    return (est / np.max(np.abs(est)) * 0.7).astype(np.float32)


if __name__ == "__main__":
    segundos = float(sys.argv[1])
    sf.write(sys.argv[2], generar(segundos), SR)
    print(f"Música: {segundos:.0f} s → {sys.argv[2]}")
