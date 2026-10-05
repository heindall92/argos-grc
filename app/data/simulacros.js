/* Simulacros · Exámenes cronometrados de práctica que toman preguntas al azar del banco, repartidas entre las salas.
 * Tipos: sprint (repaso rápido), bloque (una parte de la ruta), completo (toda la ruta) y reto (más difícil o más largo).
 * Filtros opcionales: salas (ids) y dificultad (niveles 1 a 3).
 * El formato es orientativo y propio: no reproduce el formato ni las preguntas de ningún examen oficial. */
'use strict';
module.exports = [
  { id: 'sprint-ens', tipo: 'sprint', nombre: 'Sprint ENS', rutas: ['ens'], n: 10, minutos: 10, aprobado: 0.7, descripcion: '10 preguntas del ENS en 10 minutos. Para repasar en un rato libre.' },
  { id: 'sprint-iso', tipo: 'sprint', nombre: 'Sprint ISO/IEC 27001', rutas: ['iso27001'], n: 10, minutos: 10, aprobado: 0.7, descripcion: '10 preguntas de la 27001 en 10 minutos, de todas sus salas.' },
  { id: 'sprint-cont', tipo: 'sprint', nombre: 'Sprint continuidad', rutas: ['continuidad'], n: 10, minutos: 12, aprobado: 0.7, descripcion: '10 preguntas de continuidad de negocio en 12 minutos.' },
  { id: 'blq-ens-base', tipo: 'bloque', nombre: 'ENS · Fundamentos, roles y auditoría', rutas: ['ens'], salas: ['ens-1', 'ens-2', 'ens-5'], n: 20, minutos: 30, aprobado: 0.7, descripcion: 'Ámbito y principios, política y requisitos mínimos, auditoría y conformidad: el articulado del real decreto.' },
  { id: 'blq-ens-tec', tipo: 'bloque', nombre: 'ENS · Categorización, medidas y riesgos', rutas: ['ens'], salas: ['ens-3', 'ens-4', 'ens-6', 'ens-7'], n: 25, minutos: 40, aprobado: 0.7, descripcion: 'Anexos I y II, MAGERIT y el puente con la ISO/IEC 27001: la parte técnica del ENS.' },
  { id: 'blq-iso-sgsi', tipo: 'bloque', nombre: 'ISO/IEC 27001 · El SGSI', rutas: ['iso27001'], salas: ['iso-1', 'iso-2', 'iso-3', 'iso-4', 'iso-5'], n: 25, minutos: 40, aprobado: 0.7, descripcion: 'Estructura de la norma y cláusulas 4 a 10: contexto, liderazgo, riesgos, apoyo, operación, evaluación y mejora.' },
  { id: 'blq-iso-anexo', tipo: 'bloque', nombre: 'ISO/IEC 27001 · Anexo A y certificación', rutas: ['iso27001'], salas: ['iso-6', 'iso-7', 'iso-8'], n: 25, minutos: 40, aprobado: 0.7, descripcion: 'Los controles del anexo A y cómo funciona la certificación y la auditoría.' },
  { id: 'sim-ens', tipo: 'completo', nombre: 'Simulacro ENS', rutas: ['ens'], n: 30, minutos: 45, aprobado: 0.7, descripcion: '30 preguntas de las siete salas del ENS en 45 minutos. Se aprueba con un 70 %.' },
  { id: 'sim-iso', tipo: 'completo', nombre: 'Simulacro ISO/IEC 27001', rutas: ['iso27001'], n: 40, minutos: 60, aprobado: 0.7, descripcion: '40 preguntas de las ocho salas de la 27001 en 60 minutos. Se aprueba con un 70 %.' },
  { id: 'sim-cont', tipo: 'completo', nombre: 'Simulacro de continuidad', rutas: ['continuidad'], n: 25, minutos: 40, aprobado: 0.7, descripcion: '25 preguntas de BIA, estrategias, planes y pruebas en 40 minutos. Se aprueba con un 70 %.' },
  { id: 'sim-grc', tipo: 'completo', nombre: 'Simulacro GRC integral', rutas: ['ens', 'iso27001', 'continuidad'], n: 50, minutos: 75, aprobado: 0.7, descripcion: '50 preguntas de las tres rutas en 75 minutos. El examen final del laboratorio.' },
  { id: 'reto-dificil', tipo: 'reto', nombre: 'Reto: las más difíciles', rutas: ['ens', 'iso27001', 'continuidad'], dificultad: [3], n: 18, minutos: 30, aprobado: 0.6, descripcion: 'Las 18 preguntas de máxima dificultad del banco, sin ninguna fácil. Se aprueba con un 60 %.' },
  { id: 'reto-maraton', tipo: 'reto', nombre: 'Maratón GRC', rutas: ['ens', 'iso27001', 'continuidad'], n: 90, minutos: 135, aprobado: 0.75, descripcion: '90 preguntas en 2 horas y cuarto, con un aprobado más exigente (75 %). Resistencia de examen real.' }
];
