"""Genera las capturas del README con un progreso de demostración (claro y oscuro, escritorio y móvil).

Uso:  python3 docs/capturas.py      (escribe en docs/img/)
El progreso se carga en localStorage y pasa por el mismo saneador que usa la app: los logros que no
justifica el progreso se descartan solos.
"""
import json
import pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = (ROOT / "dist" / "index.html").as_uri() + "?test"
OUT = ROOT / "docs" / "img"
OUT.mkdir(parents=True, exist_ok=True)
HOY = "2026-10-05"


def progreso():
    import subprocess
    banco = json.loads(subprocess.check_output(["node", "-e", "process.stdout.write(JSON.stringify(require('./app/data/index.js')))"], cwd=ROOT))
    salas = {s["id"]: s for r in banco["rutas"] for s in r["salas"]}
    resp = {}
    for sid in ["ens-1", "ens-2", "ens-3", "ens-4", "iso-1", "iso-2", "cont-1"]:
        for i, q in enumerate(salas[sid]["preguntas"]):
            resp[q["id"]] = {"caja": 2, "aciertos": 1, "fallos": 0, "due": "2026-10-09", "ultima": "2026-10-04"}
    for qid in ["iso-2-03", "iso-2-07", "ens-4-07", "cont-1-08"]:
        resp[qid] = {"caja": 1, "aciertos": 0, "fallos": 1, "due": HOY, "ultima": "2026-10-04"}
    dias = {f"2026-10-{d:02d}": {"xp": 120, "preguntas": 18, "repasos": 4} for d in range(1, 5)}
    dias[HOY] = {"xp": 85, "preguntas": 14, "repasos": 2}
    return {
        "v": 1, "perfil": {"nombre": "Yoandy Ramírez", "color": "teal"}, "ajustes": {"tema": "sistema", "meta": 100}, "xp": 2650,
        "respuestas": resp,
        "salas": {"ens-1": {"mejor": 1, "intentos": 2, "ultima": "2026-10-02"}, "ens-2": {"mejor": 0.9, "intentos": 1, "ultima": "2026-10-03"}, "ens-3": {"mejor": 0.8, "intentos": 2, "ultima": "2026-10-04"},
                  "ens-4": {"mejor": 0.7, "intentos": 1, "ultima": "2026-10-04"}, "iso-1": {"mejor": 0.9, "intentos": 1, "ultima": "2026-10-04"}, "iso-2": {"mejor": 0.6, "intentos": 1, "ultima": HOY}, "cont-1": {"mejor": 0.8, "intentos": 1, "ultima": HOY}},
        "maquinas": {"m-copias": {"flags": [f"m-copias-f{i}" for i in range(1, 6)], "pistas": [], "intentos": 6, "completada": True, "fecha": "2026-10-03"},
                     "m-baja": {"flags": ["m-baja-f1", "m-baja-f2"], "pistas": ["m-baja-f2"], "intentos": 3}},
        "simulacros": {"sim-ens": {"mejor": 0.833, "aprobado": True, "intentos": 2, "historial": [{"fecha": "2026-10-04", "nota": 0.833, "ok": 25, "total": 30, "seg": 1810}]}},
        "dias": dias, "logros": {l: HOY for l in ["primer-acierto", "sala-1", "sala-perfecta", "maquina-1", "ojo-halcon", "simulacro-ok", "racha-3"]}, "repasosOk": 14, "creado": "2026-10-01"
    }


def main():
    estado = json.dumps(progreso())
    with sync_playwright() as p:
        b = p.chromium.launch()
        for scheme in ["light", "dark"]:
            ctx = b.new_context(viewport={"width": 1280, "height": 860}, color_scheme=scheme, device_scale_factor=2, reduced_motion="reduce", locale="es-ES")
            pg = ctx.new_page(); pg.clock.set_fixed_time(f"{HOY}T10:30:00")
            pg.add_init_script(f"localStorage.setItem('argos/v1/progreso', {json.dumps(estado)})")
            pg.goto(APP); pg.wait_for_selector("#view h1")
            J = pg.evaluate
            pg.screenshot(path=str(OUT / f"hoy-{scheme}.png"))
            J("window.__ARGOS__.go('ruta', 'ens')"); pg.screenshot(path=str(OUT / f"ruta-{scheme}.png"))
            J("window.__ARGOS__.iniciarSala('ens-5')"); pg.wait_for_timeout(100)
            q = J("(() => { const s = window.__ARGOS__.ui.sesion; return window.__ARGOS__.D.rutas.flatMap(r => r.salas.flatMap(x => x.preguntas)).find(p => p.id === s.ids[s.i]); })()")
            if q["t"] == "multiple":
                for c in q["c"]: pg.click(f'.opt[data-o="{c}"]')
            elif q["t"] == "vf": pg.click(f'.opt[data-o="{0 if q["c"] else 1}"]')
            else: pg.click(f'.opt[data-o="{q["c"]}"]')
            pg.click('[data-act="p-check"]'); pg.wait_for_timeout(100)
            pg.screenshot(path=str(OUT / f"sala-{scheme}.png"))
            J("window.__ARGOS__.ui.sesion = null; document.body.style.overflow = ''; window.__ARGOS__.go('maquina', 'm-ransom')")
            pg.click('#evt-0'); pg.screenshot(path=str(OUT / f"maquina-{scheme}.png"))
            J("window.__ARGOS__.go('logros')"); pg.screenshot(path=str(OUT / f"logros-{scheme}.png"))
            J("window.__ARGOS__.iniciarSimulacro('sim-grc')"); pg.wait_for_timeout(100)
            for _ in range(7):
                pg.click(".opt >> nth=1"); pg.keyboard.press("ArrowRight")
            pg.click(".player details summary"); pg.screenshot(path=str(OUT / f"simulacro-{scheme}.png"))
            ctx.close()
            m = b.new_context(viewport={"width": 390, "height": 844}, color_scheme=scheme, device_scale_factor=3, is_mobile=True, has_touch=True, reduced_motion="reduce", locale="es-ES")
            mp = m.new_page(); mp.clock.set_fixed_time(f"{HOY}T10:30:00")
            mp.add_init_script(f"localStorage.setItem('argos/v1/progreso', {json.dumps(estado)})")
            mp.goto(APP); mp.wait_for_selector("#view h1")
            mp.screenshot(path=str(OUT / f"movil-hoy-{scheme}.png"))
            mp.evaluate("window.__ARGOS__.iniciarSala('cont-2')"); mp.wait_for_timeout(100)
            mp.click(".opt >> nth=0"); mp.click('[data-act="p-check"]'); mp.wait_for_timeout(100)
            mp.screenshot(path=str(OUT / f"movil-sala-{scheme}.png"))
            m.close()
        b.close()
    print("Capturas en", OUT)


if __name__ == "__main__":
    main()
