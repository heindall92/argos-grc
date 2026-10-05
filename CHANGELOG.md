# Cambios

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
