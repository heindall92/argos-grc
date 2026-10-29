# Guion · ARGOS en NicaHackFest 2026

**Sesión:** NicaBuilds // Project Showcase, domingo 22 de noviembre de 2026, por Zoom.
**Duración:** 40 minutos (38 de contenido y 2 de margen).
**Ponente:** Yoandy Ramírez Delgado.
**Versión que se enseña:** ARGOS 1.4.0 en `https://heindall92.github.io/argos-grc/`. La copia descargada de `dist/index.html` sirve de respaldo.

Cada bloque tiene tres columnas:
- **Digo:** lo que se cuenta, en frases cortas y para decirlas con tus palabras, no para leerlas.
- **Hago:** lo que se pulsa.
- **Pantalla:** lo que el público ve.

Las URL van completas para pegarlas sin pensar.

---

## Antes de empezar (T-30 min)

Pestañas abiertas en este orden, en una ventana limpia a 1920×1080 y con el zoom del navegador al 125 %:

1. Diapositivas: `docs/showcase/diapositivas/index.html`, diapositiva 1 (← → para avanzar, F para pantalla completa; copia en PDF al lado).
2. `https://heindall92.github.io/argos-grc/?demo=showcase#inicio`. Pulsa «Restablecer» una vez: el progreso de ejemplo queda con la fecha de hoy.
3. `https://heindall92.github.io/argos-grc/?demo=showcase#maquina/m-ransom`
4. `https://heindall92.github.io/argos-grc/?demo=showcase&taller=NICAHACK#laboratorio`
5. `https://github.com/heindall92/argos-grc`

Además:
- En otra ventana, `dist/index.html` descargado (por si cae la red).
- En el escritorio, el vídeo de respaldo (`showcase/grabaciones/demo-completa.webm`, se genera con `python3 tools/grabar-demo.py`).
- En Zoom, compartes una **ventana**, no la pantalla, con «Compartir sonido» activado solo para el tráiler.
- Notificaciones del sistema desactivadas.

---

## 0:00 – 3:00 · Apertura

| Digo | Hago | Pantalla |
|---|---|---|
| Gracias a Michelle y a NicaSecurity por el espacio. | Reproduzco el tráiler (60–75 s). | Tráiler |
| Soy Yoandy, pentester junior y estudiante de GRC. Hago herramientas abiertas, en español y que funcionan en el navegador. ARGOS es una de ellas. | Paso a la diapositiva 2. | Quién soy · ecosistema |
| En 40 minutos vais a ver un problema, una demo y una práctica que vais a hacer vosotros desde vuestro navegador. | Diapositiva 3. | Agenda en tres pasos |

## 3:00 – 8:00 · El problema

| Digo | Hago | Pantalla |
|---|---|---|
| GRC se estudia leyendo normas, pero en el trabajo se evalúa de otra forma: tienes un incidente, unas evidencias y una decisión que justificar. | Diapositiva 4. | «Leer la norma ≠ decidir con evidencias» |
| Para practicar eso hay poco material abierto y en español, y casi nada que te corrija explicándote por qué. | Diapositiva 5. | Tres huecos: práctica, español, corrección explicada |
| ARGOS toma la idea de las máquinas de hacking (briefing, evidencias y flags de user y root) y la lleva a GRC: ENS, ISO/IEC 27001 y continuidad. | Diapositiva 6. | De HTB a GRC: máquina → caso, flag → decisión |
| Todo es local: sin cuentas, sin servidor y sin analítica. Tu progreso se queda en tu navegador. | Diapositiva 7. | Local-first, GPL, 190 preguntas, 15 máquinas y 13 simulacros |

## 8:00 – 22:00 · Demo 1: Noche de ransomware

| Digo | Hago | Pantalla |
|---|---|---|
| Esto es ARGOS en modo demostración: un perfil de ejemplo con unos días de práctica. | Pestaña 2 · Hoy. | Hoy con racha de 4 días, 40/100 XP y 9 repasos |
| Hay rutas, máquinas, simulacros y, desde esta versión, una sección «Aprender». | Recorro la barra sin entrar. | Barra superior |
| Vamos a la máquina de dificultad media «Noche de ransomware». | Pestaña 3. | Briefing de la máquina |
| Viernes, 23:10. Cifrado masivo en la plataforma de ayudas de un organismo ficticio. Somos el comité de crisis. | Leo el briefing en voz alta. | Briefing |
| Las evidencias son las mismas que tendrías en la realidad: cronología, BIA y plan de continuidad. | Abro «Cronología» y después «BIA». | Terminal con la cronología |
| **Flag 1:** ¿cuándo debió activarse el plan? Fijaos: el plan dice que se activa al prever el 50 % del RTO. | Elijo la respuesta correcta y la envío. | +XP y explicación |
| **Flag 2:** ¿se cumple el RPO si restauramos la copia offline del miércoles? Aquí voy a fallar a propósito. | Elijo «Sí, de sobra» y la envío. | Error, sin XP |
| Este es el momento que importa: ARGOS no te regala la respuesta. Te devuelve a las evidencias y te ofrece una pista que cuesta la mitad de los puntos, como en una máquina de hacking. | Señalo «Flag incorrecta» y el botón de pista. Vuelvo a la cronología y elijo la correcta. | Aviso de flag incorrecta y pista |
| Y al acertar llega la explicación con su referencia: restaurar la copia del miércoles pierde más de 48 horas de datos, el doble del RPO. | Señalo la explicación y la referencia. | Explicación con referencia |
| **Flag 3:** a las 23:25 alguien apagó los servidores sin registrarlo. ¿Qué error forense es? | La resuelvo comentando la cadena de custodia. | Flag de user |
| **Flags root:** volver a producción y quién habla con la prensa. Son las decisiones que separan la técnica de la gestión. | Resuelvo las flags 4 y 5. | Máquina completada |
| Y si se me cierra el navegador a mitad de un simulacro… | Abro un sprint, respondo dos preguntas y recargo con F5. | El simulacro sigue con el mismo reloj |

