"""Recorrido grabado de ARGOS real: una función por toma (las escenas «toma» del guion).

Cada toma abre un navegador nuevo con ?demo=showcase (progreso de ejemplo, sin tocar ningún perfil),
hace lo que haría una persona —clics, scroll, tecleo— y deja public/clips/<toma>.mp4 con sus marcas
para la cámara. Lo que no debe verse (preparar el estado de una toma) se hace antes de empezar a grabar.

Uso: python grabacion/rodaje.py [toma ...]      (sin argumentos: todas, en orden)
"""
from __future__ import annotations

import asyncio
import sys
import tempfile
from pathlib import Path

from grabador import Toma, abrir, async_playwright

TOMAS = {}
A = "window.__ARGOS__"


def toma(f):
    TOMAS[f.__name__] = f
    return f


async def ir(page, ruta: str, espera: float = 1.0):
    """Cambia de vista por la URL (fuera de plano o como transición rápida)."""
    await page.evaluate("r => { location.hash = '#' + r; }", ruta)
    await page.wait_for_timeout(int(espera * 1000))


async def pregunta(page) -> dict:
    return await page.evaluate(f"""() => {{ const s = {A}.ui.sesion; const id = s.ids[s.i];
      return {A}.D.rutas.flatMap(r => r.salas.flatMap(x => x.preguntas)).find(q => q.id === id); }}""")


async def responder(t: Toma, bien: bool = True, texto: str | None = None, comprobar: bool = True):
    """Responde la pregunta actual del jugador (bien o mal) pulsando como una persona."""
    q = await pregunta(t.page)
    if q["t"] == "multiple":
        opciones = q["c"] if bien else [i for i in range(len(q["o"])) if i not in q["c"]][:1]
    elif q["t"] == "vf":
        opciones = [(0 if q["c"] else 1) if bien else (1 if q["c"] else 0)]
    else:
        opciones = [q["c"] if bien else (q["c"] + 1) % len(q["o"])]
    for i, o in enumerate(opciones):
        await t.clic(f'.opt[data-o="{o}"]', texto if i == 0 else None, pausa=0.5)
    if comprobar:
        await t.clic('[data-act="p-check"]', None, pausa=1.2)


async def cerrar_logros(t: Toma):
    while await t.page.locator(".unlock").count():
        await t.espera(1.2)
        await t.clic('.unlock [data-act="modal-next"]', None, pausa=0.5)


async def flag(t: Toma, fid: str, opcion: int, texto: str | None = None, pausa: float = 2.2):
    await t.clic(f'[data-act="flag-opt"][data-id="{fid}"][data-o="{opcion}"]', texto, pausa=0.6)
    await t.clic(f'[data-act="flag-enviar"][data-id="{fid}"]', None, pausa=pausa)
    await cerrar_logros(t)


async def flag_rapida(page, fid: str, opcion: int):
    """Resolver una flag fuera de plano (preparar el estado de otra toma)."""
    await page.click(f'[data-act="flag-opt"][data-id="{fid}"][data-o="{opcion}"]')
    await page.click(f'[data-act="flag-enviar"][data-id="{fid}"]')
    await page.wait_for_timeout(300)
    while await page.locator(".unlock").count():
        await page.click('.unlock [data-act="modal-next"]')


# ───────────────────────────── recorrido ─────────────────────────────

@toma
async def hoy(p):
    nav, page = await abrir(p)
    t = Toma(page, "hoy")
    await t.empezar()
    await t.senalar(".chip.flame", "Racha: 4 días seguidos", pausa=1.6)
    await t.senalar(".chip.eyes", "Puntos de experiencia", pausa=1.6)
    await t.resaltar(".rings-card", "Meta del día", pausa=2.4)
    await t.resaltar(".rank-card", "Rango: «10 ojos»", pausa=2.6)
    await t.rueda(380, 1.4, 960, 600)
    await t.senalar(".continue >> nth=0", "9 preguntas vuelven hoy", pausa=2.2)
    await t.senalar(".continue >> nth=1", "Siguiente sala recomendada", pausa=2.2)
    await t.rueda(420, 1.4)
    await t.senalar(".route-card >> nth=0", "Rutas", pausa=1.6)
    await t.terminar(1.0)
    await nav.close()


