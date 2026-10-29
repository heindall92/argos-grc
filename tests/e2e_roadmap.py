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
            page.click('[data-view="competencias"]')
            assert page.locator('#view article').count() == 7
            assert 'Tu siguiente práctica' in page.inner_text('#view')
            page.click('[data-view="laboratorio"]')
            page.fill('[data-lab="hallazgo"]', 'El acta y la política muestran una diferencia que debe investigarse con evidencias.')
            page.reload()
            assert 'diferencia' in page.input_value('[data-lab="hallazgo"]')
            page.click('[data-act="lab-evaluar"]')
            assert 'revisión humana' in page.inner_text('#lab-feedback')
            with page.expect_download() as download:
                page.click('[data-act="lab-exportar"]')
            assert download.value.suggested_filename.endswith('.md')
            page.click('[data-view="taller"]')
            page.click('[data-act="taller-previsualizar"]')
            preview = page.inner_text('#resumen-preview')
            assert '"nombre"' not in preview and '"textos"' not in preview
            with page.expect_download() as download:
                page.click('[data-act="taller-exportar"]')
            page.set_input_files('#taller-archivos', download.value.path())
            page.wait_for_function("() => document.querySelector('#taller-agregado').textContent.includes('1 resúmenes válidos')")
            page.fill('#taller-codigo', 'OTRO-TALLER')
            page.set_input_files('#taller-archivos', download.value.path())
            page.wait_for_function("() => document.querySelector('#taller-agregado').textContent.includes('0 resúmenes válidos')")
            page.click('[data-view="autores"]')
            page.click('[data-act="pack-validar"]')
            assert page.locator('[data-act="pack-opcion"]').count() == 18
            page.click('[data-act="pack-opcion"] >> nth=0')
            assert 'Coincide' in page.inner_text('#pack-res-0-0')
            page.fill('#pack-editor', '{"schema":"incorrecto"}')
            page.click('[data-act="pack-validar"]')
            assert 'inválido' in page.inner_text('#view')
            for v in ['inicio','competencias','laboratorio','taller','autores']:
                page.evaluate(f"{A}.go('{v}')")
                page.set_viewport_size({'width':390,'height':844})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), v
            showcase(page)
            assert not errors, errors
            browser.close()
            print(f'{name}: recuperación, reloj e idempotencia OK')


