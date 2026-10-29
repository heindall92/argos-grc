'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../app/src/academy.js');
const B = require('../app/data');
const E = require('../app/src/engine.js');
test('resumen por defecto no contiene nombre ni textos; solo se añaden al seleccionarlos', () => {
  const p={perfil:{nombre:'Privado'},laboratorio:{seed:'TALLER',valores:{hallazgo:'Texto reservado'}}};
  const r=A.resumenTaller(B,p,'2026-10-28','test',{competencias:true,laboratorio:true});
  assert.equal(r.nombre,undefined);assert.equal(r.textos,undefined);assert.equal(r.competencias.length,7);
  const opt=A.resumenTaller(B,p,'2026-10-28','test',{nombre:true,textos:true});
  assert.equal(opt.nombre,'Privado');assert.equal(opt.textos.hallazgo,'Texto reservado');
});
test('facilitador rechaza versiones, códigos y notas incompatibles', () => {
  const r=A.resumenTaller(B,{laboratorio:{seed:'TALLER',valores:{}}},'2026-10-28','test',{laboratorio:true});
  const a=A.agregarResumenes([r,{...r,version:'otra'},{...r,semilla:'otro'},{...r,laboratorio:{max:4,puntos:99}}],'test','TALLER');
  assert.equal(a.participantes,1);assert.equal(a.errores.length,3);assert.equal(a.media,0);
});
test('paquetes: plantilla válida, revisión exigida al publicar, errores hostiles sin ejecutar', () => {
  const p=A.plantillaPack();assert.deepEqual(A.validarPack(p,E),[]);
  p.estado='publicado';assert.ok(A.validarPack(p,E).some(x=>x.includes('revisión')));
  p.estado='borrador';p.script='globalThis.pwned=true';assert.ok(A.validarPack(p,E).length);
  p.casos[0].preguntas[0].o=[null,{},'x'];assert.doesNotThrow(()=>A.validarPack(p,E));
  assert.equal(globalThis.pwned,undefined);
});
test('las variantes son reproducibles y la rúbrica distingue RTO, RPO y falta de evidencia', () => {
  const tipos=new Set();
  for(let i=0;i<30;i++){
    const c=A.caso('taller-'+i); tipos.add(c.foco); assert.deepEqual(c,A.caso('taller-'+i));
    const v={foco:c.foco,criterio:c.foco==='rto'?'rto':'rpo',evidencias:['E1','E2','E3','E4'],clasificacion:c.foco==='evidencia'?'insuficiente':'desviacion',accion:c.foco==='rto'?'recuperacion':c.foco==='rpo'?'copias':'registro'};
    assert.equal(A.rubrica(c,v).puntos,4);
    assert.equal(A.rubrica(c,{}).puntos,0);
    assert.equal(A.rubrica(c,v).textosCompletos,false,'el acierto estructurado no valida las justificaciones');
  }
  assert.equal(tipos.size,3);
});
test('borradores acotados y exportaciones que preservan el texto como contenido', () => {
  const b=A.limpiarBorrador({seed:'prueba',valores:{hallazgo:'<script>oops</script>',evidencias:['E1','E1','inventada'],accion:5}});
  assert.deepEqual(b.valores.evidencias,['E1']);assert.equal(b.valores.accion,'');
  const informe=A.informe(A.caso('prueba'),b.valores,'test');
  assert.ok(informe.includes('&lt;script&gt;'));assert.ok(!informe.includes('<script>'));
  const multilinea=A.limpiarBorrador({seed:'demo',valores:{hallazgo:'Una línea\nOtra línea'}});
  assert.equal(multilinea.valores.hallazgo,'Una línea\nOtra línea');
});

