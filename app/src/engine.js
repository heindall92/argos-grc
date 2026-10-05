/* ARGOS · Motor del laboratorio (sin DOM; se prueba con node:test).
 *  - Corrección de respuestas y puntos de experiencia (XP).
 *  - Rangos («ojos abiertos»), logros (badges) y racha diaria.
 *  - Repaso espaciado por cajas de Leitner.
 *  - Simulacros con barajado determinista por semilla.
 *  - Validación del banco de preguntas (lo usan la construcción y las pruebas). */
(function (root) {
  'use strict';

  /* ---------- Rangos: los cien ojos de Argos ---------- */
  const RANGOS = [
    { ojos: 1, xp: 0, nombre: 'Primer ojo', lema: 'Empiezas a mirar el sistema.' },
    { ojos: 5, xp: 150, nombre: '5 ojos', lema: 'Reconoces los marcos y su vocabulario.' },
    { ojos: 10, xp: 450, nombre: '10 ojos', lema: 'Relacionas requisitos con controles.' },
    { ojos: 25, xp: 1000, nombre: '25 ojos', lema: 'Sabes qué evidencia pedir.' },
    { ojos: 50, xp: 1800, nombre: '50 ojos', lema: 'Detectas no conformidades a la primera.' },
    { ojos: 75, xp: 3000, nombre: '75 ojos', lema: 'Auditas con criterio y lo justificas.' },
    { ojos: 100, xp: 4500, nombre: 'Panoptes', lema: 'Los cien ojos abiertos. Nada se te escapa.' }
  ];
  function rangoDe(xp) {
    const x = Math.max(0, Number(xp) || 0);
    let i = 0;
    while (i + 1 < RANGOS.length && x >= RANGOS[i + 1].xp) i++;
    const r = RANGOS[i]; const sig = RANGOS[i + 1] || null;
    // Ojos abiertos dentro del tramo: interpolación lineal hasta el siguiente rango
    const tramo = sig ? (x - r.xp) / (sig.xp - r.xp) : 1;
    const ojos = sig ? Math.min(sig.ojos - 1, r.ojos + Math.floor(tramo * (sig.ojos - r.ojos))) : 100;
    return { indice: i, nivel: i + 1, rango: r, siguiente: sig, progreso: sig ? tramo : 1, faltan: sig ? sig.xp - x : 0, ojos };
  }

  /* ---------- Puntos ---------- */
  const XP = {
    pregunta: { 1: 10, 2: 15, 3: 20 },
    repaso: 4,
    sala: 50, salaPerfecta: 25,
    flag: { user: 40, root: 80 },
    dificultad: { 'Fácil': 1, 'Media': 1.5, 'Difícil': 2 },
    simulacro: 150
  };
  const xpPregunta = (q) => XP.pregunta[q.d] || XP.pregunta[1];
  function xpFlag(flag, dificultad, conPista) {
    const base = (XP.flag[flag.tipo] || XP.flag.user) * (XP.dificultad[dificultad] || 1);
    return Math.round(conPista ? base / 2 : base);
  }

  /* ---------- Corrección ---------- */
  const correctas = (q) => (q.t === 'multiple' ? [...q.c].sort((a, b) => a - b) : [q.c]);
  function evaluar(q, resp) {
    if (q.t === 'vf') return resp === q.c;
    if (q.t === 'multiple') {
      const r = Array.isArray(resp) ? [...new Set(resp)].sort((a, b) => a - b) : [];
      const c = correctas(q);
      return r.length === c.length && r.every((v, i) => v === c[i]);
    }
    return resp === q.c;
  }

  /* ---------- Fechas (día local en formato AAAA-MM-DD) ---------- */
  const dia = (d = new Date()) => { const z = new Date(d); return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, '0')}-${String(z.getDate()).padStart(2, '0')}`; };
  function sumarDias(iso, n) { const [y, m, d] = iso.split('-').map(Number); return dia(new Date(y, m - 1, d + n)); }
  function diasEntre(a, b) { const f = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((f(b) - f(a)) / 86400000); }

  /* ---------- Repaso espaciado (Leitner) ----------
   * Caja 1: mañana · 2: en 3 días · 3: en 7 · 4: en 14 · 5: en 30. Un fallo devuelve la pregunta a la caja 1 para hoy. */
  const INTERVALOS = [0, 1, 3, 7, 14, 30];
  function repasar(estado, acierto, hoy) {
    const e = estado ? { ...estado } : { caja: 0, aciertos: 0, fallos: 0 };
    if (acierto) { e.caja = Math.min(5, (e.caja || 0) + 1); e.aciertos = (e.aciertos || 0) + 1; e.due = sumarDias(hoy, INTERVALOS[e.caja]); }
    else { e.caja = 1; e.fallos = (e.fallos || 0) + 1; e.due = hoy; }
    e.ultima = hoy;
    return e;
  }
  /* Pendientes: preguntas ya vistas cuya fecha de repaso ha llegado, las más atrasadas y de caja más baja primero */
  function pendientes(respuestas, hoy) {
    return Object.entries(respuestas || {})
      .filter(([, e]) => e && e.due && e.due <= hoy && e.caja < 5 + 1)
      .sort((a, b) => (a[1].due < b[1].due ? -1 : a[1].due > b[1].due ? 1 : a[1].caja - b[1].caja))
      .map(([id]) => id);
  }

  /* ---------- Racha ---------- */
  function racha(dias, hoy) {
    const activo = (d) => dias && dias[d] && (dias[d].preguntas || 0) > 0;
    let n = 0; let d = activo(hoy) ? hoy : sumarDias(hoy, -1);
    while (activo(d)) { n++; d = sumarDias(d, -1); }
    return n;
  }
  function mejorRacha(dias) {
    const ds = Object.keys(dias || {}).filter((d) => (dias[d].preguntas || 0) > 0).sort();
    let best = 0; let cur = 0; let prev = null;
    for (const d of ds) { cur = prev && diasEntre(prev, d) === 1 ? cur + 1 : 1; best = Math.max(best, cur); prev = d; }
    return best;
  }

  /* ---------- Barajado determinista ---------- */
  function semillaDe(texto) { let h = 2166136261; for (const ch of String(texto)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function barajar(lista, seed) { const r = prng(typeof seed === 'number' ? seed : semillaDe(seed)); const a = [...lista]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  /* Orden de presentación de las opciones (índices originales). Las de verdadero/falso no se barajan. */
  function ordenOpciones(q, seed) { return q.t === 'vf' ? [0, 1] : barajar(q.o.map((_, i) => i), `${seed}|${q.id}`); }

  /* ---------- Índice del banco ---------- */
  function indexar(rutas) {
    const preguntas = new Map(); const salaDe = new Map(); const rutaDe = new Map();
    for (const r of rutas) for (const s of r.salas) for (const q of s.preguntas) { preguntas.set(q.id, q); salaDe.set(q.id, s.id); rutaDe.set(q.id, r.id); }
    return { preguntas, salaDe, rutaDe };
  }

  /* ---------- Simulacros ----------
   * Toma n preguntas repartidas entre las salas de las rutas indicadas (al menos una por sala si caben) y las baraja. */
  function generarSimulacro(rutas, sim, seed) {
    const salas = rutas.filter((r) => sim.rutas.includes(r.id)).flatMap((r) => r.salas);
    const porSala = salas.map((s) => barajar(s.preguntas.map((q) => q.id), `${seed}|${s.id}`));
    const elegidas = []; let ronda = 0;
    while (elegidas.length < sim.n && porSala.some((l) => l.length > ronda)) {
      for (const l of porSala) { if (elegidas.length >= sim.n) break; if (l[ronda]) elegidas.push(l[ronda]); }
      ronda++;
    }
    return barajar(elegidas, `${seed}|orden`);
  }
  function corregirSimulacro(idx, ids, respuestas, sim) {
    const porSala = {}; let ok = 0;
    for (const id of ids) {
      const q = idx.preguntas.get(id); const bien = respuestas[id] !== undefined && evaluar(q, respuestas[id]);
      const s = idx.salaDe.get(id); porSala[s] = porSala[s] || { ok: 0, total: 0 }; porSala[s].total++;
      if (bien) { ok++; porSala[s].ok++; }
    }
    const nota = ids.length ? ok / ids.length : 0;
    return { ok, total: ids.length, nota, aprobado: nota >= sim.aprobado, porSala };
  }

  /* ---------- Logros ---------- */
  const LOGROS = [
    { id: 'primer-acierto', nombre: 'Primer ojo abierto', desc: 'Aciertas tu primera pregunta.', icono: 'eye' },
    { id: 'sala-1', nombre: 'Primera sala', desc: 'Superas una sala con al menos un 80 %.', icono: 'door' },
    { id: 'sala-perfecta', nombre: 'Sin un fallo', desc: 'Completas una sala con el 100 %.', icono: 'target' },
    { id: 'ruta-ens', nombre: 'Guardián del ENS', desc: 'Superas todas las salas de la ruta ENS.', icono: 'landmark' },
    { id: 'ruta-iso27001', nombre: 'Arquitecto del SGSI', desc: 'Superas todas las salas de la ruta ISO/IEC 27001.', icono: 'layers' },
    { id: 'ruta-continuidad', nombre: 'Resiliente', desc: 'Superas todas las salas de la ruta de continuidad.', icono: 'lifebuoy' },
    { id: 'maquina-1', nombre: 'Primera máquina', desc: 'Capturas todas las flags de un caso práctico.', icono: 'flag' },
    { id: 'ojo-halcon', nombre: 'Ojo de halcón', desc: 'Completas un caso práctico sin abrir ninguna pista.', icono: 'scan' },
    { id: 'maquinas-todas', nombre: 'Auditor de campo', desc: 'Completas todos los casos prácticos.', icono: 'briefcase' },
    { id: 'simulacro-ok', nombre: 'Examen superado', desc: 'Apruebas un simulacro.', icono: 'graduation' },
    { id: 'simulacro-90', nombre: 'Matrícula', desc: 'Sacas un 90 % o más en un simulacro.', icono: 'award' },
    { id: 'racha-3', nombre: 'Constancia', desc: 'Practicas tres días seguidos.', icono: 'flame' },
    { id: 'racha-7', nombre: 'Semana completa', desc: 'Practicas siete días seguidos.', icono: 'flame' },
    { id: 'racha-30', nombre: 'Vigilancia continua', desc: 'Practicas treinta días seguidos (ENS, art. 10).', icono: 'flame' },
    { id: 'repaso-25', nombre: 'Memoria de auditor', desc: 'Aciertas 25 preguntas en el repaso espaciado.', icono: 'refresh' },
    { id: 'cien', nombre: 'Cien aciertos', desc: 'Aciertas 100 preguntas distintas.', icono: 'check' },
    { id: 'panoptes', nombre: 'Panoptes', desc: 'Abres los cien ojos: alcanzas el rango máximo.', icono: 'sparkles' }
  ];
  /* Devuelve los ids de logros que el progreso cumple (los ya obtenidos incluidos) */
  function logrosCumplidos(p, banco, hoy) {
    const s = new Set();
    const resp = p.respuestas || {}; const aciertos = Object.values(resp).filter((e) => (e.aciertos || 0) > 0).length;
    const salas = p.salas || {}; const superada = (id) => salas[id] && salas[id].mejor >= 0.8;
    if (aciertos >= 1) s.add('primer-acierto');
    if (aciertos >= 100) s.add('cien');
    if (Object.keys(salas).some(superada)) s.add('sala-1');
    if (Object.values(salas).some((x) => x.mejor >= 1)) s.add('sala-perfecta');
    for (const r of banco.rutas) if (r.salas.length && r.salas.every((x) => superada(x.id))) s.add('ruta-' + r.id);
    const maq = p.maquinas || {}; const hechas = banco.maquinas.filter((m) => maq[m.id] && maq[m.id].completada);
    if (hechas.length) s.add('maquina-1');
    if (hechas.some((m) => !(maq[m.id].pistas || []).length)) s.add('ojo-halcon');
    if (banco.maquinas.length && hechas.length === banco.maquinas.length) s.add('maquinas-todas');
    const sims = Object.values(p.simulacros || {});
    if (sims.some((x) => x.aprobado)) s.add('simulacro-ok');
    if (sims.some((x) => x.mejor >= 0.9)) s.add('simulacro-90');
    const rmax = Math.max(racha(p.dias, hoy), mejorRacha(p.dias));
    if (rmax >= 3) s.add('racha-3'); if (rmax >= 7) s.add('racha-7'); if (rmax >= 30) s.add('racha-30');
    if ((p.repasosOk || 0) >= 25) s.add('repaso-25');
    if (rangoDe(p.xp).nivel === RANGOS.length) s.add('panoptes');
    return s;
  }
  /* Logros nuevos respecto a los ya registrados */
  function logrosNuevos(p, banco, hoy) { const ya = p.logros || {}; return [...logrosCumplidos(p, banco, hoy)].filter((id) => !ya[id]); }

  /* ---------- Progreso de rutas ---------- */
  function progresoRuta(ruta, p) {
    const salas = p.salas || {}; const resp = p.respuestas || {};
    const total = ruta.salas.reduce((a, s) => a + s.preguntas.length, 0);
    const vistas = ruta.salas.reduce((a, s) => a + s.preguntas.filter((q) => resp[q.id] && resp[q.id].aciertos > 0).length, 0);
    const superadas = ruta.salas.filter((s) => salas[s.id] && salas[s.id].mejor >= 0.8).length;
    return { total, dominadas: vistas, salas: ruta.salas.length, superadas, pct: total ? vistas / total : 0 };
  }
  /* Siguiente sala recomendada: la primera no superada de la ruta con más avance (o la primera de todas) */
  function siguienteSala(rutas, p) {
    const salas = p.salas || {};
    const orden = [...rutas].sort((a, b) => progresoRuta(b, p).pct - progresoRuta(a, p).pct);
    for (const r of orden) for (const s of r.salas) if (!(salas[s.id] && salas[s.id].mejor >= 0.8)) return { ruta: r, sala: s };
    return null;
  }

  /* ---------- Validación del banco ---------- */
  const TIPOS = ['unica', 'multiple', 'vf'];
  function validarPregunta(q, donde, err) {
    const e = (m) => err.push(`${donde} ${q && q.id ? q.id : '?'}: ${m}`);
    if (!q || typeof q !== 'object') return e('no es un objeto');
    if (!/^[a-z0-9]+(-[a-z0-9]+)+$/.test(q.id || '')) e('id con formato no válido');
    if (!TIPOS.includes(q.t)) e(`tipo «${q.t}» no válido`);
    if (typeof q.q !== 'string' || q.q.trim().length < 12) e('enunciado vacío o demasiado corto');
    if (typeof q.x !== 'string' || q.x.trim().length < 25) e('explicación vacía o demasiado corta');
    if (typeof q.ref !== 'string' || q.ref.trim().length < 3) e('falta la referencia');
    if (![1, 2, 3].includes(q.d)) e('dificultad debe ser 1, 2 o 3');
    if (q.t === 'vf') { if (typeof q.c !== 'boolean') e('verdadero/falso necesita c booleano'); if (q.o) e('verdadero/falso no lleva opciones'); return; }
    if (!Array.isArray(q.o) || q.o.length < 3 || q.o.length > 5) return e('necesita entre 3 y 5 opciones');
    if (q.o.some((o) => typeof o !== 'string' || !o.trim())) e('opción vacía');
    if (new Set(q.o.map((o) => o.trim().toLowerCase())).size !== q.o.length) e('opciones repetidas');
    if (q.t === 'unica' && !(Number.isInteger(q.c) && q.c >= 0 && q.c < q.o.length)) e('respuesta correcta fuera de rango');
    if (q.t === 'multiple') {
      if (!Array.isArray(q.c) || q.c.length < 2 || q.c.length >= q.o.length) e('múltiple necesita al menos 2 correctas y alguna incorrecta');
      else if (q.c.some((c) => !(Number.isInteger(c) && c >= 0 && c < q.o.length)) || new Set(q.c).size !== q.c.length) e('índices de respuesta no válidos');
    }
  }
  function validarBanco(banco) {
    const err = []; const ids = new Set();
    const nuevoId = (id, donde) => { if (ids.has(id)) err.push(`${donde}: id repetido ${id}`); ids.add(id); };
    for (const r of banco.rutas || []) {
      if (!r.id || !r.nombre || !Array.isArray(r.salas) || !r.salas.length) { err.push(`ruta ${r.id}: incompleta`); continue; }
      nuevoId(r.id, 'ruta');
      for (const s of r.salas) {
        nuevoId(s.id, `ruta ${r.id}`);
        if (!s.nombre || !s.resumen) err.push(`sala ${s.id}: falta nombre o resumen`);
        if (!Array.isArray(s.preguntas) || s.preguntas.length < 6) err.push(`sala ${s.id}: necesita al menos 6 preguntas`);
        for (const q of s.preguntas || []) { validarPregunta(q, `sala ${s.id}`, err); nuevoId(q.id, `sala ${s.id}`); }
      }
    }
    for (const m of banco.maquinas || []) {
      nuevoId(m.id, 'máquina');
      if (!XP.dificultad[m.dificultad]) err.push(`máquina ${m.id}: dificultad no válida`);
      if (!m.brief || !Array.isArray(m.evidencias) || !m.evidencias.length) err.push(`máquina ${m.id}: falta el briefing o las evidencias`);
      if (!Array.isArray(m.flags) || m.flags.length < 3) err.push(`máquina ${m.id}: necesita al menos 3 flags`);
      for (const f of m.flags || []) {
        if (!XP.flag[f.tipo]) err.push(`máquina ${m.id}: flag ${f.id} con tipo no válido`);
        if (!f.nombre) err.push(`máquina ${m.id}: flag ${f.id} sin nombre`);
        validarPregunta(f, `máquina ${m.id}`, err); nuevoId(f.id, `máquina ${m.id}`);
      }
    }
    const rutasIds = new Set((banco.rutas || []).map((r) => r.id));
    for (const sim of banco.simulacros || []) {
      nuevoId(sim.id, 'simulacro');
      if (!sim.rutas.every((r) => rutasIds.has(r))) err.push(`simulacro ${sim.id}: ruta desconocida`);
      const disp = (banco.rutas || []).filter((r) => sim.rutas.includes(r.id)).reduce((a, r) => a + r.salas.reduce((b, s) => b + s.preguntas.length, 0), 0);
      if (disp < sim.n) err.push(`simulacro ${sim.id}: pide ${sim.n} preguntas y solo hay ${disp}`);
      if (!(sim.minutos > 0 && sim.aprobado > 0 && sim.aprobado <= 1)) err.push(`simulacro ${sim.id}: tiempo o nota de aprobado no válidos`);
    }
    return err;
  }
  function estadisticas(banco) {
    const preguntas = banco.rutas.reduce((a, r) => a + r.salas.reduce((b, s) => b + s.preguntas.length, 0), 0);
    const salas = banco.rutas.reduce((a, r) => a + r.salas.length, 0);
    const flags = banco.maquinas.reduce((a, m) => a + m.flags.length, 0);
    return { rutas: banco.rutas.length, salas, preguntas, maquinas: banco.maquinas.length, flags, simulacros: banco.simulacros.length, logros: LOGROS.length };
  }

  const API = { RANGOS, XP, LOGROS, INTERVALOS, rangoDe, xpPregunta, xpFlag, evaluar, correctas, dia, sumarDias, diasEntre, repasar, pendientes, racha, mejorRacha,
    semillaDe, barajar, ordenOpciones, indexar, generarSimulacro, corregirSimulacro, logrosCumplidos, logrosNuevos, progresoRuta, siguienteSala, validarBanco, estadisticas };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ArgosEngine = Object.freeze(API);
})(typeof window !== 'undefined' ? window : this);
