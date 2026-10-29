"""Grabador de ARGOS para el vídeo.

Abre Chromium sin ventana contra ARGOS (dist/index.html o la web publicada), ejecuta un recorrido (clics, scroll, tecleo)
y graba la pantalla con el screencast de Chromium (DevTools): fotogramas JPEG con su marca de
tiempo, que ffmpeg monta en un MP4 a 30 fps. Nada se recrea: es la aplicación funcionando con ?demo=showcase.

Además del vídeo guarda, por clip, un JSON de «marcas» (dónde se hizo clic, qué se resaltó y
en qué segundo) que Remotion usa para mover la cámara y dibujar los recuadros.

El cursor no lo pinta el navegador sin ventana: se inyecta una flecha que sigue al ratón.
"""
from __future__ import annotations

import asyncio
import base64
import json
import math
import os
import random
import shutil
import subprocess
import time
from pathlib import Path

from playwright.async_api import Page, async_playwright

RAIZ = Path(__file__).resolve().parent.parent
CLIPS = RAIZ / "public" / "clips"
TMP = RAIZ / "build" / "grabacion"

APP = RAIZ.parent.parent / "dist" / "index.html"
BASE = os.environ.get("ARGOS_URL", APP.as_uri())
ANCHO, ALTO, ESCALA = 1920, 1080, 1.5   # fotogramas de 2880x1620: la cámara puede acercar sin perder nitidez

CURSOR_JS = r"""
(() => {
  if (window.__cursorListo) return; window.__cursorListo = true;
  const poner = () => {
    if (!document.body || document.getElementById('__cur')) return;
    const c = document.createElement('div');
    c.id = '__cur';
    c.innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.5 14.8 L11.6 21.6 L14.6 20.3 L11.6 13.6 L18 13.6 Z"
      fill="#ffffff" stroke="#0b0f0d" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    Object.assign(c.style, {position:'fixed', left:'0px', top:'0px', zIndex:2147483647, pointerEvents:'none',
      transform:'translate(-4px,-2px)', filter:'drop-shadow(0 2px 3px rgba(0,0,0,.55))', transition:'opacity .2s'});
    document.body.appendChild(c);
    const st = document.createElement('style');
    st.textContent = `@keyframes __onda{from{transform:translate(-50%,-50%) scale(.2);opacity:.9}to{transform:translate(-50%,-50%) scale(1);opacity:0}}
      .__onda{position:fixed;width:46px;height:46px;border-radius:50%;border:3px solid #3fd0d6;pointer-events:none;
      z-index:2147483646;animation:__onda .55s ease-out forwards}`;
    document.head.appendChild(st);
  };
  document.addEventListener('mousemove', e => { poner(); const c = document.getElementById('__cur');
    if (c) { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; } }, true);
  document.addEventListener('mousedown', e => { const o = document.createElement('div'); o.className = '__onda';
    o.style.left = e.clientX + 'px'; o.style.top = e.clientY + 'px'; document.body.appendChild(o);
    setTimeout(() => o.remove(), 700); }, true);
  document.addEventListener('DOMContentLoaded', poner);
})();
"""

class NoEsta(Exception):
    """El elemento que se quería señalar no está en pantalla."""


def _tolerante(f):
    async def envoltura(self, *a, **k):
        try:
            return await f(self, *a, **k)
        except NoEsta:
            return None
    return envoltura


def _ease(t: float) -> float:
    return 0.5 - 0.5 * math.cos(math.pi * t)


