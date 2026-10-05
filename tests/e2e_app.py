"""Prueba de extremo a extremo de ARGOS en Chromium (Playwright): recorre la app como lo haría una persona.

Uso:  python3 tests/e2e_app.py      (sale con código 1 si falla alguna comprobación; capturas en tests/artifacts/)
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = (ROOT / "dist" / "index.html").as_uri()
OUT = ROOT / "tests" / "artifacts"
OUT.mkdir(parents=True, exist_ok=True)
FAILS = []
COUNT = [0]


def ok(cond, msg):
    COUNT[0] += 1
    print(("  ✔ " if cond else "  ✘ ") + msg)
    if not cond:
        FAILS.append(msg)


def offline(page):
    page.route("**/*", lambda r: r.continue_() if r.request.url.startswith(("file:", "data:", "blob:")) else r.abort())


def responder_bien(page, J):
    """Responde la pregunta actual con la respuesta correcta haciendo clic en las opciones."""
    q = J("(() => { const s = window.__ARGOS__.ui.sesion; return window.__ARGOS__.D.rutas.flatMap(r => r.salas.flatMap(x => x.preguntas)).find(p => p.id === s.ids[s.i]); })()")
    if q["t"] == "vf":
        page.click(f'.opt[data-o="{0 if q["c"] else 1}"]')
    elif q["t"] == "multiple":
        for c in q["c"]:
            page.click(f'.opt[data-o="{c}"]')
    else:
        page.click(f'.opt[data-o="{q["c"]}"]')
    return q


def responder_mal(page, J):
    q = J("(() => { const s = window.__ARGOS__.ui.sesion; return window.__ARGOS__.D.rutas.flatMap(r => r.salas.flatMap(x => x.preguntas)).find(p => p.id === s.ids[s.i]); })()")
    if q["t"] == "vf":
        page.click(f'.opt[data-o="{1 if q["c"] else 0}"]')
    elif q["t"] == "multiple":
        page.click(f'.opt[data-o="{q["c"][0]}"]')  # incompleta: siempre es fallo
    else:
        page.click(f'.opt[data-o="{(q["c"] + 1) % len(q["o"])}"]')
    return q


def main():
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1360, "height": 900}, accept_downloads=True, locale="es-ES")
        page = ctx.new_page()
        offline(page)
        page.clock.set_fixed_time("2026-10-05T10:00:00")
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("dialog", lambda d: (errors.append("diálogo: " + d.message), d.dismiss()))
        page.add_init_script("window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));")
        page.goto(APP + "?test")
        page.wait_for_selector("#view h1")
        J = page.evaluate
        A = "window.__ARGOS__"

        print("Arranque y seguridad del documento")
        ok(J("!!document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')"), "La página declara su Content-Security-Policy")
        csp = J("document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]').content")
        ok("connect-src 'none'" in csp and "default-src 'none'" in csp, "La CSP impide conexiones salientes y recursos externos")
        ok(J("Object.isFrozen(Object.prototype) && Object.isFrozen(Array.prototype)"), "Object.prototype y Array.prototype congelados")
        ok(page.locator(".route-card").count() == 3, "Hoy muestra las 3 rutas")
        ok(page.locator(".machine").count() == 3, "Hoy muestra 3 máquinas destacadas")
        ok("empieza por aquí" in page.inner_text("#view").lower(), "Sin progreso, Hoy propone empezar por una sala")
        ok(page.locator(".rings").count() == 1, "Hoy dibuja los anillos del día")
        ok("no está relacionado con ISO" in page.inner_text("#view"), "Aviso de independencia visible al empezar")
        page.screenshot(path=str(OUT / "01_hoy.png"), full_page=True)

        print("Navegación")
        for v, h in [("rutas", "Rutas"), ("maquinas", "Máquinas"), ("simulacros", "Simulacros"), ("logros", "Logros"), ("perfil", "Perfil"), ("ayuda", "Ayuda")]:
            page.click(f'#top [data-act="go"][data-view="{v}"]') if v != "ayuda" else page.click('#top [aria-label="Ayuda"]')
            ok(page.inner_text("#view h1") == h and page.locator(f'#top .nav [data-view="{v}"][aria-current="page"]').count() == (0 if v in ("perfil", "ayuda") else 1), f"La barra lleva a {h} y marca la sección")
        page.keyboard.press("g"); page.keyboard.press("r")
        ok(page.inner_text("#view h1") == "Rutas", "Atajo G luego R abre Rutas")
        page.click('.route-card[data-param="ens"]')
        ok(page.locator(".room").count() == 7 and "#ruta/ens" in page.url, "La ruta ENS muestra sus 7 salas y actualiza la dirección")

        print("Sala perfecta: flujo completo con teclado y ratón")
        page.click('[data-act="sala"][data-id="ens-1"]')
        try:
            page.wait_for_function("document.activeElement && document.activeElement.id === 'qtext'", timeout=3000)  # el foco se mueve en el siguiente ciclo de eventos
        except Exception:
            pass
        ok(page.locator(".player").count() == 1 and J("document.activeElement.id") == "qtext", "La sala abre el modo foco con el foco en la pregunta")
        ok(page.locator('[data-act="p-check"]').is_disabled(), "Comprobar está desactivado hasta elegir una opción")
        xp0 = J(f"{A}.P.xp")
        for i in range(10):
            q = responder_bien(page, J)
            if i == 0:
                ok(page.locator('.opt[aria-checked="true"]').count() >= 1, "La opción elegida queda marcada (aria-checked)")
            page.keyboard.press("Enter") if i % 2 else page.click('[data-act="p-check"]')
            if i == 0:
                ok(page.locator(".player-foot.ok").count() == 1 and "Correcto" in page.inner_text(".player-foot"), "Tras comprobar se muestra «¡Correcto!» con su explicación")
                ok(page.locator(".player-foot .ref").count() == 1, "La explicación cita su referencia")
                ok(page.locator(".opt:disabled").count() == page.locator(".opt").count(), "Las opciones quedan bloqueadas tras comprobar")
                page.screenshot(path=str(OUT / "02_sala_correcta.png"))
            page.click('[data-act="p-next"]')
        ok(page.locator(".result").count() == 1 and "100 %" in page.inner_text(".result"), "Resultado de la sala: 100 %")
        xp1 = J(f"{A}.P.xp")
        expected = J("window.__ARGOS__.D.rutas[0].salas[0].preguntas.reduce((a, q) => a + window.__ARGOS__.E.xpPregunta(q), 0)") + 50 + 25
        ok(xp1 - xp0 == expected, f"XP ganados = preguntas + bonificación de sala superada y perfecta ({xp1 - xp0} = {expected})")
        ok(J(f"{A}.P.salas['ens-1'].mejor") == 1, "La sala queda registrada con un 100 %")
        ok(page.locator(".unlock").count() == 1, "Se celebra el logro desbloqueado")
        logros = J(f"Object.keys({A}.P.logros)")
        ok(all(x in logros for x in ["primer-acierto", "sala-1", "sala-perfecta"]), f"Logros obtenidos: {logros}")
        page.screenshot(path=str(OUT / "03_logro.png"))
        for _ in range(5):
            if page.locator(".unlock").count():
                page.click('.unlock [data-act="modal-next"]')
        ok(page.locator("#modal .scrim").count() == 0, "Los diálogos de logro se cierran")
        page.click('.result [data-act="p-cerrar"]')
        ok(page.locator(".player").count() == 0 and page.locator(".room.done").count() == 1, "Al cerrar, la sala aparece superada en la ruta")
        page.click('[data-act="sala"][data-id="ens-1"]')
        for i in range(10):
            responder_bien(page, J); page.keyboard.press("Enter"); page.click('[data-act="p-next"]')
        ok(J(f"{A}.P.xp") == xp1, "Repetir una sala dominada no vuelve a sumar puntos")
        page.click('.result [data-act="p-cerrar"]')

        print("Fallos, explicación y repaso espaciado")
        page.click('[data-act="sala"][data-id="ens-2"]')
        q1 = responder_mal(page, J); page.click('[data-act="p-check"]')
        ok(page.locator(".player-foot.bad").count() == 1 and "No es correcto" in page.inner_text(".player-foot"), "Un fallo muestra «No es correcto»")
        ok(page.locator(".opt.is-missed" if q1["t"] == "multiple" else ".opt.is-ok").count() >= 1 and page.locator(".opt.is-ok" if q1["t"] == "multiple" else ".opt.is-bad").count() >= 1, f"Se marcan la respuesta elegida y la correcta (pregunta de tipo {q1['t']})")
        page.screenshot(path=str(OUT / "04_sala_fallo.png"))
        page.click('[data-act="p-next"]')
        for i in range(9):
            (responder_mal if i < 2 else responder_bien)(page, J); page.click('[data-act="p-check"]'); page.click('[data-act="p-next"]')
        ok("70 %" in page.inner_text(".result") and "Casi lo tienes" in page.inner_text(".result"), "Con un 70 % la sala no se supera")
        ok(page.locator(".review details").count() == 3, "El resumen lista los 3 fallos para revisarlos")
        ok(J(f"{A}.P.salas['ens-2'].mejor") == 0.7, "La nota de la sala queda registrada")
        page.click('.result [data-act="p-cerrar"]')
        page.click('#top [data-view="hoy"].brand')
        ok("3 preguntas vuelven hoy" in page.inner_text("#view"), "Hoy avisa de las 3 preguntas pendientes de repaso")
        page.click('[data-act="repaso"]')
        ok(J(f"{A}.ui.sesion.ids.length") == 3 and J(f"{A}.ui.sesion.modo") == "repaso", "El repaso carga exactamente las preguntas falladas")
        xr = J(f"{A}.P.xp")
        for i in range(3):
            responder_bien(page, J); page.click('[data-act="p-check"]'); page.click('[data-act="p-next"]')
        ok(J(f"{A}.P.xp") - xr == 12 and J(f"{A}.P.repasosOk") == 3, "Cada acierto en el repaso suma 4 XP")
        page.click('.result [data-act="p-cerrar"]')
        ok("Al día" in page.inner_text(".ring-leg"), "Tras repasar, el anillo de repaso queda al día")

        print("Salir de una sala a medias")
        page.click('[data-act="go"][data-view="rutas"] >> nth=0')
        page.click('.route-card[data-param="iso27001"]')
        page.click('[data-act="sala"][data-id="iso-1"]')
        responder_bien(page, J)
        page.keyboard.press("Escape")
        ok(page.locator('[role="alertdialog"]').count() == 1, "Escape a mitad de sala pide confirmación")
        page.click('[data-act="modal-ok"]')
        ok(page.locator(".player").count() == 0 and "iso-1" not in J(f"Object.keys({A}.P.salas)"), "Salir no puntúa la sala")

        print("Simulacro cronometrado")
        page.click('#top [data-view="simulacros"]')
        ok(page.locator('[data-act="simulacro"]').count() == 13 and page.locator('#view section h2').count() >= 4, "Hay 13 simulacros agrupados en sprints, bloques, completos y retos")
        page.click('[data-act="simulacro"][data-id="sim-ens"]')
        ok(J(f"{A}.ui.sesion.ids.length") == 30 and page.locator(".timer").count() == 1, "El simulacro ENS carga 30 preguntas y un cronómetro")
        ok(page.locator(".player-foot.ok, .player-foot.bad").count() == 0, "En el simulacro no se corrige pregunta a pregunta")
        for i in range(24):
            responder_bien(page, J)
            if i < 23:
                page.keyboard.press("ArrowRight")
        page.click('[data-act="p-marcar"]')
        ok(J(f"{A}.ui.sesion.marcadas.length") == 1, "Se puede marcar una pregunta para revisarla")
        page.click(".player details summary")
        ok(page.locator(".navgrid button.ans").count() == 24, "El navegador muestra 24 preguntas respondidas")
        page.screenshot(path=str(OUT / "05_simulacro.png"))
        page.click('.player-foot >> text=Entregar ahora')
        ok(page.locator('[role="alertdialog"]').count() == 1 and "6 preguntas" in page.inner_text('[role="alertdialog"]'), "Entregar con preguntas sin responder pide confirmación")
        page.click('[data-act="modal-ok"]')
        ok("80 %" in page.inner_text(".result") and "aprobado" in page.inner_text(".result").lower(), "24 de 30 = 80 %: simulacro aprobado")
        ok(J(f"{A}.P.simulacros['sim-ens'].aprobado") is True and "simulacro-ok" in J(f"Object.keys({A}.P.logros)"), "El aprobado y su logro quedan registrados")
        while page.locator(".unlock").count():
            page.click('.unlock [data-act="modal-next"]')
        page.screenshot(path=str(OUT / "06_simulacro_resultado.png"))
        page.click('.result [data-act="p-cerrar"]')
        page.click('[data-act="simulacro"][data-id="sim-iso"]')
        J(f"{A}.ui.sesion.fin = Date.now() - 1")
        page.wait_for_timeout(1300)
        ok(page.locator(".result").count() == 1 and J(f"{A}.P.simulacros['sim-iso'].intentos") == 1, "Al agotarse el tiempo el simulacro se corrige solo")
        page.click('.result [data-act="p-cerrar"]')

        page.click('#top [data-view="simulacros"]')
        page.click('[data-act="simulacro"][data-id="reto-dificil"]')
        ds = J(f"{A}.ui.sesion.ids.map(id => {A}.D.rutas.flatMap(r => r.salas.flatMap(s => s.preguntas)).find(q => q.id === id).d)")
        ok(len(ds) == 18 and set(ds) == {3}, "El reto carga las 18 preguntas de dificultad máxima, sin ninguna fácil")
        J(f"{A}.ui.sesion.fin = Date.now() - 1"); page.wait_for_timeout(1300)
        page.click('.result [data-act="p-cerrar"]')

        print("Máquinas: evidencias, pistas y flags")
        page.goto(APP + "?test#maquina/m-copias")
        page.wait_for_selector(".flag")
        ok(page.inner_text("#view h1") == "Copias de Hespéride", "La dirección #maquina/m-copias abre la máquina")
        ok(page.locator('[role="tab"]').count() == 3, "Tres evidencias en pestañas")
        page.click('#evt-1')
        ok("Registro de restauraciones" in page.inner_text("#evp"), "Cambiar de pestaña muestra otra evidencia")
        page.keyboard.press("ArrowRight")
        ok(J("document.activeElement.id") == "evt-2", "Las pestañas se recorren con las flechas")
        flags = J("window.__ARGOS__.D.maquinas.find(m => m.id === 'm-copias').flags")
        f0 = flags[0]
        mal = (f0["c"] + 1) % len(f0["o"])
        page.click(f'[data-act="flag-opt"][data-id="{f0["id"]}"][data-o="{mal}"]')
        page.click(f'[data-act="flag-enviar"][data-id="{f0["id"]}"]')
        ok("Flag incorrecta" in page.inner_text(f'#flag-{f0["id"]}'), "Una flag incorrecta muestra el error")
        page.click(f'[data-act="flag-pista"][data-id="{f0["id"]}"]')
        ok(f0["pista"] in page.inner_text(f'#flag-{f0["id"]}'), "La pista se muestra al pedirla")
        x0 = J(f"{A}.P.xp")
        page.click(f'[data-act="flag-opt"][data-id="{f0["id"]}"][data-o="{f0["c"]}"]')
        page.click(f'[data-act="flag-enviar"][data-id="{f0["id"]}"]')
        ok(J(f"{A}.P.xp") - x0 == 20, "Flag de usuario fácil con pista: 40 / 2 = 20 XP")
        ok(page.locator(f'#flag-{f0["id"]}.captured').count() == 1 and page.locator(f'#flag-{f0["id"]} .explain').count() == 1, "La flag capturada muestra su explicación")
        for f in flags[1:]:
            for c in (f["c"] if f["t"] == "multiple" else [f["c"]]):
                page.click(f'[data-act="flag-opt"][data-id="{f["id"]}"][data-o="{c}"]')
            page.click(f'[data-act="flag-enviar"][data-id="{f["id"]}"]')
        ok(J(f"{A}.P.maquinas['m-copias'].completada") is True, "Capturar todas las flags resuelve la máquina")
        ok("maquina-1" in J(f"Object.keys({A}.P.logros)") and "ojo-halcon" not in J(f"Object.keys({A}.P.logros)"), "Logro de primera máquina, pero no «ojo de halcón» (se usó una pista)")
        while page.locator(".unlock").count():
            page.click('.unlock [data-act="modal-next"]')
        page.screenshot(path=str(OUT / "07_maquina.png"), full_page=True)

        print("Perfil, ajustes y tarjeta para compartir")
        page.click('#top .avatar')
        page.fill("#pf-nombre", "Ada Lovelace")
        ok(page.inner_text("#top .avatar") == "AL", "El nombre actualiza las iniciales del avatar al momento")
        page.click('[data-act="color"][data-v="violet"]')
        ok(J(f"{A}.P.perfil.color") == "violet" and page.locator("#top .avatar.c-violet").count() == 1, "El color del perfil se aplica")
        page.click('[data-act="tema"][data-v="oscuro"]')
        ok(J("document.documentElement.getAttribute('data-theme')") == "dark", "El tema oscuro se aplica")
        page.click('[data-act="meta"][data-v="50"]')
        ok(J(f"{A}.P.ajustes.meta") == 50, "La meta diaria se guarda")
        ok(J("(() => { const c = document.getElementById('share-canvas'); const d = c.getContext('2d').getImageData(600, 315, 1, 1).data; return d[3] > 0; })()"), "La tarjeta para compartir se dibuja")
        with page.expect_download() as dl:
            page.click('[data-act="share-png"]')
        png = pathlib.Path(dl.value.path()).read_bytes()
        ok(png[:8] == b"\x89PNG\r\n\x1a\n" and dl.value.suggested_filename == "argos-progreso.png", "Descarga una imagen PNG válida")
        page.screenshot(path=str(OUT / "08_perfil_oscuro.png"), full_page=True)
        page.click('[data-act="tema"][data-v="sistema"]')

        print("Exportar, importar y datos hostiles")
        with page.expect_download() as dl:
            page.click('[data-act="exportar"]')
        data = json.loads(pathlib.Path(dl.value.path()).read_text())
        ok(data["app"] == "argos" and data["progreso"]["perfil"]["nombre"] == "Ada Lovelace", "La exportación contiene el progreso")
        xp_exp = data["progreso"]["xp"]
        hostil = {"app": "argos", "progreso": {"__proto__": {"pwned": True}, "xp": 999999999, "perfil": {"nombre": "<img src=x onerror=window.__pwn=1>" * 5, "color": "javascript:alert(1)"},
                  "respuestas": {"__proto__": {"x": 1}, "no-existe": {"aciertos": 5}, "ens-1-01": {"caja": 99, "aciertos": -3, "due": "mañana"}},
                  "salas": {"ens-1": {"mejor": 7}}, "maquinas": {"m-baja": {"flags": ["m-baja-f1", "inventada"], "completada": True}}, "logros": {"panoptes": "hoy", "falso": "2020-01-01"},
                  "dias": {"constructor": {"xp": 1}, "2026-10-05": {"xp": "mucho"}}}}
        f = OUT / "hostil.json"; f.write_text(json.dumps(hostil))
        page.set_input_files("#file-import", str(f))
        page.wait_for_selector('[role="alertdialog"]')
        page.click('[data-act="modal-ok"]')
        page.wait_for_timeout(200)
        Pq = J(f"{A}.P")
        ok(J("({}).pwned === undefined && ({}).x === undefined && window.__pwn === undefined"), "Importar un JSON hostil no contamina prototipos ni ejecuta código")
        ok(Pq["xp"] == 1000000 and len(Pq["perfil"]["nombre"]) <= 60 and Pq["perfil"]["color"] == "teal", "Los valores fuera de rango se acotan y los no válidos se descartan")
        ok(list(Pq["respuestas"].keys()) == ["ens-1-01"] and Pq["respuestas"]["ens-1-01"]["caja"] == 5 and Pq["respuestas"]["ens-1-01"]["aciertos"] == 0 and Pq["respuestas"]["ens-1-01"]["due"] == "", "Solo se aceptan preguntas existentes con valores saneados")
        ok(Pq["salas"]["ens-1"]["mejor"] == 1 and Pq["maquinas"]["m-baja"]["flags"] == ["m-baja-f1"] and Pq["maquinas"]["m-baja"]["completada"] is False, "Notas acotadas y flags inventadas descartadas")
        ok("falso" not in Pq["logros"] and "constructor" not in Pq["dias"], "Logros y días desconocidos se descartan")
        ok("<img" in page.inner_text("#view") or page.locator("#view img").count() == 0, "El nombre hostil se muestra como texto, nunca como HTML")
        f.write_text(json.dumps({"app": "otra", "progreso": {}}))
        page.set_input_files("#file-import", str(f))
        page.wait_for_timeout(200)
        ok("No es una copia de progreso de ARGOS" in page.inner_text("#toast"), "Un JSON de otra aplicación se rechaza")
        f.write_text("{ esto no es json")
        page.set_input_files("#file-import", str(f))
        page.wait_for_timeout(200)
        ok("no es un JSON válido" in page.inner_text("#toast"), "Un archivo corrupto se rechaza con un aviso")
        f.write_text(json.dumps(data))
        page.set_input_files("#file-import", str(f))
        page.click('[data-act="modal-ok"]')
        ok(J(f"{A}.P.xp") == xp_exp, "Importar la copia exportada restaura el progreso")

        print("Almacenamiento local manipulado")
        J("localStorage.setItem('argos/v1/progreso', JSON.stringify({ xp: 'NaN', perfil: { nombre: 7, color: '\"><script>' }, respuestas: { 'ens-1-01': 'x' }, salas: [], logros: { panoptes: 1 } }))")
        page.reload(); page.wait_for_selector("#view h1")
        Pm = J(f"{A}.P")
        ok(Pm["xp"] == 0 and Pm["perfil"]["color"] == "teal" and Pm["respuestas"] == {} and "panoptes" not in Pm["logros"], "Un almacenamiento local manipulado se sanea al cargar")
        f.write_text(json.dumps(data))
        page.set_input_files("#file-import", str(f))
        page.click('[data-act="modal-ok"]')

        print("Persistencia y borrado")
        page.reload(); page.wait_for_selector("#view h1")
        ok(J(f"{A}.P.xp") == xp_exp and J(f"{A}.P.perfil.nombre") == "Ada Lovelace", "El progreso sobrevive a una recarga")
        J(f"{A}.go('perfil')")
        page.click('[data-act="reset"]')
        page.click('[data-act="modal-ok"]')
        ok(J(f"{A}.P.xp") == 0 and J(f"Object.keys({A}.P.logros).length") == 0 and page.inner_text("#view h1").startswith("Buen"), "Empezar de cero borra el progreso y vuelve a Hoy")

        print("Ayuda y aviso legal")
        J(f"{A}.go('ayuda')")
        for t in ["atajos", "fuentes", "acerca"]:
            page.click(f'[data-act="help-tab"][data-tab="{t}"]')
        ok(page.locator('[data-act="help-tab"][data-tab="acerca"][aria-pressed="true"]').count() == 1 and "Yoandy Ramírez Delgado" in page.inner_text("#view"), "Las pestañas de ayuda se recorren y Acerca de muestra al autor")
        page.click('[data-act="help-tab"][data-tab="fuentes"]')
        legal = page.inner_text("#view")
        ok("sin relación con ISO, IEC, PECB, el CCN ni ninguna entidad de certificación" in legal and "no son una certificación" in legal, "Fuentes muestra el aviso legal completo")
        page.click('[data-act="help-tab"][data-tab="acerca"]')
        ok(page.locator(".suite-card").count() == 4 and "ARGOS" in page.inner_text(".suite-card.here"), "Acerca de enlaza las 4 herramientas GRC y marca ARGOS")
        links = J("[...document.querySelectorAll('#view a[target=_blank]')].map(a => [a.href, a.rel])")
        ok(all("noopener" in r for _, r in links) and any("kairos" in h for h, _ in links) and any("rosetta" in h for h, _ in links), "Los enlaces externos abren en pestaña nueva con noopener")

        print("Seguridad: CSP e inyección")
        ok(J("window.__csp.length") == 0, f"Sin infracciones de la CSP durante la sesión ({J('window.__csp')})")
        J("try { const s = document.createElement('script'); s.textContent = 'window.__inj = 1'; document.body.appendChild(s); } catch (e) {}")
        page.wait_for_timeout(50)
        ok(J("window.__inj") is None, "La CSP bloquea un script inyectado")

        print("Móvil")
        m = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, locale="es-ES")
        mp = m.new_page(); offline(mp)
        mp.goto(APP + "?test"); mp.wait_for_selector("#view h1")
        ok(mp.locator("#tabbar").is_visible() and not mp.locator(".nav").is_visible(), "En móvil se usa la barra de pestañas inferior")
        ok(mp.evaluate("innerWidth - document.querySelector('.top-end').getBoundingClientRect().right") <= 24, "En móvil, racha, ayuda y perfil quedan alineados a la derecha de la barra superior")
        for v in ["hoy", "rutas", "maquinas", "simulacros", "logros", "perfil", "ayuda"]:
            mp.evaluate(f"window.__ARGOS__.go('{v}')")
            ok(mp.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), f"{v}: sin desplazamiento horizontal")
        mp.evaluate("window.__ARGOS__.go('maquina', 'm-auditoria')")
        ok(mp.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "máquina: sin desplazamiento horizontal")
        mp.evaluate("window.__ARGOS__.iniciarSala('cont-1')")
        ok(mp.evaluate("document.documentElement.scrollWidth <= window.innerWidth") and mp.locator('[data-act="p-check"]').is_visible(), "Sala en móvil: botón visible y sin desbordes")
        mp.screenshot(path=str(OUT / "09_movil_sala.png"))
        mp.evaluate("window.__ARGOS__.ui.sesion = null; window.__ARGOS__.go('hoy')")
        mp.screenshot(path=str(OUT / "10_movil_hoy.png"), full_page=True)
        m.close()

        ok(not errors, f"Sin errores de JavaScript ni diálogos ({errors[:3]})")
        b.close()

    print(f"\n{COUNT[0] - len(FAILS)}/{COUNT[0]} comprobaciones superadas")
    if FAILS:
        print("Fallos:\n - " + "\n - ".join(FAILS))
        sys.exit(1)


if __name__ == "__main__":
    main()
