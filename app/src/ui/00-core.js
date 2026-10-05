/* ---------- Núcleo: datos, almacenamiento y progreso ---------- */
const D = window.ARGOS_DATA;
const E = window.ArgosEngine;
const VERSION = D.version;
const IDX = E.indexar(D.rutas);
const RUTA = Object.fromEntries(D.rutas.map((r) => [r.id, r]));
const SALA = Object.fromEntries(D.rutas.flatMap((r) => r.salas.map((s) => [s.id, { ...s, ruta: r }])));
const MAQ = Object.fromEntries(D.maquinas.map((m) => [m.id, m]));
const SIM = Object.fromEntries(D.simulacros.map((s) => [s.id, s]));
const FLAG = Object.fromEntries(D.maquinas.flatMap((m) => m.flags.map((f) => [f.id, { ...f, maquina: m }])));

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (x) => Math.round((Number(x) || 0) * 100) + ' %';
const plural = (n, s, p) => `${n.toLocaleString('es-ES')} ${n === 1 ? s : p}`;
const hoy = () => E.dia(new Date());
const fmtFecha = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }); };
const iniciales = (n) => String(n || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'A';
const LETRAS = ['A', 'B', 'C', 'D', 'E'];
const COLORES = ['teal', 'indigo', 'violet', 'rose', 'amber', 'green'];
const RUTA_CLS = { ens: 'ens', iso27001: 'iso', continuidad: 'cont' };

/* ---------- Almacenamiento: localStorage si está disponible; si no, memoria ---------- */
const MEM = {};
let avisoGuardado = false;
const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? safeParse(v) : (MEM[k] ?? null); } catch (e) { return MEM[k] ?? null; } },
  set(k, v) {
    MEM[k] = v;
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {
      if (!avisoGuardado) { avisoGuardado = true; setTimeout(() => toast('Este navegador no permite guardar. Exporta tu progreso para no perderlo.', 'error'), 0); }
    }
  },
  del(k) { delete MEM[k]; try { localStorage.removeItem(k); } catch (e) { /* nada */ } }
};
const KEY = 'argos/v1/progreso';

/* ---------- Progreso: todo lo que entra (almacenamiento o importación) se valida ---------- */
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function safeParse(text) { return JSON.parse(text, (k, v) => (BAD_KEYS.has(k) ? undefined : v)); }
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v, max = 80) => (typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max) : '');
const num = (v, min, max, def = min) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def; };
const fecha = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) ? v : '');
const okKey = (o, k, set) => Object.prototype.hasOwnProperty.call(o, k) && !BAD_KEYS.has(k) && set.has(k);

