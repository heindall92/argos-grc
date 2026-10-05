/* ---------- Jugador en modo foco: salas, repaso espaciado y simulacros ---------- */
function nuevaSesion(modo, id, titulo, ids, extra = {}) {
  ui.sesion = { modo, id, titulo, ids, i: 0, seed: `${Date.now()}`, resp: {}, comprobada: {}, xpQ: {}, xp: 0, aciertos: 0, marcadas: [], inicio: Date.now(), estado: 'jugando', logros: [], ...extra };
  document.body.style.overflow = 'hidden';
  render();
  enfocarPregunta();
}
function iniciarSala(id) {
  const s = SALA[id]; if (!s) return;
  nuevaSesion('sala', id, s.nombre, E.barajar(s.preguntas.map((q) => q.id), `${Date.now()}|${id}`));
}
function iniciarRepaso() {
  const ids = E.pendientes(P.respuestas, hoy()).slice(0, 20);
  if (!ids.length) { toast('No tienes preguntas pendientes de repaso. ¡Al día!'); return; }
  nuevaSesion('repaso', 'repaso', 'Repaso espaciado', ids);
}
function iniciarSimulacro(id) {
  const sim = SIM[id]; if (!sim) return;
  const ids = E.generarSimulacro(D.rutas, sim, `${Date.now()}|${id}`);
  nuevaSesion('simulacro', id, sim.nombre, ids, { fin: Date.now() + sim.minutos * 60000 });
  arrancarReloj();
}
function cerrarSesion() {
  ui.sesion = null; clearInterval(ui.tick); ui.tick = null; document.body.style.overflow = '';
  render();
}
function salir() {
  const s = ui.sesion; if (!s) return;
  if (s.estado === 'resumen' || !Object.keys(s.resp).length) { cerrarSesion(); return; }
  confirmar('¿Salir?', s.modo === 'simulacro' ? 'Si sales ahora, el simulacro no se corrige ni cuenta.' : 'Lo que ya has respondido queda guardado, pero la sala no se puntuará hasta que la termines.', () => cerrarSesion(), 'Salir', true);
}
const qActual = () => IDX.preguntas.get(ui.sesion.ids[ui.sesion.i]);
const orden = (q) => E.ordenOpciones(q, ui.sesion.seed);

/* ---------- Respuestas ---------- */
function seleccionar(origIdx) {
  const s = ui.sesion; const q = qActual();
  if (s.modo !== 'simulacro' && s.comprobada[q.id] !== undefined) return;
  if (q.t === 'multiple') { const cur = new Set(s.resp[q.id] || []); cur.has(origIdx) ? cur.delete(origIdx) : cur.add(origIdx); s.resp[q.id] = [...cur]; if (!s.resp[q.id].length) delete s.resp[q.id]; }
  else if (q.t === 'vf') s.resp[q.id] = origIdx === 0;
  else s.resp[q.id] = origIdx;
  renderPlayer();
  document.querySelector(`.opt[data-o="${origIdx}"]`)?.focus();
}
function comprobar() {
  const s = ui.sesion; const q = qActual();
  if (s.resp[q.id] === undefined || s.comprobada[q.id] !== undefined) return;
  const ok = E.evaluar(q, s.resp[q.id]);
  s.comprobada[q.id] = ok; if (ok) s.aciertos++;
  const g = registrarRespuesta(q.id, ok, s.modo); s.xpQ[q.id] = g; s.xp += g;
  guardar();
  renderPlayer(); renderTop();
  document.querySelector('.player-foot [data-act="p-next"]')?.focus();
}
function siguiente() {
  const s = ui.sesion;
  if (s.i + 1 < s.ids.length) { s.i++; renderPlayer(); enfocarPregunta(); } else finalizar();
}
function irA(i) { const s = ui.sesion; if (i < 0 || i >= s.ids.length) return; s.i = i; renderPlayer(); enfocarPregunta(); }
function marcar() { const s = ui.sesion; const id = s.ids[s.i]; s.marcadas = s.marcadas.includes(id) ? s.marcadas.filter((x) => x !== id) : [...s.marcadas, id]; renderPlayer(); }
function enfocarPregunta() { setTimeout(() => document.getElementById('qtext')?.focus({ preventScroll: true }), 0); }

