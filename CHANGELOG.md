# Cambios

## 1.4.0 · octubre de 2026

Cierra la candidata 1.4.0-rc.1, integrada en `main` el 28 de octubre, con lo que hacía falta para presentarla en NicaHackFest 2026.

### Para presentarlo

- **Navegación «Aprender».** Empieza aquí, Competencias, Laboratorio, Taller y Crear contenido eran una fila de botones encima de todas las vistas; en móvil, junto al aviso de demostración, ocupaban unos 200 px antes del contenido. Ahora «Aprender» es una sección más de la barra superior y de las pestañas del móvil, y la subnavegación solo aparece en sus cinco vistas, en una fila que se desliza.
- **Demostración con progreso de ejemplo (`?demo=showcase`).** 910 XP, racha de cuatro días, siete logros, dos competencias con retención, nueve repasos pendientes y la meta del día a medias. Se calcula respecto a la fecha de hoy, tiene su propia clave y «Restablecer» vuelve siempre a ese punto. Deja sin resolver «Noche de ransomware» y el laboratorio, que se hacen en directo.
- **Franja de demostración** fina en lugar del aviso grande.
- **Tarjeta «Empieza por aquí» / «Continúa» en móvil:** el texto quedaba en una columna de unos 80 px, una palabra por línea. Ahora el botón ocupa su propia fila.
- **Selector de archivo propio** en Crear contenido y Taller. El control nativo mostraba «Choose File / No file chosen» según el idioma del navegador; ahora dice «Elegir archivo JSON» y muestra el nombre elegido.
- **Enlace del taller:** abierta como archivo descargado, la app compartía una ruta `file:///` del equipo del facilitador. Ahora el enlace apunta a la versión publicada, conserva el modo de demostración y lleva directamente al Laboratorio.
- **Participar en un taller con un solo clic.** Antes, quien abría el enlace veía el caso por defecto y tenía que ir a Taller, pulsar «Preparar mi caso» y confirmar. Ahora, si su borrador está vacío, el caso del taller se prepara solo. Si ya ha escrito algo, no se toca nada: el Laboratorio avisa de que el borrador es de otro caso y ofrece cambiar, con confirmación.
- **Seis secciones en la barra:** entre 900 y 1200 px la barra superior se queda sin iconos y, por debajo de 1000 px, sin el nombre junto al logo, para que no haya desplazamiento horizontal ni con 11.035 XP. En móvil los nombres de las pestañas caben desde 350 px; por debajo solo se muestran los iconos.
- **Pruebas:** la demostración en el motor (XP coherentes con lo ganado, sin logros pendientes, determinista y desplazada con la fecha) y en el navegador (aislamiento, restablecer, navegación, selector, enlace y anchos de 320 a 1440 px). axe audita también la demostración.

### Materiales de la charla

Todo está en [docs/showcase](docs/showcase/README.md):
- **Guion cronometrado de 40 minutos.** Indica qué se dice, qué se pulsa y qué ve el público, y trae un plan B para cada fallo.
- **Diapositivas.** Diez, en un único HTML de 1920×1080 con copia en PDF. Usan la identidad de ARGOS, iconos Lucide, las cifras reales del banco y CSP por hashes. Las genera `tools/diapositivas.py`, y `run_tests.sh` comprueba que estén al día.
- **Códigos QR** del taller `NICAHACK` y de ARGOS, generados en local.
- **Vídeo de respaldo.** `tools/grabar-demo.py` recorre el guion con un cursor visible y deja capítulos y fotogramas clave.
- **Tráiler.** Dura 66 s, en horizontal y vertical, y está hecho con Remotion (`showcase/trailer/`) a partir de esa grabación.
- **Plantillas de issue** para opinión, errores y propuestas de casos: el canal de opinión sin analítica.

### Integrado de la candidata 1.4.0-rc.1

### Aprendizaje y comunidad

- Inicio guiado, demostración con progreso separado y guía para el showcase.
- Siete competencias con distinción entre acierto y retención, recomendaciones explicadas e historial acotado.
- Registro editorial con edición, fuente, URL, revisor y fecha, sin atribuir revisiones no realizadas.
- Laboratorio con tres situaciones reproducibles por semilla: RTO, RPO y evidencia insuficiente. Borrador persistente, rúbrica e informe Markdown.
- Taller por semilla con selección de datos y previsualización. El facilitador importa resúmenes compatibles y ve agregados sin nombres ni textos.
- Editor de paquetes declarativos, plantilla, validación y práctica sin XP del perfil. Validador CLI y ejemplo comunitario comprobado en la construcción.
- Espaciado coherente con tokens `--sp-*`: las acciones se separan del texto y entre sí, las tarjetas consecutivas no se tocan y en móvil el pie del simulacro cabe en una fila.
- Las justificaciones, la prueba con cinco usuarios y la exactitud normativa requieren revisión humana.

### Progreso fiable

