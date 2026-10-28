# Talleres y contribuciones

## Facilitar un taller

Abrir Taller, elegir un código y generar el enlace. Asegurar que todos usan la misma versión. Para uso sin conexión, distribuir el HTML y el código; no compartir una ruta `file:` del equipo del facilitador. Preparar el caso requiere confirmación porque sustituye el borrador anterior.

El guion de 35 minutos propone lectura individual, análisis, contraste por parejas y revisión. No hay sala virtual ni sincronización. El facilitador puede enseñar ejemplos resueltos después de la puesta en común. La gravedad de un hallazgo y la calidad del argumento necesitan valoración humana.

## Compartir resultados

El alumno elige campos y previsualiza el JSON antes de descargarlo. Nombre y textos completos están desmarcados por defecto. Nada se transmite automáticamente. El facilitador puede importar hasta 20 archivos de 1 MB cada uno. Se rechazan versiones o códigos diferentes y puntuaciones fuera de rango. Los agregados cuentan archivos válidos; no prueban identidad, asistencia ni personas únicas.

## Crear un paquete

La página Crear contenido entrega una plantilla funcional con seis preguntas sobre una política ficticia. Se puede editar, cargar un JSON, validarlo y practicarlo en vista previa sin XP del perfil. La plantilla es un borrador, no un contenido certificado. El editor se mantiene en memoria; descargar el JSON antes de cerrar.

Esquema `argos-pack/v1`: id, título, autor, licencia CC-BY-SA-4.0, estado editorial, fuente con edición y URL HTTPS, y entre 1 y 10 casos. Cada caso incluye briefing, evidencias y de 6 a 20 preguntas compatibles con el motor. Para declarar `publicado`, se exige nombre de revisor y fecha documentados. El mantenedor debe comprobar esa revisión; un campo JSON no constituye aprobación.

Validar desde terminal: `node tools/validar-pack.js community/ejemplo.json`.

Flujo: borrador → revisión técnica → correcciones justificadas → aprobación del mantenedor → publicación por PR. No ejecutar JavaScript aportado, copiar preguntas de exámenes o introducir datos personales reales. La vista previa no incorpora el paquete al banco oficial ni cambia su calibración de XP.

## Continuar practicando con el ecosistema

- Continuidad y planes: [KAIROS](https://github.com/heindall92/kairos).
- Relaciones entre marcos: [Rosetta](https://github.com/heindall92/rosetta_multinorma).
- Preparación de conformidad ENS: [ENS Compliance Studio](https://github.com/heindall92/grc_ens_compliance_studio).

Estos enlaces son recursos opcionales. No implican transferencia automática de progreso o evidencias.
