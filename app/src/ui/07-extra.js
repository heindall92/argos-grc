/* ---------- Simulacros ---------- */
function vSimulacros() {
  return `<div class="hd"><div><h1 class="lt">Simulacros</h1><p class="lt-sub">Exámenes cronometrados con preguntas al azar de todas las salas. Sin corrección hasta que entregas, como en un examen real.</p></div></div>
    <div class="grid g3">${D.simulacros.map((sim) => {
      const st = P.simulacros[sim.id]; const ult = st && st.historial.length ? st.historial[st.historial.length - 1] : null;
      return `<article class="card pad stack" aria-labelledby="sim-${sim.id}">
        <div class="row">${sim.rutas.map((r) => glyph(r, 18)).join('')}</div>
        <h2 id="sim-${sim.id}" style="font:700 1.2rem/1.2 var(--f-d)">${esc(sim.nombre)}</h2>
        <p class="small muted">${esc(sim.descripcion)}</p>
        <div class="row small"><span class="tag">${icon('listChecks', 13)}${sim.n} preguntas</span><span class="tag">${icon('timer', 13)}${sim.minutos} min</span><span class="tag">${icon('target', 13)}${pct(sim.aprobado)}</span></div>
        ${st ? `<p class="small">Mejor nota: <b>${pct(st.mejor)}</b>${st.aprobado ? ' · <span class="tag ok">Aprobado</span>' : ''}<br><span class="muted">${plural(st.intentos, 'intento', 'intentos')}${ult ? ` · último: ${pct(ult.nota)} el ${esc(fmtFecha(ult.fecha))}` : ''}</span></p>` : '<p class="small muted">Sin intentos todavía.</p>'}
        <button type="button" class="btn primary" data-act="simulacro" data-id="${sim.id}">${icon('timer', 17)}<span>Empezar</span></button></article>`;
    }).join('')}</div>
    <section class="sec"><div class="legal">${icon('info', 18)}<span>Formato de práctica propio. No reproduce el formato ni las preguntas de ningún examen oficial de certificación. Aprobar un simulacro de ARGOS no acredita ninguna certificación.</span></div></section>`;
}

/* ---------- Ayuda, fuentes, aviso legal y acerca de ---------- */
const AUTOR = { nombre: 'Yoandy Ramírez Delgado', email: 'yoandyramirezdelgado@gmail.com', repo: 'https://github.com/heindall92/argos-grc',
  links: [['linkedin', 'LinkedIn', 'https://www.linkedin.com/in/yoandyrd92/'], ['github', 'GitHub', 'https://github.com/heindall92'], ['globe', 'Portafolio', 'https://yoandyramirez.com']] };
