/* ---------- Rutas y salas ---------- */
function tarjetaRuta(r) {
  const pr = E.progresoRuta(r, P); const cls = RUTA_CLS[r.id];
  return `<button type="button" class="card route-card" data-act="go" data-view="ruta" data-param="${r.id}" aria-label="${esc(r.nombre)}: ${pr.superadas} de ${pr.salas} salas superadas">
    <div class="row">${glyph(r.id)}<div class="grow"><p class="eyebrow">${plural(r.salas.length, 'sala', 'salas')} · ${pr.total} preguntas</p><h3>${esc(r.nombre)}</h3></div></div>
    <p>${esc(r.descripcion)}</p>
    ${barra(pr.pct, cls)}
    <div class="route-meta"><span>${pr.superadas} de ${pr.salas} salas superadas</span><span>${pct(pr.pct)} dominado</span></div></button>`;
}
function vRutas() {
  const total = D.rutas.reduce((a, r) => a + E.progresoRuta(r, P).total, 0);
  return `<div class="hd"><div><h1 class="lt">Rutas</h1><p class="lt-sub">${plural(total, 'pregunta', 'preguntas')} en ${D.rutas.length} rutas. Cada ruta se divide en salas: supera una sala con un 80 % y desbloquea su medalla.</p></div></div>
    <div class="grid g3">${D.rutas.map(tarjetaRuta).join('')}</div>
    <section class="sec"><div class="legal">${icon('info', 18)}<span>Las preguntas son de elaboración propia. Las del ENS citan el texto literal del Real Decreto 311/2022, publicado en el BOE; las de ISO/IEC 27001 e ISO 22301 explican los conceptos con palabras propias y citan la cláusula o el control, sin reproducir el texto de las normas.</span></div></section>`;
}
function vRuta() {
  const r = RUTA[ui.param]; const pr = E.progresoRuta(r, P); const cls = RUTA_CLS[r.id];
  return `<div class="hd"><div><button type="button" class="btn ghost sm" style="padding:0;min-height:32px" data-act="go" data-view="rutas">${icon('chevronLeft', 16)}<span>Rutas</span></button>
      <div class="row" style="margin-top:8px">${glyph(r.id, 26)}<h1 class="lt">${esc(r.nombre)}</h1></div>
      <p class="lt-sub">${esc(r.descripcion)}</p><p class="small muted" style="margin-top:6px">Fuentes: ${esc(r.fuente)}</p></div></div>
    <div class="card pad" style="margin-bottom:18px"><div class="row spread"><b>${pr.superadas} de ${pr.salas} salas superadas</b><span class="small muted">${pr.dominadas} de ${pr.total} preguntas dominadas</span></div><div style="margin-top:10px">${barra(pr.pct, cls)}</div></div>
    <ol class="path" aria-label="Salas de la ruta">${r.salas.map((s, i) => {
      const st = P.salas[s.id]; const done = st && st.mejor >= 0.8; const dom = s.preguntas.filter((q) => P.respuestas[q.id] && P.respuestas[q.id].aciertos > 0).length;
      return `<li class="card room${done ? ' done' : st ? ' part' : ''}"><span class="node" aria-hidden="true">${done ? icon('check', 22) : i + 1}</span>
        <div><h3>${esc(s.nombre)}</h3><p>${esc(s.resumen)}</p><div class="score"><span>${plural(s.preguntas.length, 'pregunta', 'preguntas')}</span>${st ? `<span>Mejor: <b>${pct(st.mejor)}</b></span><span>${plural(st.intentos, 'intento', 'intentos')}</span>` : ''}<span>${dom} dominadas</span></div></div>
        <button type="button" class="btn ${done ? '' : 'primary'}" data-act="sala" data-id="${s.id}" aria-label="${done ? 'Repetir' : st ? 'Continuar' : 'Empezar'} la sala ${esc(s.nombre)}">${done ? icon('refresh', 17) : icon('arrowRight', 17)}<span>${done ? 'Repetir' : st ? 'Reintentar' : 'Empezar'}</span></button></li>`;
    }).join('')}</ol>`;
}
