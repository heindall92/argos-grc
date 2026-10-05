/* Pruebas del banco de preguntas: integridad, cifras, reparto y reglas de contenido (aviso legal). */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../app/src/engine.js');
const B = require('../app/data/index.js');

const preguntas = B.rutas.flatMap((r) => r.salas.flatMap((s) => s.preguntas.map((q) => ({ ...q, ruta: r.id, sala: s.id }))));
const flags = B.maquinas.flatMap((m) => m.flags.map((f) => ({ ...f, maquina: m.id })));
const todo = [...preguntas, ...flags];

test('el banco completo pasa la validación sin errores', () => {
  assert.deepEqual(E.validarBanco(B), []);
});

test('cifras del banco', () => {
  const st = E.estadisticas(B);
  assert.deepEqual(st, { rutas: 3, salas: 19, preguntas: 190, maquinas: 15, flags: 75, simulacros: 13, logros: 20 });
  for (const r of B.rutas) for (const s of r.salas) assert.equal(s.preguntas.length, 10, `${s.id} tiene 10 preguntas`);
});

test('variedad: hay preguntas de los tres tipos y de las tres dificultades en cada ruta', () => {
  for (const r of B.rutas) {
    const qs = preguntas.filter((q) => q.ruta === r.id);
    for (const t of ['unica', 'multiple', 'vf']) assert.ok(qs.some((q) => q.t === t), `${r.id} tiene preguntas de tipo ${t}`);
    for (const d of [1, 2, 3]) assert.ok(qs.some((q) => q.d === d), `${r.id} tiene dificultad ${d}`);
  }
  const vfs = todo.filter((q) => q.t === 'vf');
  assert.ok(vfs.some((q) => q.c) && vfs.some((q) => !q.c), 'hay verdaderos y falsos');
});

test('los ids siguen el prefijo de su sala o máquina', () => {
  for (const q of preguntas) assert.ok(q.id.startsWith(q.sala + '-'), `${q.id} empieza por ${q.sala}`);
  for (const f of flags) assert.ok(f.id.startsWith(f.maquina + '-'), `${f.id} empieza por ${f.maquina}`);
});

test('cada flag tiene pista y las máquinas tienen flags de usuario y de root', () => {
  for (const f of flags) assert.ok(typeof f.pista === 'string' && f.pista.length > 15, `${f.id} tiene pista`);
  for (const m of B.maquinas) {
    assert.ok(m.flags.some((f) => f.tipo === 'user') && m.flags.some((f) => f.tipo === 'root'), `${m.id} mezcla user y root`);
    assert.match(m.empresa, /ficti/, `${m.id} declara que la organización es ficticia`);
  }
});

test('las referencias de la ruta ENS apuntan a fuentes públicas', () => {
  for (const q of preguntas.filter((x) => x.ruta === 'ens')) assert.match(q.ref, /RD 311\/2022|CCN-STIC|MAGERIT/, `${q.id}: ${q.ref}`);
});

test('las citas literales solo están en contenido de fuente pública (BOE) y aparecen en el texto del real decreto', () => {
  const conCita = todo.filter((q) => q.cita);
  assert.ok(conCita.length >= 20, 'hay suficientes citas literales');
  for (const q of conCita) {
    assert.match(q.ref, /RD 311\/2022/, `${q.id}: una cita literal solo puede venir del RD 311/2022 (BOE)`);
    assert.ok(q.cita.length <= 420, `${q.id}: la cita es un extracto breve`);
  }
});

test('ninguna pregunta reproduce texto de normas ISO ni promete una certificación', () => {
  // Frases típicas del texto inglés de las normas y expresiones que no deben aparecer en un laboratorio independiente.
  const prohibido = [/\bshall\b/i, /the organization shall/i, /information security management system/i, /preguntas? (reales|oficiales) de examen/i, /examen oficial/i, /\bte certifica\b/i, /certificado oficial/i];
  for (const q of todo) {
    const txt = [q.q, q.x, ...(q.o || []), q.cita || ''].join(' ');
    for (const re of prohibido) assert.doesNotMatch(txt, re, `${q.id} contiene «${re}»`);
  }
});

test('las referencias ISO citan cláusula o control, nunca el texto', () => {
  for (const q of todo.filter((x) => /ISO/.test(x.ref))) assert.match(q.ref, /cláusula|anexo|apdo|cap\.|17021|27006|27005|19011|Amd|familia|atributos/, `${q.id}: ${q.ref}`);
});

test('los enunciados y explicaciones no tienen espacios dobles ni restos de marcado', () => {
  for (const q of todo) for (const t of [q.q, q.x, ...(q.o || [])]) {
    assert.doesNotMatch(t, / {2}/, `${q.id}: espacio doble`);
    assert.doesNotMatch(t, /<[a-z]|\*\*|undefined|null/, `${q.id}: marcado o resto de código`);
  }
});

test('máquinas: 5 fáciles, 5 medias y 5 difíciles, ids únicos y organizaciones ficticias', () => {
  const por = {}; for (const m of B.maquinas) por[m.dificultad] = (por[m.dificultad] || 0) + 1;
  assert.deepEqual(por, { 'Fácil': 5, 'Media': 5, 'Difícil': 5 });
  assert.equal(new Set(B.maquinas.map((m) => m.id)).size, B.maquinas.length);
  const orden = B.maquinas.map((m) => ['Fácil', 'Media', 'Difícil'].indexOf(m.dificultad));
  assert.deepEqual(orden, [...orden].sort((a, b) => a - b), 'ordenadas de fácil a difícil');
  for (const m of B.maquinas) assert.ok(m.flags.length >= 5, `${m.id} tiene al menos 5 flags`);
});

test('los simulacros caben en el banco y tienen descripción', () => {
  for (const s of B.simulacros) {
    assert.ok(s.descripcion && s.descripcion.length > 20);
    assert.ok(s.minutos / s.n >= 1, `${s.id}: al menos 1 minuto por pregunta`);
  }
  const tipos = {}; for (const s of B.simulacros) tipos[s.tipo] = (tipos[s.tipo] || 0) + 1;
  assert.ok(B.simulacros.length >= 10, 'al menos 10 simulacros');
  for (const t of ['sprint', 'bloque', 'completo', 'reto']) assert.ok(tipos[t] >= 2, `al menos 2 simulacros de tipo ${t}`);
  for (const id of ['sim-ens', 'sim-iso', 'sim-grc']) assert.ok(B.simulacros.some((s) => s.id === id), `se conserva ${id} (progreso guardado)`);
  {
  }
});

test('cada cita literal aparece tal cual en el texto del RD 311/2022 publicado en el BOE', () => {
  const fs = require('fs'); const path = require('path');
  const norm = (t) => t.replace(/-\n/g, '').replace(/\s+/g, ' ').replace(/[«»"]/g, '"').trim();
  const boe = norm(fs.readFileSync(path.join(__dirname, 'fixtures', 'boe-rd-311-2022.txt'), 'utf8'));
  for (const q of todo.filter((x) => x.cita)) {
    for (const trozo of q.cita.split('[…]').map((x) => norm(x)).filter((x) => x.length > 8)) {
      assert.ok(boe.includes(trozo), `${q.id}: no se encuentra en el BOE «${trozo.slice(0, 80)}…»`);
    }
  }
});
