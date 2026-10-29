"""Reúne los JSON de marcas de public/clips/ en src/generated/clips.json (lo importa Remotion)."""
import json

from comun import GENERADO, PUBLIC, RAIZ

acelerar = json.loads((RAIZ / "grabacion" / "acelerar.json").read_text(encoding="utf-8"))
clips = {}
for f in sorted((PUBLIC / "clips").glob("*.json")):
    if (PUBLIC / "clips" / f"{f.stem}.mp4").exists():
        clips[f.stem] = json.loads(f.read_text(encoding="utf-8"))
        if f.stem in acelerar:
            clips[f.stem]["rapidos"] = acelerar[f.stem]
GENERADO.mkdir(parents=True, exist_ok=True)
(GENERADO / "clips.json").write_text(json.dumps(clips, ensure_ascii=False), encoding="utf-8")
print(f"{len(clips)} clips: {', '.join(clips)}")