/* ---------- Cierre y puntuación ---------- */
function finalizar() {
  const s = ui.sesion; const hoyD = hoy();
  if (s.modo === 'simulacro') {
    clearInterval(ui.tick); ui.tick = null;
    const sim = SIM[s.id]; const res = E.corregirSimulacro(IDX, s.ids, s.resp, sim);
    for (const id of s.ids) if (s.resp[id] !== undefined) registrarRespuesta(id, E.evaluar(IDX.preguntas.get(id), s.resp[id]), 'simulacro');
    const st = P.simulacros[s.id] || { mejor: 0, aprobado: false, intentos: 0, historial: [] };
    const primeraVez = res.aprobado && !st.aprobado;
    st.intentos++; st.mejor = Math.max(st.mejor, res.nota); st.aprobado = st.aprobado || res.aprobado;
    st.historial = [...st.historial, { fecha: hoyD, nota: res.nota, ok: res.ok, total: res.total, seg: Math.round((Date.now() - s.inicio) / 1000) }].slice(-20);
    P.simulacros[s.id] = st;
    if (primeraVez) s.xp += sumarXp(E.xpSimulacro(sim));
    s.resultado = { ...res, primeraVez, seg: Math.round((Date.now() - s.inicio) / 1000) };
  } else if (s.modo === 'sala') {
    const nota = s.ids.length ? s.aciertos / s.ids.length : 0;
    const st = P.salas[s.id] || { mejor: 0, intentos: 0, ultima: '' };
    const bonus = (nota >= 0.8 && st.mejor < 0.8 ? E.XP.sala : 0) + (nota >= 1 && st.mejor < 1 ? E.XP.salaPerfecta : 0);
    st.intentos++; st.mejor = Math.max(st.mejor, nota); st.ultima = hoyD; P.salas[s.id] = st;
    s.xp += sumarXp(bonus);
    s.resultado = { nota, ok: s.aciertos, total: s.ids.length, bonus, superada: nota >= 0.8 };
  } else {
    s.resultado = { nota: s.ids.length ? s.aciertos / s.ids.length : 0, ok: s.aciertos, total: s.ids.length };
  }
  s.logros = revisarLogros();
  s.estado = 'resumen';
  guardar(); render();
  setTimeout(() => document.getElementById('res-h')?.focus(), 0);
  celebrar(s.logros);
}
function arrancarReloj() {
  clearInterval(ui.tick);
  ui.tick = setInterval(() => {
    const s = ui.sesion; if (!s || s.modo !== 'simulacro' || s.estado !== 'jugando') { clearInterval(ui.tick); return; }
    const el = document.getElementById('timer'); const rest = s.fin - Date.now();
    if (rest <= 0) { toast('Se acabó el tiempo. Corregimos lo que has respondido.'); finalizar(); return; }
    if (el) { el.textContent = mmss(rest); el.parentElement.classList.toggle('low', rest < 5 * 60000); }
  }, 1000);
}
const mmss = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

