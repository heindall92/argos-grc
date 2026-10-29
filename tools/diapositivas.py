"""Construye las diapositivas de la charla a partir de docs/showcase/diapositivas/plantilla.html.

Uso:
  python3 tools/diapositivas.py          escribe docs/showcase/diapositivas/index.html
  python3 tools/diapositivas.py --pdf    además exporta diapositivas.pdf (1920×1080, una página por diapositiva)
  python3 tools/diapositivas.py --check  falla si index.html no está al día (lo usa run_tests.sh)

El HTML resultante es un único archivo autónomo: los iconos y el logo salen de app/src/ui/01-icons.js,
las cifras del banco real (no se escriben a mano) y los QR de los SVG generados en local. La CSP usa
hashes de su propio script y estilo, como la app.
"""
import base64
import hashlib
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIR = ROOT / "docs" / "showcase" / "diapositivas"
NODE = r"""
const fs = require('fs'), vm = require('vm');
const ic = vm.runInNewContext(fs.readFileSync('app/src/ui/01-icons.js', 'utf8') + ';({ logo, icon })', {});
const E = require('./app/src/engine.js'), B = require('./app/data/index.js');
const nombres = JSON.parse(process.argv[1]);
const iconos = Object.fromEntries(nombres.map((n) => [n, ic.icon(n, 40)]));
process.stdout.write(JSON.stringify({ logo: ic.logo(176, 'logo-g'), logoPie: ic.logo(30, 'logo-p'), iconos, st: E.estadisticas(B), version: require('./package.json').version }));
"""


def qr(nombre):
    svg = (DIR / f"{nombre}.svg").read_text(encoding="utf-8")
    m = re.search(r'width="(\d+)" height="(\d+)"', svg)
    if not m:
        raise SystemExit(f"{nombre}.svg sin tamaño")
    w, h = m.groups()
    return svg.replace(m.group(0), f'viewBox="0 0 {w} {h}" role="img" aria-label="Código QR"', 1)


def construir(comprobar=False):
    tpl = (DIR / "plantilla.html").read_text(encoding="utf-8")
    nombres = sorted(set(re.findall(r"\{\{icon:([A-Za-z]+)\}\}", tpl)))
    d = json.loads(subprocess.check_output(["node", "-e", NODE, json.dumps(nombres)], cwd=ROOT))
    faltan = [n for n, v in d["iconos"].items() if not v]
    if faltan:
        raise SystemExit("Iconos inexistentes en 01-icons.js: " + ", ".join(faltan))
    st = d["st"]
    vals = {"logo": d["logo"], "logo-json": json.dumps(d["logoPie"]), "version": d["version"], "preguntas": st["preguntas"],
            "salas": st["salas"], "maquinas": st["maquinas"], "flags": st["flags"], "simulacros": st["simulacros"]}
    out = re.sub(r"\{\{icon:([A-Za-z]+)\}\}", lambda m: d["iconos"][m.group(1)], tpl)
    out = re.sub(r"\{\{qr:([a-z]+)\}\}", lambda m: qr("qr-" + m.group(1)), out)
    for k, v in vals.items():
        out = out.replace("{{" + k + "}}", str(v))
    resto = re.findall(r"\{\{[^}]+\}\}", out)
    if resto:
        raise SystemExit("Marcadores sin sustituir: " + ", ".join(sorted(set(resto))))
    sha = lambda t: "'sha256-" + base64.b64encode(hashlib.sha256(t.encode("utf-8")).digest()).decode() + "'"
    estilos = " ".join(sha(t) for t in re.findall(r"<style>([\s\S]*?)</style>", out))
    scripts = " ".join(sha(t) for t in re.findall(r"<script>([\s\S]*?)</script>", out))
    out = out.replace("style-src 'unsafe-inline'", f"style-src {estilos}; style-src-attr 'unsafe-inline'").replace("script-src 'unsafe-inline'", f"script-src {scripts}")
    if comprobar:
        if (DIR / "index.html").read_text(encoding="utf-8") != out:
            raise SystemExit("docs/showcase/diapositivas/index.html no está al día: ejecuta python3 tools/diapositivas.py --pdf")
        print("Diapositivas al día.")
        return
    (DIR / "index.html").write_text(out, encoding="utf-8")
    print(f"OK {DIR.relative_to(ROOT)}/index.html · ARGOS {d['version']} · {st['preguntas']} preguntas · {st['maquinas']} máquinas · {st['simulacros']} simulacros")


def pdf():
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1920, "height": 1080})
        errores = []
        pg.on("console", lambda m: m.type == "error" and errores.append(m.text))
        pg.goto((DIR / "index.html").as_uri())
        pg.wait_for_function("window.__DECK__")
        pg.emulate_media(media="print")
        pg.pdf(path=str(DIR / "diapositivas.pdf"), width="1920px", height="1080px", print_background=True)
        b.close()
    if errores:
        raise SystemExit("Errores en la consola (¿CSP?): " + "; ".join(errores))
    print(f"OK {DIR.relative_to(ROOT)}/diapositivas.pdf")


if __name__ == "__main__":
    construir("--check" in sys.argv)
    if "--pdf" in sys.argv and "--check" not in sys.argv:
        pdf()
