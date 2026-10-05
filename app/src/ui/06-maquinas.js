/* ---------- Máquinas: casos prácticos con evidencias y flags ---------- */
const estMaq = (id) => P.maquinas[id] || { flags: [], pistas: [], intentos: 0, completada: false, fecha: '' };
const xpMaquina = (m) => m.flags.reduce((a, f) => a + E.xpFlag(f, m.dificultad, false), 0);
function tarjetaMaquina(m) {
  const st = estMaq(m.id);
  return `<button type="button" class="card machine" data-act="go" data-view="maquina" data-param="${m.id}" aria-label="${esc(m.nombre)}, dificultad ${esc(m.dificultad)}, ${st.flags.length} de ${m.flags.length} flags">
    ${st.completada ? `<span class="tag ok pwned">${icon('check', 14)}Resuelta</span>` : ''}
    <div class="m-top"><span class="m-ico" aria-hidden="true">${icon(m.icono, 26)}</span><div><h3>${esc(m.nombre)}</h3><p class="small"><span class="diff ${difCls(m.dificultad)}">${esc(m.dificultad)}</span> · <span class="muted">${xpMaquina(m)} XP</span></p></div></div>
    <p class="small muted">${esc(m.empresa)}</p>
    <div class="row spread"><div class="flags-mini" aria-hidden="true">${m.flags.map((f) => `<i class="${st.flags.includes(f.id) ? 'on' : ''}"></i>`).join('')}</div><div class="row" style="gap:6px">${m.marcos.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div></div></button>`;
}
function vMaquinas() {
  const hechas = D.maquinas.filter((m) => estMaq(m.id).completada).length;
  return `<div class="hd"><div><h1 class="lt">Máquinas</h1><p class="lt-sub">Casos prácticos al estilo de un CTF: lees el briefing, analizas las evidencias y capturas las flags. ${hechas} de ${D.maquinas.length} resueltas.</p></div></div>
    <div class="grid g3">${D.maquinas.map(tarjetaMaquina).join('')}</div>
    <p class="small muted sec">Las organizaciones, personas y datos de los casos son ficticios.</p>`;
}
function vMaquina() {
  const m = MAQ[ui.param]; const st = estMaq(m.id); const tab = Math.min(ui.evTab[m.id] || 0, m.evidencias.length - 1); const ev = m.evidencias[tab];
  return `<div class="hd"><div><button type="button" class="btn ghost sm" style="padding:0;min-height:32px" data-act="go" data-view="maquinas">${icon('chevronLeft', 16)}<span>Máquinas</span></button>
      <div class="row" style="margin-top:8px"><span class="m-ico" aria-hidden="true">${icon(m.icono, 26)}</span><div><h1 class="lt">${esc(m.nombre)}</h1><p class="small"><span class="diff ${difCls(m.dificultad)}">${esc(m.dificultad)}</span> · <span class="muted">${esc(m.empresa)} · ${st.flags.length} de ${m.flags.length} flags · ${xpMaquina(m)} XP</span></p></div></div></div>
      ${st.completada ? `<span class="tag ok" style="height:32px;padding:0 14px">${icon('checkCircle', 16)}Resuelta el ${esc(fmtFecha(st.fecha))}</span>` : ''}</div>
    <section class="card pad" aria-labelledby="h-brief"><p class="eyebrow" id="h-brief">Briefing</p><p class="brief" style="margin-top:6px">${esc(m.brief)}</p></section>
    <section class="sec" aria-labelledby="h-ev"><div class="sec-h"><h2 id="h-ev">Evidencias</h2></div>
      <div class="ev-tabs" role="tablist" aria-label="Evidencias">${m.evidencias.map((e, i) => `<button type="button" role="tab" id="evt-${i}" aria-selected="${i === tab}" aria-controls="evp" tabindex="${i === tab ? 0 : -1}" data-act="ev-tab" data-i="${i}">${esc(e.titulo.split(' · ')[0])}</button>`).join('')}</div>
      <div class="term" id="evp" role="tabpanel" aria-labelledby="evt-${tab}" tabindex="0"><span class="t-h">$ cat «${esc(ev.titulo)}»</span>${esc(ev.texto)}</div></section>
    <section class="sec" aria-labelledby="h-flags"><div class="sec-h"><h2 id="h-flags">Flags</h2><span class="small muted">Usuario: identificar el problema · Root: clasificarlo y decidir</span></div>
      <div class="stack">${m.flags.map((f) => tarjetaFlag(m, f, st)).join('')}</div></section>`;
}
function tarjetaFlag(m, f, st) {
  const capt = st.flags.includes(f.id); const pista = st.pistas.includes(f.id); const sel = ui.flagSel[f.id]; const err = ui.flagErr[f.id];
  const xp = E.xpFlag(f, m.dificultad, pista);
  const ops = opcionesFlag(f, { resp: { [f.id]: sel } }, capt);
  return `<article class="card flag${capt ? ' captured' : ''}" id="flag-${f.id}" aria-labelledby="fh-${f.id}">
    <div class="flag-h"><span class="tag ${f.tipo === 'root' ? 'bad' : 'warn'}">${icon(f.tipo === 'root' ? 'zap' : 'user', 13)}${f.tipo === 'root' ? 'root' : 'user'}</span><h3 id="fh-${f.id}">${esc(f.nombre)}</h3><span class="grow"></span><span class="small muted">${capt ? `${icon('checkCircle', 15)}` : ''}${xp} XP</span></div>
    <p class="qtext" id="fq-${f.id}">${esc(f.q)}</p><p class="qhint">${pistaTipo(f)}</p>
    ${ops}
    ${capt ? bloqueExplicacion(f) : `
      ${pista ? `<p class="legal small">${icon('lightbulb', 16)}<span>${esc(f.pista)}</span></p>` : ''}
      ${err ? `<p class="flag-err" role="alert">${esc(err)}</p>` : ''}
      <div class="row"><button type="button" class="btn primary" data-act="flag-enviar" data-id="${f.id}"${sel === undefined ? ' disabled' : ''}>${icon('flag', 17)}<span>Enviar flag</span></button>
      ${pista ? '' : `<button type="button" class="btn ghost" data-act="flag-pista" data-id="${f.id}">${icon('lightbulb', 17)}<span>Pista (la flag vale la mitad)</span></button>`}</div>`}
  </article>`;
}
function opcionesFlag(f, s, bloqueada) {
  const resp = s.resp[f.id]; const corr = E.correctas(f);
  const elegida = (oi) => (f.t === 'multiple' ? (resp || []).includes(oi) : f.t === 'vf' ? resp === (oi === 0) : resp === oi);
  const textos = f.t === 'vf' ? ['Verdadero', 'Falso'] : f.o;
  const ord = E.ordenOpciones(f, 'flag');
  return `<div class="${f.t === 'vf' ? 'vf' : 'opts'}" role="${f.t === 'multiple' ? 'group' : 'radiogroup'}" aria-labelledby="fq-${f.id}">${ord.map((oi, k) => {
    const ok = bloqueada && (f.t === 'vf' ? f.c === (oi === 0) : corr.includes(oi));
    return `<button type="button" class="opt${ok ? ' is-ok' : ''}" role="${f.t === 'multiple' ? 'checkbox' : 'radio'}" aria-checked="${bloqueada ? ok : elegida(oi)}" data-act="flag-opt" data-id="${f.id}" data-o="${oi}"${bloqueada ? ' disabled' : ''}><span class="key" aria-hidden="true">${f.t === 'vf' ? (k ? 'F' : 'V') : LETRAS[k]}</span><span>${esc(textos[oi])}</span>${ok ? icon('checkCircle', 22, 'mark') : '<span></span>'}</button>`;
  }).join('')}</div>`;
}
function flagOpt(fid, oi) {
  const f = FLAG[fid]; if (!f || estMaq(f.maquina.id).flags.includes(fid)) return;
  if (f.t === 'multiple') { const cur = new Set(ui.flagSel[fid] || []); cur.has(oi) ? cur.delete(oi) : cur.add(oi); ui.flagSel[fid] = cur.size ? [...cur] : undefined; }
  else ui.flagSel[fid] = f.t === 'vf' ? oi === 0 : oi;
  delete ui.flagErr[fid];
  render(); document.querySelector(`[data-act="flag-opt"][data-id="${fid}"][data-o="${oi}"]`)?.focus();
}
function flagPista(fid) {
  const f = FLAG[fid]; const m = f.maquina; const st = { ...estMaq(m.id) };
  if (!st.pistas.includes(fid)) st.pistas = [...st.pistas, fid];
  P.maquinas[m.id] = st; guardar(); render();
  document.querySelector(`#flag-${fid} .legal`)?.scrollIntoView({ block: 'nearest' });
}
function flagEnviar(fid) {
  const f = FLAG[fid]; const m = f.maquina; const resp = ui.flagSel[fid]; if (resp === undefined) return;
  const st = { ...estMaq(m.id), flags: [...estMaq(m.id).flags] }; st.intentos++;
  const ok = E.evaluar(f, resp);
  const d = diaHoy(); d.preguntas++;
  if (!ok) {
    ui.flagErr[fid] = 'Flag incorrecta. Revisa las evidencias y vuelve a intentarlo.';
    P.maquinas[m.id] = st; guardar(); render();
    const card = document.getElementById('flag-' + fid); card?.classList.add('shake'); card?.querySelector('[data-act="flag-enviar"]')?.focus();
    return;
  }
  st.flags.push(fid); delete ui.flagSel[fid]; delete ui.flagErr[fid];
  const xp = sumarXp(E.xpFlag(f, m.dificultad, st.pistas.includes(fid)));
  st.completada = st.flags.length === m.flags.length; if (st.completada) st.fecha = hoy();
  P.maquinas[m.id] = st;
  const nuevos = revisarLogros(); guardar(); render();
  toast(st.completada ? `¡Máquina resuelta! +${xp} XP` : `Flag capturada · +${xp} XP`);
  document.getElementById('flag-' + fid)?.focus?.();
  celebrar(nuevos);
}