- XP de preguntas separados de los aciertos en simulacros y repasos. No se duplican al recargar.
- El repaso anticipado conserva fecha y caja; reforzar un fallo el mismo día no acredita otra etapa de retención.
- Checkpoints validados de salas, repasos y simulacros, con respuestas, orden, posición y plazo absoluto. La corrección final es idempotente.
- Progreso v2 con migración conservadora desde v1 y copia previa local restaurable. Importar no reanuda sesiones ajenas.
- Regresiones de recuperación en tres motores y pruebas de migración, recompensas y datos hostiles.


## 1.3.3 · octubre de 2026

- **Herramientas GRC del autor:** Ayuda → Acerca de pasa a ocho herramientas. Se suma **MCP-Shield**, que audita las configuraciones MCP de los asistentes de IA (Claude Desktop, Cursor, VS Code): cadena de suministro, secretos, ficheros y *tool poisoning*. Sus hallazgos entran en CTEM-Nexus 1.2.1 con su sobre `yrd-ecosistema` y llegan a Rosetta como evidencia por control.
- **Pruebas.** La e2e de Acerca de comprueba las ocho tarjetas.

## 1.3.2 · octubre de 2026

- **Herramientas GRC del autor:** Ayuda → Acerca de pasa de cuatro a siete herramientas (se suman CTEM-Nexus, ENS AD Auditor y Norvik) y explica que comparten formato de intercambio. CTEM-Nexus enlaza cada hallazgo con la máquina de ARGOS que entrena su corrección.

## 1.3.1 · octubre de 2026

**Corregido: un documento interno ficticio parecía una norma oficial.** En la máquina «Copias de Hespéride», la pestaña de la primera evidencia se llamaba solo «NOR-COP-01» y la flag preguntaba qué incumplía «la normativa NOR-COP-01». Fuera de contexto parecía una norma que hubiera que conocer. Es el código interno de la normativa de copias de la empresa ficticia del caso, que desarrolla la medida mp.info.6 del ENS. Ahora la pestaña y las preguntas dicen «normativa interna de copias de Hespéride» y el briefing explica qué documentos entrega la empresa. Gracias a Sergio Henestrosa por señalarlo.

## 1.3.0 · octubre de 2026

**Progresión sincronizada con el contenido.** Con 15 máquinas y 13 simulacros, los puntos posibles pasaron de unos 5.700 a 12.400. Los rangos se habían quedado cortos (Panoptes se alcanzaba con el 36 % del contenido) y las máquinas pesaban más que todas las preguntas juntas. Este es el reequilibrio:
- **Flags:** 30 XP la de usuario y 60 la de root (antes 40 y 80), por el multiplicador de dificultad (×1, ×1,5 o ×2). Abrir la pista sigue dejando la flag a la mitad.
- **Simulacros:** 5 XP por pregunta al aprobar por primera vez, y los retos ×1,5. Un sprint da 50 XP y el maratón 675 (antes, todos daban 150). Cada tarjeta muestra lo que vale.
- **Rangos reescalados:** 300, 900, 2.000, 3.600, 6.000 y 9.400 XP. Panoptes pide el 85 % de los 11.035 XP posibles.
- **Reparto:** preguntas y salas, 38 %; máquinas, 43 %; simulacros, 19 %.
- **Dos logros nuevos** (20 en total):
  - **Root de lo difícil:** las 5 máquinas difíciles.
  - **Fondista:** aprobar el Maratón GRC.
- **Guardas de calibración en las pruebas.**
  - Panoptes debe pedir entre el 80 % y el 90 % del total.
  - Las máquinas no pueden superar la mitad, y los simulacros deben pesar entre el 10 % y el 30 %.
  - Un simulacro más largo nunca vale menos.

  Si se añade contenido sin recalibrar, las pruebas fallan.
- **Logros → Cómo se ganan los puntos:** muestra el total de XP posibles y lo que pide Panoptes, calculado a partir del banco.

Los puntos que ya tenías se conservan. Como los umbrales son más altos, puede que veas un rango menos que antes.

## 1.2.0 · octubre de 2026

- **13 simulacros** (antes 3), en cuatro tipos:
  - **Sprints:** ENS, ISO/IEC 27001 y continuidad, de 10 preguntas en 10 o 12 minutos.
  - **Por bloques:** ENS · Fundamentos, roles y auditoría; ENS · Categorización, medidas y riesgos; ISO/IEC 27001 · El SGSI; e ISO/IEC 27001 · Anexo A y certificación.
  - **Completos:** ENS, ISO/IEC 27001, continuidad y GRC integral. Se conservan los de antes y el progreso guardado.
  - **Retos:** las 18 preguntas más difíciles (aprobado con un 60 %) y el Maratón GRC, de 90 preguntas en 135 minutos (aprobado con un 75 %).
