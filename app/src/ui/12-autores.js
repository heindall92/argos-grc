/* ---------- Editor de paquetes declarativos: no ejecuta código aportado ---------- */
function vAutores(){
  const texto=ui.packTexto??JSON.stringify(A.plantillaPack(),null,2);
  return `<div class="hd"><div><h1 class="lt">Crear contenido</h1><p class="lt-sub">Prepara un paquete con evidencias, preguntas propias y fuentes. La vista previa es una práctica independiente, sin puntos del perfil.</p></div></div>
  <section class="card pad academy-form"><label>Paquete JSON · máximo 100.000 caracteres<textarea id="pack-editor" maxlength="100000" rows="16">${esc(texto)}</textarea></label>${selectorArchivo('pack-archivo', 'Cargar paquete local', 'Elegir archivo JSON')}<div class="row"><button class="btn primary" data-act="pack-validar">Validar y previsualizar</button><button class="btn" data-act="pack-descargar">Descargar paquete validado</button><button class="btn" data-act="pack-plantilla">Nueva plantilla</button></div><div id="pack-status" aria-live="polite">${ui.packErrores?.length?`<ul>${ui.packErrores.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`:ui.pack?'<p>Formato válido. Esto no acredita exactitud normativa ni revisión editorial.</p>':''}</div></section>
  ${ui.pack?`<section class="sec" id="pack-preview"><h2>${esc(ui.pack.titulo)} · vista previa</h2><p class="small muted">Autor: ${esc(ui.pack.autor)} · Estado declarado: ${esc(ui.pack.estado)} · Fuente: ${esc(ui.pack.fuente.referencia)} · Edición ${esc(ui.pack.fuente.edicion)}</p>${ui.pack.casos.map((c,ci)=>`<article class="card pad sec"><h3>${esc(c.titulo)}</h3><p>${esc(c.brief)}</p>${c.evidencias.map(e=>`<details><summary>${esc(e.id)} · ${esc(e.titulo)}</summary><p>${esc(e.texto)}</p></details>`).join('')}${c.preguntas.map((q,qi)=>`<div class="sec"><h4>${esc(q.q)}</h4><div class="row">${(q.t==='vf'?['Verdadero','Falso']:q.o).map((o,i)=>`<button class="btn" data-act="pack-opcion" data-ci="${ci}" data-qi="${qi}" data-oi="${i}">${esc(o)}</button>`).join('')}</div><p id="pack-res-${ci}-${qi}" aria-live="polite"></p></div>`).join('')}</article>`).join('')}</section>`:''}
  <section class="sec card pad"><h2>Antes de proponerlo</h2><p>Revisa el caso con otra persona, cita la edición de la fuente y conserva su revisión en Git. No incluyas datos reales ni preguntas de exámenes. Para una versión publicada se exige un registro de revisión.</p><p>El mantenedor revisa y publica mediante una contribución; validar el JSON solo comprueba estructura. El paquete se prueba aquí sin añadirlo al banco oficial.</p></section>`;
}
function validarEditor(){
  ui.packTexto=$('#pack-editor').value;ui.pack=null;ui.packResp={};
  if(new Blob([ui.packTexto]).size>100000){ui.packErrores=['Máximo 100 KB de contenido JSON.'];return false;}
  try{const p=safeParse(ui.packTexto);ui.packErrores=A.validarPack(p,E);if(!ui.packErrores.length)ui.pack=p;}catch(e){ui.packErrores=['El texto no es JSON válido.'];}
  return !!ui.pack;
}
Object.assign(ACCIONES,{
  'pack-validar':()=>{validarEditor();render();},
  'pack-descargar':()=>{if(!validarEditor()){render();return;}descargar(new Blob([JSON.stringify(ui.pack,null,2)],{type:'application/json'}),'argos-paquete-contenido.json');render();},
  'pack-plantilla':()=>confirmar('¿Crear una plantilla nueva?','Se reemplazará el texto del editor. Descarga tu paquete antes si quieres conservarlo.',()=>{ui.packTexto=JSON.stringify(A.plantillaPack(),null,2);ui.pack=null;ui.packErrores=[];render();},'Crear'),
  'pack-opcion':b=>{const ci=Number(b.dataset.ci),qi=Number(b.dataset.qi),oi=Number(b.dataset.oi);const q=ui.pack?.casos[ci]?.preguntas[qi];if(!q)return;const key=ci+':'+qi;let r=q.t==='vf'?oi===0:oi;if(q.t==='multiple'){const set=new Set(ui.packResp[key]||[]);set.has(oi)?set.delete(oi):set.add(oi);r=[...set];}ui.packResp[key]=r;const ok=E.evaluar(q,r);$('#pack-res-'+ci+'-'+qi).textContent=(ok?'Coincide. ':'Revisa la selección. ')+q.x+' Referencia: '+q.ref;}
});
document.addEventListener('input',ev=>{
  if(ev.target.id!=='pack-editor')return;
  ui.packTexto=ev.target.value; ui.pack=null; ui.packErrores=[];
  $('#pack-preview')?.remove();
  $('#pack-status').textContent='Texto modificado. Valida de nuevo para practicarlo o descargarlo.';
});
document.addEventListener('change',async ev=>{if(ev.target.id!=='pack-archivo')return;const f=ev.target.files[0];nombreArchivos(ev.target);if(!f)return;if(f.size>100000){toast('El paquete supera 100 KB.','error');return;}ui.packTexto=await f.text();ui.pack=null;ui.packErrores=[];if(ui.view==='autores')render();});
