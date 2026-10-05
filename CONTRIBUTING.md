# Cómo contribuir

ARGOS mejora con cada persona que encuentra una respuesta discutible o propone una pregunta nueva. Gracias por ayudar.

## Las tres reglas

1. **Redacción propia.** Explica el concepto con tus palabras y cita la cláusula, el control o el artículo. No copies texto de normas ISO ni de material de cursos.
2. **Nunca preguntas de exámenes reales.** Incumple los acuerdos de confidencialidad de las entidades de certificación y es motivo de rechazo inmediato.
3. **Fuente verificable.** Cada pregunta lleva su referencia. En el ENS puedes citar literalmente el BOE: las pruebas comprueban que la cita existe tal cual en el texto del real decreto.

## Informar de un error

Abre una incidencia con el id de la pregunta (por ejemplo, `iso-3-02`), qué crees que está mal y la fuente que lo respalda.

## Añadir o corregir preguntas

Las preguntas están en `app/data/`: `ens.js`, `iso27001.js` y `continuidad.js`. Cada sala tiene 10 preguntas con este formato:

```js
{ id: 'ens-3-02', t: 'unica', d: 1,
  q: 'Enunciado de la pregunta',
  o: ['Opción A', 'Opción B', 'Opción C', 'Opción D'], c: 2,
  x: 'Explicación: por qué la correcta lo es y por qué fallan las otras.',
  ref: 'RD 311/2022, anexo I.4',
  cita: 'Texto literal del BOE (opcional, solo en el ENS).' }
```

| Campo | Valores |
|---|---|
| `id` | `<sala>-<número>`, único en todo el banco |
| `t` | `unica`, `multiple` (al menos 2 correctas y alguna incorrecta) o `vf` (sin `o`; `c` es `true` o `false`) |
| `c` | Índice de la correcta, lista de índices o booleano según el tipo |
| `d` | Dificultad 1, 2 o 3 (vale 10, 15 o 20 XP) |
| `x` | Explicación de al menos 25 caracteres |
| `ref` | Referencia: artículo, cláusula, control o guía |

No hace falta colocar la respuesta correcta en una posición concreta: la app baraja las opciones en cada intento.

Las máquinas están en `app/data/maquinas.js`. Cada una tiene un briefing, evidencias y al menos 3 flags (de tipo `user` o `root`, con su `pista`). Las organizaciones deben ser ficticias.

## Antes de enviar el pull request

```bash
node app/build.js      # valida el banco: si hay un error, la construcción falla y lo explica
./run_tests.sh         # todas las pruebas
```

Incluye en el commit el `dist/` regenerado: la integración continua comprueba que coincide con el código fuente.
