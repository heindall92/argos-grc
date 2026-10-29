# Hoja de ruta · ARGOS en NicaHackFest 2026

**Evento:** NicaBuilds // Project Showcase, dentro de [NicaHackFest 2026](https://nicahackfest.com), organizado por NicaSecurity.

**Sesión:** domingo 22 de noviembre de 2026 por Zoom, unos 40 minutos con demostración y preguntas. El evento principal es el sábado 21, de 9:00 a 17:00 en Nicaragua (GMT-6, siete horas menos que España). La hora se acuerda por correo con la organización.

**Objetivo:** que quien vea la sesión entienda en 40 minutos qué problema resuelve ARGOS, lo vea funcionar sin un solo fallo y salga con el enlace y ganas de abrirlo. De paso:
- conseguir las cinco observaciones de usuarios pendientes en [GUIA_SHOWCASE.md](GUIA_SHOWCASE.md);
- abrir la colaboración con NicaSecurity.

Este documento parte de la revisión del 29 de octubre de 2026 sobre `main` (`c2c78c2`, versión `1.4.0-rc.1`).

---

## 1. Estado de partida

### Lo que ya está listo para enseñar

- **Modo demostración aislado** (`?demo`): usa su propia clave de almacenamiento y se restablece sin tocar el perfil habitual. Es justo lo que hace falta para una sesión en directo.
- **«De la evidencia a la decisión»:** un primer recorrido guiado de 10 a 15 minutos que lleva a «Noche de ransomware».
- **Laboratorio «Un hallazgo defendible»:**
  - tres situaciones reproducibles por semilla (fuera de RTO, fuera de RPO y evidencia insuficiente);
  - rúbrica e informe en Markdown.

  Con la misma semilla, todo el público ve el mismo caso.
- **Taller por semilla.** El facilitador reparte un código, cada persona trabaja en su navegador y se agregan los resúmenes sin nombres. Encaja con una comunidad: se puede hacer en directo con el público.
- **Competencias y retención**, separadas de los aciertos, con recomendación explicada.
- **Editor de paquetes** (`argos-pack/v1`) con validación y vista previa sin XP, más el validador CLI. Es la puerta para que la comunidad de NicaSecurity aporte casos propios.
- **Progreso v2** con migración, copia previa y recuperación de sesiones. La recarga en directo no rompe nada.

**Pruebas el 29 de octubre:**
- 43 de motor;
- 98 de 98 comprobaciones e2e;
- recorridos del roadmap en Chromium, Firefox y WebKit;
- axe en 212 estados.

### Lo que hay que corregir antes del 22

| Id | Hallazgo | Por qué importa en directo | Prioridad |
|---|---|---|---|
| H1 | La web pública (`heindall92.github.io/argos-grc`) sirve la **1.4.0-rc.1**, y la portada de «Empieza aquí» dice «ARGOS 1.4.0-rc.1». | En pantalla parece un producto a medias. Hay que cerrar la 1.4.0. | P0 |
| H2 | `CHANGELOG.md` y `docs/FASES.md` dicen que la candidata «no se ha fusionado ni publicado», pero ya está en `main` y en Pages. | Documentación desfasada justo cuando más gente va a leerla. | P0 |
| H3 | Las cinco secciones nuevas (Empieza aquí, Competencias, Laboratorio, Taller y Crear contenido) son una fila de botones encima de **todas** las vistas, también en Hoy, Máquinas y Simulacros. No están en la barra de navegación. | En móvil, esa fila y el aviso del modo demo ocupan unos 200 px antes del contenido. En escritorio compite con la navegación principal y confunde al público. | P0 |
| H4 | La tarjeta «Empieza por aquí» de Hoy, en móvil, deja el texto en una columna de unos 80 px: una palabra por línea. Ya pasaba antes de la 1.4. | Si alguien del público lo abre en el móvil durante la charla, es lo primero que ve. | P1 |
| H5 | Hoy usa **anillos** concéntricos de progreso. Los anillos son la firma visual de Rosetta, y el ecosistema pide que cada herramienta tenga su propia visualización. | Presentarás el ecosistema: si dos herramientas comparten firma visual, el mensaje se debilita. | P1 |
| H6 | El selector de archivo de Crear contenido y Taller es el nativo del navegador: «Choose File / No file chosen», en inglés con la interfaz en español. | Se nota en la demo de Crear contenido. | P2 |
| H7 | En Taller, el «Enlace para compartir» muestra la ruta local (`file:///home/…`) cuando la app se abre como archivo descargado. | Si enseñas la versión descargada, se ve la ruta de tu equipo. En directo, usa siempre la URL pública. | P2 |
| H8 | La demo empieza a 0 XP: Competencias muestra 0/40 en todo, Logros está vacío y Hoy no tiene progreso. | Una pantalla de ceros no transmite nada. Hace falta un estado de demostración con progreso realista. | P0 |
| H9 | Los módulos nuevos (`10-laboratorio.js`, `11-talleres.js` y `12-autores.js`) están escritos en líneas muy largas y compactas. Varios commits van en inglés («feat: add…»). | No se ve en la sesión, pero sí cuando alguien abre el repositorio desde la charla. | P3 |

