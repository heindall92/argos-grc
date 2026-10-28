#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const A = require('../app/src/academy.js');
const E = require('../app/src/engine.js');
const archivo = process.argv[2];
if (!archivo) { console.error('Uso: node tools/validar-pack.js paquete.json'); process.exit(2); }
try {
  if(fs.statSync(archivo).size>100000)throw Error('Máximo 100 KB.');
  const errores=A.validarPack(JSON.parse(fs.readFileSync(archivo,'utf8')),E);
  if(errores.length){console.error(errores.join('\n'));process.exitCode=1;}else console.log('Formato válido. Revisión editorial necesaria antes de publicar.');
} catch(e) {console.error(e.message);process.exitCode=1;}
