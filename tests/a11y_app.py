"""Accesibilidad con axe-core (WCAG 2.2 A/AA) en todas las vistas y estados, tema claro y oscuro, escritorio y móvil.

Uso:  python3 tests/a11y_app.py     (falla si hay alguna infracción; detalle en tests/artifacts/a11y.json)
axe-core se inyecta con la CSP desactivada solo en este contexto de prueba; la CSP se prueba en e2e_app.py.
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = (ROOT / "dist" / "index.html").as_uri() + "?test"
AXE = ROOT / "tests" / "vendor" / "axe.min.js"
OUT = ROOT / "tests" / "artifacts"
OUT.mkdir(parents=True, exist_ok=True)
TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
A = "window.__ARGOS__"


def states(page):
    """Recorre las vistas y los estados que cambian el DOM: jugador (sin responder, acierto, fallo, resumen), simulacro, máquinas, diálogos."""
    J = page.evaluate
    for v in ["hoy", "rutas", "maquinas", "simulacros", "logros", "perfil"]:
        J(f"{A}.go('{v}')"); yield v
    for t in ["como", "atajos", "fuentes", "acerca"]:
        J(f"{A}.go('ayuda')"); page.click(f'[data-act="help-tab"][data-tab="{t}"]'); yield f"ayuda/{t}"
    for r in ["ens", "iso27001", "continuidad"]:
        J(f"{A}.go('ruta', '{r}')"); yield f"ruta/{r}"
    J(f"{A}.iniciarSala('ens-1')"); yield "sala/sin-responder"
    page.click(".opt >> nth=0"); yield "sala/elegida"
    page.click('[data-act="p-check"]'); yield "sala/comprobada"
    vistos = set()
    for _ in range(40):
        if page.locator(".result").count():
            break
        if page.locator('[data-act="p-next"]').count():
            page.click('[data-act="p-next"]'); continue
        page.click(".opt >> nth=0"); page.click('[data-act="p-check"]')
        estado = "sala/acierto" if page.locator(".player-foot.ok").count() else "sala/fallo"
        if estado not in vistos:
            vistos.add(estado); yield estado
    yield "sala/resumen-o-logro"
    while page.locator(".unlock").count():
        page.click('.unlock [data-act="modal-next"]')
    yield "sala/resumen"
    page.click('.result [data-act="p-cerrar"]')
    J(f"{A}.iniciarSimulacro('sim-grc')"); yield "simulacro"
    page.click(".player details summary"); yield "simulacro/navegador"
    page.click('.player-foot >> text=Entregar ahora'); yield "simulacro/confirmar"
    page.click('[data-act="modal-ok"]')
    while page.locator(".unlock").count():
        page.click('.unlock [data-act="modal-next"]')
    yield "simulacro/resultado"
    page.click('.result [data-act="p-cerrar"]')
    for m in J(f"{A}.D.maquinas.map(m => m.id)"):
        J(f"{A}.go('maquina', '{m}')"); yield f"maquina/{m}"
    f = J(f"{A}.D.maquinas[0].flags[0]")
    J(f"{A}.go('maquina', 'm-copias')")
    page.click(f'[data-act="flag-opt"][data-id="{f["id"]}"][data-o="{(f["c"] + 1) % len(f["o"])}"]')
    page.click(f'[data-act="flag-enviar"][data-id="{f["id"]}"]'); yield "flag/error"
    page.click(f'[data-act="flag-pista"][data-id="{f["id"]}"]'); yield "flag/pista"
    page.click(f'[data-act="flag-opt"][data-id="{f["id"]}"][data-o="{f["c"]}"]')
    page.click(f'[data-act="flag-enviar"][data-id="{f["id"]}"]'); yield "flag/capturada"
    while page.locator(".unlock").count():
        page.click('.unlock [data-act="modal-next"]')
    J(f"{A}.go('perfil')"); page.click('[data-act="reset"]'); yield "dialogo/borrar"
    page.keyboard.press("Escape")
    J(f"{A}.go('hoy')"); yield "hoy/con-progreso"


def main():
    total, report = 0, []
    with sync_playwright() as p:
        b = p.chromium.launch()
        for scheme in ["light", "dark"]:
            for w, h in [(1440, 900), (390, 844)]:
                ctx = b.new_context(viewport={"width": w, "height": h}, color_scheme=scheme, bypass_csp=True, reduced_motion="reduce")
                page = ctx.new_page(); page.clock.set_fixed_time("2026-10-05T10:00:00")
                page.route("**/*", lambda r: r.abort() if r.request.url.startswith("http") else r.continue_())
                page.goto(APP); page.wait_for_selector("#view h1")
                page.add_script_tag(path=str(AXE))
                for name in states(page):
                    page.wait_for_timeout(60)
                    res = page.evaluate("tags => axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })", TAGS)
                    for v in res["violations"]:
                        n = len(v["nodes"]); total += n
                        report.append({"tema": scheme, "ancho": w, "estado": name, "regla": v["id"], "nodos": n,
                                       "ejemplo": v["nodes"][0]["target"], "detalle": v["nodes"][0].get("failureSummary", "")[:300]})
                ctx.close()
        b.close()
    (OUT / "a11y.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    for r in report:
        print(f"  ✘ {r['tema']:5} {r['ancho']:4} {r['estado']:24} {r['regla']:24} {r['nodos']:3}  {r['ejemplo']}  {r['detalle'][:140]}")
    print(f"\naxe-core: {total} nodos con infracciones en {len(report)} combinaciones")
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main()