---

## 2. Fases

### Fase A · Cerrar ARGOS 1.4.0 (29 oct – 4 nov)

- [ ] **H1 y H2:** versión `1.4.0` en `package.json`, la portada y `dist/`. El CHANGELOG pasa de «candidata» a publicada, y FASES.md y VALIDACION.md quedan al día. Pages sirve la 1.4.0.
- [ ] **H3 · Navegación de «Aprender»:** Empieza aquí, Competencias, Laboratorio, Taller y Crear contenido pasan a formar parte de la navegación.
  - En escritorio, como entrada «Aprender» de la barra superior.
  - En móvil, como sexta pestaña o dentro de un «Más».
  - La fila de botones solo aparece en esas cinco vistas, como subnavegación con `aria-current`.
  - El aviso del modo demo pasa a una franja fina.
- [ ] **H4:** la tarjeta «Empieza por aquí» en móvil se apila: icono y texto arriba y el botón «Entrar» a todo el ancho. Prueba e2e con el texto a 320, 360 y 390 px.
- [ ] **H8 · Demo con progreso:** `?demo=showcase` carga un estado de ejemplo fijo y versionado (`app/data/demo-showcase.json`):
  - unas 400 XP;
  - dos salas superadas y una máquina resuelta;
  - competencias a medias;
  - un simulacro aprobado y una racha de 4 días.

  «Restablecer demo» vuelve a ese mismo estado. La e2e comprueba que no toca `argos/v1/progreso`.
- [ ] **H6:** selector de archivo propio: botón «Elegir archivo JSON» con el nombre del archivo debajo, en ES/EN y accesible con teclado.
- [ ] Pruebas completas (motor, e2e, roadmap en tres navegadores y axe) y capturas regeneradas.
- **Hecho cuando:**
  - Pages sirve la 1.4.0;
  - `?demo=showcase` abre con progreso;
  - las vistas de Aprender están en la navegación;
  - no hay columnas estrechas a 320 px;
  - axe da 0 infracciones.

### Fase B · Guion y materiales (5 – 11 nov)

- [ ] **Guion cronometrado de 40 minutos** (`docs/showcase/guion.md`), con lo que se dice, lo que se pulsa y la URL exacta de cada paso:

  | Min. | Bloque | Contenido |
  |---|---|---|
  | 0–3 | Apertura | Tráiler de 60–75 s y presentación personal: pentester junior que estudia GRC. |
  | 3–8 | El problema | GRC se aprende leyendo normas, pero se evalúa decidiendo con evidencias. Falta práctica realista, abierta y en español. |
  | 8–22 | Demo 1 · Noche de ransomware | Briefing, cronología, flags y **un fallo deliberado** para enseñar la explicación. Recargar la página para enseñar que la sesión se recupera. |
  | 22–30 | Demo 2 · Taller en directo | Se reparte el código `NICAHACK` en el chat y el público hace el laboratorio 4 minutos. Se pregunta en el chat «¿fuera de RTO, fuera de RPO o evidencia insuficiente?» y se enseña la rúbrica. |
  | 30–34 | Comunidad y ecosistema | Crear contenido con `argos-pack/v1` y cómo proponer un caso. ARGOS ↔ CTEM-Nexus ↔ Rosetta (una diapositiva). |
  | 34–40 | Preguntas | Enlaces, código QR y formulario de opinión. |

- [ ] **Diapositivas** (`docs/showcase/diapositivas/`): un HTML de una sola página, 1920×1080, 10 diapositivas como máximo.
  - Identidad de ARGOS: azul petróleo, fondo oscuro e iconos Lucide, sin anillos.
  - Navegación con teclado.
  - Exportación a PDF como copia de seguridad.
  - Las diapositivas solo enmarcan; la demostración es la protagonista.
- [ ] **Código QR** a `heindall92.github.io/argos-grc/?demo=showcase`, generado sin servicios externos.
- [ ] **Formulario de opinión** con plantillas de issue en GitHub (opinión, error y caso propuesto), sin analítica.
- [ ] **Post de anuncio en LinkedIn** («El 22 presento ARGOS en NicaHackFest»), al menos 3 o 4 días después del último lanzamiento.

### Fase C · Vídeo y copia de seguridad (12 – 18 nov)

- [ ] **Grabación automática de la demo con Playwright** (`tools/grabar-demo.py`). Recorre el guion con `recordVideo` a 1920×1080 y produce un `.webm` reproducible. Sirve dos veces:
  - como **plan B** si falla la red o el navegador en directo;
  - como material del tráiler.
