# Revisión de contenido

Cada pregunta y flag conserva su identificador y referencia. «Proponer una corrección» abre un borrador de incidencia con id, versión y referencia; el usuario decide si lo envía.

El registro `app/data/revisiones.json` está vacío al introducir este flujo: no se atribuye una revisión experta que no se haya realizado. Para registrar una revisión, añadir bajo `registros` el id y los campos `revisor`, `fecha` (AAAA-MM-DD), `fuente`, `edicion` y `url` HTTPS. La construcción rechaza ids desconocidos o registros incompletos.

Proceso: borrador → revisión de una persona con conocimiento del tema → cambios justificados con fuente → aprobación del mantenedor → registro de revisión → publicación. Una actualización de la referencia exige una nueva revisión. Conservar el historial en Git. No copiar textos de normas ISO ni preguntas de certificación.

Las competencias agrupan salas por objetivo educativo; no afirman equivalencia normativa entre requisitos. «Retenida» es un indicador del algoritmo de práctica, no evidencia de competencia profesional.
