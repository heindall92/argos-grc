# Materiales de la charla · NicaHackFest 2026

Todo lo necesario para presentar ARGOS el domingo 22 de noviembre de 2026 en NicaBuilds // Project Showcase. El plan y su estado están en [ROADMAP_SHOWCASE.md](../ROADMAP_SHOWCASE.md).

| Material | Dónde | Cómo se regenera |
|---|---|---|
| Guion cronometrado de 40 minutos | [guion.md](guion.md) | Se edita a mano |
| Diapositivas (10, 1920×1080) | [diapositivas/index.html](diapositivas/index.html) · copia en [PDF](diapositivas/diapositivas.pdf) | `python3 tools/diapositivas.py --pdf` |
| Códigos QR del taller y de ARGOS | `diapositivas/qr-taller.svg`, `diapositivas/qr-argos.svg` | Con `segno`, solo si cambia la URL (abajo) |
| Vídeo de respaldo de la demo (≈1:35) | `showcase/grabaciones/demo-completa.mp4` (fuera de git) | `python3 tools/grabar-demo.py` |
| Tráiler de 66 s (horizontal y vertical) | `showcase/trailer/out/` (fuera de git) | `cd showcase/trailer && npm ci && npm run todo` |
| Vídeo de presentación de 17:46, con subtítulos y capítulos | `showcase/video/out/` (fuera de git) | Pasos en [showcase/video/README.md](../../showcase/video/README.md) |
| Canal de opinión sin analítica | [.github/ISSUE_TEMPLATE](../../.github/ISSUE_TEMPLATE) | Plantillas de GitHub |

## Diapositivas

- Abre `index.html` en el navegador.
- Teclas:
  - ← y → (también la barra espaciadora y AvPág/RePág) para avanzar y retroceder;
  - Inicio y Fin para ir a la primera y a la última;
  - F para pantalla completa.
- Pulsar en el tercio derecho avanza y en el izquierdo retrocede. `#5` en la URL abre la quinta.
- Es un único archivo sin conexiones externas, con CSP por hashes como la app.
- Los iconos y el logo salen de `app/src/ui/01-icons.js`, y las cifras (preguntas, máquinas y simulacros) del banco real. Si el banco cambia, `tools/diapositivas.py` las actualiza y `run_tests.sh` falla mientras `index.html` no esté al día.
- Para editar el contenido, cambia `plantilla.html` y vuelve a generar. `index.html` no se edita a mano.

## Taller en directo

- El código del taller es `NICAHACK`. Su variante es «evidencia insuficiente»: el acta dice «copia OK», pero no registra la hora del último dato recuperable.
- Enlace para el chat: `https://heindall92.github.io/argos-grc/?taller=NICAHACK#laboratorio`.
  - Con el borrador vacío, el caso se prepara solo.
  - Con un borrador escrito, ARGOS ofrece cambiar de caso y nunca lo pisa.
- Para cambiar el código, regenera el QR. `segno` es una dependencia de autoría que la app no necesita:

```sh
pip install segno==1.6.1
python3 -c "import segno; segno.make('https://heindall92.github.io/argos-grc/?taller=OTRO#laboratorio', error='m').save('docs/showcase/diapositivas/qr-taller.svg', scale=1, border=2, dark='#0B1220', light='#ffffff', xmldecl=False)"
python3 tools/diapositivas.py --pdf
```

## Vídeo de respaldo

`tools/grabar-demo.py` recorre el guion en Chromium con `?demo=showcase`, así que no toca el progreso habitual:
1. Hoy;
2. «Noche de ransomware», con un fallo deliberado y la pista;
3. un simulacro recuperado al recargar;
4. el taller NICAHACK hasta la rúbrica 4/4;
5. Crear contenido.

Un cursor dibujado muestra dónde se pulsa. Además del vídeo escribe:
- `capitulos.txt`, con el minuto de cada bloque;
- `escenas/`, con fotogramas clave.

Con `--url https://heindall92.github.io/argos-grc/` graba la versión publicada.

## Tráiler

- Proyecto de [Remotion](https://www.remotion.dev) en `showcase/trailer/`, con versiones fijadas.
- Sin música ni voz: los rótulos van incrustados.
- Usa la grabación de la demo, el logo y las cifras del banco (`npm run preparar` los copia), con la paleta de ARGOS y animaciones de entrada sin rebote.
- Composiciones:
  - `Trailer`, 1920×1080, para abrir la charla;
  - `TrailerVertical`, 1080×1350, para LinkedIn.
- Licencia de Remotion: es gratuita para particulares y empresas pequeñas; antes de un uso comercial, revisa las condiciones vigentes en remotion.dev.
- Si Remotion no puede descargar su navegador, se le puede pasar uno local: `npx remotion render src/index.js Trailer out/a.mp4 --browser-executable=/ruta/a/chrome-headless-shell`.
