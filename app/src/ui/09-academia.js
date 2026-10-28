/* ---------- Inicio guiado y demostración independiente ---------- */
function enlacesAcademia() {
  return `<nav class="academy-links row" aria-label="Aprendizaje práctico"><button class="btn sm" data-act="go" data-view="inicio">Empieza aquí</button></nav>${MODO_DEMO ? '<p class="legal small">Modo demostración: progreso separado de tu perfil habitual. <button class="btn sm" data-act="demo-reset">Restablecer demo</button></p>' : ''}`;
}
function vInicio() {
  return `<div class="hd"><div><p class="eyebrow">Tu primer recorrido · 10–15 minutos</p><h1 class="lt">De la evidencia a la decisión</h1><p class="lt-sub">Practica cómo actuar ante un incidente y explica por qué. ARGOS ${esc(VERSION)} funciona también como HTML descargado.</p></div></div>
    <section class="card pad"><h2>Elige tu punto de partida</h2><p>Las rutas son abiertas: puedes cambiar cuando quieras.</p><div class="row">
    <button class="btn" data-act="go" data-view="ruta" data-param="ens">Empiezo con ENS</button><button class="btn" data-act="go" data-view="ruta" data-param="iso27001">Preparo ISO/IEC 27001</button><button class="btn" data-act="go" data-view="ruta" data-param="continuidad">Practico continuidad</button></div></section>
    <section class="sec"><h2>Recorrido recomendado: Noche de ransomware</h2><p class="muted">Necesitas nociones básicas de copias de seguridad. Trabajarás con una organización ficticia.</p>
    <ol class="guide-steps"><li><b>Contexto · 2 min.</b> Lee el briefing y distingue el incidente de sus consecuencias.</li><li><b>Evidencias · 4 min.</b> Recorre las pestañas y localiza horarios, pérdidas de datos y decisiones.</li><li><b>Decisión · 5 min.</b> Resuelve las flags y contrasta tu criterio con la explicación.</li><li><b>Reflexión · 2 min.</b> Explica qué dato cambiaría tu decisión y qué evidencia pedirías después.</li></ol>
    <button class="btn primary" data-act="go" data-view="maquina" data-param="m-ransom">Comenzar el caso</button><button class="btn" data-act="sala" data-id="cont-1">Repasar BIA primero</button></section>
    <section class="card pad"><h2>Ensaya con tranquilidad</h2><p>La demostración usa datos independientes. Puedes restablecerla sin borrar tu perfil habitual.</p><a class="btn" href="?demo#inicio" target="_blank" rel="noopener noreferrer">Abrir demostración</a><p class="small muted">Sin conexión: guarda el HTML completo. El progreso depende del navegador y de la ubicación del archivo; exporta una copia para trasladarlo.</p></section>`;
}
