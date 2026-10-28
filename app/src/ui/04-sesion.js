/* ---------- Recuperación: el checkpoint y las recompensas se guardan juntos ---------- */
function copiaSesion(s) {
  if (!s || s.estado !== 'jugando') return null;
  const { modo, id, titulo, ids, i, seed, resp, comprobada, xpQ, inicio, fin, marcadas } = s;
  return { v: 1, banco: VERSION, modo, id, titulo, ids, i, seed, resp, comprobada, xpQ, inicio, fin, marcadas };
}
function sanearSesion(raw) {
  if (!isObj(raw) || raw.v !== 1 || raw.banco !== VERSION || !['sala', 'repaso', 'simulacro'].includes(raw.modo)) return null;
  const { modo, id } = raw;
  if ((modo === 'sala' && !SALA[id]) || (modo === 'simulacro' && !SIM[id]) || (modo === 'repaso' && id !== 'repaso')) return null;
  if (!Array.isArray(raw.ids) || !raw.ids.length || raw.ids.length > 200 || new Set(raw.ids).size !== raw.ids.length) return null;
  const ids = raw.ids;
  const elegibles = modo === 'sala' ? SALA[id].preguntas.map((q) => q.id) : modo === 'simulacro' ? E.preguntasDeSimulacro(D.rutas, SIM[id]).flatMap((s) => s.preguntas.map((q) => q.id)) : [...IDX.preguntas.keys()];
  if (!ids.every((qid) => elegibles.includes(qid)) || (modo === 'sala' && ids.length !== elegibles.length) || (modo === 'simulacro' && ids.length !== SIM[id].n) || (modo === 'repaso' && ids.length > 20)) return null;
  if (!Number.isInteger(raw.i) || raw.i < 0 || raw.i >= ids.length || typeof raw.seed !== 'string' || !raw.seed || raw.seed.length > 80) return null;
  if (!Number.isSafeInteger(raw.inicio) || raw.inicio <= 0 || raw.inicio > Date.now()) return null;
  if (modo === 'simulacro' && raw.fin !== raw.inicio + SIM[id].minutos * 60000) return null;
  const resp = {}; const comprobada = {}; const xpQ = {};
  for (const qid of ids) {
    const q = IDX.preguntas.get(qid); const r = isObj(raw.resp) ? raw.resp[qid] : undefined;
    if (r !== undefined) {
      const opcion = (n) => Number.isInteger(n) && n >= 0 && n < q.o.length;
      if (q.t === 'vf' ? typeof r !== 'boolean' : q.t === 'multiple' ? !Array.isArray(r) || !r.length || !r.every(opcion) || new Set(r).size !== r.length : !opcion(r)) return null;
      resp[qid] = r;
    }
    if (modo !== 'simulacro' && isObj(raw.comprobada) && typeof raw.comprobada[qid] === 'boolean') {
      if (r === undefined) return null;
      comprobada[qid] = E.evaluar(q, r);
      xpQ[qid] = num(raw.xpQ?.[qid], 0, modo === 'repaso' ? E.XP.repaso : E.xpPregunta(q), 0);
    }
  }
  if (modo !== 'simulacro' && ids.some((qid, i) => i < raw.i ? comprobada[qid] === undefined : i > raw.i && comprobada[qid] !== undefined)) return null;
  const titulo = modo === 'sala' ? SALA[id].nombre : modo === 'simulacro' ? SIM[id].nombre : 'Repaso espaciado';
  return { modo, id, titulo, ids: [...ids], i: raw.i, seed: raw.seed, resp, comprobada, xpQ, xp: Object.values(xpQ).reduce((a, n) => a + n, 0), aciertos: Object.values(comprobada).filter(Boolean).length, inicio: raw.inicio, fin: raw.fin, marcadas: Array.isArray(raw.marcadas) ? [...new Set(raw.marcadas.filter((qid) => ids.includes(qid)))] : [], estado: 'jugando', logros: [] };
}
function recuperarSesion() {
  if (!P.sesion) return;
  ui.sesion = P.sesion;
  document.body.style.overflow = 'hidden';
  render();
  if (ui.sesion.modo === 'simulacro') {
    if (ui.sesion.fin <= Date.now()) { finalizar(); toast('El simulacro venció mientras estabas fuera. Se ha corregido.'); return; }
    arrancarReloj();
  }
  enfocarPregunta();
  toast('Sesión recuperada. Continúas donde lo dejaste.');
}
