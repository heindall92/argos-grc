#!/usr/bin/env node
/* Genera la cabecera y el pie del README con el mismo ojo que dibuja la app (app/src/ui/01-icons.js).
 * Uso: node docs/assets/generar.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');
const { ojoSvg } = vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'app/src/ui/01-icons.js'), 'utf8') + '\n;({ ojoSvg })', {});
const OUT = path.join(__dirname, 'readme');
fs.mkdirSync(OUT, { recursive: true });

// Ocelo de pavo real (oro, turquesa, azul noche y centro oscuro), orientado hacia fuera del círculo
const ocelo = (x, y, rot, e) => `<g class="p" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${e})"><ellipse rx="2.4" ry="3.1" fill="#C9A227"/><ellipse rx="1.85" ry="2.45" fill="#13B6A8"/><ellipse cy=".25" rx="1.15" ry="1.5" fill="#1B2F8F"/><ellipse cy=".35" rx=".55" ry=".75" fill="#070B1E"/></g>`;
const cx = 1020; const cy = 160; let plumas = '';
[[112, 18, 2.6], [168, 26, 3.4]].forEach(([r, n, e], k) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + k * 0.12; plumas += ocelo(cx + Math.cos(a) * r, cy + Math.sin(a) * r, (a * 180) / Math.PI + 90, e); } });

const cabecera = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="320" viewBox="0 0 1280 320" role="img" aria-label="ARGOS · Laboratorio GRC de código abierto">
  <title>ARGOS · Laboratorio GRC de código abierto</title>
  <style>
    .p { animation: abre 1.4s cubic-bezier(.32,.72,0,1) both; }
    .t { animation: sube 1.1s cubic-bezier(.32,.72,0,1) both; }
    @keyframes abre { from { opacity: 0; } to { opacity: 1; } }
    @keyframes sube { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .p, .t { animation: none; } }
  </style>
  <defs>
    <radialGradient id="halo" cx="0.8" cy="0.5" r="0.5"><stop offset="0" stop-color="#2F6BFF" stop-opacity=".22"/><stop offset="1" stop-color="#05070D" stop-opacity="0"/></radialGradient>
    <clipPath id="c"><rect width="1280" height="320" rx="32"/></clipPath>
  </defs>
  <g clip-path="url(#c)">
    <rect width="1280" height="320" fill="#05070D"/>
    <rect width="1280" height="320" fill="url(#halo)"/>
    ${plumas}
    <g transform="translate(${cx - 32 * 3.2} ${cy - 32 * 3.2}) scale(3.2)">${ojoSvg('hd', true, '#A9B6C8')}</g>
  </g>
  <g class="t" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif">
    <text x="80" y="112" fill="#7FE3E7" font-size="20" font-weight="700" letter-spacing="5">LABORATORIO GRC · CÓDIGO ABIERTO</text>
    <text x="76" y="196" fill="#FFFFFF" font-size="92" font-weight="800" letter-spacing="14">ARGOS</text>
    <text x="80" y="242" fill="#C9D6E3" font-size="24" font-weight="500">ENS · ISO/IEC 27001 · Continuidad de negocio</text>
    <text x="80" y="276" fill="#7D8C9C" font-size="18" font-weight="500">Rutas, casos prácticos y simulacros con puntos, rangos y logros</text>
  </g>
</svg>
`;
const pie = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="90" viewBox="0 0 1280 90" role="img" aria-label="ARGOS"><title>ARGOS</title>
  <defs><clipPath id="c"><rect width="1280" height="90" rx="24"/></clipPath></defs>
  <g clip-path="url(#c)"><rect width="1280" height="90" fill="#05070D"/>${Array.from({ length: 24 }, (_, i) => `<g opacity="${(0.35 + 0.65 * Math.sin((i / 23) * Math.PI)).toFixed(2)}">${ocelo(26 + i * 53.7, 45, 0, i % 2 ? 2.4 : 3.2).replace(' class="p"', '')}</g>`).join('')}</g>
</svg>
`;
fs.writeFileSync(path.join(OUT, 'cabecera.svg'), cabecera);
fs.writeFileSync(path.join(OUT, 'pie.svg'), pie);
console.log('OK docs/assets/readme/cabecera.svg y pie.svg');
