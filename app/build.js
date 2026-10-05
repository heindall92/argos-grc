#!/usr/bin/env node
/* Construye ARGOS:
 *  - dist/index.html: un único HTML autónomo con CSP por hashes, sin conexiones salientes ni recursos externos.
 *  - dist/artifact/argos.html: el mismo contenido sin <head>, para plataformas que añaden el suyo.
 * Antes de construir valida el banco de preguntas: si hay un error, la construcción falla.
 * Uso: node app/build.js */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const E = require('./src/engine.js');
const BANCO = require('./data/index.js');

const errores = E.validarBanco(BANCO);
if (errores.length) { console.error('El banco de preguntas tiene errores:\n - ' + errores.join('\n - ')); process.exit(1); }

const ROOT = __dirname;
const DIST = path.join(ROOT, '..', 'dist');
const src = (f) => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, '..', 'package.json'), 'utf8'));

const DATA_JS = 'window.ARGOS_DATA = ' + JSON.stringify({ version: pkg.version, ...BANCO }).replace(/<\//g, '<\\/') + ';';
const APP = '(function () {\n\'use strict\';\ntry { Object.freeze(Object.prototype); Object.freeze(Array.prototype); } catch (e) { /* entorno que no lo permite */ }\n'
  + fs.readdirSync(path.join(ROOT, 'src', 'ui')).filter((f) => f.endsWith('.js')).sort().map((f) => `/* ===== ${f} ===== */\n` + src('ui/' + f)).join('\n') + '\n})();';
const html = src('index.html')
  .replace('/*__STYLES__*/', () => src('styles.css'))
  .replace('/*__DATA__*/', () => DATA_JS)
  .replace('/*__ENGINE__*/', () => src('engine.js'))
  .replace('/*__APP__*/', () => APP);

fs.mkdirSync(path.join(DIST, 'artifact'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'artifact', 'argos.html'), html);

const sha = (t) => "'sha256-" + crypto.createHash('sha256').update(t, 'utf8').digest('base64') + "'";
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => sha(m[1]));
const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => sha(m[1]));
// Solo se ejecuta el código de este build. style-src-attr 'unsafe-inline' cubre los atributos style="" de las plantillas (no ejecuta código).
const CSP = `default-src 'none'; script-src ${scripts.join(' ')}; style-src ${styles.join(' ')}; style-src-attr 'unsafe-inline'; font-src 'none'; img-src data: blob:; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'; base-uri 'none'; form-action 'none'`;
// Favicon: el mismo logotipo que dibuja la app (01-icons.js), evaluado aquí para no duplicar el dibujo
const vm = require('vm');
const iconos = vm.runInNewContext(src('ui/01-icons.js') + '\n;({ logo })', {});
const icono = 'data:image/svg+xml,' + encodeURIComponent(iconos.logo(64, 'x').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
const standalone = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="' + CSP + '">\n<meta name="referrer" content="no-referrer">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="color-scheme" content="light dark">\n<meta name="theme-color" content="#f2f2f7" media="(prefers-color-scheme: light)">\n<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">\n<link rel="icon" href="' + icono + '">\n'
  + html.replace('<a class="skip"', '</head>\n<body>\n<a class="skip"') + '\n</body>\n</html>\n';
fs.writeFileSync(path.join(DIST, 'index.html'), standalone);
const st = E.estadisticas(BANCO);
console.log(`OK dist/index.html ${(standalone.length / 1024).toFixed(0)} KB · ${st.preguntas} preguntas en ${st.salas} salas · ${st.maquinas} máquinas (${st.flags} flags) · ${st.simulacros} simulacros`);