@toma
async def rutas(p):
    nav, page = await abrir(p)
    t = Toma(page, "rutas")
    await t.empezar()
    await t.clic('.nav [data-view="rutas"]', None, pausa=1.6)
    await t.senalar(".route-card >> nth=0", "ENS · 7 salas", pausa=1.4)
    await t.senalar(".route-card >> nth=1", "ISO/IEC 27001 · 8 salas", pausa=1.4)
    await t.senalar(".route-card >> nth=2", "Continuidad · 4 salas", pausa=1.4)
    await t.clic(".route-card >> nth=0", None, pausa=1.8)
    await t.resaltar("ol.path li >> nth=0", "Superada: mejor nota e intentos", pausa=2.0)
    await t.rueda(500, 1.6, 960, 640)
    await t.senalar("ol.path li >> nth=5", "MAGERIT", pausa=1.4)
    await t.senalar("ol.path li >> nth=6", "Puente ENS ↔ ISO/IEC 27001", pausa=1.8)
    await t.terminar(1.0)
    await nav.close()


@toma
async def sala(p):
    nav, page = await abrir(p, ruta="ruta/ens")
    t = Toma(page, "sala")
    await t.empezar()
    await t.clic('[data-act="sala"][data-id="ens-3"]', "Categorización del sistema", pausa=1.6)
    await responder(t, True, "Opción única")
    await t.resaltar(".explain", "Explicación y referencia", pausa=2.6)
    await t.clic('[data-act="p-next"]', None, pausa=1.0)
    await responder(t, False, "Fallo a propósito")
    await t.resaltar(".explain", "La explicación aparece igual al fallar", pausa=2.6)
    for _ in range(4):
        await t.clic('[data-act="p-next"]', None, pausa=0.8)
        q = await pregunta(page)
        if q.get("cita"):
            break
        await responder(t, True, None)
    q = await pregunta(page)
    if q.get("cita"):
        await responder(t, True, None)
        await t.resaltar("blockquote", "Texto literal del BOE", pausa=3.0)
    await t.senalar(".explain a", "Proponer una corrección", pausa=2.0)
    await t.terminar(1.0)
    await nav.close()


@toma
async def repaso(p):
    nav, page = await abrir(p)
    t = Toma(page, "repaso")
    await t.empezar()
    await t.senalar(".continue >> nth=0", "Repaso espaciado", pausa=1.4)
    await t.clic('[data-act="repaso"]', None, pausa=1.6)
    for i in range(3):
        await responder(t, True, "Vuelve en 1, 3, 7, 14 y 30 días" if i == 0 else None)
        await t.espera(1.2)
        await t.clic('[data-act="p-next"]', None, pausa=0.9)
    await t.terminar(1.0)
    await nav.close()


@toma
async def maquinas(p):
    nav, page = await abrir(p)
    t = Toma(page, "maquinas")
    await t.empezar()
    await t.clic('.nav [data-view="maquinas"]', None, pausa=1.4)
    await t.resaltar("#dif-d-facil", "5 fáciles", pausa=1.4)
    await t.senalar("button.machine >> nth=0", "Hespéride Servicios Digitales (ficticia)", pausa=1.6)
    await t.rueda(520, 1.6, 960, 600)
    await t.senalar("button.machine:has-text('La SoA sospechosa')", "5 medias", pausa=1.4)
    await t.rueda(520, 1.6)
    await t.senalar("button.machine:has-text('Riesgo en euros')", "5 difíciles", pausa=1.4)
    await t.rueda(-700, 1.4)
    await t.clic("button.machine:has-text('Noche de ransomware')", "Noche de ransomware", pausa=1.8)
    await t.terminar(1.0)
    await nav.close()


