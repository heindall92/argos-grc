/* ---------- Hoy: anillos diarios, rango, continuar y repaso ---------- */
function anillos(valores) {
  // valores: [[progreso 0..1, color1, color2], …] de fuera hacia dentro, al estilo de los anillos de actividad
  const R = [72, 54, 36]; const W = 15;
  const defs = valores.map(([, a, b], i) => `<linearGradient id="rg${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${a}"/><stop offset="1" style="stop-color:${b}"/></linearGradient>`).join('');
  const arcos = valores.map(([v], i) => {
    const c = 2 * Math.PI * R[i]; const off = c * (1 - Math.max(0, Math.min(1, v)));
    return `<circle class="tr" cx="84" cy="84" r="${R[i]}" stroke-width="${W}"/><circle class="pr" cx="84" cy="84" r="${R[i]}" stroke-width="${W}" stroke="url(#rg${i})" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 84 84)"/>`;
  }).join('');
  return `<svg class="rings" viewBox="0 0 168 168" role="img" aria-label="Anillos de hoy"><defs>${defs}</defs>${arcos}</svg>`;
}
function estadoHoy() {
  const d = P.dias[hoy()] || { xp: 0, preguntas: 0, repasos: 0 };
  const pend = E.pendientes(P.respuestas, hoy()).length;
  const repasoTotal = d.repasos + pend;
  return { d, pend, xp: d.xp / P.ajustes.meta, preg: d.preguntas / 20, rep: repasoTotal ? d.repasos / repasoTotal : 1 };
}
function vHoy() {
  const h = estadoHoy(); const r = E.rangoDe(P.xp); const sig = E.siguienteSala(D.rutas, P); const racha = E.racha(P.dias, hoy());
  const nombre = P.perfil.nombre ? ', ' + esc(P.perfil.nombre.split(' ')[0]) : '';
  const saludo = new Date().getHours() < 14 ? 'Buenos días' : new Date().getHours() < 21 ? 'Buenas tardes' : 'Buenas noches';
  const nuevo = !Object.keys(P.respuestas).length;
  return `<div class="hd"><div><p class="eyebrow">${esc(new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }))}</p><h1 class="lt">${saludo}${nombre}</h1>
      <p class="lt-sub">${nuevo ? 'Bienvenido a ARGOS. Practica el ENS, la ISO/IEC 27001 y la continuidad de negocio con salas, casos prácticos y simulacros.' : racha > 1 ? `Llevas ${plural(racha, 'día', 'días')} seguidos. Que no se apague la racha.` : 'Cada pregunta abre un poco más los ojos de Argos.'}</p></div></div>
    ${nuevo ? `<div class="legal" style="margin-bottom:18px">${icon('info', 18)}<span>Tu progreso se guarda solo en este navegador. Puedes exportarlo desde <button type="button" class="lnk" data-act="go" data-view="perfil">Perfil</button>. ARGOS es un proyecto independiente: no está relacionado con ISO, IEC ni ninguna entidad de certificación, y sus logros no son una certificación.</span></div>` : ''}
    <div class="today">
      <section class="card rings-card" aria-labelledby="h-anillos">
        ${anillos([[h.xp, 'var(--ring-xp)', 'var(--ring-xp-2)'], [h.preg, 'var(--ring-q)', 'var(--ring-q-2)'], [h.rep, 'var(--ring-r)', 'var(--ring-r-2)']])}
        <div class="ring-leg"><h2 id="h-anillos" class="sr">Objetivos de hoy</h2>
          <div><div class="k"><i style="background:var(--ring-xp)"></i>Puntos de hoy</div><div class="v">${h.d.xp}<small> / ${P.ajustes.meta} XP</small></div></div>
          <div><div class="k"><i style="background:var(--ring-q)"></i>Preguntas</div><div class="v">${h.d.preguntas}<small> / 20</small></div></div>
          <div><div class="k"><i style="background:var(--ring-r)"></i>Repaso</div><div class="v">${h.pend ? `${h.d.repasos}<small> · faltan ${h.pend}</small>` : '<small>Al día</small>'}</div></div>
        </div>
      </section>
      <section class="card rank-card" aria-labelledby="h-rango">
        <div class="rank-top">${eyeMedal(r.ojos, 64)}<div><p class="eyebrow">Nivel ${r.nivel} de ${E.RANGOS.length}</p><h2 id="h-rango" class="rank-name">${esc(r.rango.nombre)}</h2><p class="small muted">${esc(r.rango.lema)}</p></div></div>
        ${barra(r.progreso, 'iri')}
        <p class="small muted">${r.siguiente ? `${P.xp.toLocaleString('es-ES')} XP · faltan ${r.faltan.toLocaleString('es-ES')} para «${esc(r.siguiente.nombre)}»` : 'Has abierto los cien ojos.'}</p>
      </section>
    </div>
    ${h.pend ? `<section class="card continue sec" aria-label="Repaso pendiente"><span class="route-glyph" style="background:linear-gradient(135deg,#f59e0b,#ef4444)">${icon('refresh', 24)}</span>
      <div class="grow"><p class="eyebrow">Repaso espaciado</p><h2 style="font:700 1.15rem/1.25 var(--f-d)">${plural(h.pend, 'pregunta vuelve', 'preguntas vuelven')} hoy</h2><p class="small muted">Las que fallaste o te tocan por calendario. Repasar a tiempo es lo que fija la memoria.</p></div>
      <button type="button" class="btn primary" data-act="repaso">Repasar</button></section>` : ''}
    ${sig ? `<section class="card continue sec" aria-label="Siguiente sala">${glyph(sig.ruta.id, 24)}
      <div class="grow"><p class="eyebrow">${nuevo ? 'Empieza por aquí' : 'Continúa'} · ${esc(sig.ruta.nombre)}</p><h2 style="font:700 1.15rem/1.25 var(--f-d)">${esc(sig.sala.nombre)}</h2><p class="small muted">${esc(sig.sala.resumen)}</p></div>
      <button type="button" class="btn primary" data-act="sala" data-id="${sig.sala.id}">${icon('arrowRight', 18)}<span>Entrar</span></button></section>` : ''}
    <section class="sec"><div class="sec-h"><h2>Tus rutas</h2><button type="button" class="btn ghost sm" data-act="go" data-view="rutas">Ver todas</button></div>
      <div class="grid g3">${D.rutas.map(tarjetaRuta).join('')}</div></section>
    <section class="sec"><div class="sec-h"><h2>Máquinas</h2><button type="button" class="btn ghost sm" data-act="go" data-view="maquinas">Ver todas</button></div>
      <div class="grid g3">${D.maquinas.slice(0, 3).map(tarjetaMaquina).join('')}</div></section>`;
}