## 22:00 – 30:00 · Demo 2: taller en directo con el público

| Digo | Hago | Pantalla |
|---|---|---|
| Ahora os toca a vosotros. Abrid este enlace o escanead el QR: no hace falta registrarse. | Pego en el chat el enlace del taller de abajo y enseño la diapositiva 8. | Diapositiva 8 con el QR y las opciones A, B y C |
| Todos tenéis el mismo caso, porque sale de la misma semilla: NICAHACK. Una política interna y cuatro evidencias. | Paso a la pestaña 4 y leo E1 a E4. | Laboratorio con las evidencias |
| Tenéis 4 minutos. Escribid en el chat vuestra conclusión: **A** fuera de RTO, **B** fuera de RPO, **C** no hay evidencia suficiente para concluir. | Vuelvo a la diapositiva 8 mientras piensan. | Opciones A, B y C |
| *(Lectura de votos)* | Leo el recuento del chat en voz alta. | Chat |
| La respuesta es **C**. El servicio volvió en el minuto 105, dentro de los 120 del RTO, pero el acta solo dice «copia OK», sin la hora del último dato recuperable. No podemos afirmar que se cumpla el RPO ni que se incumpla. | Relleno el hallazgo: E1 y E4, «evidencia insuficiente», acción «registro». | Formulario |
| Un auditor no escribe «no conformidad» sin evidencia: escribe que la evidencia no basta y pide el registro. | Pulso «Contrastar con la rúbrica». | Rúbrica 4/4 |
| Y esto se descarga como informe en Markdown para entregarlo o revisarlo en clase. | Pulso «Descargar informe Markdown». | Descarga |
| Si dais clase, el modo Taller recoge los resúmenes que cada alumno decide compartir, sin nombres. | Abro Taller y enseño la selección de datos. | Taller |

**Enlace para el chat:** `https://heindall92.github.io/argos-grc/?taller=NICAHACK#laboratorio`. Sin `demo`, cada persona trabaja con su propio perfil.

## 30:00 – 34:00 · Comunidad y ecosistema

| Digo | Hago | Pantalla |
|---|---|---|
| ¿Tenéis un caso real anonimizado de vuestro país? Se puede convertir en un paquete `argos-pack/v1` desde «Crear contenido», sin programar. | Abro Crear contenido, pulso «Validar y previsualizar» y respondo una pregunta. | Vista previa del paquete |
| Cada pregunta tiene un enlace para proponer correcciones. El contenido cita fuentes públicas y no reproduce texto de normas ISO. | Señalo el enlace de corrección. | Explicación |
| ARGOS es parte de un ecosistema. Un hallazgo de pentesting en CTEM-Nexus enlaza con la máquina de ARGOS que entrena su corrección, y Rosetta cruza los controles entre marcos. | Diapositiva 9. | Ecosistema |

## 34:00 – 40:00 · Cierre y preguntas

| Digo | Hago | Pantalla |
|---|---|---|
| ARGOS es gratis, de código abierto y está en español. Si os sirve, una estrella en GitHub y un issue con lo que falla me ayudan más que cualquier otra cosa. | Diapositiva 10 con el código QR. | QR a ARGOS y contacto |
| ¿Preguntas? | Me quedo en la diapositiva 10. | Contacto |

### Respuestas preparadas

- **«¿Sustituye a una formación oficial?»** No. Es práctica, no certificación. Los logros de ARGOS no certifican nada, y lo dice la propia app.
- **«¿El contenido de ISO es libre?»** Las normas ISO tienen copyright. ARGOS cita el número de cláusula o control y redacta todo lo demás de forma propia. El ENS sí se cita literal, porque el BOE es de uso libre.
- **«¿Quién revisa los casos?»** Hay un registro editorial y la revisión experta externa está pendiente. Así lo pone en VALIDACION.md: las pruebas automáticas no sustituyen a una persona.
- **«¿Se puede usar en clase?»** Sí, con el modo Taller y la semilla. Para usarlo sin conexión, se reparte el HTML.
- **«¿Habrá más normas, como NIS2, DORA o leyes de Latinoamérica?»** Están en la hoja de ruta del ecosistema, y Rosetta ya cruza 15 normas. Las propuestas de casos por país son bienvenidas.

## Si algo falla

| Fallo | Plan B |
|---|---|
| No carga la web | La copia descargada en la otra ventana: funciona sin red |
| Falla Zoom al compartir | Reproduzco el vídeo de respaldo (`demo-completa.webm`) desde el minuto correspondiente |
| Nadie vota en el chat | Resuelvo el caso igual y lo cuento como «lo que haría un auditor» |
| Me paso de tiempo | Me salto la recarga del simulacro y Crear contenido |
