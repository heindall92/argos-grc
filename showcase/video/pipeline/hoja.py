"""Hoja de contactos de un clip (16 fotogramas repartidos) para revisarlo de un vistazo."""
import sys

from comun import BUILD, PUBLIC, duracion, ffmpeg

for nombre in sys.argv[1:]:
    clip = PUBLIC / "clips" / f"{nombre}.mp4"
    d = duracion(clip)
    ffmpeg("-i", str(clip), "-vf", f"fps=16/{d:.2f},scale=720:-1,tile=4x4", "-frames:v", "1",
           str(BUILD / f"hoja_{nombre}.png"))
    print(nombre, f"{d:.1f} s")
