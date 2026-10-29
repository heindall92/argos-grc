/* ---------- Hallazgo estructurado: borrador local y rúbrica transparente ---------- */
function borradorLab() { return P.laboratorio || A.limpiarBorrador({ seed:'ARGOS', valores:{} }); }
function selectLab(campo, titulo, opciones, v) {
  return `<label>${titulo}<select data-lab="${campo}"><option value="">Selecciona una opción</option>${opciones.map(([id,n])=>`<option value="${id}"${v[campo]===id?' selected':''}>${n}</option>`).join('')}</select></label>`;
}
function vLaboratorio() {
  const b=borradorLab(); const c=A.caso(b.seed); const v=b.valores;
  return `<div class="hd"><div><p class="eyebrow">Laboratorio con entregable · 20–30 min</p><h1 class="lt">Un hallazgo defendible</h1><p class="lt-sub">Compara la recuperación de Pegaso con su política interna. Identifica qué puedes concluir y qué información falta.</p></div></div>
  ${TALLER_URL && b.seed !== TALLER_URL ? `<div class="legal" role="note">${icon('info', 18)}<span>Este enlace es del taller <b>${esc(TALLER_URL)}</b>, pero tu borrador es del caso <b>${esc(b.seed)}</b>. <button type="button" class="btn sm" data-act="lab-taller">Cambiar al caso ${esc(TALLER_URL)}</button></span></div>` : ''}
  <section class="card pad academy-form"><label>Semilla del caso<input id="lab-seed" maxlength="40" value="${esc(b.seed)}"></label><button class="btn" data-act="lab-generar">Generar variante</button><p class="small muted">Misma semilla y versión, mismas evidencias. Generar otra variante sustituye el borrador tras confirmarlo.</p></section>
  <section class="sec grid g2">${c.evidencias.map(e=>`<article class="card pad"><h2>${e.id} · ${esc(e.titulo)}</h2><p>${esc(e.texto)}</p></article>`).join('')}</section>
  <section class="card pad academy-form"><h2>Documenta tu decisión</h2><fieldset><legend>Evidencias que sostienen tu conclusión</legend>${c.evidencias.map(e=>`<label class="row"><input type="checkbox" data-lab-evidencia="${e.id}"${v.evidencias.includes(e.id)?' checked':''}>${e.id} · ${esc(e.titulo)}</label>`).join('')}</fieldset>
  ${selectLab('foco','Problema principal',[['rto','Tiempo de recuperación excedido'],['rpo','Pérdida de datos excesiva'],['evidencia','Evidencia insuficiente para valorar el RPO']],v)}
  ${selectLab('criterio','Criterio de POL-BCP-01',[['rto','RTO: tiempo hasta recuperar el servicio'],['rpo','RPO: antigüedad del último dato recuperable']],v)}
  ${selectLab('clasificacion','Clasificación con la evidencia disponible',[['desviacion','Desviación respecto de la política interna'],['insuficiente','No se puede concluir; falta evidencia'],['conforme','Conformidad demostrada']],v)}
  <label>Hallazgo: evidencia, criterio y diferencia<textarea data-lab="hallazgo" maxlength="2000">${esc(v.hallazgo)}</textarea></label>
  <label>Justificación de tu decisión<textarea data-lab="justificacion" maxlength="2000">${esc(v.justificacion)}</textarea></label>
  ${selectLab('accion','Acción propuesta',[['recuperacion','Mejorar la capacidad de recuperación del servicio'],['copias','Ajustar y verificar la recuperación de datos'],['registro','Repetir la prueba y completar el registro de evidencias']],v)}
  <label>Cómo comprobarías la eficacia de la acción<textarea data-lab="verificacion" maxlength="2000">${esc(v.verificacion)}</textarea></label>
  <p id="lab-guardado" class="small muted" aria-live="polite">El borrador se guarda en este navegador. Puedes exportarlo con tu progreso.</p>
  <div class="row"><button class="btn primary" data-act="lab-evaluar">Contrastar con la rúbrica</button><button class="btn" data-act="lab-exportar">Descargar informe Markdown</button></div>
  <div id="lab-feedback" aria-live="polite"></div></section>
  <p class="small muted sec">El criterio es la política ficticia entregada. Las justificaciones abiertas necesitan revisión humana.</p>`;
}
function guardarLab(ev) {
  const el=ev.target; if (!el.dataset.lab && !el.dataset.labEvidencia) return;
  const b=borradorLab();
  if (el.dataset.lab) b.valores[el.dataset.lab]=el.value;
  else { const set=new Set(b.valores.evidencias); el.checked?set.add(el.dataset.labEvidencia):set.delete(el.dataset.labEvidencia); b.valores.evidencias=[...set]; }
  P.laboratorio=A.limpiarBorrador(b); guardar();
  $('#lab-guardado').textContent=avisoGuardado?'Guardado solo en memoria. Exporta tu progreso para conservarlo.':'Borrador guardado en este navegador.';
  $('#lab-feedback').innerHTML='';
}
document.addEventListener('input',guardarLab);
Object.assign(ACCIONES, {
  'lab-generar':()=>{const seed=$('#lab-seed').value.trim()||'ARGOS'; confirmar('¿Generar otra variante?','Se sustituirá el borrador actual. Descarga el informe antes si quieres conservarlo.',()=>{P.laboratorio=A.limpiarBorrador({seed,valores:{}});guardar();render();},'Generar');},
  'lab-taller':()=>{if(!TALLER_URL)return;confirmar('¿Cambiar al caso del taller?',`Se sustituirá tu borrador del caso ${borradorLab().seed}. Descarga antes el informe si quieres conservarlo.`,()=>{P.laboratorio=A.limpiarBorrador({seed:TALLER_URL,valores:{}});guardar();render();},'Cambiar');},
  'lab-evaluar':()=>{const b=borradorLab();const r=A.rubrica(A.caso(b.seed),b.valores);$('#lab-feedback').innerHTML=`<h3>${r.puntos}/${r.max} comprobaciones estructuradas</h3><ul>${r.criterios.map(x=>`<li><b>${x.ok?'Coincide':'Revisar'} · ${x.nombre}:</b> ${esc(x.ayuda)}</li>`).join('')}</ul><p>${r.textosCompletos?'Los tres textos están completados.':'Completa hallazgo, justificación y verificación con al menos 30 caracteres cada uno.'} Su calidad y la gravedad del hallazgo requieren revisión humana.</p>`;},
  'lab-exportar':()=>{const b=borradorLab();descargar(new Blob([A.informe(A.caso(b.seed),b.valores,VERSION)],{type:'text/markdown;charset=utf-8'}),'argos-informe-practica.md');}
});
