'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../app/src/academy.js');
const B = require('../app/data');
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
