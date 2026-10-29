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
  function normalizarSemilla(s) { return String(s||'').replace(/[^\p{L}\p{N} _.-]/gu,'').trim().slice(0,40)||'ARGOS'; }
  function caso(seed) {
    const codigo = normalizarSemilla(seed); const n=semilla(codigo);
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
    const valores={}; for(const k of campos) valores[k]=typeof raw.valores?.[k]==='string'?raw.valores[k].replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,' ').slice(0,2000):'';
    const opciones={foco:['rto','rpo','evidencia'],criterio:['rto','rpo'],clasificacion:['desviacion','insuficiente','conforme'],accion:['recuperacion','copias','registro']};
    for(const [k,validas] of Object.entries(opciones))if(!validas.includes(valores[k]))valores[k]='';
    valores.evidencias=Array.isArray(raw.valores?.evidencias)?[...new Set(raw.valores.evidencias.filter(x=>['E1','E2','E3','E4'].includes(x)))]:[];
    return { seed:normalizarSemilla(raw.seed), valores };
  }
  function rubrica(c, v) {
    const esperadas=c.foco==='rto'?['E1','E3']:['E1','E4'];
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
    const r=rubrica(c,v); const texto=s=>String(s||'Sin completar').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/[\\`*_[\]{}()#!|]/g,'\\$&').split('\n').map(l=>'> '+l).join('\n');
    return `# ARGOS · Informe de práctica\n\nVersión: ${version}\nCaso: recuperación de Pegaso · Semilla: ${c.codigo.replace(/[\r\n<>]/g,'')}\nOrganización ficticia. Autoevaluación, sin valor de certificación.\n\n## Criterio interno\n\nRTO: ${c.rto} min. RPO: ${c.rpo} min. POL-BCP-01.\n\n## Evidencias\n\n${(v.evidencias||[]).join(', ')||'Sin seleccionar'}\n\n## Hallazgo\n\n${texto(v.hallazgo)}\n\n## Justificación\n\n${texto(v.justificacion)}\n\n## Decisiones\n\nFoco: ${v.foco||'pendiente'}. Criterio: ${v.criterio||'pendiente'}. Clasificación: ${v.clasificacion||'pendiente'}. Acción: ${v.accion||'pendiente'}.\n\n## Comprobación de eficacia propuesta\n\n${texto(v.verificacion)}\n\n## Retroalimentación automática\n\n${r.puntos}/${r.max} comprobaciones estructuradas. Los textos requieren valoración humana.\n\n${r.criterios.map(x=>`- ${x.ok?'OK':'Revisar'}: ${x.nombre}. ${x.ayuda}`).join('\n')}\n`;
  }
  function resumenTaller(banco,p,hoy,version,opciones={}) {
    const b=limpiarBorrador(p.laboratorio); const out={app:'argos-taller',schema:1,version,fecha:hoy,semilla:b?.seed||'ARGOS',autoevaluacion:true};
    if(opciones.nombre) out.nombre=String(p.perfil?.nombre||'').slice(0,60);
    if(opciones.competencias) out.competencias=competencias(banco,p,hoy).map(c=>({id:c.id,total:c.total,retenidas:c.estados.retenida,acertadas:c.estados.acertada}));
    if(opciones.laboratorio && b){const r=rubrica(caso(b.seed),b.valores);out.laboratorio={puntos:r.puntos,max:r.max,foco:b.valores.foco,criterio:b.valores.criterio,clasificacion:b.valores.clasificacion,accion:b.valores.accion};}
    if(opciones.textos && b) out.textos={hallazgo:b.valores.hallazgo,justificacion:b.valores.justificacion,verificacion:b.valores.verificacion};
    return out;
  }
  function agregarResumenes(resumenes,version,seed) {
    const validos=[];const errores=[];
    resumenes.forEach((r,i)=>{if(!r||r.app!=='argos-taller'||r.schema!==1||r.version!==version||r.semilla!==seed||r.autoevaluacion!==true){errores.push(`Archivo ${i+1}: versión o semilla incompatible.`);return;}
      if(r.laboratorio && (r.laboratorio.max!==4||!Number.isInteger(r.laboratorio.puntos)||r.laboratorio.puntos<0||r.laboratorio.puntos>4)){errores.push(`Archivo ${i+1}: puntuación inválida.`);return;}
      if(r.competencias!==undefined && (!Array.isArray(r.competencias)||r.competencias.length>COMPETENCIAS.length||r.competencias.some(c=>!c||!COMPETENCIAS.some(x=>x.id===c.id)||![c.total,c.retenidas,c.acertadas].every(Number.isInteger)||c.total<1||c.total>190||c.retenidas<0||c.acertadas<0||c.retenidas+c.acertadas>c.total)||new Set(r.competencias.map(c=>c.id)).size!==r.competencias.length)){errores.push(`Archivo ${i+1}: competencias inválidas.`);return;}
      validos.push(r);
    });
    const notas=validos.filter(r=>r.laboratorio).map(r=>r.laboratorio.puntos);
    const cs=COMPETENCIAS.map(c=>{const filas=validos.flatMap(r=>(r.competencias||[]).filter(x=>x.id===c.id));return {id:c.id,nombre:c.nombre,muestras:filas.length,total:filas.reduce((n,f)=>n+f.total,0),retenidas:filas.reduce((n,f)=>n+f.retenidas,0)};}).filter(c=>c.muestras);
    return {participantes:validos.length,conLaboratorio:notas.length,media:notas.length?notas.reduce((a,b)=>a+b,0)/notas.length:null,competencias:cs,errores};
  }
  function plantillaPack() {
    const preguntas=[
      ['¿Cuál es el límite de recuperación fijado por la política ficticia?', ['30 minutos','60 minutos','90 minutos'],0],
      ['¿Qué evidencia permite contrastar el tiempo real de recuperación?', ['Acta fechada de la prueba','Una promesa verbal','El nombre del proveedor'],0],
      ['¿Qué dato falta para evaluar la pérdida de datos frente al RPO?', ['La hora del último dato recuperable','El color del servidor','El número de empleados'],0],
      ['¿Qué conclusión permite un registro de copias que solo dice OK?', ['Falta evidencia para concluir sobre el RPO','Siempre cumple el RPO','Siempre incumple el RPO'],0],
      ['¿Cómo se comprueba la eficacia de una mejora de recuperación?', ['Repitiendo una prueba con tiempos y datos registrados','Cerrando el ticket sin prueba','Cambiando el nombre del procedimiento'],0],
      ['¿Qué distingue el criterio de la evidencia en este caso práctico?', ['La política fija el límite y el acta describe lo observado','Son exactamente lo mismo','El acta sustituye todos los criterios'],0]
    ];
    return {schema:'argos-pack/v1',id:'pack-recuperacion',titulo:'Recuperación con evidencias',autor:'Completar autor',licencia:'CC-BY-SA-4.0',estado:'borrador',fuente:{referencia:'Política ficticia POL-BCP-01 del caso',edicion:'1',url:'https://github.com/heindall92/argos-grc'},casos:[{id:'pack-caso-1',titulo:'Prueba de recuperación',brief:'La política ficticia fija un RTO de 30 minutos. El acta registra recuperación en 25 minutos, pero no contiene la hora del último dato recuperable.',evidencias:[{id:'doc-1',titulo:'POL-BCP-01 y acta de prueba',texto:'RTO: 30 minutos. Recuperación medida: 25 minutos. Copias: OK, sin hora del último dato recuperable.'}],preguntas:preguntas.map(([q,o,c],i)=>({id:`pack-q-${i+1}`,t:'unica',q,o,c,d:1,x:'El criterio y los datos proceden exclusivamente de la política ficticia y del acta entregada. Revisa qué permiten afirmar las evidencias y qué información falta.',ref:'POL-BCP-01 ficticia y acta del caso'}))}]};
  }
  function validarPack(p,engine) {
    const errores=[];
    if(!p||typeof p!=='object'||Array.isArray(p)) return ['El paquete debe ser un objeto JSON.'];
    if(Object.keys(p).some(k=>!['schema','id','titulo','autor','licencia','estado','fuente','casos','revision'].includes(k)))errores.push('El paquete contiene campos no admitidos.');
    if(p.schema!=='argos-pack/v1'||!/^pack-[a-z0-9-]{1,60}$/.test(p.id||'')) errores.push('Esquema o id de paquete inválido.');
    for(const k of ['titulo','autor'])if(typeof p[k]!=='string'||!p[k].trim()||p[k].length>120)errores.push(`Campo ${k} vacío o demasiado largo.`);
    if(p.licencia!=='CC-BY-SA-4.0'||!['borrador','revision','publicado'].includes(p.estado))errores.push('Licencia o estado editorial inválido.');
    if(!p.fuente||typeof p.fuente.referencia!=='string'||!p.fuente.referencia.trim()||typeof p.fuente.edicion!=='string'||!p.fuente.edicion.trim()||typeof p.fuente.url!=='string'||!/^https:\/\//.test(p.fuente.url))errores.push('Falta referencia, edición o URL HTTPS de la fuente.');
    if(p.estado==='publicado'&&(!p.revision||typeof p.revision.revisor!=='string'||!p.revision.revisor.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(p.revision.fecha||'')))errores.push('Publicar requiere revisión documentada.');
    if(!Array.isArray(p.casos)||!p.casos.length||p.casos.length>10)return [...errores,'El paquete necesita entre 1 y 10 casos.'];
    for(const c of p.casos){
      if(!c||typeof c!=='object'){errores.push('Caso inválido.');continue;}
      if(!/^pack-[a-z0-9-]{1,60}$/.test(c.id||'')||typeof c.titulo!=='string'||!c.titulo.trim()||typeof c.brief!=='string'||c.brief.length<30||c.brief.length>10000)errores.push('Caso sin id, título o briefing válido.');
      if(!Array.isArray(c.evidencias)||!c.evidencias.length||c.evidencias.length>10||c.evidencias.some(e=>!e||typeof e.id!=='string'||typeof e.titulo!=='string'||typeof e.texto!=='string'||e.texto.length>20000))errores.push('Evidencias inválidas o demasiado grandes.');
      if(!Array.isArray(c.preguntas)||c.preguntas.length<6||c.preguntas.length>20){errores.push('Cada caso necesita entre 6 y 20 preguntas.');continue;}
      if(c.preguntas.some(q=>!q||typeof q!=='object'||(typeof q.q==='string'&&q.q.length>2000)||(typeof q.x==='string'&&q.x.length>5000))) {errores.push('Pregunta inválida o demasiado grande.');continue;}
      try{errores.push(...engine.validarBanco({rutas:[{id:p.id,nombre:p.titulo,salas:[{id:c.id,nombre:c.titulo,resumen:c.brief,preguntas:c.preguntas}]}],maquinas:[],simulacros:[]}));}catch(e){errores.push('Formato de pregunta inválido.');}
    }
    const ids=p.casos.flatMap(c=>c&&typeof c==='object'?[c.id,...(Array.isArray(c.preguntas)?c.preguntas.map(q=>q?.id):[])]:[]);
    if(new Set(ids).size!==ids.length)errores.push('Ids repetidos entre casos o preguntas.');
    return errores;
  }

  /* Estado de la demostración para presentaciones (?demo=showcase): progreso realista y coherente,
   * calculado respecto al día de hoy para que la racha y los repasos sean siempre actuales.
   * No incluye la máquina «Noche de ransomware» ni el laboratorio, que se resuelven en directo. */
  function demoShowcase(banco, engine, hoy) {
    const dia = (n) => engine.sumarDias(hoy, n);
    const sala = (id) => banco.rutas.flatMap((r) => r.salas).find((s) => s.id === id);
    const p = { v: 2, perfil: { nombre: 'Demostración', color: 'teal' }, ajustes: { tema: 'sistema', meta: 100 }, xp: 0, respuestas: {}, salas: {}, maquinas: {}, simulacros: {}, dias: {}, logros: {}, repasosOk: 0, creado: dia(-6), sesion: null };
    // Salas trabajadas: [id, aciertos sobre 10, retenida (repasada a tiempo)]
    const plan = [['ens-1', 10, true], ['ens-2', 9, true], ['cont-1', 8, true], ['iso-1', 4, false]];
    for (const [id, ok, retenida] of plan) {
      const s = sala(id); if (!s) continue;
      s.preguntas.forEach((q, i) => {
        const acierto = i < ok;
        const historial = acierto
          ? (retenida ? [{ fecha: dia(-5), acierto: i % 3 !== 0, modo: 'sala' }, { fecha: dia(-4), acierto: true, modo: 'sala' }, { fecha: dia(-1), acierto: true, modo: 'repaso' }] : [{ fecha: dia(-2), acierto: true, modo: 'sala' }])
          : [{ fecha: dia(-1), acierto: false, modo: 'sala' }];
        p.respuestas[q.id] = acierto
          ? { caja: retenida ? 3 : 1, aciertos: retenida ? 3 : 1, fallos: retenida && i % 3 === 0 ? 1 : 0, due: retenida ? dia(5) : dia(1), ultima: retenida ? dia(-1) : dia(-2), xpConcedida: true, historial }
          : { caja: 1, aciertos: 0, fallos: 1, due: hoy, ultima: dia(-1), xpConcedida: false, historial };
        if (acierto) p.xp += engine.xpPregunta(q);
      });
      const nota = ok / s.preguntas.length;
      p.salas[id] = { mejor: nota, intentos: retenida ? 2 : 1, ultima: retenida ? dia(-4) : dia(-2) };
      if (nota >= 0.8) p.xp += engine.XP.sala + (nota === 1 ? engine.XP.salaPerfecta : 0);
    }
    // Una máquina fácil resuelta y otra empezada
    const maq = (id, n) => {
      const m = banco.maquinas.find((x) => x.id === id); if (!m) return;
      const flags = m.flags.slice(0, n).map((f) => f.id);
      p.maquinas[id] = { flags, pistas: [], intentos: n + 1, completada: flags.length === m.flags.length, fecha: dia(-3) };
      for (const f of m.flags.slice(0, n)) p.xp += engine.xpFlag(f, m.dificultad, false);
    };
    maq('m-copias', 5); maq('m-phishing', 2);
    // Un sprint aprobado
    const sim = banco.simulacros.find((x) => x.id === 'sprint-ens');
    if (sim) { p.simulacros[sim.id] = { mejor: 0.8, aprobado: true, intentos: 1, historial: [{ fecha: dia(-2), nota: 0.8, ok: 8, total: 10, seg: 412 }] }; p.xp += engine.xpSimulacro(sim); }
    // Racha de cuatro días, con actividad hoy
    // Hoy, 40 de 100 XP: la meta diaria se ve a medias y se completa en directo con el caso.
    for (const [n, xp, preguntas] of [[-3, 180, 14], [-2, 260, 18], [-1, 120, 12], [0, 40, 4]]) p.dias[dia(n)] = { xp, preguntas, repasos: n === -1 ? 6 : 0 };
    p.repasosOk = 20;
    for (const id of engine.logrosCumplidos(p, banco, hoy)) p.logros[id] = dia(-1);
    return p;
  }
  const API = { COMPETENCIAS, estado, competencias, recomendar, evolucion, caso, limpiarBorrador, rubrica, informe, resumenTaller, agregarResumenes, plantillaPack, validarPack, normalizarSemilla, demoShowcase };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ArgosAcademy = Object.freeze(API);
})(typeof window !== 'undefined' ? window : this);
