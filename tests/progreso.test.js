'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const E = require('../app/src/engine.js');
const B = require('../app/data/index.js');
const Academy = require('../app/src/academy.js');
function app() {
  const saved = new Map();
  const c = vm.createContext({ window: { ARGOS_DATA: { ...B, version: 'test' }, ArgosEngine: E }, document: { body: { style: {} }, querySelector: () => null, getElementById: () => null }, localStorage: { getItem: (k) => saved.get(k) || null, setItem: (k, v) => saved.set(k, v) }, setTimeout: () => {}, setInterval: () => 1, clearInterval: () => {} });
  c.window.ArgosAcademy = Academy;
  vm.runInContext("const location = {search:''};\n" + ['00-core', '04-sesion', '05-jugador'].map((p) => fs.readFileSync(`${__dirname}/../app/src/ui/${p}.js`, 'utf8')).join('\n'), c);
  vm.runInContext('render = () => {}; renderPlayer = () => {}; renderTop = () => {}; celebrar = () => {}; enfocarPregunta = () => {};', c);
  return (code) => vm.runInContext(code, c);
}
test('simulacro y repaso no consumen XP de sala; recargar no duplica la recompensa', () => {
  for (const modo of ['simulacro', 'repaso']) {
    const run = app(); run(`registrarRespuesta('ens-1-01', true, '${modo}')`);
    assert.equal(run("registrarRespuesta('ens-1-01', true, 'sala')"), E.xpPregunta(B.rutas[0].salas[0].preguntas[0]));
    run('guardar(); P = sanear(store.get(KEY))');
    assert.equal(run("registrarRespuesta('ens-1-01', true, 'sala')"), 0);
  }
});
test('migración v1 conserva XP y aciertos sin volver a pagar', () => {
  const run = app(); run("P = sanear({v:1, xp:123, respuestas:{'ens-1-01':{aciertos:1,caja:2}}})");
  assert.equal(run('P.v'), 2); assert.equal(run('P.xp'), 123);
  assert.equal(run("registrarRespuesta('ens-1-01',true,'sala')"), 0);
  run('P = sanear(safeParse(JSON.stringify(P)))');
  assert.equal(run("P.respuestas['ens-1-01'].xpConcedida"), true);
});
test('recuperar sala conserva correcciones y XP sin volver a pagar', () => {
  const run = app();
  run("iniciarSala('ens-1'); const q = qActual(); if(q.t === 'multiple') q.c.forEach(seleccionar); else seleccionar(q.t === 'vf' ? (q.c ? 0 : 1) : q.c); comprobar(); guardar(); P = sanear(store.get(KEY)); ui.sesion = P.sesion");
  assert.equal(run('ui.sesion.aciertos'), 1);
  const xp = run('P.xp'); run('comprobar()'); assert.equal(run('P.xp'), xp);
  assert.equal(run('ui.sesion.ids.length'), 10);
  run('siguiente(); guardar(); P = sanear(store.get(KEY)); ui.sesion = P.sesion'); assert.equal(run('ui.sesion.i'), 1);
});
test('simulacro conserva plazo, selección y marcas; finalizar es idempotente', () => {
  const run = app();
  run("iniciarSimulacro('sim-ens'); { const q = qActual(); if(q.t === 'multiple') q.c.forEach(seleccionar); else seleccionar(q.t === 'vf' ? (q.c ? 0 : 1) : q.c); } marcar(); const finOriginal = ui.sesion.fin; guardar(); P = sanear(store.get(KEY)); ui.sesion = P.sesion");
  assert.equal(run('ui.sesion.fin === finOriginal'), true);
  assert.equal(run('Object.keys(ui.sesion.resp).length'), 1); assert.equal(run('ui.sesion.marcadas.length'), 1);
  run('finalizar(); finalizar()'); assert.equal(run("P.simulacros['sim-ens'].intentos"), 1);
  assert.equal(run('store.get(KEY).sesion'), null);
});
test('checkpoints incompatibles o hostiles se descartan; importar no reanuda una sesión ajena', () => {
  const run = app(); run("iniciarSala('ens-1'); guardar(); const raw = safeParse(JSON.stringify(P))");
  assert.equal(run('sanear(raw, false).sesion'), null);
  assert.equal(run("sanearSesion({...raw.sesion,banco:'viejo'})"), null);
  assert.equal(run("sanearSesion({...raw.sesion,ids:['inventada']})"), null);
  assert.equal(run('sanearSesion({...raw.sesion,i:999})'), null);
  run("raw.sesion.resp[raw.sesion.ids[0]] = '<img>'"); assert.equal(run('sanearSesion(raw.sesion)'), null);
});
