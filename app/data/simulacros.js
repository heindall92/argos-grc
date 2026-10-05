/* Simulacros · Exámenes cronometrados de práctica que toman preguntas al azar del banco, repartidas entre las salas.
 * El formato es orientativo y propio: no reproduce el formato ni las preguntas de ningún examen oficial. */
'use strict';
module.exports = [
  { id: 'sim-ens', nombre: 'Simulacro ENS', rutas: ['ens'], n: 30, minutos: 45, aprobado: 0.7, descripcion: '30 preguntas de las siete salas del ENS en 45 minutos. Se aprueba con un 70 %.' },
  { id: 'sim-iso', nombre: 'Simulacro ISO/IEC 27001', rutas: ['iso27001'], n: 40, minutos: 60, aprobado: 0.7, descripcion: '40 preguntas de las ocho salas de la 27001 en 60 minutos. Se aprueba con un 70 %.' },
  { id: 'sim-grc', nombre: 'Simulacro GRC integral', rutas: ['ens', 'iso27001', 'continuidad'], n: 50, minutos: 75, aprobado: 0.7, descripcion: '50 preguntas de las tres rutas en 75 minutos. El examen final del laboratorio.' }
];
