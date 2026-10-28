/* Aprendizaje práctico: funciones puras compartidas con las pruebas. */
(function (root) {
  'use strict';
  const COMPETENCIAS = [
    { id: 'gobernanza', nombre: 'Gobernanza y responsabilidades', salas: ['ens-1','ens-2','iso-1','iso-2'], maquinas: ['m-nube','m-puesto'] },
    { id: 'categoria', nombre: 'Categorización del sistema', salas: ['ens-3'], maquinas: ['m-categoria','m-ensalta'] },
    { id: 'controles', nombre: 'Controles y aplicabilidad', salas: ['ens-4','ens-7','iso-6','iso-7'], maquinas: ['m-soa','m-baja'] },
    { id: 'riesgos', nombre: 'Análisis y tratamiento de riesgos', salas: ['ens-6','iso-3'], maquinas: ['m-magerit'] },
    { id: 'auditoria', nombre: 'Auditoría y acciones correctivas', salas: ['ens-5','iso-5','iso-8'], maquinas: ['m-auditoria','m-interna'] },
    { id: 'operacion', nombre: 'Operación y gestión del cambio', salas: ['iso-4'], maquinas: ['m-despliegue','m-phishing'] },
    { id: 'continuidad', nombre: 'BIA, recuperación y continuidad', salas: ['cont-1','cont-2','cont-3','cont-4'], maquinas: ['m-bia','m-ransom','m-copias','m-region'] }
  ];
  function estado(e, hoy) {
    if (!e) return 'nueva';
    if (e.caja >= 3 && e.aciertos >= 3 && e.due >= hoy) return 'retenida';
    return e.aciertos > 0 ? 'acertada' : 'vista';
  }
  function competencias(banco, progreso, hoy) {
    return COMPETENCIAS.map((c) => {
      const preguntas = banco.rutas.flatMap((r) => r.salas).filter((s) => c.salas.includes(s.id)).flatMap((s) => s.preguntas);
      const estados = { nueva: 0, vista: 0, acertada: 0, retenida: 0 };
      for (const q of preguntas) estados[estado(progreso.respuestas?.[q.id], hoy)]++;
      return { ...c, total: preguntas.length, estados, pct: preguntas.length ? estados.retenida / preguntas.length : 0, casos: c.maquinas.filter((id) => progreso.maquinas?.[id]?.completada).length };
    });
  }
  function recomendar(banco, progreso, hoy) {
    const vencidas = Object.entries(progreso.respuestas || {}).filter(([, e]) => e.due && e.due <= hoy).length;
    if (vencidas) return { tipo: 'repaso', motivo: `Tienes ${vencidas} preguntas con repaso vencido. Recupera primero esas ideas.` };
    const cs = competencias(banco, progreso, hoy).sort((a,b) => a.pct - b.pct || a.estados.acertada - b.estados.acertada);
    const c = cs[0];
    const sala = c.salas.find((id) => (progreso.salas?.[id]?.mejor || 0) < .8) || c.salas[0];
    return { tipo: 'sala', id: sala, maquina: c.maquinas.find((id) => !progreso.maquinas?.[id]?.completada) || c.maquinas[0], motivo: `${c.nombre}: ${c.estados.retenida} de ${c.total} preguntas retenidas. Practica esta competencia y aplica después lo aprendido en un caso.` };
  }
  function evolucion(progreso) {
    const respuestas = Object.values(progreso.respuestas || {});
    const tasa = (lista) => lista.length ? lista.filter((x) => x.acierto).length / lista.length : null;
    const iniciales = respuestas.flatMap((e) => (e.historial || []).slice(0, 1));
    const recientes = respuestas.flatMap((e) => (e.historial || []).slice(-1));
    return { inicial: tasa(iniciales), reciente: tasa(recientes), preguntas: iniciales.length };
  }
  const API = { COMPETENCIAS, estado, competencias, recomendar, evolucion };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ArgosAcademy = Object.freeze(API);
})(typeof window !== 'undefined' ? window : this);
