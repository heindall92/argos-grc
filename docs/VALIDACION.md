# Validación de ARGOS 1.4.0

Fecha de comprobación: 29 de octubre de 2026, sobre la 1.4.0 (la candidata 1.4.0-rc.1 se comprobó el 28 de octubre en cinco ramas encadenadas).

| Comprobación | Resultado |
|---|---|
| Motor, banco, progreso, competencias, casos, privacidad y paquetes (`node --test tests/*.test.js`) | 44/44 pruebas superadas (incluida la demostración de presentación) |
| Suite original de la aplicación en Chromium (`tests/e2e_app.py`) | 98/98 comprobaciones superadas |
| Recorridos del roadmap (`tests/e2e_roadmap.py`) | Superados en Chromium en local; Chromium, Firefox y WebKit en la CI de Ubuntu. Incluyen la demostración con progreso, la navegación «Aprender», el selector de archivo, el enlace del taller y anchos de 320 a 1440 px |
| Accesibilidad automática (`tests/a11y_app.py`) | 232 estados auditados (20 nuevos de la demostración con progreso); 0 nodos con infracciones |
| Construcción y validación del banco | Correctas: 190 preguntas, 19 salas, 15 máquinas y 13 simulacros |
| Plantilla comunitaria (`node tools/validar-pack.js community/ejemplo.json`) | Formato válido |

La accesibilidad se comprueba con axe-core, temas claro/oscuro y anchos 1440/390. Incluye las vistas nuevas, la rúbrica, los errores de autoría y la vista previa de contenido. Es una comprobación automática, no una certificación de accesibilidad.

Los recorridos nuevos cubren recuperación de sesión sin pagar dos veces, plazo absoluto del simulacro, corrección de examen vencido, aislamiento de la demo, competencias, borrador de hallazgo, descarga del informe, selección de datos, importación de resúmenes, rechazo de otro código de taller, paquetes inválidos y ausencia de desbordamiento móvil.

## Pendientes que requieren otro entorno o personas

- Observación con cinco usuarios nuevos, siguiendo `GUIA_SHOWCASE.md`.
- Revisión experta de contenido normativo y de la calidad de las justificaciones abiertas.
- Prueba manual con lector de pantalla y ensayo con la organización del evento.

## Reproducir

```sh
node app/build.js
node --test tests/*.test.js
python -m pip install -r requirements.txt
python -m playwright install chromium firefox webkit
python tests/e2e_app.py
python tests/e2e_roadmap.py
python tests/a11y_app.py
```

Para probar varios motores, definir `ARGOS_BROWSERS=chromium,firefox,webkit` al ejecutar `e2e_roadmap.py`. Los resultados de accesibilidad se escriben en `tests/artifacts/a11y.json` y `a11y-summary.json`.
