/* Pruebas del motor de ARGOS: corrección, puntos, rangos, repaso espaciado, rachas, simulacros y logros. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../app/src/engine.js');
const B = require('../app/data/index.js');

const unica = { id: 'x-1', t: 'unica', q: 'Pregunta de prueba única', o: ['a', 'b', 'c'], c: 1, x: 'Explicación suficientemente larga.', ref: 'Ref', d: 2 };
const multi = { id: 'x-2', t: 'multiple', q: 'Pregunta de prueba múltiple', o: ['a', 'b', 'c', 'd'], c: [0, 2], x: 'Explicación suficientemente larga.', ref: 'Ref', d: 3 };
const vf = { id: 'x-3', t: 'vf', q: 'Pregunta de verdadero o falso', c: false, x: 'Explicación suficientemente larga.', ref: 'Ref', d: 1 };

test('corrección: única, múltiple (sin importar el orden ni repeticiones) y verdadero/falso', () => {
  assert.equal(E.evaluar(unica, 1), true);
  assert.equal(E.evaluar(unica, 0), false);
  assert.equal(E.evaluar(multi, [2, 0]), true);
  assert.equal(E.evaluar(multi, [0, 2, 2]), true);
  assert.equal(E.evaluar(multi, [0]), false, 'una múltiple incompleta es fallo');
  assert.equal(E.evaluar(multi, [0, 1, 2]), false, 'marcar de más es fallo');
  assert.equal(E.evaluar(multi, undefined), false);
  assert.equal(E.evaluar(vf, false), true);
  assert.equal(E.evaluar(vf, true), false);
});

test('rangos: umbrales, ojos interpolados y rango máximo', () => {
  assert.equal(E.rangoDe(0).rango.nombre, 'Primer ojo');
  assert.equal(E.rangoDe(0).ojos, 1);
  assert.equal(E.rangoDe(149).nivel, 1);
  assert.equal(E.rangoDe(150).nivel, 2);
  assert.equal(E.rangoDe(150).ojos, 5);
  const medio = E.rangoDe(300); // mitad entre 150 (5 ojos) y 450 (10 ojos)
  assert.ok(medio.ojos >= 5 && medio.ojos < 10);
  assert.equal(E.rangoDe(1e6).rango.nombre, 'Panoptes');
  assert.equal(E.rangoDe(1e6).ojos, 100);
  assert.equal(E.rangoDe(1e6).siguiente, null);
  assert.equal(E.rangoDe(-50).nivel, 1, 'XP negativos no rompen el cálculo');
  for (let i = 1; i < E.RANGOS.length; i++) assert.ok(E.RANGOS[i].xp > E.RANGOS[i - 1].xp, 'los umbrales crecen');
});

test('puntos: dificultad de la pregunta y flags con pista', () => {
  assert.equal(E.xpPregunta(vf), 10);
  assert.equal(E.xpPregunta(unica), 15);
  assert.equal(E.xpPregunta(multi), 20);
  assert.equal(E.xpFlag({ tipo: 'user' }, 'Fácil', false), 40);
  assert.equal(E.xpFlag({ tipo: 'root' }, 'Difícil', false), 160);
  assert.equal(E.xpFlag({ tipo: 'root' }, 'Media', false), 120);
  assert.equal(E.xpFlag({ tipo: 'root' }, 'Media', true), 60, 'la pista reduce la flag a la mitad');
});

test('fechas: suma de días con cambio de mes y año', () => {
  assert.equal(E.sumarDias('2026-01-31', 1), '2026-02-01');
  assert.equal(E.sumarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(E.sumarDias('2026-03-01', -1), '2026-02-28');
  assert.equal(E.diasEntre('2026-01-01', '2026-01-31'), 30);
});

test('repaso espaciado (Leitner): aciertos suben de caja, un fallo vuelve a la caja 1 para hoy', () => {
  let e = E.repasar(undefined, true, '2026-10-01');
  assert.deepEqual([e.caja, e.due, e.aciertos], [1, '2026-10-02', 1]);
  e = E.repasar(e, true, '2026-10-02'); assert.deepEqual([e.caja, e.due], [2, '2026-10-05']);
  e = E.repasar(e, true, '2026-10-05'); assert.deepEqual([e.caja, e.due], [3, '2026-10-12']);
  e = E.repasar(e, false, '2026-10-12'); assert.deepEqual([e.caja, e.due, e.fallos], [1, '2026-10-12', 1]);
  for (let i = 0; i < 10; i++) e = E.repasar(e, true, '2026-11-01');
  assert.equal(e.caja, 5, 'la caja máxima es la 5');
  assert.equal(e.due, '2026-12-01', 'la caja 5 vuelve en 30 días');
  const resp = { a: { caja: 1, due: '2026-10-01' }, b: { caja: 3, due: '2026-09-20' }, c: { caja: 2, due: '2026-10-30' } };
  assert.deepEqual(E.pendientes(resp, '2026-10-05'), ['b', 'a'], 'pendientes ordenadas por fecha de repaso');
});

test('rachas: actual y mejor racha', () => {
  const dias = { '2026-10-01': { preguntas: 3 }, '2026-10-02': { preguntas: 1 }, '2026-10-03': { preguntas: 5 }, '2026-10-05': { preguntas: 2 }, '2026-09-28': { preguntas: 0 } };
  assert.equal(E.racha(dias, '2026-10-05'), 1);
  assert.equal(E.racha(dias, '2026-10-04'), 3, 'si hoy aún no has practicado, cuenta la racha hasta ayer');
  assert.equal(E.racha(dias, '2026-10-07'), 0);
  assert.equal(E.mejorRacha(dias), 3);
  assert.equal(E.racha({}, '2026-10-05'), 0);
});

test('barajado determinista y orden de opciones', () => {
  const l = Array.from({ length: 20 }, (_, i) => i);
  assert.deepEqual(E.barajar(l, 'semilla'), E.barajar(l, 'semilla'), 'misma semilla, mismo orden');
  assert.notDeepEqual(E.barajar(l, 'semilla'), E.barajar(l, 'otra'), 'distinta semilla, distinto orden');
  assert.deepEqual([...E.barajar(l, 'x')].sort((a, b) => a - b), l, 'es una permutación');
  assert.deepEqual(E.ordenOpciones(vf, 's'), [0, 1], 'verdadero/falso no se baraja');
  assert.deepEqual([...E.ordenOpciones(multi, 's')].sort(), [0, 1, 2, 3]);
});

test('el barajado reparte la respuesta correcta entre posiciones (sin sesgo hacia una letra)', () => {
  const unicas = B.rutas.flatMap((r) => r.salas.flatMap((s) => s.preguntas)).filter((q) => q.t === 'unica');
  const pos = [0, 0, 0, 0, 0];
  for (const q of unicas) pos[E.ordenOpciones(q, 'sesion-1').indexOf(q.c)]++;
  const max = Math.max(...pos.slice(0, 4)); const min = Math.min(...pos.slice(0, 4));
  assert.ok(max / unicas.length < 0.4, `ninguna posición concentra más del 40 % (${pos.join(', ')})`);
  assert.ok(min > 0, 'todas las posiciones reciben respuestas correctas');
});

test('simulacros: número de preguntas, sin repetir, repartidas entre salas y deterministas', () => {
  for (const sim of B.simulacros) {
    const ids = E.generarSimulacro(B.rutas, sim, 'seed-1');
    assert.equal(ids.length, sim.n, `${sim.id} tiene ${sim.n} preguntas`);
    assert.equal(new Set(ids).size, ids.length, `${sim.id} no repite preguntas`);
    const idx = E.indexar(B.rutas);
    const salas = new Set(ids.map((id) => idx.salaDe.get(id)));
    const total = B.rutas.filter((r) => sim.rutas.includes(r.id)).reduce((a, r) => a + r.salas.length, 0);
    assert.equal(salas.size, total, `${sim.id} incluye todas sus salas`);
    assert.ok(ids.every((id) => sim.rutas.includes(idx.rutaDe.get(id))), `${sim.id} solo usa sus rutas`);
    assert.deepEqual(E.generarSimulacro(B.rutas, sim, 'seed-1'), ids);
  }
});

test('corrección de un simulacro: nota, aprobado y desglose por sala', () => {
  const idx = E.indexar(B.rutas); const sim = B.simulacros[0];
  const ids = E.generarSimulacro(B.rutas, sim, 'seed-2');
  const resp = {};
  ids.forEach((id, i) => { const q = idx.preguntas.get(id); if (i < 21) resp[id] = q.t === 'multiple' ? q.c : q.c; });
  const r = E.corregirSimulacro(idx, ids, resp, sim);
  assert.equal(r.ok, 21); assert.equal(r.total, 30); assert.equal(r.nota, 0.7); assert.equal(r.aprobado, true);
  assert.equal(Object.values(r.porSala).reduce((a, s) => a + s.total, 0), 30);
  const r2 = E.corregirSimulacro(idx, ids, {}, sim);
  assert.equal(r2.ok, 0); assert.equal(r2.aprobado, false);
});

test('logros: se obtienen con el progreso que les corresponde', () => {
  const vacio = { xp: 0, respuestas: {}, salas: {}, maquinas: {}, simulacros: {}, dias: {}, logros: {}, repasosOk: 0 };
  assert.equal(E.logrosCumplidos(vacio, B, '2026-10-05').size, 0, 'sin progreso no hay logros');
  const ens = B.rutas.find((r) => r.id === 'ens');
  const p = { ...vacio, respuestas: { 'ens-1-01': { aciertos: 1 } }, salas: Object.fromEntries(ens.salas.map((s) => [s.id, { mejor: 1 }])),
    maquinas: { [B.maquinas[0].id]: { completada: true, pistas: [] } }, simulacros: { 'sim-ens': { aprobado: true, mejor: 0.93 } },
    dias: { '2026-10-03': { preguntas: 1 }, '2026-10-04': { preguntas: 1 }, '2026-10-05': { preguntas: 1 } }, repasosOk: 25, xp: 5000 };
  const s = E.logrosCumplidos(p, B, '2026-10-05');
  for (const id of ['primer-acierto', 'sala-1', 'sala-perfecta', 'ruta-ens', 'maquina-1', 'ojo-halcon', 'simulacro-ok', 'simulacro-90', 'racha-3', 'repaso-25', 'panoptes']) assert.ok(s.has(id), `logro ${id}`);
  for (const id of ['ruta-iso27001', 'ruta-continuidad', 'maquinas-todas', 'racha-7', 'cien']) assert.ok(!s.has(id), `sin logro ${id}`);
  assert.deepEqual(E.logrosNuevos({ ...p, logros: { 'primer-acierto': '2026-10-01' } }, B, '2026-10-05').includes('primer-acierto'), false, 'no repite logros ya obtenidos');
  const conPista = { ...vacio, maquinas: { [B.maquinas[0].id]: { completada: true, pistas: ['x'] } } };
  assert.ok(!E.logrosCumplidos(conPista, B, '2026-10-05').has('ojo-halcon'), 'ojo de halcón exige no abrir pistas');
  for (const l of E.LOGROS) assert.ok(l.id && l.nombre && l.desc && l.icono, `logro ${l.id} completo`);
});

test('progreso de ruta y siguiente sala recomendada', () => {
  const ens = B.rutas.find((r) => r.id === 'ens');
  const p = { respuestas: { [ens.salas[0].preguntas[0].id]: { aciertos: 1 } }, salas: { [ens.salas[0].id]: { mejor: 0.9 } } };
  const pr = E.progresoRuta(ens, p);
  assert.equal(pr.dominadas, 1); assert.equal(pr.superadas, 1); assert.equal(pr.salas, ens.salas.length);
  const sig = E.siguienteSala(B.rutas, p);
  assert.equal(sig.ruta.id, 'ens'); assert.equal(sig.sala.id, ens.salas[1].id, 'recomienda la primera sala no superada de la ruta con más avance');
  assert.equal(E.siguienteSala(B.rutas, { salas: {}, respuestas: {} }).sala.id, B.rutas[0].salas[0].id);
});

test('validación del banco: detecta los errores típicos', () => {
  const malo = { rutas: [{ id: 'r', nombre: 'R', salas: [{ id: 's', nombre: 'S', resumen: 'R', preguntas: [
    { id: 'mal', t: 'unica', q: 'corta', o: ['a', 'a', 'b'], c: 5, x: 'corta', ref: '', d: 4 },
    { id: 'r-1', t: 'multiple', q: 'Pregunta múltiple sin incorrectas', o: ['a', 'b', 'c'], c: [0, 1, 2], x: 'Explicación suficientemente larga.', ref: 'Ref', d: 1 },
    { id: 'r-1', t: 'vf', q: 'Pregunta repetida de verdadero', c: 'si', x: 'Explicación suficientemente larga.', ref: 'Ref', d: 1 }
  ] }] }], maquinas: [], simulacros: [{ id: 'sim', rutas: ['nada'], n: 99, minutos: 0, aprobado: 2 }] };
  const err = E.validarBanco(malo).join('\n');
  for (const frag of ['id con formato', 'enunciado', 'explicación', 'referencia', 'dificultad', 'opciones repetidas', 'fuera de rango', 'al menos 2 correctas', 'c booleano', 'id repetido', 'al menos 6 preguntas', 'ruta desconocida', 'pide 99', 'tiempo o nota']) assert.match(err, new RegExp(frag), `detecta «${frag}»`);
});
