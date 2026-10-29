"""Graba la demostración de la charla siguiendo docs/showcase/guion.md (vídeo de respaldo y material del tráiler).

Uso:
  python3 tools/grabar-demo.py                 graba con dist/index.html
  python3 tools/grabar-demo.py --url https://heindall92.github.io/argos-grc/

Escribe en showcase/grabaciones/ (fuera de git):
  demo-completa.webm   la demostración entera a 1920×1080
  demo-completa.mp4    la misma, en H.264 si hay ffmpeg (para Zoom, LinkedIn o el tráiler)
  capitulos.txt        minuto de inicio de cada bloque del guion
  escenas/*.png        fotogramas clave para el tráiler

Usa ?demo=showcase, así que no toca el progreso habitual del navegador. Un cursor dibujado sobre la
página muestra dónde se pulsa, porque la grabación del navegador no incluye el puntero.
"""
import pathlib
import shutil
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "showcase" / "grabaciones"
BASE = sys.argv[sys.argv.index("--url") + 1] if "--url" in sys.argv else (ROOT / "dist" / "index.html").as_uri()
SEP = "&" if "?" in BASE else "?"

CURSOR = """
(() => {
  if (window.__cursor) return;
  const c = document.createElement('div');
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;left:0;top:0;width:28px;height:28px;margin:-6px 0 0 -6px;z-index:2147483647;pointer-events:none;transition:transform .55s cubic-bezier(.2,.8,.2,1);transform:translate(960px,540px)';
  c.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  const pon = () => document.body && !c.isConnected && document.body.appendChild(c);
  document.addEventListener('DOMContentLoaded', pon); pon();
  window.__cursor = (x, y) => { pon(); c.style.transform = `translate(${x}px,${y}px)`; };
  window.__pulso = () => { c.animate([{ transform: c.style.transform + ' scale(1)' }, { transform: c.style.transform + ' scale(.82)' }, { transform: c.style.transform + ' scale(1)' }], { duration: 260 }); };
})();
"""


class Demo:
    def __init__(self, page):
        self.p = page
        self.t0 = time.time()
        self.capitulos = []
        (OUT / "escenas").mkdir(parents=True, exist_ok=True)

    def capitulo(self, nombre):
        s = int(time.time() - self.t0)
        self.capitulos.append(f"{s // 60:02d}:{s % 60:02d}  {nombre}")
        print(self.capitulos[-1], flush=True)

    def pausa(self, ms):
        self.p.wait_for_timeout(ms)

    def mover(self, sel):
        el = self.p.locator(sel).first
        el.scroll_into_view_if_needed()
        b = el.bounding_box()
        self.p.evaluate("([x, y]) => window.__cursor(x, y)", [b["x"] + b["width"] / 2, b["y"] + b["height"] / 2])
        self.pausa(650)
        return el

    def pulsar(self, sel, espera=700):
        el = self.mover(sel)
        self.p.evaluate("window.__pulso()")
        el.click()
        self.pausa(espera)

    def escribir(self, sel, texto):
        self.pulsar(sel, 200)
        self.p.locator(sel).first.press_sequentially(texto, delay=18)
        self.pausa(400)

    def foto(self, nombre):
        self.p.screenshot(path=str(OUT / "escenas" / f"{nombre}.png"))

    def cerrar_logros(self):
        while self.p.locator(".unlock").count():
            self.pausa(900)
            self.pulsar('.unlock [data-act="modal-next"]', 400)

    def flag(self, fid, opcion, espera=2200):
        self.pulsar(f'[data-act="flag-opt"][data-id="{fid}"][data-o="{opcion}"]', 400)
        self.pulsar(f'[data-act="flag-enviar"][data-id="{fid}"]', espera)
        self.cerrar_logros()


