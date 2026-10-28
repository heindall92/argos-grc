# Validación de ARGOS 1.4.0-rc.1

Fecha de comprobación: 28 de octubre de 2026. Implementación en cinco ramas encadenadas, con `main` conservada en `7021cbc61f410cc49b2ecf9dab4f168a8c88272d`.

| Comprobación | Resultado |
|---|---|
| Motor, banco, progreso, competencias, casos, privacidad y paquetes (`node --test tests/*.test.js`) | 43/43 pruebas superadas |
| Suite original de la aplicación en Chromium (`tests/e2e_app.py`) | 98/98 comprobaciones superadas |
| Recorridos del roadmap (`tests/e2e_roadmap.py`) | Superados en Chromium, Firefox y WebKit (CI en Ubuntu). En Windows, Firefox no terminó la ejecución local en 45 segundos |
| Accesibilidad automática (`tests/a11y_app.py`) | 212 estados auditados; 0 nodos con infracciones |
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