- **Filtros por sala y por dificultad** en el motor de simulacros, validados en la construcción.
- **Nuevo logro, «Examinador»:** aprobar todos los simulacros. Son 18 logros en total.
- **Vista de simulacros agrupada por tipo**, con el recuento de aprobados.
- **Pruebas:** filtros de sala y dificultad, reparto entre salas, el logro nuevo y el reto de las más difíciles en el navegador.

## 1.1.0 · octubre de 2026

- **10 máquinas nuevas: 15 en total, 5 por dificultad, con 75 flags.**
  - Fáciles: El correo del director (phishing), Puesto despejado y El contrato de nube.
  - Medias: La SoA sospechosa, Viernes de despliegue y El BIA de Pegaso.
  - Difíciles: Riesgo en euros (MAGERIT cuantitativo), La auditoría interna, Caída del proveedor crítico y Certificación ENS de Arcadia.
- **Nueva organización ficticia:** Instituto Pegaso de Formación, una empresa privada certificada en ISO/IEC 27001.
- **Vista de máquinas por dificultad**, con las resueltas y los XP de cada sección.
- **Pruebas:** reparto 5 / 5 / 5, orden de dificultad, al menos 5 flags por máquina y axe-core en las 15 máquinas.

## 1.0.1 · octubre de 2026

- **El ojo de Argos, más realista.** Esclerótica en almendra con volumen, iris con los tonos del pavo real, estrías, anillo limbal, pupila con brillos, sombra del párpado y pestañas. Los párpados se adaptan al tema claro y oscuro.
- **Ocelos de pavo real.** Las «plumas» de progreso de la medalla de rango pasan a ser ocelos con su anillo dorado y turquesa.
- **Un solo dibujo para toda la marca.** El mismo ojo aparece en la medalla, el logotipo, el favicon (generado en la construcción a partir del logotipo), la tarjeta para LinkedIn y la cabecera del README (`docs/assets/generar.js`).
- **Tarjeta para LinkedIn:** se recolocan el anillo de ocelos y las barras de progreso para que no se solapen.
- **Barra superior en móvil:** racha, ayuda y perfil, alineados a la derecha.

## 1.0.0 · octubre de 2026

Primera versión.

**Contenido**
- **Ruta ENS** (RD 311/2022): 7 salas y 70 preguntas sobre ámbito y principios, política y roles, categorización, medidas del anexo II, auditoría y conformidad, análisis de riesgos con MAGERIT y el puente ENS ↔ ISO/IEC 27001 según la CCN-STIC 825. Incluye 23 citas literales del BOE.
- **Ruta ISO/IEC 27001:2022**: 8 salas y 80 preguntas de redacción propia sobre la estructura de la norma, las cláusulas 4 a 10, los controles del anexo A y la certificación (ISO/IEC 17021-1, 27006-1 e ISO 19011).
- **Ruta de continuidad de negocio**: 4 salas y 40 preguntas sobre el BIA, las estrategias, los planes BCP y DRP, la gestión de crisis y las pruebas (ISO 22301, controles 5.29 y 5.30, op.cont).
- **5 máquinas** con 25 flags de usuario y root sobre dos organizaciones ficticias: copias de seguridad, la baja de un empleado, categorización, una noche de ransomware y una auditoría de certificación.
- **3 simulacros** cronometrados: ENS (30 preguntas en 45 minutos), ISO/IEC 27001 (40 en 60) y GRC integral (50 en 75).

**Aplicación**
- **Juego:**
  - puntos por el primer acierto, bonificaciones por superar salas y aprobar simulacros;
  - 7 rangos «de ojos», del Primer ojo a Panoptes, y 17 logros;
  - racha diaria y anillos de actividad.
- **Aprendizaje:**
  - repaso espaciado con cajas de Leitner (1, 3, 7, 14 y 30 días);
  - opciones barajadas en cada intento;
  - explicación y fuente en cada respuesta.
- **Interfaz:**
  - jugador en modo foco con atajos de teclado;
  - simulacros con cronómetro, navegador de preguntas y preguntas marcadas;
  - corrección automática al agotarse el tiempo.
- **Perfil:**
  - tarjeta PNG para compartir en LinkedIn, con su texto;
  - exportación e importación del progreso en JSON;
  - tema claro, oscuro o del sistema y meta diaria configurable.
- **Diseño:** inspirado en las guías de Apple, con la paleta del pavo real de Argos. Accesible: WCAG 2.2 AA verificado con axe-core en todas las vistas y estados.

**Seguridad y calidad**
- **Un único HTML** con CSP por hashes y sin ninguna petición de red.
- **Saneado de lo importado:** el progreso que llega desde un JSON o desde el almacenamiento local se valida por esquema. Además, los logros que el progreso no justifica se descartan.
- **Pruebas:**
  - 13 del motor y 12 del banco, entre ellas las 23 citas literales comprobadas contra el texto del BOE;
  - 96 comprobaciones de extremo a extremo en Chromium;
  - axe-core sin infracciones en claro y oscuro, en escritorio y móvil.