/* ---------- Logros y rangos ---------- */
function vLogros() {
  const r = E.rangoDe(P.xp); const n = Object.keys(P.logros).length;
  return `<div class="hd"><div><h1 class="lt">Logros</h1><p class="lt-sub">${n} de ${E.LOGROS.length} desbloqueados. Cada rango abre más ojos de Argos.</p></div>
      <button type="button" class="btn" data-act="go" data-view="perfil">${icon('share', 17)}<span>Compartir mi progreso</span></button></div>
    <div class="badges">${E.LOGROS.map((l) => { const f = P.logros[l.id]; return `<div class="card badge${f ? ' on' : ''}"><div class="medal">${icon(f ? l.icono : 'lock', 30)}</div><h3>${esc(l.nombre)}</h3><p>${esc(l.desc)}</p>${f ? `<span class="when">${esc(fmtFecha(f))}</span>` : '<span class="small muted">Bloqueado</span>'}</div>`; }).join('')}</div>
    <section class="sec"><div class="sec-h"><h2>Rangos</h2><span class="small muted">${P.xp.toLocaleString('es-ES')} XP</span></div>
      <div class="card ladder" style="padding:10px">${E.RANGOS.map((x, i) => `<div class="step${i === r.indice ? ' cur' : ''}${P.xp >= x.xp ? ' reached' : ''}"><span class="n">${x.ojos}</span><div><b>${esc(x.nombre)}</b><p class="small muted">${esc(x.lema)}</p></div><span class="small muted">${x.xp.toLocaleString('es-ES')} XP</span></div>`).join('')}</div></section>
    <section class="sec"><div class="sec-h"><h2>Cómo se ganan los puntos</h2></div><div class="card pad prose small">
      <ul><li>Primer acierto de cada pregunta: ${E.XP.pregunta[1]}, ${E.XP.pregunta[2]} o ${E.XP.pregunta[3]} XP según su dificultad. Repetir una sala ya dominada no suma de nuevo.</li>
      <li>Superar una sala por primera vez (80 % o más): ${E.XP.sala} XP; hacerla perfecta: ${E.XP.salaPerfecta} XP más.</li>
      <li>Acertar en el repaso espaciado: ${E.XP.repaso} XP por pregunta.</li>
      <li>Flags de las máquinas: ${E.XP.flag.user} (usuario) y ${E.XP.flag.root} (root), multiplicados por 1, 1,5 o 2 según la dificultad. Abrir la pista reduce la flag a la mitad.</li>
      <li>Aprobar un simulacro por primera vez: ${E.XP.simulacro} XP.</li></ul></div></section>`;
}