@toma
async def ransom_briefing(p):
    nav, page = await abrir(p, ruta="maquina/m-ransom")
    t = Toma(page, "ransom_briefing")
    await t.empezar()
    await t.resaltar(".m-brief, .briefing, section.card >> nth=0", "Briefing", pausa=3.0)
    await t.clic("#evt-0", "Cronología", pausa=3.6)
    await t.resaltar(".term", "23:25 · apagan dos servidores sin registro", pausa=4.0)
    await t.clic("#evt-1", "BIA de la plataforma", pausa=3.6)
    await t.clic("#evt-2", "Plan de continuidad", pausa=3.8)
    await t.terminar(1.0)
    await nav.close()


@toma
async def ransom_flags(p):
    nav, page = await abrir(p, ruta="maquina/m-ransom")
    await page.click("#evt-0")
    t = Toma(page, "ransom_flags")
    await t.empezar()
    await flag(t, "m-ransom-f1", 1, "Activar al prever el 50 % del RTO", pausa=3.4)
    await flag(t, "m-ransom-f2", 0, "«Sí, de sobra» (fallo a propósito)", pausa=2.8)
    await t.senalar('[data-act="flag-pista"][data-id="m-ransom-f2"]', "Pista: la flag vale la mitad", pausa=2.6)
    await flag(t, "m-ransom-f2", 1, "Más de 48 h de datos: el doble del RPO", pausa=3.4)
    await flag(t, "m-ransom-f3", 1, "Cadena de custodia", pausa=3.2)
    await t.terminar(1.0)
    await nav.close()


@toma
async def ransom_root(p):
    nav, page = await abrir(p, ruta="maquina/m-ransom")
    for f in ("m-ransom-f1", "m-ransom-f2", "m-ransom-f3"):
        await flag_rapida(page, f, 1)
    await page.locator('[data-id="m-ransom-f4"]').first.scroll_into_view_if_needed()
    t = Toma(page, "ransom_root")
    await t.empezar()
    await flag(t, "m-ransom-f4", 1, "Integridad, vector cerrado y CCN-CERT", pausa=3.6)
    await flag(t, "m-ransom-f5", 1, "Portavoz designado", pausa=3.6)
    await t.rueda(-2400, 1.8, 960, 500)
    await t.resaltar("#view .hd, .hd >> nth=0", "Máquina resuelta", pausa=2.4)
    await t.terminar(1.0)
    await nav.close()


@toma
async def simulacros(p):
    nav, page = await abrir(p)
    t = Toma(page, "simulacros")
    await t.empezar()
    await t.clic('.nav [data-view="simulacros"]', None, pausa=1.4)
    await t.resaltar("#tipo-sprint", "Sprints de 10 minutos", pausa=1.6)
    await t.rueda(560, 1.6, 960, 600)
    await t.resaltar("#tipo-bloque", "Por bloques", pausa=1.4)
    await t.rueda(900, 1.8)
    await t.senalar("h3:has-text('Maratón GRC')", "Maratón: 90 preguntas", pausa=1.8)
    await t.rueda(-1460, 1.6)
    await t.clic('[data-act="simulacro"][data-id="sprint-cont"]', "Sprint de continuidad", pausa=1.6)
    for i in range(3):
        await responder(t, i != 1, None, comprobar=False)
        await t.espera(0.6)
        if i == 1:
            await t.clic('[data-act="p-marcar"]', "Marcar para revisar", pausa=1.0)
        await t.page.keyboard.press("ArrowRight")
        await t.espera(0.8)
    await t.clic(".player details summary", "Navegador de preguntas", pausa=2.4)
    await t.terminar(1.0)
    await nav.close()


