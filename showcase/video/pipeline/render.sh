#!/usr/bin/env bash
# Render final por tramos: cada tramo de 3000 fotogramas (100 s) se guarda en build/tramos/ y no se repite
# si ya existe, así que un corte (o un límite de tiempo) solo obliga a relanzar el script. Después une los
# tramos sin recodificar y añade la mezcla de audio entera, sin saltos entre tramos.
#
# Uso: pipeline/render.sh [--sin-subtitulos]
# Necesita: npm ci, montar.py hecho y las copias public/clips_1080/ (ver README).
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "${1:-}" == "--sin-subtitulos" ]]; then
  SUBS=false; SALIDA=out/argos_nicahackfest_sin_subtitulos.mp4; DIR=build/tramos/sin
else
  SUBS=true; SALIDA=out/argos_nicahackfest.mp4; DIR=build/tramos/con
fi
TRAMO=3000
mkdir -p "$DIR"
TOTAL=$(node -p "require('./src/generated/manifest.json').duracion")
npx remotion bundle src/index.ts --out-dir=build/paquete --log=error
for ((ini = 0; ini < TOTAL; ini += TRAMO)); do
  fin=$((ini + TRAMO - 1))
  if ((fin >= TOTAL)); then fin=$((TOTAL - 1)); fi
  f=$(printf '%s/%06d.mp4' "$DIR" "$ini")
  [[ -s "$f" ]] && continue
  echo "Tramo $ini-$fin de $TOTAL"
  npx remotion render build/paquete ARGOS "$f.tmp.mp4" --props="{\"dir\":\"clips_1080\",\"subtitulos\":$SUBS}" \
    --frames="$ini-$fin" --muted --concurrency=4 --log=error
  mv "$f.tmp.mp4" "$f"
done
ls "$DIR"/*.mp4 | grep -v '\.tmp\.' | sed "s|^|file '$PWD/|; s|$|'|" > "$DIR/lista.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$DIR/lista.txt" -i public/generated/audio.wav -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$SALIDA"
echo "Listo: $SALIDA"