/* ---------- Pintado ---------- */
function opciones(q, s, bloqueada) {
  const resp = s.resp[q.id]; const corr = E.correctas(q);
  const elegida = (oi) => (q.t === 'multiple' ? (resp || []).includes(oi) : q.t === 'vf' ? resp === (oi === 0) : resp === oi);
  const esCorrecta = (oi) => (q.t === 'vf' ? q.c === (oi === 0) : corr.includes(oi));
  const textos = q.t === 'vf' ? ['Verdadero', 'Falso'] : q.o;
  const role = q.t === 'multiple' ? 'checkbox' : 'radio';
  const items = orden(q).map((oi, k) => {
    let cls = ''; let sr = '';
    if (bloqueada) {
      if (esCorrecta(oi) && elegida(oi)) { cls = ' is-ok'; sr = ' (correcta, la elegiste)'; }
      else if (elegida(oi)) { cls = ' is-bad'; sr = ' (incorrecta, la elegiste)'; }
      else if (esCorrecta(oi)) { cls = q.t === 'multiple' ? ' is-missed' : ' is-ok'; sr = ' (era correcta)'; }
    }
    const mark = bloqueada && (cls.includes('ok') || cls.includes('missed')) ? icon('checkCircle', 22, 'mark') : bloqueada && cls.includes('bad') ? icon('xCircle', 22, 'mark') : '<span></span>';
    return `<button type="button" class="opt${cls}" role="${role}" aria-checked="${elegida(oi)}" data-act="p-opt" data-o="${oi}"${bloqueada ? ' disabled' : ''}><span class="key" aria-hidden="true">${q.t === 'vf' ? (k === 0 ? 'V' : 'F') : LETRAS[k]}</span><span>${esc(textos[oi])}<span class="sr">${sr}</span></span>${mark}</button>`;
  }).join('');
  return `<div class="${q.t === 'vf' ? 'vf' : 'opts'}" role="${q.t === 'multiple' ? 'group' : 'radiogroup'}" aria-labelledby="qtext">${items}</div>`;
}
function cabeceraPregunta(q, conSala) {
  const rid = IDX.rutaDe.get(q.id); const sala = SALA[IDX.salaDe.get(q.id)];
  return `<div class="qmeta">${tagRuta(rid)}${conSala ? `<span class="tag">${esc(sala.nombre)}</span>` : ''}<span class="tag" title="Dificultad">${'●'.repeat(q.d)}${'○'.repeat(3 - q.d)}<span class="sr">Dificultad ${q.d} de 3</span></span></div>`;
}
const pistaTipo = (q) => (q.t === 'multiple' ? 'Elige todas las correctas.' : q.t === 'vf' ? '¿Verdadero o falso?' : 'Elige una respuesta.');
function bloqueExplicacion(q, desplazable = false) {
  return `<div class="explain"${desplazable ? ' tabindex="0" role="region" aria-label="Explicación"' : ''}><p>${esc(q.x)}</p><p class="ref">${icon('bookmark', 15)}<span>${esc(q.ref)}</span></p>${q.cita ? `<blockquote class="cita"><b>Texto literal (BOE)</b>${esc(q.cita)}</blockquote>` : ''}</div>`;
}
function renderPlayer() {
  const el = $('#player'); const s = ui.sesion;
  if (!s) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  if (s.estado === 'resumen') { el.innerHTML = resumen(s); return; }
  const q = qActual(); const sim = s.modo === 'simulacro';
  const hecha = s.comprobada[q.id] !== undefined; const elegida = s.resp[q.id] !== undefined;
  const progreso = sim ? Object.keys(s.resp).length / s.ids.length : (s.i + (hecha ? 1 : 0)) / s.ids.length;
  const top = `<div class="player-top"><button type="button" class="icon-btn" data-act="p-salir" aria-label="Salir">${icon('x', 22)}</button>
    ${barra(progreso, 'iri')}<span class="count">${s.i + 1} / ${s.ids.length}</span>
    ${sim ? `<span class="timer" aria-label="Tiempo restante">${icon('timer', 16)}<span id="timer">${mmss(s.fin - Date.now())}</span></span>` : ''}</div>`;
  const body = `<div class="player-body" tabindex="0" role="region" aria-label="Pregunta ${s.i + 1} de ${s.ids.length}"><div class="qwrap">
    <p class="eyebrow">${esc(s.titulo)}</p>${cabeceraPregunta(q, s.modo !== 'sala')}
    <h2 class="qtext" id="qtext" tabindex="-1">${esc(q.q)}</h2><p class="qhint">${pistaTipo(q)}</p>
    ${opciones(q, s, !sim && hecha)}
    ${sim ? `<details class="card pad" style="margin-top:8px"><summary class="small" style="cursor:pointer;font-weight:600">Navegador de preguntas · ${Object.keys(s.resp).length} respondidas${s.marcadas.length ? ` · ${s.marcadas.length} marcadas` : ''}</summary>
      <div class="navgrid" style="margin-top:12px">${s.ids.map((id, i) => `<button type="button" data-act="p-ir" data-i="${i}" class="${s.resp[id] !== undefined ? 'ans' : ''}${s.marcadas.includes(id) ? ' flagged' : ''}" aria-current="${i === s.i}" aria-label="Pregunta ${i + 1}${s.resp[id] !== undefined ? ', respondida' : ''}${s.marcadas.includes(id) ? ', marcada' : ''}">${i + 1}</button>`).join('')}</div></details>` : ''}
  </div></div>`;
  let foot;
  if (sim) {
    foot = `<div class="player-foot"><div class="foot-in"><div class="row spread">
      <button type="button" class="btn" data-act="p-prev"${s.i === 0 ? ' disabled' : ''}>${icon('chevronLeft', 18)}<span>Anterior</span></button>
      <button type="button" class="btn ghost" data-act="p-marcar" aria-pressed="${s.marcadas.includes(q.id)}">${icon('bookmark', 17)}<span>${s.marcadas.includes(q.id) ? 'Marcada' : 'Marcar'}</span></button>
      ${s.i + 1 < s.ids.length ? `<button type="button" class="btn primary" data-act="p-sig">${'<span>Siguiente</span>' + icon('chevronRight', 18)}</button>` : `<button type="button" class="btn primary" data-act="p-entregar">${icon('check', 18)}<span>Entregar</span></button>`}
    </div><button type="button" class="btn ghost sm" data-act="p-entregar">Entregar ahora (${Object.keys(s.resp).length} de ${s.ids.length} respondidas)</button></div></div>`;
  } else if (!hecha) {
    foot = `<div class="player-foot"><div class="foot-in"><button type="button" class="btn primary lg block" data-act="p-check"${elegida ? '' : ' disabled'}>Comprobar</button></div></div>`;
  } else {
    const ok = s.comprobada[q.id]; const ganado = s.xpQ[q.id] || 0;
    foot = `<div class="player-foot ${ok ? 'ok' : 'bad'}" role="region" aria-label="Resultado"><div class="foot-in" aria-live="polite">
      <div class="verdict ${ok ? 'ok' : 'bad'}">${icon(ok ? 'checkCircle' : 'xCircle', 26)}<span>${ok ? '¡Correcto!' : 'No es correcto'}</span>${ganado ? `<span class="xp">+${ganado} XP</span>` : ''}</div>
      ${bloqueExplicacion(q, true)}
      <button type="button" class="btn primary lg block" data-act="p-next">${s.i + 1 < s.ids.length ? 'Continuar' : 'Ver resultado'}</button></div></div>`;
  }
  el.innerHTML = `<div class="player" role="dialog" aria-modal="true" aria-label="${esc(s.titulo)}">${top}${body}${foot}</div>`;
}
function resumen(s) {
  const r = s.resultado; const sim = s.modo === 'simulacro'; const okNota = sim ? r.aprobado : s.modo === 'sala' ? r.superada : r.nota >= 0.8;
  const titulo = sim ? (r.aprobado ? 'Simulacro aprobado' : 'Simulacro no superado') : s.modo === 'sala' ? (r.nota >= 1 ? 'Sala perfecta' : r.superada ? 'Sala superada' : 'Casi lo tienes') : 'Repaso completado';
  const sub = sim ? `Necesitabas un ${pct(SIM[s.id].aprobado)}.${r.primeraVez ? ` Primer aprobado: +${E.xpSimulacro(SIM[s.id])} XP.` : ''}` : s.modo === 'sala' ? (r.superada ? (r.bonus ? `Bonificación: +${r.bonus} XP.` : 'Ya la habías superado antes.') : 'Necesitas un 80 % para superarla. Las que fallaste volverán en el repaso.') : 'Las que fallaste vuelven a la primera caja y siguen en tu repaso.';
  const fallos = s.ids.filter((id) => (sim ? !(s.resp[id] !== undefined && E.evaluar(IDX.preguntas.get(id), s.resp[id])) : s.comprobada[id] === false));
  const porSala = sim ? Object.entries(r.porSala).map(([sid, v]) => `<div class="row spread small" style="padding:6px 0"><span>${esc(SALA[sid].nombre)}</span><b>${v.ok} / ${v.total}</b></div>`).join('') : '';
  return `<div class="player" role="dialog" aria-modal="true" aria-label="Resultado"><div class="player-top"><button type="button" class="icon-btn" data-act="p-cerrar" aria-label="Cerrar">${icon('x', 22)}</button><div class="grow"></div></div>
    <div class="player-body" tabindex="0" role="region" aria-label="Resultado"><div class="result">
      ${eyeMedal(E.rangoDe(P.xp).ojos, 88)}
      <p class="big${okNota ? ' ok' : ''}">${pct(r.nota)}</p>
      <h2 id="res-h" tabindex="-1" style="font:700 1.6rem/1.2 var(--f-d)">${titulo}</h2><p class="muted">${sub}</p>
      <div class="stats3"><div class="stat"><div class="v">${r.ok}/${r.total}</div><div class="k">Aciertos</div></div><div class="stat"><div class="v">+${s.xp}</div><div class="k">XP ganados</div></div><div class="stat"><div class="v">${sim ? mmss(r.seg * 1000) : s.logros.length}</div><div class="k">${sim ? 'Tiempo' : 'Logros nuevos'}</div></div></div>
      ${sim ? `<div class="card pad" style="width:100%;text-align:left"><b>Resultado por sala</b>${porSala}</div>` : ''}
      ${fallos.length ? `<div class="review"><h3 style="font:700 1.1rem var(--f-d)">Revisa ${fallos.length === 1 ? 'tu fallo' : `tus ${fallos.length} fallos`}</h3>${fallos.map((id) => { const q = IDX.preguntas.get(id); const t = q.t === 'vf' ? (q.c ? 'Verdadero' : 'Falso') : E.correctas(q).map((i) => q.o[i]).join(' · '); return `<details><summary>${icon('xCircle', 18)}<span>${esc(q.q)}</span></summary><div class="body"><p><b>Respuesta correcta:</b> ${esc(t)}</p>${bloqueExplicacion(q)}</div></details>`; }).join('')}</div>` : ''}
      <div class="row" style="justify-content:center">${s.modo === 'sala' ? `<button type="button" class="btn" data-act="sala" data-id="${s.id}">${icon('refresh', 17)}<span>Repetir sala</span></button>` : ''}${sim ? `<button type="button" class="btn" data-act="simulacro" data-id="${s.id}">${icon('refresh', 17)}<span>Otro intento</span></button>` : ''}<button type="button" class="btn primary" data-act="p-cerrar">Hecho</button></div>
    </div></div></div>`;
}