@toma
async def recuperacion(p):
    nav, page = await abrir(p, ruta="simulacros")
    await page.click('[data-act="simulacro"][data-id="sprint-cont"]')
    await page.wait_for_timeout(600)
    t = Toma(page, "recuperacion")
    for _ in range(3):
        q = await pregunta(page)
        o = (0 if q["c"] else 1) if q["t"] == "vf" else (q["c"][0] if q["t"] == "multiple" else q["c"])
        await page.click(f'.opt[data-o="{o}"]')
        await page.keyboard.press("ArrowRight")
    await t.empezar()
    await t.resaltar(".timer", "El reloj sigue corriendo", pausa=1.6)
    await page.reload()
    await page.wait_for_selector(".player-foot")
    await t.espera(1.0)
    await t.resaltar(".toast", "Sesión recuperada", pausa=2.4)
    await t.resaltar(".timer", "Mismo plazo absoluto", pausa=1.8)
    await t.clic(".player-foot >> text=Entregar ahora", "Entregar", pausa=1.2)
    await t.clic('[data-act="modal-ok"]', None, pausa=2.0)
    await cerrar_logros(t)
    await t.resaltar(".result", "Resultado y salas que reforzar", pausa=3.4)
    await t.rueda(420, 1.4, 960, 640)
    await t.espera(1.6)
    await t.terminar(1.0)
    await nav.close()


@toma
async def logros(p):
    nav, page = await abrir(p)
    t = Toma(page, "logros")
    await t.empezar()
    await t.clic('.nav [data-view="logros"]', None, pausa=1.4)
    await t.senalar(".badge.on >> nth=0", "7 de 20 logros", pausa=1.8)
    await t.senalar(".badge:not(.on) >> nth=0", "Bloqueado", pausa=1.4)
    await t.rueda(700, 1.8, 960, 640)
    await t.espera(1.4)
    await t.rueda(700, 1.8)
    await t.senalar("text=Panoptes >> nth=-1", "Panoptes: el 85 % de los puntos", pausa=2.2)
    await t.rueda(700, 1.8)
    await t.espera(2.0)
    await t.terminar(1.0)
    await nav.close()


# ───────────────────────────── aprender ─────────────────────────────

@toma
async def aprender(p):
    nav, page = await abrir(p)
    t = Toma(page, "aprender")
    await t.empezar()
    await t.clic('.nav [data-view="inicio"]', "Aprender", pausa=1.8)
    await t.resaltar(".subnav", "Empieza aquí · Competencias · Laboratorio · Taller · Crear contenido", pausa=2.4)
    await t.senalar("text=Practico continuidad", "Elige tu punto de partida", pausa=1.6)
    await t.rueda(420, 1.4, 960, 620)
    await t.resaltar(".guide-steps", "Recorrido guiado de 10 a 15 minutos", pausa=3.0)
    await t.rueda(380, 1.4)
    await t.senalar("text=Abrir demostración", "Demostración con datos separados", pausa=2.2)
    await t.terminar(1.0)
    await nav.close()


@toma
async def competencias(p):
    nav, page = await abrir(p, ruta="inicio")
    t = Toma(page, "competencias")
    await t.empezar()
    await t.clic('.subnav [data-view="competencias"]', None, pausa=1.8)
    await t.resaltar("section.card >> nth=0", "Tu siguiente práctica, con el motivo", pausa=2.6)
    await t.rueda(420, 1.4, 960, 620)
    await t.senalar("article.card >> nth=0", "Gobernanza: 19 de 40 retenidas", pausa=2.2)
    await t.senalar("article.card >> nth=6", "Continuidad: 8 de 40", pausa=2.0)
    await t.rueda(520, 1.4)
    await t.espera(1.6)
    await t.terminar(1.0)
    await nav.close()