class Toma:
    """Una toma: graba lo que pasa en `page` entre empezar() y terminar()."""

    def __init__(self, page: Page, nombre: str, escala: float = ESCALA):
        self.page, self.nombre = page, nombre
        vp = page.viewport_size or {"width": ANCHO, "height": ALTO}
        self.ancho, self.alto = vp["width"], vp["height"]
        # tamaño de los fotogramas (par, como pide H.264)
        self.px = (int(self.ancho * escala) // 2 * 2, int(self.alto * escala) // 2 * 2)
        self.dir = TMP / nombre
        self.frames: list[tuple[float, Path]] = []
        self.marcas: list[dict] = []
        self.t0 = 0.0
        self.x, self.y = self.ancho * 0.62, self.alto * 0.55
        self.cdp = None

    # ---------- grabación ----------
    async def empezar(self) -> None:
        shutil.rmtree(self.dir, ignore_errors=True)
        self.dir.mkdir(parents=True)
        self.cdp = await self.page.context.new_cdp_session(self.page)
        self.cdp.on("Page.screencastFrame", lambda p: asyncio.ensure_future(self._frame(p)))
        await self.cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 92,
                                                      "maxWidth": self.px[0], "maxHeight": self.px[1],
                                                      "everyNthFrame": 1})
        self.t0 = time.time()
        await self.page.mouse.move(self.x, self.y)
        await self.espera(0.4)

    async def _frame(self, p: dict) -> None:
        ruta = self.dir / f"{len(self.frames):06d}.jpg"
        ruta.write_bytes(base64.b64decode(p["data"]))
        self.frames.append((p["metadata"].get("timestamp", time.time()), ruta))
        try:
            await self.cdp.send("Page.screencastFrameAck", {"sessionId": p["sessionId"]})
        except Exception:
            pass

    async def terminar(self, cola: float = 1.0) -> Path:
        await self.espera(cola)
        fin = time.time()
        await self.cdp.send("Page.stopScreencast")
        await asyncio.sleep(0.3)
        CLIPS.mkdir(parents=True, exist_ok=True)
        lista = self.dir / "lista.txt"
        frames = sorted(self.frames, key=lambda f: f[0])
        if not frames:
            raise RuntimeError(f"{self.nombre}: no llegó ningún fotograma")
        t_ini = frames[0][0]
        lineas = []
        for i, (ts, ruta) in enumerate(frames):
            sig = frames[i + 1][0] if i + 1 < len(frames) else fin
            lineas += [f"file '{ruta.name}'", f"duration {max(sig - ts, 0.001):.4f}"]
        lineas.append(f"file '{frames[-1][1].name}'")
        lista.write_text("\n".join(lineas), encoding="utf-8")
        salida = CLIPS / f"{self.nombre}.mp4"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
                        "-i", str(lista), "-vf", f"fps=30,scale={self.px[0]}:{self.px[1]}:flags=lanczos,format=yuv420p",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-movflags", "+faststart", str(salida)],
                       check=True, cwd=self.dir)
        desfase = t_ini - self.t0   # las marcas se miden desde el primer fotograma
        meta = {"clip": self.nombre, "duracion": round(fin - t_ini, 3), "ancho": self.ancho, "alto": self.alto,
                "marcas": [{**m, "t": round(m["t"] - desfase, 3)} for m in self.marcas]}
        (CLIPS / f"{self.nombre}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
        shutil.rmtree(self.dir, ignore_errors=True)
        print(f"  {self.nombre}: {meta['duracion']:.1f} s · {len(frames)} fotogramas · {len(self.marcas)} marcas")
        return salida

    # ---------- acciones ----------
    def marca(self, tipo: str, **datos) -> None:
        self.marcas.append({"t": time.time() - self.t0, "tipo": tipo, **datos})

    def corte(self, empieza: bool) -> None:
        """Tramo de espera (p. ej. la IA pensando) que el montaje recorta a un par de segundos."""
        self.marca("corte_ini" if empieza else "corte_fin", caja=[0, 0, 0, 0])

    async def espera(self, s: float) -> None:
        await self.page.wait_for_timeout(int(s * 1000))

    async def mover(self, x: float, y: float, dur: float | None = None) -> None:
        d = math.hypot(x - self.x, y - self.y)
        dur = dur if dur is not None else min(1.1, 0.35 + d / 1800)
        x0, y0 = self.x, self.y
        # ligera curva, como una mano; el avance va por reloj, no por pasos, para que la
        # velocidad no dependa de lo que tarde cada evento con el screencast en marcha
        cx, cy = (x0 + x) / 2 + random.uniform(-40, 40), (y0 + y) / 2 + random.uniform(-40, 40)
        ini = time.time()
        while True:
            r = min(1.0, (time.time() - ini) / dur)
            t = _ease(r)
            px = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t ** 2 * x
            py = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t ** 2 * y
            await self.page.mouse.move(px, py)
            if r >= 1.0:
                break
            await asyncio.sleep(0.012)
        self.x, self.y = x, y

    async def caja(self, objetivo):
        loc = self.page.locator(objetivo) if isinstance(objetivo, str) else objetivo
        loc = loc.first
        try:
            await loc.scroll_into_view_if_needed(timeout=6000)
            b = await loc.bounding_box()
        except Exception:
            b = None
        if not b:
            # Una toma no se tira por un elemento que no está: se avisa y se sigue
            print(f"    ⚠ {self.nombre}: no se encontró {objetivo}", flush=True)
            raise NoEsta()
        return loc, b

    @_tolerante
    async def senalar(self, objetivo, texto: str | None = None, pausa: float = 0.6, zoom: float | None = None) -> dict:
        """Lleva el cursor a un elemento y deja una marca (la cámara puede acercarse ahí)."""
        loc, b = await self.caja(objetivo)
        await self.mover(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
        self.marca("foco", caja=[round(b["x"]), round(b["y"]), round(b["width"]), round(b["height"])],
                   texto=texto, zoom=zoom)
        await self.espera(pausa)
        return b

    @_tolerante
    async def resaltar(self, objetivo, texto: str | None = None, zoom: float | None = None, pausa: float = 1.2) -> None:
        """Marca una zona sin mover el ratón (paneles grandes)."""
        _, b = await self.caja(objetivo)
        self.marca("foco", caja=[round(b["x"]), round(b["y"]), round(b["width"]), round(b["height"])],
                   texto=texto, zoom=zoom)
        await self.espera(pausa)

    @_tolerante
    async def clic(self, objetivo, texto: str | None = None, pausa: float = 0.9, zoom: float | None = None) -> None:
        loc, b = await self.caja(objetivo)
        await self.mover(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
        self.marca("clic", caja=[round(b["x"]), round(b["y"]), round(b["width"]), round(b["height"])],
                   texto=texto, zoom=zoom)
        await self.espera(0.15)
        await self.page.mouse.down()
        await self.page.wait_for_timeout(90)
        await self.page.mouse.up()
        await self.espera(pausa)

    @_tolerante
    async def mantener(self, objetivo, segundos: float, texto: str | None = None) -> None:
        loc, b = await self.caja(objetivo)
        await self.mover(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
        self.marca("clic", caja=[round(b["x"]), round(b["y"]), round(b["width"]), round(b["height"])], texto=texto)
        await self.page.mouse.down()
        await self.espera(segundos)
        await self.page.mouse.up()

    async def escribir(self, texto: str, retardo: int = 55) -> None:
        for ch in texto:
            await self.page.keyboard.type(ch)
            await self.page.wait_for_timeout(retardo + random.randint(-15, 25))

    async def rueda(self, dy: float, dur: float = 1.2, x: float | None = None, y: float | None = None) -> None:
        if x is not None:
            await self.mover(x, y if y is not None else self.y, 0.4)
        ini, hecho = time.time(), 0.0
        while True:
            r = min(1.0, (time.time() - ini) / dur)
            objetivo = abs(dy) * _ease(r)
            paso = objetivo - hecho
            if paso >= 1 or (r >= 1.0 and paso > 0):
                await self.page.mouse.wheel(0, math.copysign(paso, dy))
                hecho = objetivo
            if r >= 1.0:
                break
            await asyncio.sleep(0.016)

    async def ir(self, vista: str, espera: float = 3.0) -> None:
        """Navega con el botón de la barra lateral, como lo haría el analista."""
        boton = self.page.locator("button.navbtn").filter(has_text=vista)
        await self.clic(boton, pausa=espera)


async def abrir(p, movil: bool = False, tema: str = "dark", demo: str = "showcase", ruta: str = "hoy", extra: str = ""):
    """Contexto nuevo (almacenamiento vacío: la demostración arranca con su progreso de ejemplo)."""
    navegador = await p.chromium.launch(headless=True)
    if movil:
        ctx = await navegador.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=3,
                                          is_mobile=True, has_touch=True, color_scheme=tema, locale="es-ES")
    else:
        ctx = await navegador.new_context(viewport={"width": ANCHO, "height": ALTO}, device_scale_factor=ESCALA,
                                          color_scheme=tema, locale="es-ES", reduced_motion="no-preference")
    await ctx.add_init_script(CURSOR_JS)
    page = await ctx.new_page()
    consulta = "?test" + (f"&demo={demo}" if demo else "") + extra
    await page.goto(BASE + consulta + "#" + ruta)
    await page.wait_for_selector("#view h1")
    await page.wait_for_timeout(800)
    return navegador, page


__all__ = ["Toma", "abrir", "async_playwright", "BASE", "CLIPS"]