function nuevoProgreso() {
  return { v: 1, perfil: { nombre: '', color: 'teal' }, ajustes: { tema: 'sistema', meta: 100 }, xp: 0, respuestas: {}, salas: {}, maquinas: {}, simulacros: {}, dias: {}, logros: {}, repasosOk: 0, creado: hoy() };
}
function sanear(raw) {
  const r = isObj(raw) ? raw : {}; const p = nuevoProgreso();
  const pf = isObj(r.perfil) ? r.perfil : {};
  p.perfil = { nombre: str(pf.nombre, 60), color: COLORES.includes(pf.color) ? pf.color : 'teal' };
  const aj = isObj(r.ajustes) ? r.ajustes : {};
  p.ajustes = { tema: ['sistema', 'claro', 'oscuro'].includes(aj.tema) ? aj.tema : 'sistema', meta: [50, 100, 200].includes(aj.meta) ? aj.meta : 100 };
  p.xp = Math.round(num(r.xp, 0, 1e6, 0));
  p.repasosOk = Math.round(num(r.repasosOk, 0, 1e6, 0));
  p.creado = fecha(r.creado) || hoy();
  const qids = new Set(IDX.preguntas.keys());
  if (isObj(r.respuestas)) for (const k of Object.keys(r.respuestas)) {
    const e = r.respuestas[k]; if (!okKey(r.respuestas, k, qids) || !isObj(e)) continue;
    p.respuestas[k] = { caja: Math.round(num(e.caja, 0, 5, 0)), aciertos: Math.round(num(e.aciertos, 0, 1e5, 0)), fallos: Math.round(num(e.fallos, 0, 1e5, 0)), due: fecha(e.due), ultima: fecha(e.ultima) };
  }
  const sids = new Set(Object.keys(SALA));
  if (isObj(r.salas)) for (const k of Object.keys(r.salas)) {
    const e = r.salas[k]; if (!okKey(r.salas, k, sids) || !isObj(e)) continue;
    p.salas[k] = { mejor: num(e.mejor, 0, 1, 0), intentos: Math.round(num(e.intentos, 0, 1e5, 0)), ultima: fecha(e.ultima) };
  }
  const mids = new Set(Object.keys(MAQ));
  if (isObj(r.maquinas)) for (const k of Object.keys(r.maquinas)) {
    const e = r.maquinas[k]; if (!okKey(r.maquinas, k, mids) || !isObj(e)) continue;
    const fids = new Set(MAQ[k].flags.map((f) => f.id));
    const lista = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && fids.has(x)))] : []);
    const flags = lista(e.flags);
    p.maquinas[k] = { flags, pistas: lista(e.pistas), intentos: Math.round(num(e.intentos, 0, 1e5, 0)), completada: flags.length === fids.size, fecha: fecha(e.fecha) };
  }
  const simids = new Set(Object.keys(SIM));
  if (isObj(r.simulacros)) for (const k of Object.keys(r.simulacros)) {
    const e = r.simulacros[k]; if (!okKey(r.simulacros, k, simids) || !isObj(e)) continue;
    const hist = Array.isArray(e.historial) ? e.historial.slice(-20).filter(isObj).map((h) => ({ fecha: fecha(h.fecha), nota: num(h.nota, 0, 1, 0), ok: Math.round(num(h.ok, 0, 500, 0)), total: Math.round(num(h.total, 0, 500, 0)), seg: Math.round(num(h.seg, 0, 86400, 0)) })) : [];
    p.simulacros[k] = { mejor: num(e.mejor, 0, 1, 0), aprobado: e.aprobado === true, intentos: Math.round(num(e.intentos, 0, 1e5, 0)), historial: hist };
  }
  if (isObj(r.dias)) for (const k of Object.keys(r.dias).slice(-800)) {
    const e = r.dias[k]; if (BAD_KEYS.has(k) || !fecha(k) || !isObj(e)) continue;
    p.dias[k] = { xp: Math.round(num(e.xp, 0, 1e5, 0)), preguntas: Math.round(num(e.preguntas, 0, 1e5, 0)), repasos: Math.round(num(e.repasos, 0, 1e5, 0)) };
  }
  const lids = new Set(E.LOGROS.map((l) => l.id));
  // Solo se conservan los logros que el progreso saneado justifica: no se pueden «regalar» editando el almacenamiento o un JSON
  const cumplidos = E.logrosCumplidos(p, D, hoy());
  if (isObj(r.logros)) for (const k of Object.keys(r.logros)) if (okKey(r.logros, k, lids) && cumplidos.has(k)) p.logros[k] = fecha(r.logros[k]) || hoy();
  return p;
}

let P = sanear(store.get(KEY));
const guardar = () => store.set(KEY, P);

/* ---------- Estado de la interfaz ---------- */
const ui = { view: 'hoy', param: null, sesion: null, evTab: {}, flagSel: {}, flagErr: {}, helpTab: 'como', modal: null, tick: null };

/* ---------- Registro de actividad y recompensas ---------- */
const diaHoy = () => { const d = hoy(); P.dias[d] = P.dias[d] || { xp: 0, preguntas: 0, repasos: 0 }; return P.dias[d]; };
function sumarXp(n) { if (!n) return 0; P.xp += n; diaHoy().xp += n; return n; }
/* Registra una respuesta: actualiza la caja de repaso y devuelve los XP ganados (solo el primer acierto de cada pregunta da XP completos) */
function registrarRespuesta(qid, acierto, modo) {
  const q = IDX.preguntas.get(qid); const previo = P.respuestas[qid]; const primerAcierto = acierto && !(previo && previo.aciertos > 0);
  P.respuestas[qid] = E.repasar(previo, acierto, hoy());
  const d = diaHoy(); d.preguntas++;
  let xp = 0;
  if (modo === 'repaso') { d.repasos++; if (acierto) { P.repasosOk++; xp = sumarXp(E.XP.repaso); } }
  else if (primerAcierto && modo !== 'simulacro') xp = sumarXp(E.xpPregunta(q));
  return xp;
}
/* Comprueba logros nuevos; los registra y los devuelve para celebrarlos */
function revisarLogros() {
  const nuevos = E.logrosNuevos(P, D, hoy());
  for (const id of nuevos) P.logros[id] = hoy();
  return nuevos;
}
function aplicarTema() {
  const t = P.ajustes.tema; const el = document.documentElement;
  if (t === 'claro') el.setAttribute('data-theme', 'light'); else if (t === 'oscuro') el.setAttribute('data-theme', 'dark'); else el.removeAttribute('data-theme');
}
