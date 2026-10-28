"""Regresiones del roadmap. ARGOS_BROWSERS=chromium,firefox,webkit para los tres motores."""
import os
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'dist' / 'index.html').as_uri() + '?test'
A = 'window.__ARGOS__'


def main():
    with sync_playwright() as pw:
        for name in os.getenv('ARGOS_BROWSERS', 'chromium').split(','):
            print(f'Iniciando {name}', flush=True)
            browser = getattr(pw, name).launch(timeout=30000)
            page = browser.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(URL)
            page.wait_for_selector('#view h1')
            page.evaluate(f"{A}.iniciarSala('ens-1')")
            page.click('.opt >> nth=0')
            page.click('[data-act="p-check"]')
            before = page.evaluate(f"{A}.P")
            page.reload()
            page.wait_for_selector('[data-act="p-next"]')
            after = page.evaluate(f"{A}.P")
            for field in ['xp', 'respuestas', 'sesion', 'dias']:
                assert after[field] == before[field], f'Recargar conserva {field}: {before[field]} / {after[field]}'
            page.click('[data-act="p-next"]')
            page.reload()
            assert page.evaluate(f'{A}.ui.sesion.i') == 1
            page.keyboard.press('Escape')
            page.click('[data-act="modal-ok"]')
            page.evaluate(f"{A}.iniciarSimulacro('sim-ens')")
            page.click('.opt >> nth=0')
            fin = page.evaluate(f'{A}.ui.sesion.fin')
            page.reload()
            page.wait_for_selector('.timer')
            assert page.evaluate(f'{A}.ui.sesion.fin') == fin
            assert page.evaluate(f'Object.keys({A}.ui.sesion.resp).length') == 1
            # Un examen vencido se corrige una sola vez al recuperar.
            page.evaluate("const key='argos/v1/progreso'; const p=JSON.parse(localStorage.getItem(key));p.sesion.inicio=Date.now()-3600000;p.sesion.fin=p.sesion.inicio+45*60000;localStorage.setItem(key,JSON.stringify(p));")
            # La duración exacta se toma del banco para no depender de una configuración particular.
            page.evaluate(f"const key='argos/v1/progreso';const p=JSON.parse(localStorage.getItem(key));p.sesion.fin=p.sesion.inicio+{A}.D.simulacros.find(s=>s.id===p.sesion.id).minutos*60000;localStorage.setItem(key,JSON.stringify(p));")
            page.reload()
            page.wait_for_selector('.result')
            assert page.evaluate(f"{A}.P.simulacros['sim-ens'].intentos") == 1
            page.reload()
            assert page.evaluate(f"{A}.P.simulacros['sim-ens'].intentos") == 1
            personal = page.evaluate("localStorage.getItem('argos/v1/progreso')")
            page.goto(URL + '&demo#inicio')
            page.wait_for_selector('#view h1')
            assert 'De la evidencia' in page.inner_text('#view h1')
            assert page.evaluate(f'{A}.P.xp') == 0
            page.click('[data-act="demo-reset"]')
            page.click('[data-act="modal-ok"]')
            assert page.evaluate("localStorage.getItem('argos/v1/progreso')") == personal
            assert not errors, errors
            browser.close()
            print(f'{name}: recuperación, reloj e idempotencia OK')


if __name__ == '__main__':
    main()