def grabar():
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = OUT / "_tmp"
    shutil.rmtree(tmp, ignore_errors=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=1, color_scheme="dark", locale="es-ES",
                            bypass_csp=True, record_video_dir=str(tmp), record_video_size={"width": 1920, "height": 1080})
        ctx.add_init_script(CURSOR)
        page = ctx.new_page()
        d = Demo(page)
        page.goto(BASE + SEP + "demo=showcase#hoy")
        page.wait_for_selector(".demo-strip")
        page.evaluate("localStorage.removeItem('argos/demo/showcase-dia')")
        page.reload(); page.wait_for_selector(".demo-strip")

        d.capitulo("Hoy · demostración con progreso")
        d.pausa(2500); d.foto("01-hoy")
        for v in ["rutas", "maquinas", "simulacros", "inicio", "logros"]:
            d.mover(f'.nav [data-view="{v}"]'); d.pausa(250)
        d.foto("02-logros-hover")

        d.capitulo("Demo 1 · Noche de ransomware")
        d.pulsar('.nav [data-view="maquinas"]', 1200)
        page.evaluate("location.hash = '#maquina/m-ransom'"); page.wait_for_selector('#evt-0'); d.pausa(1800); d.foto("03-ransom-briefing")
        for i in range(3):
            d.pulsar(f"#evt-{i}", 1600)
        d.foto("04-ransom-evidencias")
        d.flag("m-ransom-f1", 1)
        d.flag("m-ransom-f2", 0, 2600)          # fallo deliberado: la explicación
        d.foto("05-ransom-fallo")
        d.flag("m-ransom-f2", 1)
        d.flag("m-ransom-f3", 1)
        d.flag("m-ransom-f4", 1)
        d.flag("m-ransom-f5", 1, 2600)
        d.foto("06-ransom-completa")

        d.capitulo("Recuperación de un simulacro al recargar")
        d.pulsar('.nav [data-view="simulacros"]', 1000)
        d.pulsar('[data-act="simulacro"][data-id="sprint-cont"]', 1200)
        d.pulsar(".opt >> nth=1", 500); page.keyboard.press("ArrowRight"); d.pausa(500)
        d.pulsar(".opt >> nth=0", 500); d.pausa(800)
        page.reload(); page.wait_for_selector(".player-foot"); d.pausa(2200); d.foto("07-simulacro-recuperado")
        page.keyboard.press("Escape"); d.pausa(500)
        if page.locator('[data-act="modal-ok"]').count():
            d.pulsar('[data-act="modal-ok"]', 600)

        d.capitulo("Demo 2 · Taller NICAHACK")
        page.goto(BASE + SEP + "demo=showcase&taller=NICAHACK#laboratorio"); page.wait_for_selector("#lab-seed")
        if page.locator('[data-act="lab-taller"]').count():
            d.pulsar('[data-act="lab-taller"]', 400); d.pulsar('[data-act="modal-ok"]', 800)
        d.pausa(1500); d.foto("08-laboratorio")
        for e in ["E1", "E4"]:
            d.pulsar(f'[data-lab-evidencia="{e}"]', 300)
        for campo, valor in [("foco", "evidencia"), ("criterio", "rpo"), ("clasificacion", "insuficiente"), ("accion", "registro")]:
            d.mover(f'[data-lab="{campo}"]'); page.select_option(f'[data-lab="{campo}"]', valor); d.pausa(500)
        d.escribir('[data-lab="hallazgo"]', "El acta indica «copia OK», pero no registra la hora del último dato recuperable (E4), que exige POL-BCP-01 (E1).")
        d.escribir('[data-lab="justificacion"]', "Sin esa hora no se puede afirmar ni negar que se cumpla el RPO de 30 minutos.")
        d.escribir('[data-lab="verificacion"]', "En la próxima prueba, el acta incluye la hora del último dato recuperable y se contrasta con una transacción.")
        d.pulsar('[data-act="lab-evaluar"]', 2400); d.foto("09-rubrica")

        d.capitulo("Comunidad · Crear contenido")
        d.pulsar('.subnav [data-view="autores"]', 1200)
        d.pulsar('[data-act="pack-validar"]', 1400)
        d.pulsar('[data-act="pack-opcion"] >> nth=0', 1600); d.foto("10-paquete")
        d.capitulo("Fin")
        d.pausa(1500)
        video = page.video.path()
        ctx.close(); b.close()
    destino = OUT / "demo-completa.webm"
    shutil.move(video, destino)
    shutil.rmtree(tmp, ignore_errors=True)
    (OUT / "capitulos.txt").write_text("\n".join(d.capitulos) + "\n", encoding="utf-8")
    print("Vídeo:", destino.relative_to(ROOT))
    if shutil.which("ffmpeg"):
        mp4 = OUT / "demo-completa.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(destino), "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4)], check=True)
        print("Vídeo:", mp4.relative_to(ROOT))


if __name__ == "__main__":
    grabar()
