# Evolución de ARGOS

Implementación en ramas encadenadas; `main` permanece intacta. Cada rama parte de la anterior y tiene su propio commit revisable.

| Fase | Rama | Alcance |
|---|---|---|
| 1 | fase-1-progreso-fiable | XP independientes del modo, repaso con separación temporal, migración v2, copia previa y recuperación de sesiones |
| 2 | fase-2-showcase | Inicio guiado, demostración con progreso independiente y guía de presentación |
| 3 | fase-3-competencias | Competencias, retención, recomendaciones explicadas y trazabilidad editorial |
| 4 | fase-4-laboratorios | Caso variable, hallazgo estructurado, rúbrica y exportación de informe |
| 5 | fase-5-talleres | Taller por semilla, resumen con selección de datos y plantillas validadas para autores |

## Revisión y publicación

Revisar en orden y fusionar hacia la rama precedente o retargetear tras cada integración. Nunca publicar automáticamente. El último hito contiene el conjunto completo para la revisión funcional.

## Compatibilidad de progreso

La clave de almacenamiento se mantiene para encontrar los datos de v1. La estructura pasa a v2 y se guarda una copia previa local. En v1 no consta si un acierto recibió sus XP individuales: la migración conserva el total y considera recompensados los aciertos antiguos para evitar duplicarlos. No reconstruye puntos históricos que ese formato no permite atribuir con certeza.

Los checkpoints de sesiones solo se recuperan con la misma versión de contenido. Una importación restaura el aprendizaje, pero no reanuda el examen de otro dispositivo. Una recarga conserva el plazo absoluto del simulacro. La sesión y sus recompensas se guardan en la misma escritura. El uso concurrente en varias pestañas sigue sin ser un sistema de edición colaborativa.

La copia previa reside en el mismo navegador: no sustituye exportar un JSON fuera del equipo. Si el almacenamiento está bloqueado o lleno se avisa; cerrar el navegador puede perder la sesión en memoria.

## Validación externa pendiente

- Sesiones de observación con cinco usuarios nuevos. Objetivo propuesto: cuatro completan el recorrido sin ayuda.
- Revisión experta de contenido normativo y justificaciones de auditoría.
- Ensayo con el organizador y horario del evento.
- Prueba manual con lector de pantalla y dispositivos reales.

Estas actividades requieren personas y no se consideran realizadas por pasar pruebas automáticas.