@toma
async def laboratorio(p):
    nav, page = await abrir(p, ruta="laboratorio", extra="&taller=NICAHACK")
    t = Toma(page, "laboratorio")
    await t.empezar()
    await t.senalar("#lab-seed", "Semilla: NICAHACK", pausa=1.8)
    await t.rueda(300, 1.2, 960, 620)
    await t.resaltar(".grid.g2 article >> nth=0", "Política: RTO 120 min · RPO 30 min", pausa=2.6)
    await t.resaltar(".grid.g2 article >> nth=2", "Recuperado en el minuto 105", pausa=2.4)
    await t.resaltar(".grid.g2 article >> nth=3", "«Copia OK», sin hora del último dato", pausa=3.0)
    await t.rueda(520, 1.4)
    await t.clic('[data-lab-evidencia="E1"]', "Evidencias que sostienen la conclusión", pausa=0.6)
    await t.clic('[data-lab-evidencia="E4"]', None, pausa=0.8)
    for campo, valor, texto in [("foco", "evidencia", "Evidencia insuficiente"), ("criterio", "rpo", "Criterio: RPO"),
                                ("clasificacion", "insuficiente", "No se puede concluir")]:
        await t.senalar(f'[data-lab="{campo}"]', texto, pausa=0.4)
        await page.select_option(f'[data-lab="{campo}"]', valor)
        await t.espera(0.8)
    await t.clic('[data-lab="hallazgo"]', "Hallazgo: evidencia, criterio y diferencia", pausa=0.2)
    await t.escribir("El acta indica «copia OK», pero no registra la hora del último dato recuperable (E4), que exige POL-BCP-01 (E1).", 22)
    await t.clic('[data-lab="justificacion"]', None, pausa=0.2)
    await t.escribir("Sin esa hora no se puede afirmar ni negar que se cumpla el RPO de 30 minutos.", 22)
    await t.senalar('[data-lab="accion"]', "Repetir la prueba y registrar", pausa=0.4)
    await page.select_option('[data-lab="accion"]', "registro")
    await t.clic('[data-lab="verificacion"]', None, pausa=0.2)
    await t.escribir("En la próxima prueba, el acta incluye la hora del último dato recuperable y se contrasta con una transacción.", 22)
    await t.espera(1.0)
    await t.terminar(1.0)
    await nav.close()


@toma
async def rubrica(p):
    nav, page = await abrir(p, ruta="laboratorio", extra="&taller=NICAHACK")
    for e in ("E1", "E4"):
        await page.check(f'[data-lab-evidencia="{e}"]')
    for campo, valor in [("foco", "evidencia"), ("criterio", "rpo"), ("clasificacion", "insuficiente"), ("accion", "registro")]:
        await page.select_option(f'[data-lab="{campo}"]', valor)
    await page.fill('[data-lab="hallazgo"]', "El acta indica «copia OK», pero no registra la hora del último dato recuperable (E4), que exige POL-BCP-01 (E1).")
    await page.fill('[data-lab="justificacion"]', "Sin esa hora no se puede afirmar ni negar que se cumpla el RPO de 30 minutos.")
    await page.fill('[data-lab="verificacion"]', "En la próxima prueba, el acta incluye la hora del último dato recuperable y se contrasta con una transacción.")
    await page.locator('[data-act="lab-evaluar"]').scroll_into_view_if_needed()
    await page.mouse.wheel(0, 200)
    await page.wait_for_timeout(500)
    t = Toma(page, "rubrica")
    await t.empezar()
    await t.clic('[data-act="lab-evaluar"]', "Contrastar con la rúbrica", pausa=1.6)
    await t.resaltar("#lab-feedback", "4 de 4 comprobaciones estructuradas", pausa=3.6)
    await t.senalar("#lab-feedback >> text=revisión humana", "Los textos necesitan revisión humana", pausa=2.6)
    async with page.expect_download():
        await t.clic('[data-act="lab-exportar"]', "Informe en Markdown", pausa=2.4)
    await t.terminar(1.0)
    await nav.close()