const SUITE = [
  ['argos', 'ARGOS', 'Laboratorio de práctica GRC: rutas, casos prácticos y simulacros de ENS, ISO/IEC 27001 y continuidad.', null, 'https://github.com/heindall92/argos-grc'],
  ['rosetta', 'Rosetta', 'Mapa multinorma: ENS, ISO/IEC 27001, NIS2 e ISO/IEC 42001 en 115 controles unificados, alineado con la CCN-STIC 825.', 'https://heindall92.github.io/rosetta_multinorma/', 'https://github.com/heindall92/rosetta_multinorma'],
  ['ens', 'ENS Compliance Studio', 'Categorización, análisis de riesgos MAGERIT, Declaración de Aplicabilidad y preauditoría del ENS.', 'https://heindall92.github.io/grc_ens_compliance_studio/app/dist/ens-compliance-studio.html', 'https://github.com/heindall92/grc_ens_compliance_studio'],
  ['kairos', 'KAIROS', 'Continuidad de negocio: BIA, BCP y DRP con la ruta crítica de recuperación de cada función.', 'https://heindall92.github.io/kairos/', 'https://github.com/heindall92/kairos']
];
const ext = (h, inner, cls = 'btn sm') => `<a class="${cls}" href="${esc(h)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
const AVISO = 'ARGOS es un proyecto independiente y de código abierto, sin relación con ISO, IEC, PECB, el CCN ni ninguna entidad de certificación. ISO, ISO/IEC 27001 e ISO 22301 son marcas de la International Organization for Standardization. Todas las preguntas y casos son de elaboración propia: no reproducen el texto de ninguna norma ISO ni contienen preguntas de exámenes reales. Los logros y rangos miden tu progreso en el laboratorio y no son una certificación.';
function vAyuda() {
  const tabs = [['como', 'Cómo funciona'], ['atajos', 'Atajos'], ['fuentes', 'Fuentes y aviso legal'], ['acerca', 'Acerca de']];
  const t = tabs.some(([id]) => id === ui.helpTab) ? ui.helpTab : 'como';
  let body = '';
  if (t === 'como') body = `<div class="prose">
    <h3>Rutas y salas</h3><p>Cada ruta (ENS, ISO/IEC 27001 y continuidad) se divide en salas de 10 preguntas. Al responder ves al momento si has acertado, por qué y la referencia exacta. Una sala se supera con un 80 %.</p>
    <h3>Repaso espaciado</h3><p>Cada pregunta que respondes entra en un sistema de cajas (Leitner). Si aciertas, vuelve en 1, 3, 7, 14 y 30 días; si fallas, vuelve a tu repaso de hoy. Así se fija lo aprendido sin repetir lo que ya dominas.</p>
    <h3>Máquinas</h3><p>Casos prácticos al estilo de un CTF: un briefing, evidencias (documentos, registros, tablas) y flags. Las de usuario piden identificar el problema y las de root, clasificarlo y decidir. Puedes abrir una pista, pero la flag valdrá la mitad.</p>
    <h3>Simulacros</h3><p>Exámenes cronometrados con preguntas al azar repartidas entre todas las salas. Solo se corrigen al entregar.</p>
    <h3>Rangos y logros</h3><p>Argos Panoptes tenía cien ojos y nunca los cerraba todos a la vez. Aquí empiezas con uno abierto: cada sala superada, cada flag capturada y cada simulacro aprobado abren otro, hasta llegar a Panoptes, el que lo ve todo. Los logros premian superar rutas, resolver máquinas, aprobar simulacros y mantener la racha.</p>
    <h3>Tus datos</h3><p>No hay cuentas ni servidor. El progreso se guarda solo en este navegador; expórtalo desde Perfil para conservarlo o llevarlo a otro equipo.</p></div>`;
  else if (t === 'atajos') body = `<div class="card list">${[['1 – 5', 'Elegir una opción en las preguntas'], ['V / F', 'Verdadero o falso'], ['Intro', 'Comprobar y continuar'], ['← →', 'Pregunta anterior y siguiente en los simulacros'], ['Esc', 'Salir de la sala o cerrar un diálogo'], ['G luego H / R / M / S / L', 'Ir a Hoy, Rutas, Máquinas, Simulacros o Logros']].map(([k, d]) => `<div class="li"><span style="min-width:180px">${k.split(' ').map((x) => (/^(luego|\/|–)$/.test(x) ? `<span class="muted small">${x}</span>` : `<kbd class="kbd">${esc(x)}</kbd>`)).join(' ')}</span><span class="small muted">${esc(d)}</span></div>`).join('')}</div>`;
  else if (t === 'fuentes') body = `<div class="stack"><div class="legal">${icon('alert', 18)}<span>${esc(AVISO)}</span></div><div class="prose">
    <h3>Ruta ENS</h3><p>Real Decreto 311/2022, de 3 de mayo, por el que se regula el Esquema Nacional de Seguridad (BOE-A-2022-7191, texto consolidado). Las citas literales proceden del BOE: los textos legales no están sujetos a derechos de autor (artículo 13 de la Ley de Propiedad Intelectual). Guías públicas del Centro Criptológico Nacional CCN-STIC 803 (valoración de los sistemas) y CCN-STIC 825 (ENS y certificaciones 27001), y metodología MAGERIT v3, citadas como referencia.</p>
    <h3>Rutas ISO/IEC 27001 y continuidad</h3><p>Preguntas de elaboración propia que explican los conceptos y citan la cláusula o el control de ISO/IEC 27001:2022 (y su modificación 1:2024), ISO/IEC 27002:2022, ISO 22301:2019, ISO/IEC 17021-1, ISO/IEC 27006-1 e ISO 19011:2018. Para estudiar a fondo necesitas las normas originales, que se adquieren en ISO o en UNE.</p>
    <h3>Casos prácticos</h3><p>Las organizaciones (Hespéride Servicios Digitales, Consorcio Digital de Arcadia), las personas y los datos son ficticios.</p>
    <h3>Errores</h3><p>Si una respuesta o una referencia no es correcta, ${ext(AUTOR.repo + '/issues/new', 'abre una incidencia', 'btn ghost sm')} y la revisamos.</p></div></div>`;
  else body = `<div class="stack"><div class="card about-card"><span class="avatar c-teal" style="--s:72px">YR</span><div><h3 style="font:700 1.2rem var(--f-d)">${esc(AUTOR.nombre)}</h3><p class="small muted">Diseño y desarrollo de ARGOS · Junior Pentester · eJPTv2 · AI Governance (ISO 42001) · SysAdmin</p>
      <div class="row" style="margin-top:10px">${AUTOR.links.map(([ic, n, h]) => ext(h, `${icon(ic, 15)}${n}`)).join('')}${ext('mailto:' + AUTOR.email, `${icon('mail', 15)}Correo`)}</div></div></div>
    <p><b>ARGOS ${esc(VERSION)}</b> · Código bajo licencia GPLv2 y contenidos bajo CC BY-SA 4.0. Iconos Lucide (ISC). ${ext(AUTOR.repo, `${icon('github', 15)}github.com/heindall92/argos-grc`, 'btn ghost sm')}</p>
    <section class="sec" aria-labelledby="suite-h"><div class="sec-h"><h2 id="suite-h">Herramientas GRC del autor</h2></div>
      <p class="small muted" style="margin-bottom:12px">Se complementan: ARGOS te entrena, Rosetta traduce entre marcos, ENS Compliance Studio prepara la conformidad con el ENS y KAIROS cubre la continuidad.</p>
      <div class="suite-grid">${SUITE.map(([id, n, d, app, repo]) => `<article class="card suite-card${id === 'argos' ? ' here' : ''}"><div class="row spread"><b>${esc(n)}</b>${id === 'argos' ? '<span class="tag ok">Estás aquí</span>' : ''}</div><p>${esc(d)}</p>
        <div class="row">${app ? ext(app, `${icon('arrowRight', 15)}Abrir la app`) : ''}${ext(repo, `${icon('github', 15)}Código`)}</div></article>`).join('')}</div></section></div>`;
  return `<div class="hd"><div><h1 class="lt">Ayuda</h1><p class="lt-sub">Cómo funciona ARGOS, de dónde salen las preguntas y quién lo hace.</p></div></div>
    <div class="seg help-tabs" role="group" aria-label="Secciones de ayuda">${tabs.map(([id, n]) => `<button type="button" data-act="help-tab" data-tab="${id}" aria-pressed="${t === id}">${n}</button>`).join('')}</div>${body}`;
}

/* ---------- Tarjeta para compartir (canvas → PNG) ---------- */
function dibujarTarjeta(cv) {
  if (!cv || !cv.getContext) return;
  const c = cv.getContext('2d'); if (!c) return;
  const W = 1200; const H = 630; const r = E.rangoDe(P.xp);
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#071018'); g.addColorStop(1, '#14102b'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const iri = c.createLinearGradient(0, 0, W, 0); iri.addColorStop(0, '#0FB5BA'); iri.addColorStop(0.5, '#2F6BFF'); iri.addColorStop(1, '#8B5CF6');
  // Plumas: los ojos abiertos del rango
  const cx = 930; const cy = 300;
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; const on = i < Math.round((r.ojos / 100) * 40); c.beginPath(); c.arc(cx + Math.cos(a) * 190, cy + Math.sin(a) * 190, 9, 0, Math.PI * 2); c.fillStyle = on ? iri : 'rgba(255,255,255,.08)'; c.fill(); }
  c.lineWidth = 8; c.strokeStyle = iri; c.beginPath(); c.moveTo(cx - 140, cy); c.quadraticCurveTo(cx, cy - 120, cx + 140, cy); c.quadraticCurveTo(cx, cy + 120, cx - 140, cy); c.stroke();
  c.beginPath(); c.arc(cx, cy, 46, 0, Math.PI * 2); c.fillStyle = iri; c.fill(); c.beginPath(); c.arc(cx, cy, 18, 0, Math.PI * 2); c.fillStyle = '#071018'; c.fill();
  const F = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  c.fillStyle = '#7fe3e7'; c.font = `700 26px ${F}`; c.fillText('A R G O S  ·  LABORATORIO GRC', 70, 92);
  c.fillStyle = '#ffffff'; c.font = `800 66px ${F}`; c.fillText((P.perfil.nombre || 'Analista GRC').slice(0, 26), 70, 190);
  c.fillStyle = '#c9d6e3'; c.font = `600 34px ${F}`; c.fillText(`Rango: ${r.rango.nombre} · ${r.ojos === 1 ? '1 ojo abierto' : `${r.ojos} ojos abiertos`}`, 70, 250);
  const st = [[`${P.xp.toLocaleString('es-ES')}`, 'XP'], [`${Object.keys(P.logros).length}/${E.LOGROS.length}`, 'logros'], [`${D.maquinas.filter((m) => estMaq(m.id).completada).length}/${D.maquinas.length}`, 'máquinas']];
  st.forEach(([v, k], i) => { const x = 70 + i * 220; c.fillStyle = '#ffffff'; c.font = `800 52px ${F}`; c.fillText(v, x, 350); c.fillStyle = '#93a4b5'; c.font = `600 24px ${F}`; c.fillText(k, x, 385); });
  D.rutas.forEach((ru, i) => { const pr = E.progresoRuta(ru, P); const y = 440 + i * 46; c.fillStyle = '#c9d6e3'; c.font = `600 22px ${F}`; c.fillText(ru.nombre, 70, y); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(420, y - 16, 300, 14); c.fillStyle = iri; c.fillRect(420, y - 16, 300 * pr.pct, 14); c.fillStyle = '#93a4b5'; c.fillText(pct(pr.pct), 735, y); });
  c.fillStyle = '#6b7c8d'; c.font = `500 20px ${F}`; c.fillText('Laboratorio de práctica de código abierto · no es una certificación · github.com/heindall92/argos-grc', 70, 600);
}
function textoLinkedIn() {
  const r = E.rangoDe(P.xp); const ru = D.rutas.map((x) => `${x.nombre}: ${pct(E.progresoRuta(x, P).pct)}`).join(' · ');
  return `Sigo practicando GRC con ARGOS, un laboratorio de código abierto para preparar el ENS, la ISO/IEC 27001 y la continuidad de negocio.\n\nRango actual: ${r.rango.nombre} (${P.xp} XP) · ${Object.keys(P.logros).length} logros · ${ru}\n\nEs un laboratorio de práctica, no una certificación. Si estás estudiando para alguna de estas normas, puedes usarlo gratis: https://github.com/heindall92/argos-grc\n\n#GRC #ENS #ISO27001 #Ciberseguridad`;
}
function descargarTarjeta() {
  const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 630; dibujarTarjeta(cv);
  cv.toBlob((b) => { if (!b) { toast('No se pudo generar la imagen.', 'error'); return; } descargar(b, 'argos-progreso.png'); toast('Imagen descargada'); }, 'image/png');
}
async function copiarTexto(t) {
  try { await navigator.clipboard.writeText(t); toast('Texto copiado'); }
  catch (e) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Texto copiado'); } catch (e2) { toast('No se pudo copiar', 'error'); } ta.remove(); }
}

/* ---------- Exportar e importar progreso ---------- */
function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportar() {
  descargar(new Blob([JSON.stringify({ app: 'argos', version: VERSION, exportado: new Date().toISOString(), progreso: P }, null, 2)], { type: 'application/json' }), `argos-progreso-${hoy()}.json`);
  toast('Progreso exportado');
}
function importar(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('El archivo es demasiado grande (máximo 5 MB).', 'error'); return; }
  const rd = new FileReader();
  rd.onerror = () => toast('No se pudo leer el archivo.', 'error');
  rd.onload = () => {
    let data; try { data = safeParse(String(rd.result)); } catch (e) { toast('El archivo no es un JSON válido.', 'error'); return; }
    if (!isObj(data) || data.app !== 'argos' || !isObj(data.progreso)) { toast('No es una copia de progreso de ARGOS.', 'error'); return; }
    confirmar('¿Sustituir tu progreso?', 'Se reemplazará el progreso de este navegador por el del archivo.', () => { P = sanear(data.progreso); guardar(); render(); toast('Progreso importado'); }, 'Importar');
  };
  rd.readAsText(file);
}