def showcase(page):
    """1.4.0: demostración con progreso de ejemplo, navegación «Aprender», selector de archivo y enlace del taller."""
    personal = page.evaluate("localStorage.getItem('argos/v1/progreso')")
    demo = page.evaluate("localStorage.getItem('argos/demo/progreso')")
    page.set_viewport_size({'width': 1280, 'height': 800})
    page.goto(URL + '&demo=showcase#hoy')
    page.wait_for_selector('.demo-strip')
    assert page.locator('#modal').is_hidden(), 'Cargar la demostración no celebra logros'
    xp = page.evaluate(f'{A}.P.xp')
    assert 500 < xp < 2000, xp
    assert page.evaluate(f'Object.keys({A}.P.logros).length') >= 5
    assert page.evaluate(f'{A}.E.racha({A}.P.dias, {A}.E.dia(new Date()))') == 4
    assert '40' in page.inner_text('.rings-card'), 'La meta del día aparece a medias'
    assert not page.evaluate(f"{A}.P.maquinas['m-ransom']"), 'El caso de la charla queda sin resolver'
    # Practicar en la demostración y restablecer vuelve al mismo progreso de ejemplo
    page.evaluate(f"{A}.iniciarSala('iso-2')")
    page.click('.opt >> nth=0')
    page.click('[data-act="p-check"]')
    page.keyboard.press('Escape')
    page.click('[data-act="modal-ok"]')
    assert page.evaluate(f'{A}.ui.sesion') is None
    page.evaluate(f"{A}.go('inicio')")
    page.click('[data-act="demo-reset"]')
    page.click('[data-act="modal-ok"]')
    assert page.evaluate(f'{A}.P.xp') == xp
    assert page.evaluate(f"{A}.P.respuestas[{A}.D.rutas[1].salas[1].preguntas[0].id]") is None
    assert page.evaluate("localStorage.getItem('argos/v1/progreso')") == personal, 'El perfil habitual no cambia'
    assert page.evaluate("localStorage.getItem('argos/demo/progreso')") == demo, 'La demo vacía no cambia'
    # Navegación «Aprender»: entrada propia y subnavegación solo en sus vistas
    page.click('.nav [data-view="inicio"]')
    for v in ['competencias', 'laboratorio', 'taller', 'autores']:
        page.click(f'.subnav [data-view="{v}"]')
        assert page.get_attribute(f'.subnav [data-view="{v}"]', 'aria-current') == 'page', v
        assert page.get_attribute('.nav [data-view="inicio"]', 'aria-current') == 'page', v
    page.evaluate(f"{A}.go('hoy')")
    assert page.locator('.subnav').count() == 0, 'Hoy no repite la subnavegación'
    # Selector de archivo propio con el nombre elegido
    page.evaluate(f"{A}.go('autores')")
    assert page.inner_text('#pack-archivo-n') == 'Ningún archivo elegido'
    page.set_input_files('#pack-archivo', files=[{'name': 'mi-paquete.json', 'mimeType': 'application/json', 'buffer': b'{"schema":"argos-pack/v1"}'}])
    page.wait_for_function("() => document.querySelector('#pack-archivo-n')?.textContent === 'mi-paquete.json'")
    # Abierta como archivo, el enlace del taller apunta a la versión publicada y conserva la demostración
    page.evaluate(f"{A}.go('taller')")
    page.click('[data-act="taller-enlace"]')
    enlace = page.input_value('#taller-enlace')
    assert enlace.startswith('https://heindall92.github.io/argos-grc/?'), enlace
    assert 'demo=showcase' in enlace and 'taller=' in enlace and 'file:' not in enlace, enlace
    # Sin desbordes de 320 a 1440 px y nombres de pestaña que caben desde 350 px
    for w in [320, 360, 390, 900, 1024, 1440]:
        page.set_viewport_size({'width': w, 'height': 800})
        for v in ['hoy', 'inicio', 'autores', 'maquinas']:
            page.evaluate(f"{A}.go('{v}')")
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (w, v)
        if 350 <= w < 900:
            sobra = page.evaluate("Math.max(...[...document.querySelectorAll('.tabbar button')].map(b => { const s = getComputedStyle(b); return b.querySelector('span').scrollWidth - (b.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)); }))")
            # Cada motor rasteriza la fuente del sistema con anchos algo distintos: se admiten 2 px de margen.
            assert sobra <= 2, (w, sobra)
    page.set_viewport_size({'width': 390, 'height': 844})
    page.evaluate(f"{A}.go('hoy')")
    caja = page.evaluate("(() => { const c = document.querySelector('.continue .grow').getBoundingClientRect(); return c.width; })()")
    assert caja > 220, f'La tarjeta de Hoy no deja el texto en una columna estrecha ({caja}px)'
    assert '#laboratorio' in enlace, enlace
    # Participante de un taller: con el borrador vacío, el enlace prepara el caso solo
    page.goto(URL + '&taller=NICAHACK#laboratorio')
    page.wait_for_selector('#lab-seed')
    assert page.input_value('#lab-seed') == 'NICAHACK'
    assert 'no contiene fecha ni hora' in page.inner_text('#view'), 'NICAHACK es la variante de evidencia insuficiente'
    # Con un borrador escrito no se pisa nada: se ofrece cambiar de caso con confirmación
    page.goto(URL + '&demo&taller=OTRO#laboratorio')
    page.wait_for_selector('[data-act="lab-taller"]')
    assert 'diferencia' in page.input_value('[data-lab="hallazgo"]')
    page.click('[data-act="lab-taller"]')
    page.click('[data-act="modal-ok"]')
    assert page.input_value('#lab-seed') == 'OTRO'
    assert page.input_value('[data-lab="hallazgo"]') == ''
    assert page.locator('[data-act="lab-taller"]').count() == 0
    # Cada vista se puede abrir directamente desde un enlace (el primer pintado ocurre antes de evaluar
    # los módulos de Aprender: una constante de módulo usada al pintar dejaba la página en blanco)
    # Una pestaña nueva por enlace: es lo que hace quien lo abre, y ninguna navegación interrumpe a otra.
    errores_directos = []
    for consulta in ['', '&demo', '&demo=showcase', '&taller=NICAHACK']:
        for vista in ['hoy', 'rutas', 'ruta/ens', 'maquinas', 'maquina/m-ransom', 'simulacros', 'logros', 'perfil', 'ayuda',
                      'inicio', 'competencias', 'laboratorio', 'taller', 'autores']:
            p = page.context.new_page()
            p.on('pageerror', lambda e, c=consulta, v=vista: errores_directos.append(f'{c}#{v}: {e}'))
            p.goto(URL + consulta + '#' + vista)
            p.wait_for_selector('#view h1', timeout=5000)
            assert p.locator('#view h1').inner_text().strip(), (consulta, vista)
            p.close()
    assert not errores_directos, errores_directos
    print('Demostración, navegación Aprender, selector de archivo y enlace del taller OK')


if __name__ == '__main__':
    main()