/* ---------- Perfil, tarjeta para compartir y datos ---------- */
function vPerfil() {
  const r = E.rangoDe(P.xp); const pf = P.perfil;
  return `<div class="hd"><div><h1 class="lt">Perfil</h1><p class="lt-sub">Tu nombre aparece en la tarjeta para compartir. Todo se guarda solo en este navegador.</p></div></div>
    <div class="grid g2">
      <section class="card pad stack" aria-labelledby="h-yo"><h2 id="h-yo" class="sec-h" style="margin:0"><span style="font:700 1.15rem var(--f-d)">Tú</span></h2>
        <div class="row">${`<span class="avatar c-${pf.color}" style="--s:64px">${esc(iniciales(pf.nombre))}</span>`}<div><b>${esc(pf.nombre || 'Sin nombre')}</b><p class="small muted">${esc(r.rango.nombre)} · ${P.xp.toLocaleString('es-ES')} XP</p></div></div>
        <div class="field"><label for="pf-nombre">Nombre</label><input id="pf-nombre" class="input" maxlength="60" autocomplete="name" value="${esc(pf.nombre)}" placeholder="Cómo quieres aparecer"></div>
        <div class="field"><span class="lbl" id="lbl-color">Color</span><div class="swatches" role="group" aria-labelledby="lbl-color">${COLORES.map((c) => `<button type="button" class="avatar swatch c-${c}" data-act="color" data-v="${c}" aria-pressed="${pf.color === c}" aria-label="Color ${c}"></button>`).join('')}</div></div>
      </section>
      <section class="card pad stack" aria-labelledby="h-share"><h2 id="h-share" style="font:700 1.15rem var(--f-d)">Comparte tu progreso</h2>
        <p class="small muted">Genera una imagen con tu rango, tus puntos y tus logros para publicarla en LinkedIn. Recuerda: es un laboratorio de práctica, no una certificación.</p>
        <canvas id="share-canvas" width="1200" height="630" style="width:100%;height:auto;border-radius:14px;background:#0b1220" role="img" aria-label="Vista previa de la tarjeta para compartir"></canvas>
        <div class="row"><button type="button" class="btn primary" data-act="share-png">${icon('download', 17)}<span>Descargar imagen</span></button><button type="button" class="btn" data-act="share-text">${icon('copy', 17)}<span>Copiar texto</span></button></div>
      </section>
    </div>
    <section class="sec"><div class="sec-h"><h2>Ajustes</h2></div><div class="card list">
      <div class="li"><div class="grow"><b>Apariencia</b></div><div class="seg" role="group" aria-label="Apariencia">${[['sistema', 'Sistema'], ['claro', 'Claro'], ['oscuro', 'Oscuro']].map(([v, n]) => `<button type="button" data-act="tema" data-v="${v}" aria-pressed="${P.ajustes.tema === v}">${n}</button>`).join('')}</div></div>
      <div class="li"><div class="grow"><b>Meta diaria</b><p class="small muted">Puntos para cerrar el anillo exterior.</p></div><div class="seg" role="group" aria-label="Meta diaria">${[50, 100, 200].map((v) => `<button type="button" data-act="meta" data-v="${v}" aria-pressed="${P.ajustes.meta === v}">${v} XP</button>`).join('')}</div></div>
    </div></section>
    <section class="sec"><div class="sec-h"><h2>Tus datos</h2></div><div class="card list">
      <div class="li"><div class="grow"><b>Exportar progreso</b><p class="small muted">Un archivo JSON para guardarlo o pasarlo a otro navegador.</p></div><button type="button" class="btn sm" data-act="exportar">${icon('download', 16)}<span>Exportar</span></button></div>
      <div class="li"><div class="grow"><b>Importar progreso</b><p class="small muted">Sustituye el progreso actual por el del archivo.</p></div><button type="button" class="btn sm" data-act="importar">${icon('upload', 16)}<span>Importar</span></button></div>
      <div class="li"><div class="grow"><b>Empezar de cero</b><p class="small muted">Borra todo el progreso de este navegador.</p></div><button type="button" class="btn sm danger" data-act="reset">${icon('trash', 16)}<span>Borrar</span></button></div>
    </div></section>
    <p class="small muted sec center">ARGOS ${esc(VERSION)} · <button type="button" class="btn ghost sm" data-act="go" data-view="ayuda">Ayuda, fuentes y aviso legal</button></p>`;
}
