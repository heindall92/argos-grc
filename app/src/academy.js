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
  function semilla(texto) { let n=2166136261; for (const c of texto) n=Math.imul(n ^ c.codePointAt(0),16777619); return n>>>0; }
  function caso(seed) {
    const codigo = String(seed || 'ARGOS').trim().slice(0,40) || 'ARGOS'; const n=semilla(codigo);
    const variante=n%3; const rto=[60,90,120][(n>>>3)%3]; const rpo=[15,30,60][(n>>>5)%3];
    const recuperacion=variante===0?rto+30:rto-15; const perdida=variante===1?rpo+30:rpo-5;
    const foco=['rto','rpo','evidencia'][variante];
    return { codigo, variante, rto, rpo, recuperacion, perdida, foco, evidencias: [
      { id:'E1', titulo:'Política interna POL-BCP-01 · empresa ficticia', texto:`El servicio debe recuperarse en ${rto} minutos desde la interrupción. Se admite perder como máximo ${rpo} minutos de datos. Toda prueba debe registrar interrupción, recuperación y último dato recuperable.` },
      { id:'E2', titulo:'Cronología del incidente', texto:'Interrupción: minuto 0. Activación del plan: minuto 10. El plazo de recuperación se mide desde la interrupción, no desde la activación.' },
      { id:'E3', titulo:'Acta de recuperación', texto:`El servicio quedó disponible en el minuto ${recuperacion} desde la interrupción. La disponibilidad fue comprobada por operaciones.` },
      { id:'E4', titulo:'Registro de datos recuperados', texto:variante===2?'El acta indica «copia OK», pero no contiene fecha ni hora del último dato recuperable.':`Último dato recuperable: ${perdida} minutos antes de la interrupción. El registro está fechado y contrastado con una transacción de prueba.` }
    ] };
  }
  function limpiarBorrador(raw) {
    if (!raw || typeof raw!=='object' || typeof raw.seed!=='string') return null;
    const campos=['foco','criterio','clasificacion','accion','hallazgo','justificacion','verificacion'];
    const valores={}; for(const k of campos) valores[k]=typeof raw.valores?.[k]==='string'?raw.valores[k].replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,2000):'';
    valores.evidencias=Array.isArray(raw.valores?.evidencias)?[...new Set(raw.valores.evidencias.filter(x=>['E1','E2','E3','E4'].includes(x)))]:[];
    return { seed:raw.seed.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,40)||'ARGOS', valores };
  }
  function rubrica(c, v) {
    const esperadas=c.foco==='rto'?['E1','E2','E3']:['E1','E4'];
    const clasificacion=c.foco==='evidencia'?'insuficiente':'desviacion';
    const accion=c.foco==='rto'?'recuperacion':c.foco==='rpo'?'copias':'registro';
    const criterios=[
      { nombre:'Problema identificado', ok:v.foco===c.foco, ayuda:c.foco==='rto'?`La recuperación tarda ${c.recuperacion} min y el límite es ${c.rto}.`:c.foco==='rpo'?`Se pierden ${c.perdida} min de datos y el límite es ${c.rpo}.`:'Sin la hora del último dato recuperable no se puede concluir si se cumple el RPO.' },
      { nombre:'Evidencias suficientes y criterio', ok:esperadas.every(id=>(v.evidencias||[]).includes(id)) && v.criterio===(c.foco==='rto'?'rto':'rpo'), ayuda:`Cruza ${esperadas.join(', ')} con POL-BCP-01. RTO y RPO miden cosas diferentes.` },
      { nombre:'Clasificación prudente', ok:v.clasificacion===clasificacion, ayuda:clasificacion==='insuficiente'?'Falta evidencia: evita afirmar cumplimiento o incumplimiento del RPO.':'Hay una desviación frente a la política del caso. La gravedad requiere contexto adicional.' },
      { nombre:'Acción orientada al problema', ok:v.accion===accion, ayuda:accion==='recuperacion'?'Mejora y prueba la capacidad de recuperación.':accion==='copias'?'Ajusta y prueba la frecuencia/capacidad de recuperación de datos.':'Repite la prueba y registra tiempos y último dato recuperable.' }
    ];
    return { criterios, puntos:criterios.filter(x=>x.ok).length, max:criterios.length, textosCompletos:['hallazgo','justificacion','verificacion'].every(k=>(v[k]||'').trim().length>=30) };
  }
  function informe(c,v,version) {
    const r=rubrica(c,v); const texto=s=>String(s||'Sin completar').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).split('\n').map(l=>'> '+l).join('\n');
    return `# ARGOS · Informe de práctica\n\nVersión: ${version}\nCaso: recuperación de Pegaso · Semilla: ${c.codigo.replace(/[\r\n<>]/g,'')}\nOrganización ficticia. Autoevaluación, sin valor de certificación.\n\n## Criterio interno\n\nRTO: ${c.rto} min. RPO: ${c.rpo} min. POL-BCP-01.\n\n## Evidencias\n\n${(v.evidencias||[]).join(', ')||'Sin seleccionar'}\n\n## Hallazgo\n\n${texto(v.hallazgo)}\n\n## Justificación\n\n${texto(v.justificacion)}\n\n## Decisiones\n\nFoco: ${v.foco||'pendiente'}. Criterio: ${v.criterio||'pendiente'}. Clasificación: ${v.clasificacion||'pendiente'}. Acción: ${v.accion||'pendiente'}.\n\n## Comprobación de eficacia propuesta\n\n${texto(v.verificacion)}\n\n## Retroalimentación automática\n\n${r.puntos}/${r.max} comprobaciones estructuradas. Los textos requieren valoración humana.\n\n${r.criterios.map(x=>`- ${x.ok?'OK':'Revisar'}: ${x.nombre}. ${x.ayuda}`).join('\n')}\n`;
  }
  const API = { COMPETENCIAS, estado, competencias, recomendar, evolucion, caso, limpiarBorrador, rubrica, informe };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ArgosAcademy = Object.freeze(API);
})(typeof window !== 'undefined' ? window : this);
