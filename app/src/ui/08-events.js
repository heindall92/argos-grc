/* ---------- Eventos: un único escuchador delegado por tipo ---------- */
const ACCIONES = {
  go: (b) => go(b.dataset.view, b.dataset.param || null),
  sala: (b) => iniciarSala(b.dataset.id),
  repaso: () => iniciarRepaso(),
  simulacro: (b) => iniciarSimulacro(b.dataset.id),
  'p-opt': (b) => seleccionar(Number(b.dataset.o)),
  'p-check': () => comprobar(),
  'p-next': () => siguiente(),
  'p-sig': () => irA(ui.sesion.i + 1),
  'p-prev': () => irA(ui.sesion.i - 1),
  'p-ir': (b) => irA(Number(b.dataset.i)),
  'p-marcar': () => marcar(),
  'p-entregar': () => { const s = ui.sesion; const faltan = s.ids.length - Object.keys(s.resp).length; if (faltan) confirmar('¿Entregar el simulacro?', `Te quedan ${plural(faltan, 'pregunta', 'preguntas')} sin responder, que contarán como fallos.`, () => finalizar(), 'Entregar'); else finalizar(); },
  'p-salir': () => salir(),
  'p-cerrar': () => cerrarSesion(),
  'ev-tab': (b) => { ui.evTab[ui.param] = Number(b.dataset.i); render(); document.getElementById('evt-' + b.dataset.i)?.focus(); },
  'flag-opt': (b) => flagOpt(b.dataset.id, Number(b.dataset.o)),
  'flag-enviar': (b) => flagEnviar(b.dataset.id),
  'flag-pista': (b) => flagPista(b.dataset.id),
  color: (b) => { P.perfil.color = b.dataset.v; guardar(); render(); document.querySelector(`[data-act="color"][data-v="${b.dataset.v}"]`)?.focus(); },
  tema: (b) => { P.ajustes.tema = b.dataset.v; guardar(); render(); document.querySelector(`[data-act="tema"][data-v="${b.dataset.v}"]`)?.focus(); },
  meta: (b) => { P.ajustes.meta = Number(b.dataset.v); guardar(); render(); document.querySelector(`[data-act="meta"][data-v="${b.dataset.v}"]`)?.focus(); },
  'share-png': () => descargarTarjeta(),
  'share-text': () => copiarTexto(textoLinkedIn()),
  exportar: () => exportar(),
  importar: () => $('#file-import').click(),
  reset: () => confirmar('¿Borrar todo el progreso?', 'Se perderán tus puntos, logros y el historial de este navegador. Exporta antes si quieres conservarlo.', () => { P = nuevoProgreso(); guardar(); go('hoy'); toast('Progreso borrado'); }, 'Borrar', true),
  'help-tab': (b) => { ui.helpTab = b.dataset.tab; render(); document.querySelector(`[data-act="help-tab"][data-tab="${b.dataset.tab}"]`)?.focus(); },
  'modal-ok': () => { const a = ui.modal && ui.modal.accion; cerrarModal(); if (a) a(); },
  'modal-close': (b, ev) => { if (ev.target === b) cerrarModal(); },
  'modal-next': (b, ev) => { if (ev.target !== b && b.classList.contains('scrim')) return; const m = ui.modal; if (m && m.ids && m.ids.length > 1) { m.ids.shift(); renderModal(); } else cerrarModal(); }
};
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-act]'); if (!b || b.disabled) return;
  const fn = ACCIONES[b.dataset.act]; if (!fn) return;
  if (b.tagName === 'A') return;
  fn(b, ev);
});
document.addEventListener('input', (ev) => {
  if (ev.target.id === 'pf-nombre') { P.perfil.nombre = str(ev.target.value, 60); guardar(); renderTop(); dibujarTarjeta($('#share-canvas')); }
});
$('#file-import').addEventListener('change', (ev) => { importar(ev.target.files && ev.target.files[0]); ev.target.value = ''; });

/* ---------- Teclado ---------- */
let gPend = false; let gT = null;
document.addEventListener('keydown', (ev) => {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const enCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);
  if (ui.modal) { if (ev.key === 'Escape') { ev.preventDefault(); cerrarModal(); } return; }
  const s = ui.sesion;
  if (s) {
    if (ev.key === 'Escape') { ev.preventDefault(); s.estado === 'resumen' ? cerrarSesion() : salir(); return; }
    if (s.estado !== 'jugando') return;
    const q = qActual(); const bloqueada = s.modo !== 'simulacro' && s.comprobada[q.id] !== undefined;
    const ord = orden(q);
    if (!bloqueada && /^[1-5]$/.test(ev.key) && q.t !== 'vf') { const k = Number(ev.key) - 1; if (ord[k] !== undefined) { ev.preventDefault(); seleccionar(ord[k]); } return; }
    if (!bloqueada && q.t === 'vf' && /^[vf12]$/i.test(ev.key)) { ev.preventDefault(); seleccionar(/^[v1]$/i.test(ev.key) ? 0 : 1); return; }
    if (ev.key === 'Enter' && !(ev.target.tagName === 'BUTTON' && ev.target.dataset.act !== 'p-opt')) {
      ev.preventDefault();
      if (s.modo === 'simulacro') { if (s.i + 1 < s.ids.length) irA(s.i + 1); return; }
      if (bloqueada) siguiente(); else comprobar();
      return;
    }
    if (s.modo === 'simulacro' && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') && !enCampo) { ev.preventDefault(); irA(s.i + (ev.key === 'ArrowRight' ? 1 : -1)); }
    return;
  }
  if (enCampo) return;
  if (gPend) {
    const destino = { h: 'hoy', r: 'rutas', m: 'maquinas', s: 'simulacros', l: 'logros', p: 'perfil', a: 'ayuda' }[ev.key.toLowerCase()];
    gPend = false; clearTimeout(gT);
    if (destino) { ev.preventDefault(); go(destino); }
    return;
  }
  if (ev.key.toLowerCase() === 'g') { gPend = true; gT = setTimeout(() => { gPend = false; }, 1200); return; }
  // Pestañas de evidencias: flechas izquierda y derecha
  if (ev.target.getAttribute && ev.target.getAttribute('role') === 'tab' && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) {
    const m = MAQ[ui.param]; if (!m) return;
    const i = (Number(ev.target.dataset.i) + (ev.key === 'ArrowRight' ? 1 : -1) + m.evidencias.length) % m.evidencias.length;
    ev.preventDefault(); ui.evTab[m.id] = i; render(); document.getElementById('evt-' + i)?.focus();
  }
});
window.addEventListener('hashchange', () => { const h = desdeHash(); if (h.view !== ui.view || h.param !== ui.param) go(h.view, h.param); });
window.addEventListener('storage', (ev) => { if (ev.key === KEY && !ui.sesion) { P = sanear(store.get(KEY)); render(); } });

/* ---------- Arranque ---------- */
(function arrancar() {
  const h = desdeHash();
  if (!store.get(KEY)) guardar();
  go(h.view, h.param, { keepScroll: true });
  // Logros que el progreso ya cumple (por ejemplo, tras importar una copia antigua)
  const nuevos = revisarLogros(); if (nuevos.length) guardar();
  // Gancho para las pruebas automatizadas (solo lectura del estado y navegación)
  if (/[?&]test\b/.test(location.search)) {
    Object.defineProperty(window, '__ARGOS__', { value: Object.freeze({ go, iniciarSala, iniciarRepaso, iniciarSimulacro, finalizar, get P() { return P; }, get ui() { return ui; }, D, E }) });
  }
})();
