/* ---------- Taller sin servidor y exportación explícita de resultados ---------- */
/* Enlace del taller. Si la app se abre como archivo descargado, se comparte la dirección pública:
 * una ruta file:// no sirve a nadie más y muestra la estructura de carpetas del facilitador. */
function enlaceTaller(seed) {
  // Dentro de la función: este módulo se evalúa después del primer pintado y una constante de
  // módulo aún no existiría si la app se abre directamente en #taller.
  const url = new URL(location.protocol === 'file:' ? 'https://heindall92.github.io/argos-grc/' : location.href);
  url.search = ''; if (MODO_DEMO) url.searchParams.set('demo', DEMO_SHOWCASE ? 'showcase' : ''); url.searchParams.set('taller', seed); url.hash = 'laboratorio';
  return url;
}
function codigoTaller() { return A.normalizarSemilla(str(parametro('taller'),40) || borradorLab().seed); }
function opcionesResumen() { return Object.fromEntries(['nombre','competencias','laboratorio','textos'].map(k=>[k,$('#resumen-'+k)?.checked===true])); }
function vistaResumen() { return A.resumenTaller(D,P,hoy(),VERSION,opcionesResumen()); }
function vTaller() {
  const seed=codigoTaller(); const link=enlaceTaller(seed);
  return `<div class="hd"><div><h1 class="lt">Taller en comunidad</h1><p class="lt-sub">Trabajad el mismo caso y comparad las razones. Cada participante conserva sus datos en su navegador.</p></div></div>
  <section class="card pad academy-form"><label>Código o semilla del taller<input id="taller-codigo" maxlength="40" value="${esc(seed)}"></label><div class="row"><button class="btn primary" data-act="taller-unirse">Preparar mi caso</button><button class="btn" data-act="taller-enlace">Generar enlace</button></div><label>Enlace para compartir<input id="taller-enlace" readonly value="${esc(link.href)}"></label><p class="small muted">El enlace solo contiene la semilla. Si usas ARGOS como archivo descargado, el enlace apunta a la versión publicada: comprueba que todos usáis la misma versión o reparte solo el código.</p></section>
  <section class="sec card pad"><h2>Guion del facilitador · 35 minutos</h2><ol class="guide-steps"><li>5 min: leer la política y confirmar qué significan RTO y RPO.</li><li>10 min: analizar evidencias y redactar el hallazgo individual.</li><li>10 min: contrastar en parejas qué afirmaciones tienen soporte.</li><li>10 min: comparar con la rúbrica y revisar la comprobación de eficacia.</li></ol><p>Las semillas y versiones deben coincidir para comparar resultados. No hay sincronización ni clasificación pública.</p></section>
  <section class="card pad academy-form"><h2>Elige qué compartir</h2><p>El archivo se descarga. Tú decides si se lo entregas al facilitador.</p>${[['nombre','Nombre del perfil',false],['competencias','Resumen de competencias',true],['laboratorio','Decisiones estructuradas del laboratorio',true],['textos','Textos completos del hallazgo y justificación',false]].map(([id,n,on])=>`<label class="row"><input type="checkbox" id="resumen-${id}" data-resumen${on?' checked':''}>${n}</label>`).join('')}
  <button class="btn" data-act="taller-previsualizar">Previsualizar datos</button><pre id="resumen-preview" class="term" tabindex="0" aria-label="Datos seleccionados para exportar">Pulsa Previsualizar datos.</pre><button class="btn primary" data-act="taller-exportar">Descargar estos datos JSON</button></section>
  <section class="sec card pad academy-form"><h2>Resumen del facilitador</h2><p>Importa hasta 20 resúmenes del mismo código y versión. Se muestran resultados agregados, sin listar nombres ni textos.</p>${selectorArchivo('taller-archivos', 'Archivos de autoevaluación', 'Elegir archivos JSON', true)}<div id="taller-agregado" aria-live="polite"></div></section>`;
}
Object.assign(ACCIONES,{
  'taller-unirse':()=>{const seed=$('#taller-codigo').value.trim()||'ARGOS';confirmar('¿Preparar este caso?','Se sustituirá tu borrador de laboratorio. Descarga antes el informe si quieres conservarlo.',()=>{P.laboratorio=A.limpiarBorrador({seed,valores:{}});guardar();go('laboratorio');},'Preparar');},
  'taller-enlace':()=>{const url=enlaceTaller(A.normalizarSemilla($('#taller-codigo').value));$('#taller-enlace').value=url.href;$('#taller-enlace').focus();$('#taller-enlace').select();},
  'taller-previsualizar':()=>{$('#resumen-preview').textContent=JSON.stringify(vistaResumen(),null,2);},
  'taller-exportar':()=>{const out=vistaResumen();$('#resumen-preview').textContent=JSON.stringify(out,null,2);descargar(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}),'argos-resumen-taller.json');}
});
document.addEventListener('change',async ev=>{
  if(ev.target.hasAttribute('data-resumen'))$('#resumen-preview').textContent='Selección modificada. Previsualiza de nuevo antes de compartir.';
  if(ev.target.id!=='taller-archivos')return;
  const files=[...ev.target.files];const informes=[];const errores=[];nombreArchivos(ev.target);
  ev.target.value='';
  const seed=A.normalizarSemilla($('#taller-codigo').value);
  if(files.length>20){$('#taller-agregado').textContent='Máximo 20 archivos.';return;}
  for(const f of files){if(f.size>1024*1024){errores.push('Un archivo excede 1 MB.');continue;}try{informes.push(safeParse(await f.text()));}catch(e){errores.push('Un archivo no contiene JSON válido.');}}
  const r=A.agregarResumenes(informes,VERSION,seed);
  if(!$('#taller-agregado'))return;
  $('#taller-agregado').innerHTML=`<p><b>${r.participantes} resúmenes válidos.</b> ${r.conLaboratorio} contienen decisiones del laboratorio. ${r.media===null?'':`Media: ${r.media.toFixed(1)}/4 comprobaciones estructuradas.`}</p><p class="small muted">Son autoevaluaciones aportadas, no resultados verificados ni un recuento de personas únicas. Los textos abiertos necesitan revisión humana.</p><ul>${r.competencias.map(c=>`<li>${esc(c.nombre)}: ${c.retenidas}/${c.total} preguntas retenidas en ${c.muestras} resúmenes.</li>`).join('')}</ul><ul>${[...errores,...r.errores].map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`;
});
document.addEventListener('input',ev=>{if(ev.target.id==='taller-codigo')$('#taller-agregado').textContent='Código modificado. Vuelve a cargar los resúmenes para este taller.';});
