/* ---------- Estructura: barra superior, pestañas, navegación, avisos y diálogos ---------- */
const SECCIONES = [
  ['hoy', 'Hoy', 'home'], ['rutas', 'Rutas', 'route'], ['maquinas', 'Máquinas', 'terminal'], ['simulacros', 'Simulacros', 'timer'], ['logros', 'Logros', 'award']
];
const seccionDe = (v) => ({ ruta: 'rutas', maquina: 'maquinas' }[v] || v);

function renderTop() {
  const r = E.rangoDe(P.xp); const racha = E.racha(P.dias, hoy()); const cur = seccionDe(ui.view);
  $('#top').innerHTML = `<button type="button" class="brand" data-act="go" data-view="hoy" aria-label="ARGOS, ir a Hoy">${logo(30)}<span>ARGOS</span></button>
    <nav class="nav" aria-label="Secciones">${SECCIONES.map(([id, n, ic]) => `<button type="button" data-act="go" data-view="${id}"${cur === id ? ' aria-current="page"' : ''}>${icon(ic, 17)}<span>${n}</span></button>`).join('')}</nav>
    <div class="top-end">
      <button type="button" class="chip flame" data-act="go" data-view="hoy" title="Racha de días seguidos" aria-label="Racha: ${plural(racha, 'día', 'días')}">${icon('flame', 16)}${racha}</button>
      <button type="button" class="chip eyes" data-act="go" data-view="logros" title="Rango y puntos" aria-label="${esc(r.rango.nombre)}, ${P.xp} XP">${icon('eye', 16)}${P.xp.toLocaleString('es-ES')} XP</button>
      <button type="button" class="icon-btn" data-act="go" data-view="ayuda" aria-label="Ayuda"${ui.view === 'ayuda' ? ' aria-current="page"' : ''}>${icon('help', 20)}</button>
      <button type="button" class="avatar c-${P.perfil.color}" data-act="go" data-view="perfil" aria-label="Perfil y ajustes">${esc(iniciales(P.perfil.nombre))}</button>
    </div>`;
  $('#tabbar').innerHTML = SECCIONES.map(([id, n, ic]) => `<button type="button" data-act="go" data-view="${id}"${cur === id ? ' aria-current="page"' : ''}>${icon(ic, 22)}<span>${n}</span></button>`).join('');
}

const VISTAS = { hoy: vHoy, rutas: vRutas, ruta: vRuta, maquinas: vMaquinas, maquina: vMaquina, simulacros: vSimulacros, logros: vLogros, perfil: vPerfil, ayuda: vAyuda };
function render() {
  aplicarTema();
  renderTop();
  const fn = VISTAS[ui.view] || vHoy;
  $('#view').innerHTML = fn();
  if (ui.view === 'perfil') dibujarTarjeta($('#share-canvas'));
  renderPlayer();
  renderModal();
}
function go(view, param = null, opts = {}) {
  if (!VISTAS[view]) view = 'hoy';
  if (view === 'ruta' && !RUTA[param]) view = 'rutas';
  if (view === 'maquina' && !MAQ[param]) view = 'maquinas';
  ui.view = view; ui.param = (view === 'ruta' || view === 'maquina') ? param : null;
  const hash = '#' + view + (ui.param ? '/' + ui.param : '');
  if (location.hash !== hash) { try { history.replaceState(null, '', hash); } catch (e) { /* entorno sin historial */ } }
  render();
  if (!opts.keepScroll) window.scrollTo(0, 0);
  if (!ui.sesion) $('#view').focus({ preventScroll: true });
}
function desdeHash() {
  const [v, p] = (location.hash || '').replace('#', '').split('/');
  return { view: VISTAS[v] ? v : 'hoy', param: p || null };
}

/* ---------- Avisos ---------- */
let toastT = null;
function toast(msg, kind = '') {
  const el = $('#toast'); el.textContent = msg; el.className = 'toast' + (kind ? ' ' + kind : ''); el.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3200);
}

/* ---------- Diálogos: confirmación y logros desbloqueados ---------- */
function confirmar(titulo, texto, accion, etiqueta = 'Confirmar', peligro = false) { ui.modal = { tipo: 'confirm', titulo, texto, accion, etiqueta, peligro }; renderModal(); }
function celebrar(ids) { if (!ids.length) return; ui.modal = { tipo: 'logro', ids: [...ids] }; renderModal(); }
function renderModal() {
  const el = $('#modal'); const m = ui.modal;
  if (!m) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  if (m.tipo === 'confirm') {
    el.innerHTML = `<div class="scrim" data-act="modal-close"><div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d">
      <h2 id="dlg-t">${esc(m.titulo)}</h2><p id="dlg-d" class="muted">${esc(m.texto)}</p>
      <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="modal-close">Cancelar</button><button type="button" class="btn ${m.peligro ? 'danger' : 'primary'}" data-act="modal-ok">${esc(m.etiqueta)}</button></div></div></div>`;
    setTimeout(() => el.querySelector('[data-act="modal-ok"]')?.focus(), 0);
  } else {
    const l = E.LOGROS.find((x) => x.id === m.ids[0]);
    el.innerHTML = `<div class="scrim" data-act="modal-next"><div class="dialog unlock" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
      <div class="medal">${icon(l.icono, 48)}</div><p class="eyebrow">Logro desbloqueado${m.ids.length > 1 ? ` · 1 de ${m.ids.length}` : ''}</p>
      <h2 id="dlg-t">${esc(l.nombre)}</h2><p class="muted">${esc(l.desc)}</p>
      <button type="button" class="btn primary block" data-act="modal-next">${m.ids.length > 1 ? 'Siguiente' : 'Genial'}</button></div></div>`;
    setTimeout(() => el.querySelector('button')?.focus(), 0);
  }
}
function cerrarModal() { ui.modal = null; renderModal(); }

/* ---------- Componentes comunes ---------- */
const barra = (v, cls = '') => `<div class="bar ${cls}" role="presentation"><i style="width:${Math.max(0, Math.min(100, v * 100)).toFixed(1)}%"></i></div>`;
const tagRuta = (rid) => `<span class="tag ${RUTA_CLS[rid]}">${esc(RUTA[rid].corto)}</span>`;
const glyph = (rid, size = 22) => `<span class="route-glyph ${RUTA_CLS[rid]}" aria-hidden="true">${icon(RUTA[rid].icono, size)}</span>`;
const difCls = (d) => 'd-' + d.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