test('RTO: política y acta bastan cuando el acta ya fija el origen del tiempo', () => {
  let c; for(let i=0;i<30;i++){c=A.caso('caso-'+i);if(c.foco==='rto')break;}
  assert.equal(c.foco,'rto');
  const r=A.rubrica(c,{foco:'rto',criterio:'rto',evidencias:['E1','E3'],clasificacion:'desviacion',accion:'recuperacion'});
  assert.equal(r.puntos,4);
});
test('las competencias cubren cada sala y cada caso una sola vez', () => {
  const salas = A.COMPETENCIAS.flatMap((c) => c.salas).sort();
  assert.deepEqual(salas, B.rutas.flatMap((r) => r.salas.map((s) => s.id)).sort());
  assert.deepEqual(A.COMPETENCIAS.flatMap((c) => c.maquinas).sort(), B.maquinas.map((m) => m.id).sort());
});
test('retención exige aciertos, caja y vigencia; un acierto aislado no basta', () => {
  assert.equal(A.estado(undefined,'2026-10-28'),'nueva');
  assert.equal(A.estado({aciertos:0,caja:1},'2026-10-28'),'vista');
  assert.equal(A.estado({aciertos:1,caja:1},'2026-10-28'),'acertada');
  assert.equal(A.estado({aciertos:3,caja:3,due:'2026-11-01'},'2026-10-28'),'retenida');
  assert.equal(A.estado({aciertos:3,caja:3,due:'2026-10-01'},'2026-10-28'),'acertada');
});
test('recomendaciones explicadas priorizan pendientes y enlazan contenido existente', () => {
  assert.equal(A.recomendar(B,{respuestas:{'ens-1-01':{due:'2026-10-01'}}},'2026-10-28').tipo,'repaso');
  const rec=A.recomendar(B,{},'2026-10-28');
  assert.ok(B.rutas.some((r)=>r.salas.some((s)=>s.id===rec.id)));
  assert.ok(B.maquinas.some((m)=>m.id===rec.maquina)); assert.ok(rec.motivo.length>20);
  assert.equal(A.competencias(B,{},'2026-10-28').reduce((n,c)=>n+c.total,0),190);
});

test('demostración para presentaciones: progreso coherente, actual y sin el caso de la charla', () => {
  const hoy='2026-11-22'; const p=A.demoShowcase(B,E,hoy);
  assert.equal(E.racha(p.dias,hoy),4,'racha de cuatro días con actividad hoy');
  assert.equal(p.dias[hoy].xp,40);
  // Los XP coinciden con lo que se habría ganado: preguntas acertadas, salas superadas, flags y simulacro.
  const qs=B.rutas.flatMap(r=>r.salas.flatMap(s=>s.preguntas)); const q=id=>qs.find(x=>x.id===id);
  let esperado=Object.entries(p.respuestas).filter(([,e])=>e.aciertos>0).reduce((n,[id])=>n+E.xpPregunta(q(id)),0);
  esperado+=Object.values(p.salas).filter(s=>s.mejor>=.8).reduce((n,s)=>n+E.XP.sala+(s.mejor===1?E.XP.salaPerfecta:0),0);
  for(const [id,m] of Object.entries(p.maquinas)){const mq=B.maquinas.find(x=>x.id===id);esperado+=m.flags.reduce((n,f)=>n+E.xpFlag(mq.flags.find(x=>x.id===f),mq.dificultad,false),0);}
  esperado+=E.xpSimulacro(B.simulacros.find(s=>s.id==='sprint-ens'));
  assert.equal(p.xp,esperado);
  assert.deepEqual(Object.keys(p.logros).sort(),[...E.logrosCumplidos(p,B,hoy)].sort(),'sin logros pendientes de celebrar');
  assert.equal(p.maquinas['m-ransom'],undefined,'«Noche de ransomware» se resuelve en directo');
  assert.equal(p.laboratorio,undefined);
  const cs=A.competencias(B,p,hoy);assert.ok(cs.filter(c=>c.estados.retenida>0).length>=2,'al menos dos competencias con retención');
  assert.ok(E.pendientes(p.respuestas,hoy).length>0,'hay repasos pendientes que enseñar');
  assert.equal(A.recomendar(B,p,hoy).tipo,'repaso');
  // Es determinista y se desplaza con la fecha
  assert.deepEqual(A.demoShowcase(B,E,hoy),p);
  assert.equal(E.racha(A.demoShowcase(B,E,'2027-01-15').dias,'2027-01-15'),4);
});