@toma
async def taller(p):
    nav, page = await abrir(p, ruta="taller")
    t = Toma(page, "taller")
    await t.empezar()
    await t.senalar("#taller-codigo", "Código del taller", pausa=1.4)
    await t.clic('[data-act="taller-enlace"]', "Enlace: entra directo al caso", pausa=2.2)
    await t.rueda(760, 1.6, 960, 620)
    await t.senalar("label:has(#resumen-nombre)", "Nombre: desmarcado", pausa=1.6)
    await t.senalar("label:has(#resumen-textos)", "Textos completos: desmarcados", pausa=1.6)
    await t.clic('[data-act="taller-previsualizar"]', "Vista previa de lo que se comparte", pausa=2.6)
    async with page.expect_download() as d:
        await t.clic('[data-act="taller-exportar"]', None, pausa=1.4)
    ruta = await (await d.value).path()
    await t.rueda(600, 1.4)
    await t.senalar("label[for='taller-archivos']", "El facilitador importa hasta 20", pausa=1.0)
    await page.set_input_files("#taller-archivos", ruta)
    await t.espera(1.2)
    await t.resaltar("#taller-agregado", "Agregados, sin nombres ni textos", pausa=3.0)
    await t.terminar(1.0)
    await nav.close()


# ───────────────────────────── comunidad ─────────────────────────────

@toma
async def autores(p):
    nav, page = await abrir(p, ruta="autores")
    t = Toma(page, "autores")
    await t.empezar()
    await t.resaltar("#pack-editor", "Plantilla argos-pack/v1", pausa=2.6)
    await t.clic('[data-act="pack-validar"]', "Validar y previsualizar", pausa=1.8)
    await t.rueda(420, 1.4, 960, 620)
    await t.clic('[data-act="pack-opcion"] >> nth=0', "Practicar sin sumar puntos", pausa=2.2)
    await t.clic('[data-act="pack-opcion"] >> nth=3', None, pausa=1.8)
    await t.rueda(700, 1.6)
    await t.senalar("text=Antes de proponerlo", "Revisión antes de entrar en el banco", pausa=2.4)
    await t.terminar(1.0)
    await nav.close()


@toma
async def perfil(p):
    nav, page = await abrir(p)
    t = Toma(page, "perfil")
    await t.empezar()
    await t.clic('[data-act="go"][data-view="perfil"].avatar', None, pausa=1.8)
    await t.senalar('[data-act="exportar"]', "Exportar el progreso (JSON)", pausa=1.8)
    await t.senalar('[data-act="importar"]', "Importar: se valida campo a campo", pausa=1.8)
    await t.rueda(520, 1.4, 960, 620)
    await t.clic('[data-act="tema"] >> nth=0', "Tema claro, oscuro o del sistema", pausa=1.8)
    await t.clic('[data-act="tema"] >> nth=-1', None, pausa=1.6)
    await t.rueda(520, 1.4)
    await t.senalar("#share-canvas", "Tarjeta para compartir el rango", pausa=2.4)
    await t.terminar(1.0)
    await nav.close()


@toma
async def movil(p):
    nav, page = await abrir(p, movil=True)
    t = Toma(page, "movil", escala=1.0)
    await t.empezar()
    await t.rueda(500, 1.6, 195, 500)
    await t.espera(0.8)
    await t.clic('.tabbar [data-view="maquinas"]', None, pausa=1.6)
    await t.rueda(400, 1.2, 195, 500)
    await t.clic('.tabbar [data-view="inicio"]', None, pausa=1.6)
    await t.clic('.subnav [data-view="laboratorio"]', None, pausa=1.8)
    await t.rueda(600, 1.4, 195, 500)
    await t.clic('.tabbar [data-view="logros"]', None, pausa=1.8)
    await t.terminar(1.0)
    await nav.close()


async def main(nombres: list[str]) -> None:
    async with async_playwright() as p:
        for n in nombres or list(TOMAS):
            print(f"{n}…", flush=True)
            await TOMAS[n](p)


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:]))
