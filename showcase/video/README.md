# Vídeo de ARGOS · NicaHackFest 2026

Vídeo de presentación de ARGOS (**17:46**, 1920×1080) para NicaHackFest 2026: qué problema resuelve, un recorrido por la app real, la parte nueva de la 1.4 (Aprender, laboratorio y taller), la comunidad, cómo se prueba y sus límites. Sirve como respaldo de la charla en directo y como vídeo para YouTube.

Todo se genera desde este directorio, sin servicios externos:

| Pieza | Herramienta | Dónde |
|---|---|---|
| Guion (33 escenas, 7 bloques) | JSON | `guion/escenas.json` |
| Voz en off | [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) (Apache 2.0), voz `em_alex`, en local | `pipeline/voz_kokoro.py` |
| Música | Sintetizada por código, sin derechos de terceros | `pipeline/musica.py` |
| Tomas de la app | Playwright sobre `dist/index.html` con `?demo=showcase` | `grabacion/rodaje.py` |
| Toma de la terminal | `./run_tests.sh` ejecutado de verdad y reproducido en xterm.js | `grabacion/grabar_terminal.py` |
| Montaje | Línea de tiempo marcada por la voz, -16 LUFS | `pipeline/montar.py` |
| Composición y render | [Remotion](https://www.remotion.dev/) 4 | `src/` |

## Qué hay en pantalla

- **Grabaciones reales**: 19 tomas de ARGOS 1.4.0 (escritorio a 2880×1620 y móvil a 390×844) y la batería de pruebas real en la terminal. Nada es una maqueta: la cámara solo se acerca a la zona donde se pulsa, a partir de las marcas que deja el grabador.
- **Diapositivas** con la identidad de ARGOS: tema oscuro, Geist, acento cian, línea iridiscente del logo e iconos Lucide. Sin anillos ni patrones (los anillos son la firma de Rosetta).
- **Movimiento**: muelles críticamente amortiguados (sin rebote), entrada con desenfoque y escala de 0,97 a 1, fundidos de 1/3 s entre escenas.
- **Cabecera** con el bloque actual, **barra de progreso** por bloques y **subtítulos quemados** (desactivables).

## Salidas (`out/`, fuera de git)

| Archivo | Para qué |
|---|---|
| `argos_nicahackfest.mp4` | El vídeo: H.264 CRF 20, AAC 192 kb/s, 30 fps |
| `subtitulos.srt` | Subtítulos para YouTube (354 entradas) |
| `capitulos_youtube.txt` | Capítulos para pegar en la descripción |
| `CAPITULOS.md` | Minuto de cada escena y de dónde sale su imagen |

## Cómo regenerarlo

Requisitos: Node 20+, Python 3.11+, ffmpeg, `script` (util-linux) y `espeak-ng` del sistema (lo usa Kokoro para la fonética).

```bash
cd showcase/video
npm ci
python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt && playwright install chromium

# 1. Voz (descarga los modelos de Kokoro en build/modelos/ la primera vez; cachea por frase)
python pipeline/voz_kokoro.py

# 2. Tomas reales (desde la raíz del repo: node app/build.js antes, para que dist/ esté al día)
python grabacion/rodaje.py            # las 19 tomas de la app; o solo algunas: rodaje.py sala taller
python grabacion/grabar_terminal.py   # ./run_tests.sh de verdad (unos 5 min)

# 3. Montaje: audio, manifiesto, subtítulos y capítulos
python pipeline/indice_clips.py
python pipeline/montar.py --voz kokoro

# 4. Revisión: un fotograma por escena y una hoja con todos (build/hoja_escenas.png)
python pipeline/fotos.py

# 5. Render por tramos (se puede cortar y relanzar: los tramos hechos no se repiten)
#    Antes, copias de las tomas a 1080p con un fotograma clave cada 10, para que Remotion salte rápido
mkdir -p public/clips_1080
for f in public/clips/*.mp4; do ffmpeg -y -i "$f" -vf scale=1920:-2:flags=lanczos -c:v libx264 -preset fast -crf 14 -g 10 -pix_fmt yuv420p "public/clips_1080/$(basename "$f")"; done
pipeline/render.sh                    # → out/argos_nicahackfest.mp4 (unos 90 min con 4 núcleos)
```

- Sin subtítulos quemados (para subir el `.srt` aparte): `pipeline/render.sh --sin-subtitulos`.
- Si Remotion no puede descargar su Chrome, usa uno local: `REMOTION_CHROME=/ruta/chrome-headless-shell pipeline/render.sh`.
- `npm run studio` abre Remotion Studio con el vídeo completo y cada toma por separado.

## Cambiar algo

- **Una frase**: edítala en `guion/escenas.json`, vuelve a ejecutar `voz_kokoro.py` (solo resintetiza esa frase) y `montar.py`. La imagen sigue a la voz sola: las animaciones se anclan a frases (`"en": 2.5` = mitad de la tercera frase), no a segundos.
- **Pronunciación**: `pipeline/pronunciacion.json` (por ejemplo, «ENS» se lee «e ene ese» e «ISO/IEC 27001», «iso iec veintisiete mil uno»).
- **Con tu propia voz**: graba `voz_propia/<id_escena>.wav` (una por escena, leyendo sus frases) y monta con `python pipeline/montar.py --voz propia`.
- **Una toma**: cada una es una función de `grabacion/rodaje.py`. Si la toma dura más que su locución, se acelera hasta 2×; si dura menos, se congela el último fotograma.
- **Avance rápido** de un tramo largo: `grabacion/acelerar.json`, `{"toma": [[inicio_s, fin_s, factor]]}`.

## Contenido y propiedad intelectual

- Las organizaciones de los casos son ficticias. El ENS se cita del BOE (Real Decreto 311/2022). De la ISO/IEC 27001 solo se dan números de cláusula o control, nunca su texto.
- ARGOS no es una certificación y es independiente de ISO, IEC, CCN y de cualquier entidad de certificación. El vídeo lo dice en la escena «Límites».
- Tipografías Geist y Geist Mono (SIL OFL 1.1) autoalojadas con @fontsource. Iconos Lucide (ISC).
