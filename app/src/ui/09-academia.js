/* ---------- Inicio guiado y demostración independiente ---------- */
function enlacesAcademia() {
  if (seccionDe(ui.view) !== 'inicio') return '';
  return `<nav class="subnav" aria-label="Aprender"><div class="seg">${APRENDER.map(([id, n]) => `<button type="button" data-act="go" data-view="${id}"${ui.view === id ? ' aria-current="page"' : ''}>${n}</button>`).join('')}</div></nav>`;
}
/* Selector de archivo propio: el control nativo muestra textos del idioma del navegador («Choose File»). */
function selectorArchivo(id, etiqueta, boton, multiple = false) {
  return `<div class="file-pick"><span class="file-label" id="${id}-l">${etiqueta}</span><div class="row"><input id="${id}" type="file" accept=".json,application/json"${multiple ? ' multiple' : ''} aria-labelledby="${id}-l ${id}-b" aria-describedby="${id}-n"><label for="${id}" class="btn" id="${id}-b">${icon('upload', 18)}<span>${boton}</span></label><span class="small muted" id="${id}-n" aria-live="polite">${esc(ui.archivos?.[id] || 'Ningún archivo elegido')}</span></div></div>`;
}
function nombreArchivos(input) {
  const n = input.files?.length || 0;
  const texto = !n ? 'Ningún archivo elegido' : n === 1 ? str(input.files[0].name, 80) : `${n} archivos`;
  ui.archivos = { ...ui.archivos, [input.id]: texto };
  const el = $('#' + input.id + '-n'); if (el) el.textContent = texto;
}
function avisoDemo() {
  if (!MODO_DEMO) return '';
  return `<div class="demo-strip" role="note">${icon('eye', 16)}<span><b>Demostración</b><span class="demo-extra">${DEMO_SHOWCASE ? ' con progreso de ejemplo' : ''} · separada de tu perfil habitual</span></span><button type="button" class="btn ghost sm" data-act="demo-reset">Restablecer</button></div>`;
}
function vCompetencias() {
  const cs = A.competencias(D, P, hoy()); const rec = A.recomendar(D, P, hoy()); const ev = A.evolucion(P);
  return `<div class="hd"><div><h1 class="lt">Competencias</h1><p class="lt-sub">Un acierto es el primer paso. Retenida: al menos tres aciertos, caja 3 o superior y repaso todavía vigente.</p></div></div>
  <section class="card pad"><h2>Tu siguiente práctica</h2><p>${esc(rec.motivo)}</p>${rec.tipo === 'repaso' ? '<button class="btn primary" data-act="repaso">Repasar pendientes</button>' : `<button class="btn primary" data-act="sala" data-id="${rec.id}">Practicar sala</button><button class="btn" data-act="go" data-view="maquina" data-param="${rec.maquina}">Aplicar en un caso</button>`}</section>
  <section class="sec grid g3">${cs.map((c) => `<article class="card pad"><h2>${esc(c.nombre)}</h2><p><b>${c.estados.retenida}/${c.total}</b> retenidas</p>${barra(c.pct)}<p class="small muted">${c.estados.acertada} acertadas · ${c.estados.vista} vistas sin acierto · ${c.estados.nueva} nuevas</p><p class="small">${c.casos}/${c.maquinas.length} casos resueltos</p></article>`).join('')}</section>
  <section class="card pad"><h2>Evolución de tus respuestas</h2><p>${ev.preguntas ? `Primer registro conservado: ${pct(ev.inicial)} de aciertos. Último registro: ${pct(ev.reciente)}. Comparación sobre ${ev.preguntas} preguntas con historial.` : 'Todavía no hay historial. Se registra a partir de esta versión.'}</p><p class="small muted">Se conservan los últimos 30 registros por pregunta. Repetir el mismo día no demuestra retención. Este indicador describe tu práctica, no una certificación ni una medición causal de mejora.</p></section>`;
}
function enlaceCorreccion(q) {
  const body = `Pregunta: ${q.id}\nVersión: ${VERSION}\nReferencia: ${q.ref}\n\nQué debería corregirse y por qué:\n\nFuente pública o referencia exacta:\n`;
  return `<a class="small" target="_blank" rel="noopener noreferrer" href="https://github.com/heindall92/argos-grc/issues/new?title=${encodeURIComponent('Revisión de contenido: ' + q.id)}&body=${encodeURIComponent(body)}">Proponer una corrección · ${esc(q.id)}</a>`;
}
function fichaEditorial(q) {
  const r = D.editorial?.registros?.[q.id];
  return r ? `Revisión documentada: ${esc(r.fecha)} · ${esc(r.revisor)} · Edición ${esc(r.edicion)}. <a target="_blank" rel="noopener noreferrer" href="${esc(r.url)}">Fuente</a>` : 'Referencia citada; revisión experta independiente pendiente de registrar.';
}
function vInicio() {
  return `<div class="hd"><div><p class="eyebrow">Tu primer recorrido · 10–15 minutos</p><h1 class="lt">De la evidencia a la decisión</h1><p class="lt-sub">Practica cómo actuar ante un incidente y explica por qué. ARGOS ${esc(VERSION)} funciona también como HTML descargado.</p></div></div>
    <section class="card pad"><h2>Elige tu punto de partida</h2><p>Las rutas son abiertas: puedes cambiar cuando quieras.</p><div class="row">
    <button class="btn" data-act="go" data-view="ruta" data-param="ens">Empiezo con ENS</button><button class="btn" data-act="go" data-view="ruta" data-param="iso27001">Preparo ISO/IEC 27001</button><button class="btn" data-act="go" data-view="ruta" data-param="continuidad">Practico continuidad</button></div></section>
    <section class="sec"><h2>Recorrido recomendado: Noche de ransomware</h2><p class="muted">Necesitas nociones básicas de copias de seguridad. Trabajarás con una organización ficticia.</p>
    <ol class="guide-steps"><li><b>Contexto · 2 min.</b> Lee el briefing y distingue el incidente de sus consecuencias.</li><li><b>Evidencias · 4 min.</b> Recorre las pestañas y localiza horarios, pérdidas de datos y decisiones.</li><li><b>Decisión · 5 min.</b> Resuelve las flags y contrasta tu criterio con la explicación.</li><li><b>Reflexión · 2 min.</b> Explica qué dato cambiaría tu decisión y qué evidencia pedirías después.</li></ol>
    <button class="btn primary" data-act="go" data-view="maquina" data-param="m-ransom">Comenzar el caso</button><button class="btn" data-act="sala" data-id="cont-1">Repasar BIA primero</button></section>
    <section class="card pad"><h2>Ensaya con tranquilidad</h2><p>La demostración usa datos independientes. Puedes restablecerla sin borrar tu perfil habitual.</p><a class="btn" href="?demo#inicio" target="_blank" rel="noopener noreferrer">Abrir demostración</a><p class="small muted">Sin conexión: guarda el HTML completo. El progreso depende del navegador y de la ubicación del archivo; exporta una copia para trasladarlo.</p></section>`;
}
