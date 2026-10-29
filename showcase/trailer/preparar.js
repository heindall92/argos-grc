// Copia la grabación de la demo y el logo de ARGOS a public/ para que Remotion los sirva.
// La grabación se genera con: python3 tools/grabar-demo.py (desde la raíz del repositorio).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const raiz = path.join(__dirname, '..', '..');
const video = path.join(raiz, 'showcase', 'grabaciones', 'demo-completa.mp4');
if (!fs.existsSync(video)) { console.error('Falta showcase/grabaciones/demo-completa.mp4. Ejecuta antes: python3 tools/grabar-demo.py'); process.exit(1); }
fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
fs.copyFileSync(video, path.join(__dirname, 'public', 'demo.mp4'));
const iconos = vm.runInNewContext(fs.readFileSync(path.join(raiz, 'app', 'src', 'ui', '01-icons.js'), 'utf8') + ';({ logo })', {});
fs.writeFileSync(path.join(__dirname, 'public', 'logo.svg'), iconos.logo(512, 'x').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
const pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));
const E = require(path.join(raiz, 'app', 'src', 'engine.js'));
const B = require(path.join(raiz, 'app', 'data', 'index.js'));
fs.writeFileSync(path.join(__dirname, 'src', 'datos.json'), JSON.stringify({ version: pkg.version, ...E.estadisticas(B) }, null, 2) + '\n');
console.log('Preparado: public/demo.mp4, public/logo.svg y src/datos.json');