- [ ] **Tráiler con Remotion** (`showcase/trailer/`, fuera de `app/`):
  - de 60 a 75 segundos, a 1920×1080 y 30 fps;
  - montado con las grabaciones de Playwright, títulos animados, la paleta de ARGOS y subtítulos incrustados;
  - sin música con derechos.

  Se usa como apertura de la sesión y como teaser en LinkedIn (también en vertical, 1080×1350).
- [ ] **Ensayo 1** cronometrado con grabación propia, para ajustar los tiempos del guion.
- [ ] **Observación con cinco personas** siguiendo GUIA_SHOWCASE.md. Se puede proponer a NicaSecurity hacerla con su comunidad.
- **Hecho cuando:**
  - el vídeo de respaldo cubre la demo entera;
  - el tráiler está exportado en horizontal y vertical;
  - el guion cabe en 38 minutos en el ensayo.

### Fase D · Ensayo técnico y día D (19 – 22 nov)

- [ ] **Ensayo con la organización** en el mismo Zoom:
  - compartir una ventana, no la pantalla entera;
  - el sonido del ordenador para el tráiler;
  - activar «Optimizar para vídeo»;
  - nitidez del texto a 1080p con el zoom del navegador al 125 %.
- [ ] **Lista del día D:**
  - [ ] Navegador limpio, sin extensiones ni marcadores a la vista, y notificaciones del sistema desactivadas.
  - [ ] Pestañas preparadas en orden: diapositivas, `?demo=showcase#inicio`, máquina, laboratorio con la semilla `NICAHACK` y repositorio.
  - [ ] La versión descargada abierta en otra ventana por si falla la red.
  - [ ] El vídeo de respaldo listo para reproducir.
  - [ ] JSON de respaldo del estado de la demo.
  - [ ] Una frase preparada para cada pregunta difícil:
    - «¿Sustituye a una formación oficial?»
    - «¿El contenido de ISO es libre?»
    - «¿Quién revisa los casos?»
- [ ] **Después del evento** (23 – 27 nov):
  - post en LinkedIn con un fragmento del vídeo y lo que dijo el público;
  - issues de lo que salga en las preguntas;
  - actualizar GUIA_SHOWCASE.md con los resultados de la observación.

### Fase E · Después del evento (opcional)

- [ ] **H5 · Visualización propia de Hoy:** sustituir los anillos por algo que sea solo de ARGOS. Por ejemplo, una fila de ojos que se abren a medida que se cumple la meta del día, coherente con Argos Panoptes, el gigante de los cien ojos.
- [ ] **H9:** reformatear los módulos nuevos y documentar la convención de commits en español.
- [ ] Paquetes de casos aportados por la comunidad de NicaSecurity, revisados con el flujo de TALLERES_Y_AUTORES.md.

---

## 3. Remotion, diapositivas o demo en directo

| Pieza | Uso | Decisión |
|---|---|---|
| **Demo en directo** | El centro de la sesión: más del 60 % del tiempo | Sí, con la demo con progreso y el vídeo de respaldo |
| **Diapositivas HTML** | Enmarcar: problema, ecosistema y cierre | Sí, pocas (10 como máximo) y exportadas a PDF |
| **Remotion** | Tráiler de 60–75 s para abrir y para LinkedIn | Sí, solo para el tráiler |
| **Grabación con Playwright** | Plan B y materia prima del tráiler | Sí: sale del propio guion y se puede repetir |

**Por qué Remotion solo para el tráiler:**
- En un showcase lo que convence es ver la herramienta funcionar.
- Una charla entera en vídeo pierde la interacción con el público y no permite responder a lo que pase en el chat.
- Para el tráiler sí encaja:
  - las animaciones se escriben en código y se pueden repetir;
  - usa las mismas fuentes y colores que la app;
  - se renderiza en local.

  Así sale una pieza que se reutiliza en LinkedIn, en el README y en futuras charlas.

**Licencia de Remotion:** es gratuito para particulares y para empresas pequeñas; las más grandes necesitan licencia. Antes de usarlo hay que confirmar las condiciones vigentes en remotion.dev.

---

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| Falla la red o Zoom durante la demo | Versión descargada abierta y vídeo de respaldo de Playwright |
| El público no participa en el taller en directo | El caso con la semilla `NICAHACK` está resuelto de antemano, para enseñarlo aunque nadie conteste en el chat |
| No da tiempo a todo antes del 22 | Orden de recorte: primero la Fase E entera, después H6 y H7, y por último el tráiler (se abre con una diapositiva). La Fase A y el guion no se recortan |
| Una pregunta sobre la exactitud normativa | Respuesta preparada: el contenido cita referencias y no reproduce texto ISO, la revisión experta está pendiente y se documenta en VALIDACION.md, y cualquier persona puede proponer correcciones con el enlace de cada pregunta |
| Diferencia horaria | Pedir una franja de 9:00 a 12:00 en Nicaragua (de 16:00 a 19:00 en España) |
